import { AlertCircle } from "lucide-react";

export default function FormError({ children }: { children?: React.ReactNode }) {
  // El contenedor vive siempre para que los lectores de pantalla anuncien el cambio
  return (
    <div role="alert" aria-live="assertive">
      {children && (
        <p className="flex items-start gap-2 rounded-md bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          <span>{children}</span>
        </p>
      )}
    </div>
  );
}
