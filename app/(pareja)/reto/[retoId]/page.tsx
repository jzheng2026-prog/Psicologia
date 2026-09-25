import { notFound } from "next/navigation";
import { cargarParejaActual } from "@/lib/pareja-actual";
import { CAMPOS_RETO, estaCompletado, type Reto } from "@/lib/retos";
import { formatoFecha } from "@/lib/fechas";
import BackLink from "@/components/ui/back-link";
import EstadoReto from "@/components/ui/estado-reto";
import CompletarRetoForm from "./completar-reto-form";

export default async function RetoPage({
  params,
}: {
  params: Promise<{ retoId: string }>;
}) {
  const { retoId } = await params;
  const { supabase, userId, otroId, otroNombre } = await cargarParejaActual();

  const { data } = await supabase.from("retos").select(CAMPOS_RETO).eq("id", retoId).maybeSingle();
  if (!data) notFound();
  const reto = data as Reto;

  const para =
    reto.destinatario_id === null
      ? "Para los dos"
      : reto.destinatario_id === userId
        ? "Para ti"
        : `Para ${otroNombre ?? "tu pareja"}`;

  const quienCompleto =
    reto.completado_por === userId
      ? "ti"
      : reto.completado_por && reto.completado_por === otroId
        ? otroNombre
        : null;

  return (
    <main className="mx-auto max-w-xl px-5 pb-16 pt-6 sm:px-6 sm:pt-8">
      <BackLink href="/inicio">Inicio</BackLink>

      <div className="animate-entrar mt-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-ink-soft">
          <span>{para}</span>
          {reto.fecha_limite && (
            <>
              <span aria-hidden>·</span>
              <span>Hasta el {formatoFecha(reto.fecha_limite)}</span>
            </>
          )}
        </div>
        <h1 className="font-display text-3xl text-ink">{reto.titulo}</h1>
        <EstadoReto reto={reto} />
      </div>

      {reto.descripcion && (
        <p className="mt-6 whitespace-pre-line text-base leading-relaxed text-ink">{reto.descripcion}</p>
      )}

      <div className="mt-10 border-t border-border pt-8">
        {estaCompletado(reto) ? (
          <div className="space-y-3">
            <h2 className="font-display text-xl text-ink">Completado</h2>
            <p className="text-sm text-ink-soft">
              {reto.completado_en ? `El ${formatoFecha(reto.completado_en)}` : "Completado"}
              {quienCompleto ? `, por ${quienCompleto}.` : "."}
            </p>
            {reto.reflexion && (
              <blockquote className="rounded-lg bg-canvas-raised px-5 py-4 text-base leading-relaxed whitespace-pre-line text-ink">
                {reto.reflexion}
              </blockquote>
            )}
          </div>
        ) : reto.destinatario_id && reto.destinatario_id !== userId ? (
          <p className="text-sm text-ink-soft">
            Este reto es para {otroNombre ?? "tu pareja"}: solo esa persona puede marcarlo como completado.
          </p>
        ) : (
          <CompletarRetoForm
            retoId={reto.id}
            userId={userId}
            compartido={reto.destinatario_id === null}
          />
        )}
      </div>
    </main>
  );
}
