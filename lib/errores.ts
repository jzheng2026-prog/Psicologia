// Traduce los mensajes crudos de Supabase/servidor a un español que la persona
// pueda entender y sobre el que pueda actuar.
export function mensajeDeError(raw: string | null | undefined, porDefecto: string) {
  if (!raw) return porDefecto;
  const m = raw.toLowerCase();

  if (m.includes("already") && (m.includes("registered") || m.includes("exists")))
    return "Ya existe una cuenta con este email. Prueba a iniciar sesión.";
  if (m.includes("password") && (m.includes("at least") || m.includes("short")))
    return "La contraseña debe tener al menos 6 caracteres.";
  if (m.includes("invalid") && m.includes("email"))
    return "Revisa el email: parece que no es válido.";
  if (m.includes("fetch") || m.includes("network"))
    return "No hay conexión. Comprueba tu red e inténtalo de nuevo.";

  // Si el mensaje ya viene en español desde nuestra API, lo respetamos
  if (/[áéíóúñ¿]/i.test(raw) || raw.startsWith("Necesitas") || raw.startsWith("Faltan")) return raw;

  return porDefecto;
}

export async function leerJson(res: Response): Promise<Record<string, unknown>> {
  try {
    return await res.json();
  } catch {
    return {};
  }
}
