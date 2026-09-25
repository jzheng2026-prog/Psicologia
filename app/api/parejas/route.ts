import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { nombre, emailA, emailB } = await request.json();

  if (!emailA || !emailB) {
    return NextResponse.json(
      { error: "Necesitas el email de los dos miembros" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // 1. Crear la pareja (RLS: psicologo_id debe ser el propio usuario)
  const { data: pareja, error: parejaError } = await supabase
    .from("parejas")
    .insert({ psicologo_id: user.id, nombre: nombre || null })
    .select("id")
    .single();

  if (parejaError || !pareja) {
    return NextResponse.json(
      { error: parejaError?.message ?? "No se pudo crear la pareja" },
      { status: 400 }
    );
  }

  // 2. Crear las dos invitaciones (RLS: solo el psicólogo dueño puede insertar)
  const { data: invitacionesCreadas, error: invError } = await supabase
    .from("invitaciones")
    .insert([
      { pareja_id: pareja.id, email: emailA, rol_en_pareja: "A", token: randomUUID() },
      { pareja_id: pareja.id, email: emailB, rol_en_pareja: "B", token: randomUUID() },
    ])
    .select("email, token, rol_en_pareja");

  if (invError) {
    return NextResponse.json({ error: invError.message }, { status: 400 });
  }

  return NextResponse.json({
    parejaId: pareja.id,
    invitaciones: invitacionesCreadas,
  });
}
