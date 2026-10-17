import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const { count: eventsCount } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true });

  const { count: registrationsCount } = await supabase
    .from("registrations")
    .select("*", { count: "exact", head: true });

  const { count: pendingReceiptsCount } = await supabase
    .from("registrations")
    .select("*", { count: "exact", head: true })
    .eq("status", "receipt_uploaded");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Yönetim Paneli</h1>
          <p className="text-sm text-neutral-500">Gazi Gezi Kulübü etkinlik ve operasyon yönetimi</p>
        </div>
        <div className="flex gap-2">
          <Link href="/yonetim/blog/yeni">
            <Button variant="outline">+ Yeni Yazı</Button>
          </Link>
          <Link href="/yonetim/geziler/yeni">
            <Button className="bg-orange-600 hover:bg-orange-700 text-white">
              + Yeni Gezi Oluştur
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardDescription>Toplam Gezi</CardDescription>
            <CardTitle className="text-3xl font-bold">{eventsCount ?? 0}</CardTitle>
          </CardHeader>
          <div className="px-6 pb-6">
            <Link href="/yonetim/geziler" className="text-sm text-orange-600 hover:underline font-medium">
              Gezileri Yönet →
            </Link>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Onay Bekleyen Dekont</CardDescription>
            <CardTitle className="text-3xl font-bold text-amber-600">
              {pendingReceiptsCount ?? 0}
            </CardTitle>
          </CardHeader>
          <div className="px-6 pb-6">
            <Link href="/yonetim/dekontlar" className="text-sm text-orange-600 hover:underline font-medium">
              Dekontları İncele →
            </Link>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Toplam Başvuru</CardDescription>
            <CardTitle className="text-3xl font-bold">{registrationsCount ?? 0}</CardTitle>
          </CardHeader>
          <div className="px-6 pb-6">
            <Link href="/yonetim/dekontlar" className="text-sm text-neutral-500 hover:underline">
              Tüm Başvurular →
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

