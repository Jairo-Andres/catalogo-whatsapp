"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, signUp, type AuthState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input } from "@/components/ui/field";

export function AuthForm({
  mode,
  next,
  initialError,
}: {
  mode: "login" | "registro";
  next?: string;
  initialError?: string;
}) {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    mode === "login" ? signIn : signUp,
    initialError ? { error: initialError } : {},
  );
  const f = state.fields ?? {};
  if (mode === "registro" && state.success) return <FormMessage success={state.success} />;

  return (
    <form action={action} className="grid gap-4" noValidate>
      <FormMessage error={state.error} />
      {next && <input type="hidden" name="next" value={next} />}
      {mode === "registro" && (
        <Field label="Tu nombre" error={f.full_name}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              name="full_name"
              autoComplete="name"
              required
              defaultValue={state.values?.full_name}
              aria-describedby={describedBy}
              aria-invalid={invalid}
            />
          )}
        </Field>
      )}
      <Field label="Correo" error={f.email}>
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            name="email"
            type="email"
            autoComplete="email"
            required
            inputMode="email"
            defaultValue={state.values?.email}
            aria-describedby={describedBy}
            aria-invalid={invalid}
          />
        )}
      </Field>
      <Field label="Contraseña" error={f.password} hint={mode === "registro" ? "Mínimo 8 caracteres." : undefined}>
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            name="password"
            type="password"
            required
            minLength={mode === "registro" ? 8 : undefined}
            autoComplete={mode === "registro" ? "new-password" : "current-password"}
            aria-describedby={describedBy}
            aria-invalid={invalid}
          />
        )}
      </Field>
      {mode === "registro" && (
        <div className="grid gap-1.5">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="habeas_data"
              required
              className="mt-1 size-5 shrink-0 accent-[var(--color-accent)]"
              aria-invalid={Boolean(f.habeas_data)}
              aria-describedby={f.habeas_data ? "habeas-error" : undefined}
            />
            <span className="text-sm">
              Autorizo el tratamiento de mis datos personales según la{" "}
              <Link href="/privacidad" className="font-bold underline underline-offset-4" target="_blank">
                política de privacidad
              </Link>{" "}
              (Ley 1581 de 2012) y acepto los{" "}
              <Link href="/terminos" className="font-bold underline underline-offset-4" target="_blank">
                términos
              </Link>
              .
            </span>
          </label>
          {f.habeas_data && (
            <p id="habeas-error" className="text-sm font-bold text-status-bad">
              {f.habeas_data}
            </p>
          )}
        </div>
      )}
      <Button type="submit" size="lg" disabled={pending} aria-disabled={pending}>
        {pending ? "Un momento…" : mode === "login" ? "Entrar" : "Crear mi cuenta"}
      </Button>
      <p className="text-center text-sm">
        {mode === "login" ? (
          <>
            ¿No tienes cuenta?{" "}
            <Link href="/registro" className="font-bold underline underline-offset-4">
              Crea tu tienda gratis
            </Link>
          </>
        ) : (
          <>
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="font-bold underline underline-offset-4">
              Entra aquí
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
