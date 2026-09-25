const estilos: Record<string, { chip: string; punto: string }> = {
  // Hueco: todavía no ha empezado, a la espera de que se unan los dos miembros
  inactiva: { chip: "border border-border-strong text-ink-soft", punto: "border border-ink-soft" },
  activa: { chip: "bg-sage/15 text-sage-ink", punto: "bg-sage" },
  pausada: { chip: "bg-accent-soft/30 text-accent", punto: "bg-accent" },
  finalizada: { chip: "bg-border/70 text-ink-soft", punto: "bg-ink-soft" },
};

export default function EstadoPareja({ estado }: { estado: string }) {
  const estilo = estilos[estado] ?? estilos.finalizada;

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${estilo.chip}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${estilo.punto}`} aria-hidden />
      {estado}
    </span>
  );
}
