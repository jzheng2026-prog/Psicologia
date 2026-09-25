import BackLink from "@/components/ui/back-link";

export default function ParejaNoEncontrada() {
  return (
    <main className="mx-auto max-w-2xl px-5 pb-16 pt-6 sm:px-6 sm:pt-8">
      <BackLink href="/dashboard">Parejas</BackLink>
      <div className="mt-4 max-w-md space-y-2">
        <h1 className="font-display text-3xl text-ink">No encontramos esta pareja</h1>
        <p className="text-sm leading-relaxed text-ink-soft">
          Puede que el enlace esté mal o que ya no tengas acceso a ella.
        </p>
      </div>
    </main>
  );
}
