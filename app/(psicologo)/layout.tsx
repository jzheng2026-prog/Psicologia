import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/logout-button";

export default async function PsicologoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 border-b border-border bg-canvas/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-5 sm:px-6">
          <Link href="/dashboard" className="-ml-1 rounded-md px-1 font-display text-lg text-ink">
            ConectaDos
          </Link>
          <LogoutButton />
        </div>
      </header>
      {children}
    </div>
  );
}
