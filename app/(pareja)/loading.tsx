import { Loader2 } from "lucide-react";

export default function Cargando() {
  return (
    <main className="mx-auto max-w-xl px-5 pb-16 pt-10 sm:px-6" aria-busy="true">
      <p className="flex items-center gap-2 text-sm text-ink-soft" role="status">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Cargando…
      </p>
    </main>
  );
}
