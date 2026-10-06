import { useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type FieldProps = {
  label: string;
  hint?: ReactNode;
  error?: string;
  children: (ids: { id: string; describedBy?: string; invalid: boolean }) => ReactNode;
  className?: string;
  optional?: boolean;
};

/** Etiqueta + control + ayuda + error, conectados con aria-describedby. */
export function Field({ label, hint, error, children, className, optional }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn("grid gap-1.5", className)}>
      <label htmlFor={id} className="font-bold">
        {label}
        {optional && <span className="font-normal text-fg-muted"> (opcional)</span>}
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {hint && (
        <p id={hintId} className="text-sm text-fg-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm font-bold text-status-bad">
          {error}
        </p>
      )}
    </div>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn("field-input", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn("field-input min-h-24", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn("field-input", className)} {...props} />;
}

/** Mensaje de error o éxito de un formulario completo (anunciado por lectores de pantalla). */
export function FormMessage({ error, success }: { error?: string | null; success?: string | null }) {
  if (!error && !success) return <div role="status" aria-live="polite" />;
  return (
    <div
      role={error ? "alert" : "status"}
      aria-live="polite"
      className={cn(
        "rounded-md px-4 py-3 font-bold",
        error ? "bg-status-bad-bg text-status-bad" : "bg-status-good-bg text-status-good",
      )}
    >
      {error ?? success}
    </div>
  );
}
