import Link from "next/link";
import { CalendarClock, ChevronRight, ClipboardList } from "lucide-react";
import { cargarParejaActual } from "@/lib/pareja-actual";
import { CAMPOS_RETO, estaCompletado, ordenarRetos, type Reto } from "@/lib/retos";
import { formatoDiaLargo, formatoFecha, formatoHora, hoy } from "@/lib/fechas";
import { buttonClasses } from "@/components/ui/button-styles";
import EstadoReto from "@/components/ui/estado-reto";
import MarcaEmocion from "@/components/ui/marca-emocion";

export default async function InicioPage() {
  const { supabase, userId, parejaId, miNombre, otroNombre, terapeutaNombre, estadoPareja } =
    await cargarParejaActual();

  const [{ data: registroHoy }, { data: retosData }, { data: sesiones }] = await Promise.all([
    supabase
      .from("registros_emocionales")
      .select("emocion, intensidad")
      .eq("miembro_id", userId)
      .eq("fecha", hoy())
      .maybeSingle(),
    supabase
      .from("retos")
      .select(CAMPOS_RETO)
      .eq("pareja_id", parejaId)
      .or(`destinatario_id.is.null,destinatario_id.eq.${userId}`),
    supabase
      .from("sesiones_pareja")
      .select("fecha, hora, duracion_minutos")
      .eq("estado", "programada")
      .gte("fecha", hoy())
      .order("fecha")
      .order("hora")
      .limit(1),
  ]);

  const retos = ordenarRetos((retosData ?? []) as Reto[]);
  const pendientes = retos.filter((r) => !estaCompletado(r));
  const completados = retos.filter(estaCompletado);
  const proxima = sesiones?.[0];
  const nombrePila = miNombre?.trim().split(/\s+/)[0];

  return (
    <main className="mx-auto max-w-xl px-5 pb-16 pt-8 sm:px-6 sm:pt-12">
      <div className="animate-entrar space-y-1">
        <h1 className="font-display text-3xl text-ink">
          {nombrePila ? `Hola, ${nombrePila}` : "Hola"}
        </h1>
        <p className="text-ink-soft">
          {terapeutaNombre ? `Tu proceso con ${terapeutaNombre}` : "Tu proceso terapéutico"}
          {otroNombre ? `, junto a ${otroNombre}.` : "."}
        </p>
      </div>

      {estadoPareja === "inactiva" && !otroNombre && (
        <p className="mt-6 rounded-lg border border-border bg-canvas-raised px-4 py-3 text-sm leading-relaxed text-ink-soft">
          Tu pareja todavía no se ha unido. Cuando lo haga, empezaréis a ver
          los retos que os proponga vuestro terapeuta.
        </p>
      )}

      {/* Lo diario va primero: es la razón de abrir la app cada día */}
      <section className="mt-8 rounded-lg border border-border bg-canvas-raised px-5 py-5">
        <h2 className="font-display text-xl text-ink">¿Cómo te sientes hoy?</h2>
        {registroHoy ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <MarcaEmocion valor={registroHoy.emocion} intensidad={registroHoy.intensidad} />
            <Link href="/emocion" className={buttonClasses({ variant: "ghost", className: "-mr-4" })}>
              Cambiar
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">
              Un minuto al día ayuda a tu terapeuta a entender tu semana. Solo lo ve tu terapeuta.
            </p>
            <Link href="/emocion" className={buttonClasses({ className: "mt-4 w-full sm:w-auto" })}>
              Registrar cómo me siento
            </Link>
          </>
        )}
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="flex items-center gap-2 font-display text-xl text-ink">
          <ClipboardList className="h-5 w-5 text-ink-soft" strokeWidth={1.5} aria-hidden />
          Retos
        </h2>

        {retos.length === 0 ? (
          <p className="text-sm leading-relaxed text-ink-soft">
            Todavía no tenéis retos. Cuando vuestro terapeuta os proponga uno,
            aparecerá aquí.
          </p>
        ) : (
          <>
            {pendientes.length > 0 ? (
              <ListaRetos retos={pendientes} />
            ) : (
              <p className="text-sm text-ink-soft">Estás al día: no tienes retos pendientes.</p>
            )}

            {completados.length > 0 && (
              <details className="group">
                <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1.5 rounded-md text-sm text-ink-soft hover:text-ink">
                  <ChevronRight
                    className="h-4 w-4 transition-transform group-open:rotate-90"
                    aria-hidden
                  />
                  Completados ({completados.length})
                </summary>
                <div className="mt-2">
                  <ListaRetos retos={completados} />
                </div>
              </details>
            )}
          </>
        )}
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="flex items-center gap-2 font-display text-xl text-ink">
          <CalendarClock className="h-5 w-5 text-ink-soft" strokeWidth={1.5} aria-hidden />
          Próxima sesión
        </h2>
        {proxima ? (
          <div className="rounded-lg border border-border bg-canvas-raised px-5 py-4">
            <p className="font-medium text-ink">{formatoDiaLargo(proxima.fecha)}</p>
            <p className="text-sm text-ink-soft tabular-nums">
              {formatoHora(proxima.hora)} · {proxima.duracion_minutos} minutos
            </p>
          </div>
        ) : (
          <p className="text-sm text-ink-soft">No hay ninguna sesión programada.</p>
        )}
      </section>
    </main>
  );
}

function ListaRetos({ retos }: { retos: Reto[] }) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-canvas-raised">
      {retos.map((r) => (
        <li key={r.id}>
          <Link
            href={`/reto/${r.id}`}
            className="group flex min-h-16 items-center gap-3 px-4 py-3.5 transition-colors -outline-offset-2 hover:bg-canvas sm:px-5"
          >
            <span className="min-w-0 flex-1">
              <span className="block font-medium text-ink">{r.titulo}</span>
              {r.fecha_limite && !estaCompletado(r) && (
                <span className="block text-xs text-ink-soft">Hasta el {formatoFecha(r.fecha_limite)}</span>
              )}
            </span>
            <EstadoReto reto={r} />
            <ChevronRight className="h-4 w-4 shrink-0 text-ink-soft" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}
