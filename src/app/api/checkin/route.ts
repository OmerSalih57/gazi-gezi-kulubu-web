import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyTicket } from "@/lib/ticket-token";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { status: "unauthorized", message: "Giriş yapmalısınız." },
        { status: 401 }
      );
    }

    // Yetki kontrolü (Yönetici olmalı)
    const { data: me } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (me?.role !== "admin") {
      return NextResponse.json(
        { status: "forbidden", message: "Bu işlem için yönetici yetkisi gereklidir." },
        { status: 403 }
      );
    }

    const { token, eventId } = await req.json();

    if (!token || !eventId) {
      return NextResponse.json(
        { status: "invalid", message: "Bilet kodu veya gezi bilgisi eksik." },
        { status: 400 }
      );
    }

    // Kriptografik token doğrulaması
    const payload = await verifyTicket(token);
    if (!payload || payload.evt !== eventId) {
      return NextResponse.json(
        { status: "invalid", message: "Geçersiz veya bu geziye ait olmayan bilet!" },
        { status: 400 }
      );
    }

    // Başvuruyu veritabanından bul
    const { data: reg } = await supabase
      .from("registrations")
      .select("id, status, ticket_nonce, checked_in_at, full_name")
      .eq("id", payload.reg)
      .maybeSingle();

    if (!reg || reg.ticket_nonce !== payload.nonce || reg.status !== "approved") {
      return NextResponse.json(
        { status: "invalid", message: "Onaysız veya geçersiz bilet!" },
        { status: 400 }
      );
    }

    // Zaten giriş yapmış mı?
    if (reg.checked_in_at) {
      return NextResponse.json({
        status: "already",
        name: reg.full_name,
        checkedInAt: reg.checked_in_at,
        message: `Bu biletle daha önce giriş yapılmış: ${reg.full_name}`,
      });
    }

    // Atomik yoklama güncellemesi (.is("checked_in_at", null) çifte okutmayı engeller)
    const { data: updated } = await supabase
      .from("registrations")
      .update({
        checked_in_at: new Date().toISOString(),
        checked_in_by: user.id,
      })
      .eq("id", reg.id)
      .is("checked_in_at", null)
      .select("id");

    if (!updated?.length) {
      return NextResponse.json({
        status: "already",
        name: reg.full_name,
        message: `Zaten giriş yapılmış: ${reg.full_name}`,
      });
    }

    return NextResponse.json({
      status: "ok",
      name: reg.full_name,
      message: `Giriş başarıyla onaylandı: ${reg.full_name}`,
    });
  } catch (error) {
    console.error("checkin", error);
    return NextResponse.json(
      { status: "error", message: "Sistemsel bir hata oluştu, lütfen tekrar deneyin." },
      { status: 500 }
    );
  }
}

