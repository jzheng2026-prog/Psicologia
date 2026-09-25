"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import FormError from "@/components/ui/form-error";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setCargando(false);
      setError(
        error.message.toLowerCase().includes("fetch")
          ? "No hay conexión. Comprueba tu red e inténtalo de nuevo."
          : "El email o la contraseña no coinciden. Revísalos e inténtalo de nuevo."
      );
      return;
    }

    // Mantenemos el estado de carga hasta que llegue la navegación
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="animate-entrar space-y-8">
      <div className="space-y-2">
        <h1 className="font-display text-3xl text-ink">Inicia sesión</h1>
        <p className="text-sm text-ink-soft">Accede a tu cuenta de ConectaDos.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          enterKeyHint="go"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <FormError>{error}</FormError>

        <Button type="submit" fullWidth loading={cargando}>
          {cargando ? "Entrando…" : "Entrar"}
        </Button>
      </form>

      <div className="space-y-3 text-sm text-ink-soft">
        <p>
          ¿Te ha invitado tu terapeuta? Crea tu cuenta desde el enlace que te ha
          compartido.
        </p>
        <p>
          ¿Eres psicólogo y no tienes cuenta?{" "}
          <Link
            href="/registro/psicologo"
            className="rounded-sm font-medium text-ink underline decoration-border-strong underline-offset-4 hover:decoration-ink"
          >
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}
