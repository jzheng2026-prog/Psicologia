import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Users, ClipboardList, CalendarClock, HeartPulse, Plus, type LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CAMPOS_RETO, estaCompletado, ordenarRetos, type Reto } from "@/lib/retos";
import { emocion } from "@/lib/emociones";
import { formatoDiaCorto, formatoDiaLargo, formatoFecha, formatoHora, haceDias, hoy } from "@/lib/fechas";
import { buttonClasses } from "@/components/ui/button-styles";
import EstadoPareja from "@/components/ui/estado-pareja";
import EstadoReto from "@/components/ui/estado-reto";
import MarcaEmocion from "@/components/ui/marca-emocion";
import BackLink from "@/components/ui/back-link";
import InvitationLink from "./invitation-link";
import RenovarInvitacion from "./renovar-invitacion";
import CancelarSesion from "./cancelar-sesion";

const nombreRol: Record<string, string> = {
  A: "Primer miembro",
  B: "Segundo miembro",
};

type Miembro = {
  id: string;
  rol_en_pareja: string;
  perfiles: { nombre: string | null; email: string | null } | null;
};

type Registro = {
  miembro_id: string;
  fecha: string;
  emocion: string;
  intensidad: number | null;
  comentario: string | null;
};

const DIAS_EMOCIONES = 14;

function Seccion({
  icono: Icono,
  titulo,
  accion,
  children,
}: {
  icono: LucideIcon;
  titulo: string;
  accion?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex min-h-11 items-center justify-between gap-4">
        <h2 className="flex items-center gap-2 font-display text-xl text-ink">
          <Icono className="h-5 w-5 text-ink-soft" strokeWidth={1.5} aria-hidden />
          {titulo}
        </h2>
        {accion}
      </div>
      {children}
    </section>
  );
}

export default async function ParejaDetailPage({
  params,
}: {
  params: Promise<{ parejaId: string }>;
}) {
  const { parejaId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: pareja } = await supabase
    .from("parejas")
    .select("id, nombre, estado, creado_en")
    .eq("id", parejaId)
    .single();

  if (!pareja) notFound();

  const desde = haceDias(DIAS_EMOCIONES - 1);

  const [miembrosRes, invitacionesRes, retosRes, sesionesRes] = await Promise.all([
    supabase
      .from("miembros_pareja")
      .select("id, rol_en_pareja, perfiles(nombre, email)")
      .eq("pareja_id", parejaId)
      .order("rol_en_pareja"),
    supabase
      .from("invitaciones")
      .select("id, email, token, rol_en_pareja, expira_en")
      .eq("pareja_id", parejaId)
      .eq("aceptada", false)
      .order("rol_en_pareja"),
    supabase.from("retos").select(CAMPOS_RETO).eq("pareja_id", parejaId),
    supabase
      .from("sesiones")
      .select("id, fecha, hora, duracion_minutos")
      .eq("pareja_id", parejaId)
      .eq("estado", "programada")
      .gte("fecha", hoy())
      .order("fecha")
      .order("hora")
      .limit(1),
  ]);

  const miembros = (miembrosRes.data ?? []) as unknown as Miembro[];
  const pendientes = invitacionesRes.data ?? [];
  // Si no se pueden leer los miembros, las invitaciones aceptadas dan el mismo recuento
  const unidos = miembrosRes.error ? 2 - pendientes.length : miembros.length;

  const { data: registrosData } = miembros.length
    ? await supabase
        .from("registros_emocionales")
        .select("miembro_id, fecha, emocion, intensidad, comentario")
        .in("miembro_id", miembros.map((m) => m.id))
        .gte("fecha", desde)
        .order("fecha", { ascending: false })
    : { data: [] as Registro[] };
  const registros = (registrosData ?? []) as Registro[];

  const retos = ordenarRetos((retosRes.data ?? []) as Reto[]);
  const completados = retos.filter(estaCompletado).length;
  const proxima = sesionesRes.data?.[0];

  const nombreDe = (id: string | null) =>
    miembros.find((m) => m.id === id)?.perfiles?.nombre ?? null;

  const host = (await headers()).get("host");
  const protocolo = process.env.NODE_ENV === "development" ? "http" : "https";
  const origin = `${protocolo}://${host}`;
  const ahora = new Date();

  // Los 14 días, del más antiguo al de hoy, para la tira de cada miembro
  const dias = Array.from({ length: DIAS_EMOCIONES }, (_, i) => haceDias(DIAS_EMOCIONES - 1 - i));

  const seccionMiembros = (
    <Seccion key="miembros" icono={Users} titulo="Miembros">
      <p className="text-sm text-ink-soft">
        {unidos === 2
          ? "Los dos miembros se han unido."
          : `${unidos} de 2 se han unido. ${
              pendientes.length ? "Comparte con cada miembro su enlace de invitación." : ""
            }`}
      </p>

      {(unidos > 0 || pendientes.length > 0) && (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-canvas-raised">
          {miembros.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-4 px-4 py-4 sm:px-5">
              <div className="min-w-0">
                <p className="font-medium text-ink">{m.perfiles?.nombre || "Sin nombre"}</p>
                <p className="text-xs text-ink-soft">{nombreRol[m.rol_en_pareja] ?? "Miembro"}</p>
                {m.perfiles?.email && (
                  <p className="text-xs text-ink-soft [overflow-wrap:anywhere]">{m.perfiles.email}</p>
                )}
              </div>
              <span className="shrink-0 text-xs font-medium text-sage-ink">Se ha unido</span>
            </li>
          ))}

          {pendientes.map((inv) => {
            const caducada = new Date(inv.expira_en) < ahora;
            return (
              <li key={inv.id} className="space-y-3 px-4 py-4 sm:px-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="break-all font-medium text-ink">{inv.email}</p>
                    <p className="text-xs text-ink-soft">
                      {nombreRol[inv.rol_en_pareja] ?? "Miembro"}
                      {!caducada && ` · El enlace caduca el ${formatoFecha(inv.expira_en)}`}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                      caducada ? "bg-border/70 text-ink-soft" : "bg-accent-soft/30 text-accent"
                    }`}
                  >
                    {caducada ? "Caducada" : "Pendiente"}
                  </span>
                </div>
                {caducada ? (
                  <RenovarInvitacion invitacionId={inv.id} para={inv.email} />
                ) : (
                  <InvitationLink url={`${origin}/invitacion/${inv.token}`} para={inv.email} />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Seccion>
  );

  const seccionRetos = (
    <Seccion
      key="retos"
      icono={ClipboardList}
      titulo="Retos"
      accion={
        <Link
          href={`/parejas/${parejaId}/retos/nuevo`}
          className={buttonClasses({ variant: "secondary", className: "pl-3" })}
        >
          <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
          Nuevo reto
        </Link>
      }
    >
      {retos.length === 0 ? (
        <p className="text-sm leading-relaxed text-ink-soft">
          Todavía no hay retos. Propón el primero y la pareja lo verá en su
          inicio en cuanto se una.
        </p>
      ) : (
        <>
          <p className="text-sm text-ink-soft tabular-nums">
            {completados} de {retos.length} completados
          </p>
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-canvas-raised">
            {retos.map((r) => {
              const para = r.destinatario_id ? (nombreDe(r.destinatario_id) ?? "Un miembro") : "Los dos";
              const quien = nombreDe(r.completado_por);
              return (
                <li key={r.id} className="space-y-2 px-4 py-4 sm:px-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-ink">{r.titulo}</p>
                      <p className="text-xs text-ink-soft">
                        Para: {para}
                        {r.fecha_limite && ` · Hasta el ${formatoFecha(r.fecha_limite)}`}
                      </p>
                    </div>
                    <EstadoReto reto={r} />
                  </div>
                  {estaCompletado(r) && (
                    <div className="space-y-2">
                      <p className="text-xs text-ink-soft">
                        {quien ? `Lo completó ${quien}` : "Completado"}
                        {r.completado_en ? ` el ${formatoFecha(r.completado_en)}.` : "."}
                      </p>
                      {r.reflexion && (
                        <blockquote className="whitespace-pre-line rounded-md bg-canvas px-4 py-3 text-sm leading-relaxed text-ink">
                          {r.reflexion}
                        </blockquote>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Seccion>
  );

  const seccionEmociones = (
    <Seccion key="emociones" icono={HeartPulse} titulo="Cómo se sienten">
      {miembros.length === 0 ? (
        <p className="text-sm leading-relaxed text-ink-soft">
          Cuando los miembros se unan, aquí verás cómo se sienten cada día.
          Cada uno solo ve sus propios registros; tú ves los de los dos.
        </p>
      ) : (
        <div className="space-y-4">
          {miembros.map((m) => {
            const suyos = registros.filter((r) => r.miembro_id === m.id);
            const porDia = new Map(suyos.map((r) => [r.fecha, r]));
            const conNota = suyos.filter((r) => r.comentario);
            return (
              <div key={m.id} className="rounded-lg border border-border bg-canvas-raised px-4 py-4 sm:px-5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p className="font-medium text-ink">{m.perfiles?.nombre || "Sin nombre"}</p>
                  <p className="text-xs text-ink-soft tabular-nums">
                    {suyos.length} de {DIAS_EMOCIONES} días registrados
                  </p>
                </div>

                {/* Tira de los últimos 14 días: cada casilla es un día, hoy a la derecha */}
                <ol className="mt-3 grid grid-cols-14 gap-1" aria-label={`Últimos ${DIAS_EMOCIONES} días`}>
                  {dias.map((d) => {
                    const r = porDia.get(d);
                    const etiqueta = r ? emocion(r.emocion).etiqueta : "Sin registro";
                    return (
                      <li
                        key={d}
                        title={`${formatoDiaCorto(d)}: ${etiqueta}`}
                        className={`h-6 rounded-sm ${
                          r ? emocion(r.emocion).color : "border border-dashed border-border-strong/70"
                        }`}
                      >
                        <span className="sr-only">
                          {formatoDiaCorto(d)}: {etiqueta}
                          {r?.intensidad ? `, intensidad ${r.intensidad} de 10` : ""}
                        </span>
                      </li>
                    );
                  })}
                </ol>
                <div className="mt-1 flex justify-between text-[11px] text-ink-soft" aria-hidden>
                  <span>{formatoDiaCorto(dias[0])}</span>
                  <span>Hoy</span>
                </div>

                {suyos[0] && (
                  <p className="mt-3 flex flex-wrap items-center gap-x-2 text-sm text-ink-soft">
                    Último registro ({formatoDiaCorto(suyos[0].fecha)}):
                    <MarcaEmocion valor={suyos[0].emocion} intensidad={suyos[0].intensidad} />
                  </p>
                )}

                {conNota.length > 0 && (
                  <ul className="mt-3 space-y-2 border-t border-border pt-3">
                    {conNota.map((r) => (
                      <li key={r.fecha} className="text-sm leading-relaxed">
                        <span className="text-ink-soft">{formatoDiaCorto(r.fecha)} · </span>
                        <span className="text-ink">{r.comentario}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Seccion>
  );

  const seccionSesion = (
    <Seccion
      key="sesion"
      icono={CalendarClock}
      titulo="Próxima sesión"
      accion={
        !proxima && (
          <Link
            href={`/parejas/${parejaId}/sesiones/nueva`}
            className={buttonClasses({ variant: "secondary", className: "pl-3" })}
          >
            <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
            Programar
          </Link>
        )
      }
    >
      {proxima ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-canvas-raised px-4 py-4 sm:px-5">
          <div>
            <p className="font-medium text-ink">{formatoDiaLargo(proxima.fecha)}</p>
            <p className="text-sm text-ink-soft tabular-nums">
              {formatoHora(proxima.hora)} · {proxima.duracion_minutos} minutos
            </p>
          </div>
          <CancelarSesion sesionId={proxima.id} />
        </div>
      ) : (
        <p className="text-sm leading-relaxed text-ink-soft">
          No hay ninguna sesión programada. La pareja verá la fecha en su inicio.
        </p>
      )}
    </Seccion>
  );

  // Mientras faltan miembros, lo primero es conseguir que se unan
  const secciones =
    unidos < 2
      ? [seccionMiembros, seccionRetos, seccionSesion, seccionEmociones]
      : [seccionRetos, seccionEmociones, seccionSesion, seccionMiembros];

  return (
    <main className="mx-auto max-w-2xl px-5 pb-16 pt-6 sm:px-6 sm:pt-8">
      <BackLink href="/dashboard">Parejas</BackLink>

      <div className="animate-entrar mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="font-display text-3xl text-ink">{pareja.nombre || "Pareja sin nombre"}</h1>
        <EstadoPareja estado={pareja.estado} />
      </div>
      {pareja.estado === "inactiva" && (
        <p className="mt-2 text-sm text-ink-soft">Se activará cuando se unan los dos miembros.</p>
      )}

      <div className="mt-10 space-y-12">{secciones}</div>
    </main>
  );
}
