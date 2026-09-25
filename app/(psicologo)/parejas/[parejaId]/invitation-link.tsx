"use client";

import { useState, useSyncExternalStore } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { buttonClasses } from "@/components/ui/button-styles";

const sinSuscripcion = () => () => {};

export default function InvitationLink({ url, para }: { url: string; para: string }) {
  const [estado, setEstado] = useState<"idle" | "copiado" | "fallo">("idle");
  // Web Share solo existe en el cliente (sobre todo en móvil); en servidor, false
  const puedeCompartir = useSyncExternalStore(
    sinSuscripcion,
    () => "share" in navigator,
    () => false
  );

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url);
      setEstado("copiado");
      setTimeout(() => setEstado("idle"), 2500);
    } catch {
      // Sin permiso de portapapeles (o sin HTTPS): enseñamos el enlace para copiarlo a mano
      setEstado("fallo");
    }
  }

  async function compartir() {
    try {
      await navigator.share({ title: "Invitación a ConectaDos", url });
    } catch {
      // Cancelado por la persona: no es un error
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copiar}
          aria-label={`Copiar enlace de invitación para ${para}`}
          className={buttonClasses({ variant: "secondary", className: "min-w-40 flex-1 sm:flex-none" })}
        >
          {estado === "copiado" ? (
            <Check className="h-4 w-4 text-sage-ink" strokeWidth={2} aria-hidden />
          ) : (
            <Copy className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          )}
          {estado === "copiado" ? "Enlace copiado" : "Copiar enlace"}
        </button>
        {puedeCompartir && (
          <button
            type="button"
            onClick={compartir}
            aria-label={`Compartir enlace de invitación para ${para}`}
            className={buttonClasses({ variant: "secondary", className: "flex-1 sm:flex-none" })}
          >
            <Share2 className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            Compartir
          </button>
        )}
      </div>

      <p className="sr-only" aria-live="polite">
        {estado === "copiado" ? "Enlace copiado al portapapeles" : ""}
      </p>

      {estado === "fallo" && (
        <div className="space-y-1.5">
          <p className="text-xs text-ink-soft">
            No hemos podido copiarlo automáticamente. Selecciona el enlace y cópialo:
          </p>
          <input
            readOnly
            value={url}
            onFocus={(e) => e.currentTarget.select()}
            aria-label={`Enlace de invitación para ${para}`}
            className="block min-h-11 w-full rounded-md border border-border-strong bg-canvas-raised px-3 text-sm text-ink"
          />
        </div>
      )}
    </div>
  );
}
