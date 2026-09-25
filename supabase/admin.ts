import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente con la SECRET KEY. Salta RLS por completo.
 * USO EXCLUSIVO EN SERVIDOR (Route Handlers / Server Actions).
 * Nunca importar este archivo desde un Client Component.
 *
 * Caso de uso principal: canjear el token de invitación y crear
 * la cuenta + fila en miembros_pareja antes de que el usuario
 * tenga sesión (auth.uid() aún no existe).
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
