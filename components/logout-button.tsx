"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/button";

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();
  const [saliendo, setSaliendo] = useState(false);

  async function handleLogout() {
    setSaliendo(true);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button variant="ghost" onClick={handleLogout} disabled={saliendo} className="-mr-4">
      {saliendo ? "Cerrando sesión…" : "Cerrar sesión"}
    </Button>
  );
}
