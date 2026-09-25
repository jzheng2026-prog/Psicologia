"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import FormError from "@/components/ui/form-error";
import { leerJson, mensajeDeError } from "@/lib/errores";

export default function AceptarInvitacionForm({ token, email }: { token: string; email: string }) {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);

    try {
      const res = await fetch("/api/invitacion/aceptar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, nombre: nombre.trim(), password }),
      });
      const data = await leerJson(res);

      if (!res.ok) {
        setError(mensajeDeError(data.error as string, "No hemos podido crear tu cuenta. Inténtalo de nuevo."));
        setCargando(false);
        return;
      }
    } catch {
      setError("No hay conexión. Comprueba tu red e inténtalo de nuevo.");
      setCargando(false);
      return;
    }

    router.push("/inicio");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <p className="text-sm font-medium text-ink">Email</p>
        <p className="break-all rounded-md border border-border bg-canvas px-3.5 py-2.5 text-base text-ink-soft">
          {email}
        </p>
      </div>
      <Input
        label="Tu nombre"
        hint="Así te verán tu pareja y tu terapeuta."
        type="text"
        autoComplete="given-name"
        autoCapitalize="words"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        required
      />
      <Input
        label="Crea una contraseña"
        hint="Mínimo 6 caracteres."
        type="password"
        autoComplete="new-password"
        enterKeyHint="go"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={6}
      />

      <FormError>{error}</FormError>

      <Button type="submit" fullWidth loading={cargando}>
        {cargando ? "Creando tu cuenta…" : "Unirme"}
      </Button>
    </form>
  );
}
