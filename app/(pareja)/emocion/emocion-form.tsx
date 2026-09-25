"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { EMOCIONES } from "@/lib/emociones";
import Textarea from "@/components/ui/textarea";
import Button from "@/components/ui/button";
import FormError from "@/components/ui/form-error";

type Registro = { emocion: string; intensidad: number | null; comentario: string | null };

export default function EmocionForm({
  userId,
  fecha,
  inicial,
}: {
  userId: string;
  fecha: string;
  inicial: Registro | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [valor, setValor] = useState(inicial?.emocion ?? "");
  const [intensidad, setIntensidad] = useState<number | null>(inicial?.intensidad ?? null);
  const [comentario, setComentario] = useState(inicial?.comentario ?? "");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valor) {
      setError("Elige cómo te sientes para poder guardarlo.");
      return;
    }
    setError(null);
    setCargando(true);

    // Un registro por persona y día: si ya existe el de hoy, se actualiza
    const { error } = await supabase.from("registros_emocionales").upsert(
      {
        miembro_id: userId,
        fecha,
        emocion: valor,
        intensidad,
        comentario: comentario.trim() || null,
      },
      { onConflict: "miembro_id,fecha" }
    );

    if (error) {
      setError("No hemos podido guardarlo. Inténtalo de nuevo.");
      setCargando(false);
      return;
    }

    router.push("/inicio");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <fieldset className="space-y-2">
        <legend className="mb-3 text-sm font-medium text-ink">Hoy me siento…</legend>
        {EMOCIONES.map((e) => (
          <label
            key={e.valor}
            className="flex min-h-13 cursor-pointer items-center gap-3 rounded-lg border border-border-strong bg-canvas-raised px-4 transition-colors hover:border-ink has-checked:border-ink has-checked:bg-canvas-raised has-checked:ring-1 has-checked:ring-ink has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink"
          >
            <input
              type="radio"
              name="emocion"
              value={e.valor}
              checked={valor === e.valor}
              onChange={() => setValor(e.valor)}
              className="sr-only"
            />
            <span className={`h-3 w-3 shrink-0 rounded-full ${e.color}`} aria-hidden />
            <span className="flex-1 text-base text-ink">{e.etiqueta}</span>
            <span
              className={`h-4 w-4 shrink-0 rounded-full border ${
                valor === e.valor ? "border-[5px] border-ink" : "border-border-strong"
              }`}
              aria-hidden
            />
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium text-ink">¿Con qué intensidad? (opcional)</legend>
        <p className="mt-1 text-xs text-ink-soft">1 es apenas nada; 10, muchísimo.</p>
        <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-10">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={intensidad === n}
              onClick={() => setIntensidad(intensidad === n ? null : n)}
              className={`min-h-11 rounded-md border text-sm font-medium tabular-nums transition-colors ${
                intensidad === n
                  ? "border-ink bg-ink text-canvas-raised"
                  : "border-border-strong bg-canvas-raised text-ink hover:border-ink"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </fieldset>

      <Textarea
        label="¿Quieres contar algo más? (opcional)"
        rows={3}
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
      />

      <FormError>{error}</FormError>

      <Button type="submit" loading={cargando} className="w-full sm:w-auto">
        {cargando ? "Guardando…" : inicial ? "Guardar cambios" : "Guardar"}
      </Button>
    </form>
  );
}
