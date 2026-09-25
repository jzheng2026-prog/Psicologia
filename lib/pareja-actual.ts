import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Todo lo que las pantallas de la pareja necesitan saber de quién mira:
// su perfil, su pareja, el otro miembro y su terapeuta.
export async function cargarParejaActual() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: yo } = await supabase
    .from("miembros_pareja")
    .select("id, pareja_id, rol_en_pareja, perfiles(nombre)")
    .eq("id", user.id)
    .single();

  if (!yo) redirect("/login");

  const [{ data: pareja }, { data: otros }] = await Promise.all([
    supabase.from("parejas").select("id, estado, psicologo_id").eq("id", yo.pareja_id).single(),
    supabase
      .from("miembros_pareja")
      .select("id, perfiles(nombre)")
      .eq("pareja_id", yo.pareja_id)
      .neq("id", user.id),
  ]);

  const { data: terapeuta } = pareja
    ? await supabase.from("perfiles").select("nombre").eq("id", pareja.psicologo_id).maybeSingle()
    : { data: null };

  const nombreDe = (fila: unknown) =>
    ((fila as { perfiles: { nombre: string | null } | null } | null)?.perfiles?.nombre ?? null);

  const otro = otros?.[0] ?? null;

  return {
    supabase,
    userId: user.id,
    parejaId: yo.pareja_id as string,
    estadoPareja: (pareja?.estado as string | undefined) ?? "inactiva",
    miNombre: nombreDe(yo),
    otroId: (otro?.id as string | undefined) ?? null,
    otroNombre: otro ? nombreDe(otro) : null,
    terapeutaNombre: terapeuta?.nombre ?? null,
  };
}
