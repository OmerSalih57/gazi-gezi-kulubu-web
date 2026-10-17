import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const STATUS: Record<string, string> = {
  pending: "İnceleniyor",
  approved: "Kabul",
  rejected: "Red",
};

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Yetkisiz erişim.", { status: 401 });

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") return new NextResponse("Yalnızca yöneticiler indirebilir.", { status: 403 });

  const url = new URL(request.url);
  const status = url.searchParams.get("status") || "all";
  const department = url.searchParams.get("department") || "all";

  let query = supabase
    .from("team_applications")
    .select("full_name, department_class, student_no, phone, selected_departments, answers, status, created_at")
    .order("created_at", { ascending: true });
  if (status === "pending" || status === "approved" || status === "rejected") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) return new NextResponse("Başvurular okunamadı.", { status: 500 });

  const rows = (data ?? []).filter((row) => {
    const departments = Array.isArray(row.selected_departments) ? row.selected_departments : [];
    return department === "all" || departments.includes(department);
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Gazi Üniversitesi Gezi Kulübü";
  const sheet = workbook.addWorksheet("Ekip Başvuruları");
  sheet.columns = [
    { header: "Sıra", key: "rowNo", width: 8 },
    { header: "Ad Soyad", key: "fullName", width: 28 },
    { header: "Bölüm ve Sınıf", key: "departmentClass", width: 32 },
    { header: "Öğrenci No", key: "studentNo", width: 16 },
    { header: "Telefon", key: "phone", width: 18 },
    { header: "Ekipler", key: "departments", width: 32 },
    { header: "Durum", key: "status", width: 16 },
    { header: "Yanıtlar", key: "answers", width: 60 },
    { header: "Tarih", key: "createdAt", width: 22 },
  ];
  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE05624" } };

  rows.forEach((row, index) => {
    const answers = Array.isArray(row.answers)
      ? row.answers
          .map((item) => {
            const entry = item as { prompt?: string; answer?: string };
            return `${entry.prompt || "Soru"}: ${entry.answer || "-"}`;
          })
          .join("\n")
      : "";
    const departments = Array.isArray(row.selected_departments) ? row.selected_departments.join(", ") : "";
    sheet.addRow({
      rowNo: index + 1,
      fullName: row.full_name,
      departmentClass: row.department_class,
      studentNo: row.student_no,
      phone: row.phone,
      departments,
      status: STATUS[row.status] || row.status,
      answers,
      createdAt: new Date(row.created_at).toLocaleString("tr-TR"),
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="ekip-basvurulari.xlsx"',
    },
  });
}
