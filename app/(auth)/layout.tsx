export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh md:grid-cols-2">
      <div className="hidden flex-col justify-between bg-ink px-12 py-14 text-canvas-raised md:flex">
        <span className="font-display text-lg">ConectaDos</span>

        <div className="max-w-sm space-y-5">
          <p className="font-display text-3xl leading-snug">
            Lo que pasa entre sesiones importa tanto como la sesión misma.
          </p>
          <p className="text-sm leading-relaxed text-canvas-raised/75">
            Un espacio para que psicólogo y pareja mantengan el hilo del
            proceso terapéutico durante la semana, no solo el día de la cita.
          </p>
        </div>

        <p className="text-xs text-canvas-raised/70">
          Pensado junto a psicólogos especializados en terapia de pareja.
        </p>
      </div>

      <div className="flex flex-col px-5 pb-12 sm:px-6 md:justify-center md:py-14">
        {/* En móvil el panel de marca desaparece: la marca y su promesa se quedan */}
        <div className="-mx-5 mb-10 bg-ink px-5 pb-7 pt-6 text-canvas-raised sm:-mx-6 sm:px-6 md:hidden">
          <span className="font-display text-lg">ConectaDos</span>
          <p className="mt-5 font-display text-xl leading-snug">
            Lo que pasa entre sesiones importa tanto como la sesión misma.
          </p>
        </div>

        <div className="mx-auto w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
