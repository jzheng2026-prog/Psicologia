// El producto trabaja en hora de España: "hoy" es el día de la pareja,
// no el del servidor (que puede estar en UTC).
const ZONA = "Europe/Madrid";

export function hoy(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA }).format(new Date());
}

export function haceDias(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA }).format(d);
}

// Las columnas "date" llegan como "YYYY-MM-DD": se interpretan a mediodía
// para que ningún desfase horario las mueva de día.
function comoFecha(iso: string) {
  return new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
}

const diaLargo = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long", timeZone: ZONA });
const diaCorto = new Intl.DateTimeFormat("es-ES", { weekday: "short", day: "numeric", month: "short", timeZone: ZONA });
const fechaSimple = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", timeZone: ZONA });

export function formatoDiaLargo(iso: string) {
  const s = diaLargo.format(comoFecha(iso));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatoDiaCorto(iso: string) {
  return diaCorto.format(comoFecha(iso));
}

export function formatoFecha(iso: string) {
  return fechaSimple.format(comoFecha(iso));
}

export function formatoHora(hora: string) {
  return hora.slice(0, 5);
}
