"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/button";

// Dos pasos en el mismo sitio en lugar de un modal: cancelar la quita del
// inicio de la pareja, así que pedimos confirmación sin interrumpir.
export default function CancelarSesion({ sesionId }: { sesionId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [confirmando, setConfirmando] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [fallo, setFallo] = useState(false);

  async function cancelar() {
    setCargando(true);
    setFallo(false);
    const { error } = await supabase.from("sesiones").update({ estado: "cancelada" }).eq("id", sesionId);
    if (error) {
      setFallo(true);
      setCargando(false);
      return;
    }
    router.refresh();
  }

  if (!confirmando) {
    return (
      <Button variant="ghost" onClick={() => setConfirmando(true)} className="-mr-4">
        Cancelar sesión
      </Button>
    );
  }

  return (
    <div className="flex w-full flex-wrap items-center gap-2 border-t border-border pt-3 sm:w-auto sm:border-0 sm:pt-0">
      <span className="text-sm text-ink" role="status">
        {fallo ? "No se pudo cancelar." : "¿Cancelar esta sesión?"}
      </span>
      <Button variant="secondary" onClick={cancelar} loading={cargando}>
        Sí, cancelar
      </Button>
      <Button variant="ghost" onClick={() => setConfirmando(false)} disabled={cargando}>
        No
      </Button>
    </div>
  );
}
