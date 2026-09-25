import { Heart } from "lucide-react";
import { ReactNode } from "react";

export default function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-5 rounded-lg border border-border bg-canvas-raised px-6 py-8 sm:px-8 sm:py-10">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft/30 text-accent">
        <Heart className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      </span>
      <div className="space-y-1.5">
        <p className="font-display text-xl text-ink">{title}</p>
        <p className="max-w-prose text-sm leading-relaxed text-ink-soft">{description}</p>
      </div>
      {action}
    </div>
  );
}
