"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/button";
import FormError from "@/components/ui/form-error";

export default function RenovarInvitacion({ invitacionId, para }: { invitacionId: string; para: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function renovar() {
    setCargando(true);
    setError(null);

    // Token nuevo: el enlace caducado deja de funcionar aunque alguien lo guarde
    const expira = new Date();
    expira.setDate(expira.getDate() + 7);
    const { error } = await supabase
      .from("invitaciones")
      .update({ token: crypto.randomUUID(), expira_en: expira.toISOString() })
      .eq("id", invitacionId);

    if (error) {
      setError("No hemos podido generar el enlace. Inténtalo de nuevo.");
      setCargando(false);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <Button
        variant="secondary"
        onClick={renovar}
        loading={cargando}
        aria-label={`Generar un enlace nuevo para ${para}`}
        className="w-full sm:w-auto"
      >
        {!cargando && <RefreshCw className="h-4 w-4" strokeWidth={1.75} aria-hidden />}
        Generar enlace nuevo
      </Button>
      <FormError>{error}</FormError>
    </div>
  );
}
