import { cargarParejaActual } from "@/lib/pareja-actual";
import { formatoDiaCorto, haceDias, hoy } from "@/lib/fechas";
import BackLink from "@/components/ui/back-link";
import MarcaEmocion from "@/components/ui/marca-emocion";
import EmocionForm from "./emocion-form";

export default async function EmocionPage() {
  const { supabase, userId } = await cargarParejaActual();
  const fechaHoy = hoy();

  const { data: registros } = await supabase
    .from("registros_emocionales")
    .select("fecha, emocion, intensidad, comentario")
    .eq("miembro_id", userId)
    .gte("fecha", haceDias(13))
    .order("fecha", { ascending: false });

  const deHoy = registros?.find((r) => r.fecha === fechaHoy);
  const anteriores = (registros ?? []).filter((r) => r.fecha !== fechaHoy);

  return (
    <main className="mx-auto max-w-xl px-5 pb-16 pt-6 sm:px-6 sm:pt-8">
      <BackLink href="/inicio">Inicio</BackLink>

      <div className="animate-entrar mt-4 space-y-2">
        <h1 className="font-display text-3xl text-ink">¿Cómo te sientes hoy?</h1>
        <p className="text-sm leading-relaxed text-ink-soft">
          No hay respuestas correctas. Solo lo verá tu terapeuta, no tu pareja.
        </p>
      </div>

      <div className="mt-8">
        <EmocionForm
          userId={userId}
          fecha={fechaHoy}
          inicial={
            deHoy
              ? { emocion: deHoy.emocion, intensidad: deHoy.intensidad, comentario: deHoy.comentario }
              : null
          }
        />
      </div>

      {anteriores.length > 0 && (
        <section className="mt-12 space-y-4 border-t border-border pt-8">
          <h2 className="font-display text-xl text-ink">Tus últimos días</h2>
          <ul className="space-y-3">
            {anteriores.map((r) => (
              <li key={r.fecha} className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="w-24 shrink-0 text-sm text-ink-soft tabular-nums">
                  {formatoDiaCorto(r.fecha)}
                </span>
                <MarcaEmocion valor={r.emocion} intensidad={r.intensidad} />
                {r.comentario && (
                  <p className="w-full pl-28 text-sm text-ink-soft max-sm:pl-0">{r.comentario}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
