import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hoy } from "@/lib/fechas";
import BackLink from "@/components/ui/back-link";
import NuevaSesionForm from "./nueva-sesion-form";

export default async function NuevaSesionPage({
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
    .select("id, nombre")
    .eq("id", parejaId)
    .single();

  if (!pareja) notFound();

  const volver = `/parejas/${parejaId}`;

  return (
    <main className="mx-auto max-w-2xl px-5 pb-16 pt-6 sm:px-6 sm:pt-8">
      <BackLink href={volver}>{pareja.nombre || "Pareja sin nombre"}</BackLink>

      <div className="mt-4 max-w-md space-y-8">
        <div className="animate-entrar space-y-2">
          <h1 className="font-display text-3xl text-ink">Programar sesión</h1>
          <p className="text-sm leading-relaxed text-ink-soft">
            La pareja verá la fecha y la hora en su inicio. Tus notas de sesión
            nunca se le muestran.
          </p>
        </div>

        <NuevaSesionForm parejaId={parejaId} hoy={hoy()} volver={volver} />
      </div>
    </main>
  );
}
