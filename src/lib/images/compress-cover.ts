const MAX_WIDTH = 1200;
const QUALITY = 0.8;
const MAX_SOURCE_BYTES = 25 * 1024 * 1024;

function canvasBlob(canvas: HTMLCanvasElement, type: string) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, QUALITY);
  });
}

export async function compressCoverImage(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Yalnızca JPG, PNG veya WEBP yükleyebilirsiniz.");
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error("Kapak dosyası 25 MB sınırını aşıyor. Daha küçük bir görsel seçin.");
  }

  const bitmap = await createImageBitmap(file);
  try {
    const width = Math.max(1, Math.min(bitmap.width, MAX_WIDTH));
    const height = Math.max(1, Math.round((bitmap.height * width) / bitmap.width));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Kapak görseli işlenemedi.");
    context.drawImage(bitmap, 0, 0, width, height);

    const webp = await canvasBlob(canvas, "image/webp");
    const blob = webp ?? (await canvasBlob(canvas, "image/jpeg"));
    if (!blob) throw new Error("Kapak görseli sıkıştırılamadı.");

    const type = blob.type === "image/jpeg" ? "image/jpeg" : "image/webp";
    const extension = type === "image/jpeg" ? "jpg" : "webp";
    return new File([blob], `kapak.${extension}`, { type });
  } finally {
    bitmap.close();
  }
}

export function withTimeout<T>(work: Promise<T>, ms: number, message: string) {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(message)), ms);
    work.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        window.clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(message));
      },
    );
  });
}
