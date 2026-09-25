import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { nombre, email, password } = await request.json();

  if (!nombre || !email || !password) {
    return NextResponse.json(
      { error: "Faltan campos obligatorios" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // 1. Crear usuario en auth.users (confirmado automáticamente para el MVP,
  //    más adelante se puede activar confirmación por email)
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
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

  // 2. Crear fila en perfiles
  const { error: perfilError } = await admin.from("perfiles").insert({
    id: userId,
    rol: "psicologo",
    nombre,
    email,
  });

  if (perfilError) {
    await admin.auth.admin.deleteUser(userId); // evita usuarios huérfanos
    return NextResponse.json({ error: perfilError.message }, { status: 400 });
  }

  // 3. Crear fila en psicologos (numero_colegiado/especialidad se rellenan después)
  const { error: psicologoError } = await admin.from("psicologos").insert({
    id: userId,
  });

  if (psicologoError) {
    await admin.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: psicologoError.message }, { status: 400 });
  }

  // 4. Iniciar sesión automáticamente tras el registro
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return NextResponse.json({ error: signInError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
