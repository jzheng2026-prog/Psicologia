import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { token, nombre, password } = await request.json();

  if (!token || !nombre || !password) {
    return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
  }

  const admin = createAdminClient();

  // 1. Validar el token (existe, no usado, no caducado)
  const { data: invitacion } = await admin
    .from("invitaciones")
    .select("id, email, pareja_id, rol_en_pareja, aceptada, expira_en")
    .eq("token", token)
    .maybeSingle();

  if (!invitacion) {
    return NextResponse.json({ error: "Este enlace de invitación no es válido." }, { status: 404 });
  }
  if (invitacion.aceptada) {
    return NextResponse.json({ error: "Esta invitación ya se ha usado. Inicia sesión con tu email." }, { status: 409 });
  }
  if (new Date(invitacion.expira_en) < new Date()) {
    return NextResponse.json({ error: "Este enlace ha caducado. Pide a tu terapeuta uno nuevo." }, { status: 410 });
  }

  // 2. Crear la cuenta con el email de la invitación (no lo elige la persona)
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: invitacion.email,
    password,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    return NextResponse.json(
      { error: authError?.message ?? "No se pudo crear la cuenta" },
      { status: 400 }
    );
  }

  const userId = authData.user.id;
  const deshacer = async () => {
    await admin.auth.admin.deleteUser(userId); // borra también perfil/miembro en cascada
  };

  // 3. Perfil con rol de miembro de pareja
  const { error: perfilError } = await admin.from("perfiles").insert({
    id: userId,
    rol: "miembro_pareja",
    nombre,
    email: invitacion.email,
  });
  if (perfilError) {
    await deshacer();
    return NextResponse.json({ error: perfilError.message }, { status: 400 });
  }

  // 4. Marcar la invitación como usada (solo si nadie se adelantó)
  const { data: marcada } = await admin
    .from("invitaciones")
    .update({ aceptada: true })
    .eq("id", invitacion.id)
    .eq("aceptada", false)
    .select("id");
  if (!marcada?.length) {
    await deshacer();
    return NextResponse.json({ error: "Esta invitación ya se ha usado. Inicia sesión con tu email." }, { status: 409 });
  }

  // 5. Unir a la pareja (el trigger la activa al llegar el segundo miembro)
  const { error: miembroError } = await admin.from("miembros_pareja").insert({
    id: userId,
    pareja_id: invitacion.pareja_id,
    rol_en_pareja: invitacion.rol_en_pareja,
    invitacion_id: invitacion.id,
  });
  if (miembroError) {
    await admin.from("invitaciones").update({ aceptada: false }).eq("id", invitacion.id);
    await deshacer();
    return NextResponse.json({ error: miembroError.message }, { status: 400 });
  }

  // 6. Iniciar sesión directamente
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: invitacion.email,
    password,
  });
  if (signInError) {
    return NextResponse.json({ error: signInError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
