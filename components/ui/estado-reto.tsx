import { Check } from "lucide-react";
import { estaCompletado, estaVencido, type Reto } from "@/lib/retos";

export default function EstadoReto({ reto }: { reto: Pick<Reto, "estado" | "fecha_limite"> }) {
  if (estaCompletado(reto)) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-sage/15 px-2.5 py-1 text-xs font-medium text-sage-ink">
        <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden />
        Completado
      </span>
    );
  }

  if (estaVencido(reto)) {
    return (
      <span className="inline-flex shrink-0 items-center rounded-full bg-accent-soft/30 px-2.5 py-1 text-xs font-medium text-accent">
        Fuera de plazo
      </span>
    );
  }

  return (
    <span className="inline-flex shrink-0 items-center rounded-full border border-border-strong px-2.5 py-1 text-xs font-medium text-ink-soft">
      Pendiente
    </span>
  );
}
