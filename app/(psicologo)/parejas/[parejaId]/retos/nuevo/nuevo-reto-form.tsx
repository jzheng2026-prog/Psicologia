"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Input from "@/components/ui/input";
import Textarea from "@/components/ui/textarea";
import Button from "@/components/ui/button";
import FormError from "@/components/ui/form-error";
import { buttonClasses } from "@/components/ui/button-styles";

export default function NuevoRetoForm({
  parejaId,
  psicologoId,
  miembros,
  hoy,
  volver,
}: {
  parejaId: string;
  psicologoId: string;
  miembros: { id: string; nombre: string }[];
  hoy: string;
  volver: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [destinatario, setDestinatario] = useState("");
  const [fechaLimite, setFechaLimite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);

    const { error } = await supabase.from("retos").insert({
      pareja_id: parejaId,
      creado_por: psicologoId,
      destinatario_id: destinatario || null,
      titulo: titulo.trim(),
      descripcion: descripcion.trim() || null,
      fecha_inicio: hoy,
      fecha_limite: fechaLimite || null,
    });

    if (error) {
      setError("No hemos podido crear el reto. Inténtalo de nuevo.");
      setCargando(false);
      return;
    }

    router.push(volver);
    router.refresh();
  }

  const opciones = [{ id: "", nombre: "Los dos" }, ...miembros];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Título"
        type="text"
        autoComplete="off"
        placeholder="Ej. 15 minutos al día sin móviles"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        required
        maxLength={120}
      />

      <Textarea
        label="Instrucciones"
        hint="Opcional, pero ayuda: la pareja lo leerá sin ti delante."
        rows={5}
        placeholder="Cada noche, sentaos 15 minutos a hablar de vuestro día sin interrumpiros…"
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
      />

      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-medium text-ink">¿Para quién es?</legend>
        <div className="flex flex-wrap gap-2">
          {opciones.map((o) => (
            <label
              key={o.id || "ambos"}
              className="flex min-h-11 cursor-pointer items-center rounded-md border border-border-strong bg-canvas-raised px-4 text-sm text-ink transition-colors hover:border-ink has-checked:border-ink has-checked:bg-ink has-checked:text-canvas-raised has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink"
            >
              <input
                type="radio"
                name="destinatario"
                value={o.id}
                checked={destinatario === o.id}
                onChange={() => setDestinatario(o.id)}
                className="sr-only"
              />
              {o.nombre}
            </label>
          ))}
        </div>
        {miembros.length < 2 && (
          <p className="text-xs text-ink-soft">
            Podrás asignar retos a cada miembro por separado cuando se hayan unido.
          </p>
        )}
      </fieldset>

      <Input
        label="Fecha límite"
        hint="Opcional. Normalmente, el día antes de la próxima sesión."
        type="date"
        min={hoy}
        value={fechaLimite}
        onChange={(e) => setFechaLimite(e.target.value)}
        className="sm:max-w-56"
      />

      <FormError>{error}</FormError>

      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
        <Button type="submit" loading={cargando} className="w-full sm:w-auto">
          {cargando ? "Creando reto…" : "Crear reto"}
        </Button>
        <Link href={volver} className={buttonClasses({ variant: "ghost", className: "w-full sm:w-auto" })}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
