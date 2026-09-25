// Sin "use client": así los enlaces de componentes de servidor comparten
// exactamente el mismo aspecto que <Button>.

export type ButtonVariant = "primary" | "secondary" | "ghost";

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium whitespace-nowrap transition-colors duration-150 disabled:cursor-not-allowed";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-ink text-canvas-raised hover:bg-ink/85 active:bg-ink/75 disabled:bg-ink/40 aria-busy:bg-ink/85",
  secondary:
    "border border-border-strong bg-canvas-raised text-ink hover:border-ink hover:bg-canvas-raised/60 active:bg-border/60 disabled:text-ink-soft disabled:hover:border-border-strong",
  ghost:
    "text-ink-soft underline decoration-border-strong underline-offset-4 hover:text-ink hover:decoration-ink disabled:text-ink-soft/60",
};

export function buttonClasses({
  variant = "primary",
  fullWidth = false,
  className = "",
}: {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  className?: string;
} = {}) {
  return `${base} ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`;
}
