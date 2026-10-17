"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/guards";

const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 8 * 1024 * 1024;

function refresh(albumId?: string) {
  revalidatePath("/galeri");
  revalidatePath("/yonetim/galeri");
  if (albumId) revalidatePath(`/yonetim/galeri/${albumId}`);
}

function tableMissing(message: string) {
  const text = message.toLowerCase();
  return text.includes("albums") || text.includes("album_photos") || text.includes("gallery");
}

function migrationError(message: string) {
  const text = message.toLowerCase();
  if (tableMissing(message)) {
    return "Galeri tabloları henüz yok. supabase/migrations/0003_gallery.sql dosyasını SQL Editor'da çalıştırın.";
  }
  if (text.includes("bucket") || text.includes("gallery") || text.includes("row-level security") || text.includes("permission") || text.includes("403")) {
    return "Görsel depoya yazılamadı. gallery kovası ve yönetici yükleme izni için 0003_gallery.sql dosyasını çalıştırın.";
  }
  return message;
}

function isNavigationError(error: unknown) {
  if (!error || typeof error !== "object" || !("digest" in error)) return false;
  const digest = String((error as { digest?: unknown }).digest);
  return digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_HTTP_ERROR_FALLBACK");
}

function safeFolder(folder: string) {
  const parts = folder.split("/").filter(Boolean);
  if (parts.length === 0 || parts.length > 3) return null;
  if (!parts.every((part) => /^[a-z0-9-]{1,80}$/i.test(part))) return null;
  return parts.join("/");
}

async function storeImage(file: File, folder: string) {
  if (!IMAGE_TYPES.includes(file.type)) {
    return { ok: false as const, error: "Yalnızca JPG, PNG veya WEBP yükleyebilirsiniz." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false as const, error: "Görsel en fazla 8 MB olabilir. Kapak yüklemeden önce sıkıştırılır." };
  }

  const destination = safeFolder(folder);
  if (!destination) return { ok: false as const, error: "Görsel yolu geçersiz." };

  try {
    const supabase = await createClient();
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${destination}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("gallery").upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    if (error) return { ok: false as const, error: `Görsel yüklenemedi: ${migrationError(error.message)}` };

    const { data } = supabase.storage.from("gallery").getPublicUrl(path);
    return { ok: true as const, url: data.publicUrl, path };
  } catch (error) {
    if (isNavigationError(error)) throw error;
    const message = error instanceof Error ? error.message : "Görsel yüklenemedi.";
    return { ok: false as const, error: migrationError(message) };
  }
}

export async function createAlbum(formData: FormData) {
  await requireAdmin();
  try {
    const title = String(formData.get("title") || "").trim();
    const eventId = String(formData.get("event_id") || "").trim();
    const coverUrl = String(formData.get("cover_url") || "").trim();
    const cover = formData.get("cover");

    if (title.length < 3) return { ok: false as const, error: "Albüm başlığı en az 3 karakter olmalıdır." };
    if (eventId && !ID.test(eventId)) return { ok: false as const, error: "Gezi seçimi geçersiz." };
    if (coverUrl && !/^https?:\/\//.test(coverUrl)) {
      return { ok: false as const, error: "Kapak adresi http veya https ile başlamalıdır." };
    }

    let image = coverUrl || null;
    if (cover instanceof File && cover.size > 0) {
      const stored = await storeImage(cover, "covers");
      if (!stored.ok) return stored;
      image = stored.url;
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("albums")
      .insert({
        title,
        event_id: eventId || null,
        cover_image: image,
      })
      .select("id")
      .single();

    if (error) return { ok: false as const, error: migrationError(error.message) };
    refresh(data.id);
    return { ok: true as const, id: data.id as string };
  } catch (error) {
    if (isNavigationError(error)) throw error;
    const message = error instanceof Error ? error.message : "Albüm kaydedilemedi.";
    return { ok: false as const, error: migrationError(message) };
  }
}

export async function updateAlbum(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const title = String(formData.get("title") || "").trim();
  const eventId = String(formData.get("event_id") || "").trim();
  const coverUrl = String(formData.get("cover_url") || "").trim();
  const cover = formData.get("cover");

  if (!ID.test(id)) return { ok: false as const, error: "Geçersiz albüm." };
  if (title.length < 3) return { ok: false as const, error: "Albüm başlığı en az 3 karakter olmalıdır." };
  if (eventId && !ID.test(eventId)) return { ok: false as const, error: "Gezi seçimi geçersiz." };

  const patch: { title: string; event_id: string | null; cover_image?: string | null } = {
    title,
    event_id: eventId || null,
  };

  if (cover instanceof File && cover.size > 0) {
    const stored = await storeImage(cover, `covers/${id}`);
    if (!stored.ok) return stored;
    patch.cover_image = stored.url;
  } else if (coverUrl) {
    if (!/^https?:\/\//.test(coverUrl)) {
      return { ok: false as const, error: "Kapak adresi http veya https ile başlamalıdır." };
    }
    patch.cover_image = coverUrl;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("albums").update(patch).eq("id", id);
  if (error) return { ok: false as const, error: migrationError(error.message) };
  refresh(id);
  return { ok: true as const };
}

export async function deleteAlbum(id: string) {
  await requireAdmin();
  if (!ID.test(id)) return { ok: false as const, error: "Geçersiz albüm." };

  const supabase = await createClient();
  const folders = [`covers/${id}`, id];
  for (const folder of folders) {
    const { data: files } = await supabase.storage.from("gallery").list(folder);
    if (files?.length) {
      await supabase.storage.from("gallery").remove(files.map((file) => `${folder}/${file.name}`));
    }
  }

  const { error } = await supabase.from("albums").delete().eq("id", id);
  if (error) return { ok: false as const, error: migrationError(error.message) };
  refresh();
  return { ok: true as const };
}

export async function addAlbumPhoto(formData: FormData) {
  await requireAdmin();
  const albumId = String(formData.get("album_id") || "");
  const caption = String(formData.get("caption") || "").trim();
  const imageUrl = String(formData.get("image_url") || "").trim();
  const file = formData.get("file");

  if (!ID.test(albumId)) return { ok: false as const, error: "Geçersiz albüm." };
  if (caption.length > 200) return { ok: false as const, error: "Açıklama en fazla 200 karakter olabilir." };

  let url = imageUrl;
  if (file instanceof File && file.size > 0) {
    const stored = await storeImage(file, albumId);
    if (!stored.ok) return stored;
    url = stored.url;
  }
  if (!/^https?:\/\//.test(url)) {
    return { ok: false as const, error: "Bir görsel dosyası seçin veya geçerli bir adres yazın." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("album_photos").insert({
    album_id: albumId,
    image_url: url,
    caption: caption || null,
  });
  if (error) return { ok: false as const, error: migrationError(error.message) };

  const { data: album } = await supabase.from("albums").select("cover_image").eq("id", albumId).maybeSingle();
  if (album && !album.cover_image) {
    await supabase.from("albums").update({ cover_image: url }).eq("id", albumId);
  }

  refresh(albumId);
  return { ok: true as const };
}

export async function deleteAlbumPhoto(photoId: string, albumId: string) {
  await requireAdmin();
  if (!ID.test(photoId) || !ID.test(albumId)) return { ok: false as const, error: "Geçersiz fotoğraf." };

  const supabase = await createClient();
  const { error } = await supabase.from("album_photos").delete().eq("id", photoId).eq("album_id", albumId);
  if (error) return { ok: false as const, error: migrationError(error.message) };
  refresh(albumId);
  return { ok: true as const };
}
