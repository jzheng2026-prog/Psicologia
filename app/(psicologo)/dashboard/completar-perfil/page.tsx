import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CompletarPerfilForm from "./completar-perfil-form";

export default async function CompletarPerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: psicologo } = await supabase
    .from("psicologos")
    .select("numero_colegiado, especialidad")
    .eq("id", user.id)
    .single();

  return (
    <main className="mx-auto max-w-2xl px-5 pb-16 pt-10 sm:px-6 sm:pt-14">
      <div className="max-w-md space-y-8">
        <div className="animate-entrar space-y-2">
          <h1 className="font-display text-3xl text-ink">Completa tu perfil</h1>
          <p className="text-sm leading-relaxed text-ink-soft">
            Tu número de colegiado y tu especialidad ayudan a que las parejas
            sepan con quién están trabajando. Puedes rellenarlo ahora o
            saltarlo y hacerlo más adelante.
          </p>
        </div>

        <CompletarPerfilForm
          numeroColegiadoInicial={psicologo?.numero_colegiado ?? ""}
          especialidadInicial={psicologo?.especialidad ?? ""}
        />
      </div>
    </main>
  );
}
