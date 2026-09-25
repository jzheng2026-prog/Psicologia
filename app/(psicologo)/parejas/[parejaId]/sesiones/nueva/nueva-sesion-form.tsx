"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import FormError from "@/components/ui/form-error";
import { buttonClasses } from "@/components/ui/button-styles";

const DURACIONES = [45, 60, 90];

export default function NuevaSesionForm({
  parejaId,
  hoy,
  volver,
}: {
  parejaId: string;
  hoy: string;
  volver: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [duracion, setDuracion] = useState(60);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);

    const { error } = await supabase.from("sesiones").insert({
      pareja_id: parejaId,
      fecha,
      hora,
      duracion_minutos: duracion,
    });

    if (error) {
      setError("No hemos podido programar la sesión. Inténtalo de nuevo.");
      setCargando(false);
      return;
    }

    router.push(volver);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="Fecha" type="date" min={hoy} value={fecha} onChange={(e) => setFecha(e.target.value)} required />
        <Input label="Hora" type="time" step={300} value={hora} onChange={(e) => setHora(e.target.value)} required />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink">Duración</legend>
        <div className="flex flex-wrap gap-2">
          {DURACIONES.map((d) => (
            <label
              key={d}
              className="flex min-h-11 cursor-pointer items-center rounded-md border border-border-strong bg-canvas-raised px-4 text-sm text-ink tabular-nums transition-colors hover:border-ink has-checked:border-ink has-checked:bg-ink has-checked:text-canvas-raised has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink"
            >
              <input
                type="radio"
                name="duracion"
                value={d}
                checked={duracion === d}
                onChange={() => setDuracion(d)}
                className="sr-only"
              />
              {d} min
            </label>
          ))}
        </div>
      </fieldset>

      <FormError>{error}</FormError>

      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
        <Button type="submit" loading={cargando} className="w-full sm:w-auto">
          {cargando ? "Programando…" : "Programar sesión"}
        </Button>
        <Link href={volver} className={buttonClasses({ variant: "ghost", className: "w-full sm:w-auto" })}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
