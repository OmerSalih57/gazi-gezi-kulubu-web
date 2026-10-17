import { Suspense } from "react";
import AuthForm from "@/components/auth/AuthForm";

async function LoginForm({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <AuthForm next={next} />;
}

export default function LoginPage(props: {
  searchParams: Promise<{ next?: string }>;
}) {
  return (
    <main className="grid w-full place-items-center">
      <Suspense fallback={<div className="text-sm text-neutral-500">Yükleniyor...</div>}>
        <LoginForm searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}
