import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface FormFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "name"> {
  name: string;
  label: string;
  error?: string;
  hint?: ReactNode;
}

/**
 * Input com label, erro e hint — padronizado pra todos os forms.
 */
export function FormField({
  name,
  label,
  error,
  hint,
  className,
  ...props
}: FormFieldProps) {
  return (
    <div className="mb-4">
      <label
        htmlFor={name}
        className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-fg-muted"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        className={cn(
          "w-full rounded-lg border bg-ink-800/70 px-3 py-2.5 text-sm text-fg placeholder:text-fg-subtle/70",
          "transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/40",
          error
            ? "border-danger/60 focus:border-danger"
            : "border-white/10 focus:border-brand-500/60",
          className
        )}
        {...props}
      />
      {error && (
        <p id={`${name}-error`} className="mt-1 text-xs text-danger-fg">
          {error}
        </p>
      )}
      {!error && hint && (
        <p className="mt-1 text-xs text-fg-subtle">{hint}</p>
      )}
    </div>
  );
}
