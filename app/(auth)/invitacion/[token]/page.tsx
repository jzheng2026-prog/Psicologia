import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { buttonClasses } from "@/components/ui/button-styles";
import AceptarInvitacionForm from "./aceptar-invitacion-form";

function Aviso({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="animate-entrar space-y-6">
      <div className="space-y-2">
        <h1 className="font-display text-3xl text-ink">{titulo}</h1>
        <p className="text-sm leading-relaxed text-ink-soft">{children}</p>
      </div>
      <Link href="/login" className={buttonClasses({ variant: "secondary" })}>
        Ir a iniciar sesión
      </Link>
    </div>
  );
}

export default async function InvitacionPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // La persona invitada aún no tiene sesión: el token se valida en servidor
  // con la secret key, nunca desde el cliente.
  const admin = createAdminClient();
  const { data: invitacion } = await admin
    .from("invitaciones")
    .select("email, aceptada, expira_en, parejas(psicologo_id)")
    .eq("token", token)
    .maybeSingle();

  if (!invitacion) {
    return (
      <Aviso titulo="Este enlace no es válido">
        Puede que esté incompleto o que se haya sustituido por otro más
        reciente. Pide a tu terapeuta que te envíe tu enlace de nuevo.
      </Aviso>
    );
  }

  if (invitacion.aceptada) {
    return (
      <Aviso titulo="Ya te has unido">
        Esta invitación ya se ha usado. Entra con tu email y tu contraseña.
      </Aviso>
    );
  }

  if (new Date(invitacion.expira_en) < new Date()) {
    return (
      <Aviso titulo="Este enlace ha caducado">
        Los enlaces de invitación duran 7 días. Pide a tu terapeuta que genere
        uno nuevo para ti.
      </Aviso>
    );
  }

  const pareja = invitacion.parejas as unknown as { psicologo_id: string } | null;
  const { data: psicologo } = pareja
    ? await admin.from("perfiles").select("nombre").eq("id", pareja.psicologo_id).single()
    : { data: null };

  return (
    <div className="animate-entrar space-y-8">
      <div className="space-y-3">
        <h1 className="font-display text-3xl text-ink">
          {psicologo?.nombre ? `${psicologo.nombre} te ha invitado` : "Te han invitado"}
        </h1>
        <p className="text-sm leading-relaxed text-ink-soft">
          ConectaDos es el espacio donde tu pareja y tú haréis los retos que os
          proponga vuestro terapeuta entre sesión y sesión, y donde podrás
          contar cómo te sientes cada día.
        </p>
        <p className="text-sm leading-relaxed text-ink-soft">
          Lo que registres sobre cómo te sientes solo lo verá tu terapeuta, no
          tu pareja.
        </p>
      </div>

      <AceptarInvitacionForm token={token} email={invitacion.email} />
    </div>
  );
}
