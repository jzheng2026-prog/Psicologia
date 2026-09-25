import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresca la sesión si el token ha expirado
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const esRutaPsicologo = pathname.startsWith("/dashboard") || pathname.startsWith("/parejas");
  const esRutaPareja = pathname.startsWith("/inicio") || pathname.startsWith("/reto") || pathname.startsWith("/emocion");

  // Sin sesión intentando entrar a zona protegida → redirige a login
  if (!user && (esRutaPsicologo || esRutaPareja)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Nota: la comprobación de ROL exacto (psicólogo vs miembro_pareja)
  // requiere consultar la tabla "perfiles", lo cual añade una query
  // extra por request. Para el MVP lo resolvemos así aquí; si pesa
  // en rendimiento, se puede mover ese check a cada layout con caché.
  if (user && (esRutaPsicologo || esRutaPareja)) {
    const { data: perfil } = await supabase
      .from("perfiles")
      .select("rol")
      .eq("id", user.id)
      .single();

    if (esRutaPsicologo && perfil?.rol !== "psicologo") {
      const url = request.nextUrl.clone();
      url.pathname = "/inicio";
      return NextResponse.redirect(url);
    }

    if (esRutaPareja && perfil?.rol !== "miembro_pareja") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
