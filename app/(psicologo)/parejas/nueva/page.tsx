"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import FormError from "@/components/ui/form-error";
import BackLink from "@/components/ui/back-link";
import { leerJson, mensajeDeError } from "@/lib/errores";

export default function NuevaParejaPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [emailA, setEmailA] = useState("");
  const [emailB, setEmailB] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [errorEmailB, setErrorEmailB] = useState<string | undefined>();
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setErrorEmailB(undefined);

    if (emailA.trim().toLowerCase() === emailB.trim().toLowerCase()) {
      setErrorEmailB("Cada miembro necesita su propio email.");
      return;
    }

    setCargando(true);

    try {
      const res = await fetch("/api/parejas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombre.trim(), emailA: emailA.trim(), emailB: emailB.trim() }),
      });
      const data = await leerJson(res);

      if (!res.ok) {
        setError(mensajeDeError(data.error as string, "No hemos podido crear la pareja. Inténtalo de nuevo."));
        setCargando(false);
        return;
      }

      router.push(`/parejas/${data.parejaId}`);
      router.refresh();
    } catch {
      setError("No hay conexión. Comprueba tu red e inténtalo de nuevo.");
      setCargando(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-5 pb-16 pt-6 sm:px-6 sm:pt-8">
      <BackLink href="/dashboard">Parejas</BackLink>

      <div className="mt-4 max-w-md space-y-8">
        <div className="animate-entrar space-y-2">
          <h1 className="font-display text-3xl text-ink">Nueva pareja</h1>
          <p className="text-sm leading-relaxed text-ink-soft">
            Crea la pareja y obtendrás un enlace de invitación para cada uno de
            sus miembros.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Nombre o referencia"
            hint="Opcional. Solo lo ves tú."
            type="text"
            autoComplete="off"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Marta y Álex"
          />

          <fieldset className="space-y-5 border-t border-border pt-5">
            <legend className="sr-only">Miembros de la pareja</legend>
            <Input
              label="Email del primer miembro"
              type="email"
              autoComplete="off"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              value={emailA}
              onChange={(e) => setEmailA(e.target.value)}
              required
            />
            <Input
              label="Email del segundo miembro"
              type="email"
              autoComplete="off"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              enterKeyHint="go"
              value={emailB}
              onChange={(e) => {
                setEmailB(e.target.value);
                setErrorEmailB(undefined);
              }}
              error={errorEmailB}
              required
            />
          </fieldset>

          <FormError>{error}</FormError>

          <Button type="submit" loading={cargando} className="w-full sm:w-auto">
            {cargando ? "Creando pareja…" : "Crear pareja"}
          </Button>
        </form>
      </div>
    </main>
  );
}
