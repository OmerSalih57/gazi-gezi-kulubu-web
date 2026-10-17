import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse("Yetkisiz erişim: Giriş yapmalısınız.", { status: 401 });
  }

  // Yönetici yetki denetimi
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (me?.role !== "admin") {
    return new NextResponse("Yalnızca kulüp yöneticileri yolcu listesini indirebilir.", {
      status: 403,
    });
  }

  // Gezi bilgilerini al
  const { data: event } = await supabase
    .from("events")
    .select("id, slug, title, starts_at, capacity")
    .eq("id", eventId)
    .single();

  if (!event) {
    return new NextResponse("Gezi bulunamadı.", { status: 404 });
  }

  // Bu geziye ait tüm başvuruları çek
  const { data: rawRegistrations } = await supabase
    .from("registrations")
    .select("id, full_name, tc_no, phone, student_no, status, checked_in_at, created_at")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  const registrations = rawRegistrations || [];

  // Excel Çalışma Kitabı Oluştur
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Gazi Üniversitesi Gezi Kulübü";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Yolcu Listesi");

  // Kolon Ayarları
  worksheet.columns = [
    { header: "Sıra", key: "rowNo", width: 8 },
    { header: "Ad Soyad", key: "fullName", width: 28 },
    { header: "T.C. Kimlik No", key: "tcNo", width: 18 },
    { header: "Telefon Numarası", key: "phone", width: 18 },
    { header: "Öğrenci Numarası", key: "studentNo", width: 18 },
    { header: "Başvuru Durumu", key: "status", width: 18 },
    { header: "Yoklama / Giriş", key: "checkedIn", width: 22 },
    { header: "Kayıt Tarihi", key: "createdAt", width: 22 },
  ];

  // Başlık Satırını Biçimlendir
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE05624" }, // Gazi Turuncu
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.height = 28;

  // Veri Satırlarını Ekle
  registrations.forEach((r: any, idx: number) => {
    let statusLabel = r.status;
    if (r.status === "approved") statusLabel = "Onaylandı";
    else if (r.status === "receipt_uploaded") statusLabel = "Dekont Yüklendi";
    else if (r.status === "pending_payment") statusLabel = "Ödeme Bekliyor";
    else if (r.status === "rejected") statusLabel = "Reddedildi";
    else if (r.status === "cancelled") statusLabel = "İptal";

    const row = worksheet.addRow({
      rowNo: idx + 1,
      fullName: r.full_name,
      tcNo: r.tc_no || "-",
      phone: r.phone || "-",
      studentNo: r.student_no || "-",
      status: statusLabel,
      checkedIn: r.checked_in_at
        ? new Date(r.checked_in_at).toLocaleString("tr-TR")
        : "Giriş Yapmadı",
      createdAt: new Date(r.created_at).toLocaleString("tr-TR"),
    });

    row.alignment = { vertical: "middle" };
    row.height = 22;
  });

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="yolcu-listesi-${event.slug || "gezi"}.xlsx"`,
    },
  });
}

