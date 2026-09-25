"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import FormError from "@/components/ui/form-error";
import { leerJson, mensajeDeError } from "@/lib/errores";

export default function RegistroPsicologoPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);

    try {
      const res = await fetch("/api/registro/psicologo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, password }),
      });
      const data = await leerJson(res);

      if (!res.ok) {
        setError(mensajeDeError(data.error as string, "No hemos podido crear la cuenta. Inténtalo de nuevo."));
        setCargando(false);
        return;
      }
    } catch {
      setError("No hay conexión. Comprueba tu red e inténtalo de nuevo.");
      setCargando(false);
      return;
    }

    router.push("/dashboard/completar-perfil");
    router.refresh();
  }

  return (
    <div className="animate-entrar space-y-8">
      <div className="space-y-2">
        <h1 className="font-display text-3xl text-ink">Crea tu cuenta</h1>
        <p className="text-sm text-ink-soft">
          Para psicólogos que acompañan a las parejas que atienden entre sesión y sesión.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Nombre completo"
          type="text"
          autoComplete="name"
          autoCapitalize="words"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
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
          autoComplete="new-password"
          enterKeyHint="go"
          hint="Mínimo 6 caracteres."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />

        <FormError>{error}</FormError>

        <Button type="submit" fullWidth loading={cargando}>
          {cargando ? "Creando cuenta…" : "Crear cuenta"}
        </Button>
      </form>

      <p className="text-sm text-ink-soft">
        ¿Ya tienes cuenta?{" "}
        <Link
          href="/login"
          className="rounded-sm font-medium text-ink underline decoration-border-strong underline-offset-4 hover:decoration-ink"
        >
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
