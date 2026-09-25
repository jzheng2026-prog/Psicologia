"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import FormError from "@/components/ui/form-error";
import { buttonClasses } from "@/components/ui/button-styles";

export default function CompletarPerfilForm({
  numeroColegiadoInicial,
  especialidadInicial,
}: {
  numeroColegiadoInicial: string;
  especialidadInicial: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [numeroColegiado, setNumeroColegiado] = useState(numeroColegiadoInicial);
  const [especialidad, setEspecialidad] = useState(especialidadInicial);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Tu sesión ha caducado. Vuelve a iniciar sesión para guardar el perfil.");
      setCargando(false);
      return;
    }

    const { error } = await supabase
      .from("psicologos")
      .update({ numero_colegiado: numeroColegiado.trim(), especialidad: especialidad.trim() })
      .eq("id", user.id);

    if (error) {
      setError("No hemos podido guardar tu perfil. Inténtalo de nuevo.");
      setCargando(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="animate-entrar space-y-5">
      <Input
        label="Número de colegiado"
        type="text"
        autoComplete="off"
        placeholder="Ej. M-12345"
        value={numeroColegiado}
        onChange={(e) => setNumeroColegiado(e.target.value)}
      />
      <Input
        label="Especialidad"
        type="text"
        autoComplete="off"
        placeholder="Ej. Terapia de pareja y familia"
        value={especialidad}
        onChange={(e) => setEspecialidad(e.target.value)}
      />

      <FormError>{error}</FormError>

      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
        <Button type="submit" loading={cargando} className="w-full sm:w-auto">
          {cargando ? "Guardando…" : "Guardar y continuar"}
        </Button>
        <Link
          href="/dashboard"
          aria-disabled={cargando || undefined}
          className={buttonClasses({
            variant: "ghost",
            className: `w-full sm:w-auto ${cargando ? "pointer-events-none opacity-60" : ""}`,
          })}
        >
          Saltar por ahora
        </Link>
      </div>
    </form>
  );
}
