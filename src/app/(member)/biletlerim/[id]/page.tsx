import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/guards";
import { signTicket } from "@/lib/ticket-token";
import { TicketCard } from "@/components/booking/TicketCard";

// Dinamik veri çekme ve params okuma işlemini Suspense sınırının içine alıyoruz
async function TicketContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const me = await getCurrentProfile();
  if (!me) redirect(`/giris?next=/biletlerim/${id}`);

  const supabase = await createClient();

  const { data: reg, error } = await supabase
    .from("registrations")
    .select("id, event_id, status, ticket_nonce, checked_in_at, full_name, events(title, starts_at)")
    .eq("id", id)
    .maybeSingle();

  if (error || !reg || reg.status !== "approved") {
    notFound();
  }

  const token = await signTicket({
    reg: reg.id,
    evt: reg.event_id,
    nonce: reg.ticket_nonce,
  });

  const eventData = reg.events as { title?: string; starts_at?: string } | null;

  return (
    <TicketCard
      token={token}
      name={reg.full_name}
      title={eventData?.title ?? "Gazi Gezi Kulübü"}
      date={eventData?.starts_at ?? ""}
      checkedIn={!!reg.checked_in_at}
    />
  );
}

export default function MemberTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div>
      <Suspense
        fallback={
          <div className="max-w-md mx-auto p-12 text-center text-sm text-neutral-500 bg-white rounded-3xl shadow-sm border border-neutral-200">
            Bilet yükleniyor...
          </div>
        }
      >
        <TicketContent params={params} />
      </Suspense>
    </div>
  );
}
