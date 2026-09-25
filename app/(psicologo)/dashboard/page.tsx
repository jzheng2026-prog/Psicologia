import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import EstadoPareja from "@/components/ui/estado-pareja";
import EmptyState from "@/components/ui/empty-state";
import { buttonClasses } from "@/components/ui/button-styles";

const fecha = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric" });

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("nombre")
    .eq("id", user.id)
    .single();

  const { data: parejas } = await supabase
    .from("parejas")
    .select("id, nombre, estado, creado_en")
    .order("creado_en", { ascending: false });

  const nombrePila = perfil?.nombre?.trim().split(/\s+/)[0];
  const hayParejas = !!parejas?.length;

  const nuevaPareja = (
    <Link href="/parejas/nueva" className={buttonClasses({ className: "pl-3.5" })}>
      <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
      Nueva pareja
    </Link>
  );

  return (
    <main className="mx-auto max-w-2xl space-y-8 px-5 pb-16 pt-10 sm:px-6 sm:pt-14">
      <div className="animate-entrar flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-display text-3xl text-ink">
            {nombrePila ? `Hola, ${nombrePila}` : "Hola"}
          </h1>
          <p className="text-ink-soft">
            {hayParejas
              ? `${parejas.length} ${parejas.length === 1 ? "pareja" : "parejas"} en seguimiento`
              : "Aquí verás las parejas que acompañas."}
          </p>
        </div>
        {hayParejas && nuevaPareja}
      </div>

      {hayParejas ? (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-canvas-raised">
          {parejas.map((p) => (
            <li key={p.id}>
              <Link
                href={`/parejas/${p.id}`}
                className="group flex min-h-16 items-center gap-4 px-4 py-3.5 transition-colors -outline-offset-2 hover:bg-canvas sm:px-5"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-ink">
                    {p.nombre || "Pareja sin nombre"}
                  </span>
                  <span className="block text-xs text-ink-soft">
                    Creada el {fecha.format(new Date(p.creado_en))}
                  </span>
                </span>
                <EstadoPareja estado={p.estado} />
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-ink-soft transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="Todavía no tienes parejas"
          description="Crea la primera pareja e invita a sus dos miembros para empezar el seguimiento entre sesiones."
          action={nuevaPareja}
        />
      )}
    </main>
  );
}
