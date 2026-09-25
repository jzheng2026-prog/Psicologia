"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Textarea from "@/components/ui/textarea";
import Button from "@/components/ui/button";
import FormError from "@/components/ui/form-error";

export default function CompletarRetoForm({
  retoId,
  userId,
  compartido,
}: {
  retoId: string;
  userId: string;
  compartido: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [reflexion, setReflexion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);

    const { error } = await supabase
      .from("retos")
      .update({
        estado: "finalizado",
        reflexion: reflexion.trim() || null,
        completado_en: new Date().toISOString(),
        completado_por: userId,
      })
      .eq("id", retoId);

    if (error) {
      setError("No hemos podido guardarlo. Inténtalo de nuevo.");
      setCargando(false);
      return;
    }

    router.push("/inicio");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1">
        <h2 className="font-display text-xl text-ink">
          {compartido ? "¿Lo habéis hecho?" : "¿Lo has hecho?"}
        </h2>
        <p className="text-sm leading-relaxed text-ink-soft">
          {compartido
            ? "Es un reto para los dos: basta con que uno lo marque como completado."
            : "Márcalo como completado cuando lo hayas hecho."}
        </p>
      </div>

      <Textarea
        label="¿Cómo ha ido? (opcional)"
        hint="Lo leerán tu pareja y tu terapeuta."
        value={reflexion}
        onChange={(e) => setReflexion(e.target.value)}
        placeholder="Qué os ha costado, qué ha salido bien, qué habéis descubierto…"
      />

      <FormError>{error}</FormError>

      <Button type="submit" loading={cargando} className="w-full sm:w-auto">
        {cargando ? "Guardando…" : "Marcar como completado"}
      </Button>
    </form>
  );
}
