import { hoy } from "./fechas";

export type Reto = {
  id: string;
  titulo: string;
  descripcion: string | null;
  destinatario_id: string | null;
  fecha_limite: string | null;
  estado: string;
  reflexion: string | null;
  completado_en: string | null;
  completado_por: string | null;
  creado_en: string;
};

export const CAMPOS_RETO =
  "id, titulo, descripcion, destinatario_id, fecha_limite, estado, reflexion, completado_en, completado_por, creado_en";

export function estaCompletado(reto: Pick<Reto, "estado">) {
  return reto.estado === "finalizado";
}

export function estaVencido(reto: Pick<Reto, "estado" | "fecha_limite">) {
  return !estaCompletado(reto) && !!reto.fecha_limite && reto.fecha_limite < hoy();
}

// Pendientes primero (los que vencen antes, arriba), luego completados recientes
export function ordenarRetos<T extends Reto>(retos: T[]) {
  return [...retos].sort((a, b) => {
    const ca = estaCompletado(a);
    const cb = estaCompletado(b);
    if (ca !== cb) return ca ? 1 : -1;
    if (!ca) return (a.fecha_limite ?? "9999").localeCompare(b.fecha_limite ?? "9999");
    return (b.completado_en ?? "").localeCompare(a.completado_en ?? "");
  });
}
