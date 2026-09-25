"use client";

import { TextareaHTMLAttributes, forwardRef, useId } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
  error?: string;
};

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, className = "", id, rows = 4, ...props }, ref) => {
    const autoId = useId();
    const inputId = id || autoId;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div className="space-y-1.5">
        <label htmlFor={inputId} className="block text-sm font-medium text-ink">
          {label}
        </label>
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          className={`block w-full resize-y rounded-md border bg-canvas-raised px-3.5 py-2.5 text-base leading-relaxed text-ink transition-colors duration-150 focus-visible:-outline-offset-1 disabled:cursor-not-allowed disabled:bg-canvas disabled:text-ink-soft ${
            error
              ? "border-danger"
              : "border-border-strong hover:border-ink-soft focus:border-ink"
          } ${className}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
          {...props}
        />
        {hint && !error && (
          <p id={hintId} className="text-xs text-ink-soft">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} className="text-xs text-danger">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export default Textarea;
