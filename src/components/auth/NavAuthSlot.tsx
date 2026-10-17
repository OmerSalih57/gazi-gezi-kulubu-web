import { connection } from "next/server";
import { getCurrentProfile } from "@/lib/auth/guards";
import { NavAuth, type NavSession } from "@/components/auth/NavAuth";

export async function NavAuthSlot({
  size = "sm",
  tone,
}: {
  size?: "sm" | "xs";
  tone?: "light" | "onDark";
}) {
  await connection();
  const me = await getCurrentProfile();

  const initial: NavSession | null = me
    ? {
        name: me.profile?.full_name || me.user.email || "Üye",
        role: me.profile?.role ?? null,
      }
    : null;

  return <NavAuth initial={initial} size={size} tone={tone} />;
}
