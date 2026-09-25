import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hoy } from "@/lib/fechas";
import BackLink from "@/components/ui/back-link";
import NuevoRetoForm from "./nuevo-reto-form";

export default async function NuevoRetoPage({
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

  const { data: miembros } = await supabase
    .from("miembros_pareja")
    .select("id, perfiles(nombre)")
    .eq("pareja_id", parejaId)
    .order("rol_en_pareja");

  const opciones = (miembros ?? []).map((m) => ({
    id: m.id as string,
    nombre: (m.perfiles as unknown as { nombre: string | null } | null)?.nombre ?? "Sin nombre",
  }));

  const volver = `/parejas/${parejaId}`;

  return (
    <main className="mx-auto max-w-2xl px-5 pb-16 pt-6 sm:px-6 sm:pt-8">
      <BackLink href={volver}>{pareja.nombre || "Pareja sin nombre"}</BackLink>

      <div className="mt-4 max-w-md space-y-8">
        <div className="animate-entrar space-y-2">
          <h1 className="font-display text-3xl text-ink">Nuevo reto</h1>
          <p className="text-sm leading-relaxed text-ink-soft">
            La pareja lo verá en su inicio. Escríbelo como se lo dirías en
            consulta: qué hacer, cuándo y durante cuánto tiempo.
          </p>
        </div>

        <NuevoRetoForm
          parejaId={parejaId}
          psicologoId={user.id}
          miembros={opciones}
          hoy={hoy()}
          volver={volver}
        />
      </div>
    </main>
  );
}
