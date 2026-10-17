import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ReceiptReviewTable, type ReviewItem } from "@/components/admin/ReceiptReviewTable";

export default async function AdminReceiptsPage() {
  await connection();
  const supabase = await createClient();

  // Tüm başvuruları ilişkili gezi verileriyle çek
  const { data: rawRegistrations, error } = await supabase
    .from("registrations")
    .select("*, events(id, title, price_try, starts_at)")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">
        Başvurular yüklenirken hata oluştu: {error.message}
      </div>
    );
  }

  // Dekont dosyaları için özel (private) bucket'tan geçici imzalı URL'ler üret
  const items: ReviewItem[] = await Promise.all(
    (rawRegistrations || []).map(async (r: any) => {
      let receiptUrl: string | null = null;
      if (r.receipt_path) {
        const { data: signed } = await supabase.storage
          .from("receipts")
          .createSignedUrl(r.receipt_path, 3600); // 1 saat geçerli
        receiptUrl = signed?.signedUrl ?? null;
      }

      return {
        id: r.id,
        full_name: r.full_name,
        tc_no: r.tc_no,
        phone: r.phone,
        student_no: r.student_no,
        status: r.status,
        receipt_path: r.receipt_path,
        receipt_url: receiptUrl,
        admin_note: r.admin_note,
        created_at: r.created_at,
        event: r.events ?? null,
      };
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Dekont ve Başvuru Onayları
          </h1>
          <p className="text-sm text-neutral-500">
            Öğrencilerin yüklediği ödeme dekontlarını inceleyin, onaylayın veya gerekçesiyle reddedin.
          </p>
        </div>
      </div>

      <ReceiptReviewTable items={items} />
    </div>
  );
}

