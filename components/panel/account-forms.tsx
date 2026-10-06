"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { changeEmail, changePassword } from "@/lib/actions/account";
import type { AuthState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input } from "@/components/ui/field";

export function ChangeEmailForm({ currentEmail }: { currentEmail: string | null }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(changeEmail, {});
  const f = state.fields ?? {};
  return (
    <form action={action} className="grid gap-4" noValidate>
      <p>
        Correo actual: <strong className="break-all">{currentEmail ?? "sin correo"}</strong>
      </p>
      <FormMessage error={state.error} success={state.success} />
      <Field label="Correo nuevo" error={f.email}>
        {({ id, describedBy, invalid }) => (
          <Input
            // Al terminar con éxito se vacía el campo.
            key={state.success ? "ok" : "edit"}
            id={id}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            defaultValue={state.values?.email}
            aria-describedby={describedBy}
            aria-invalid={invalid}
          />
        )}
      </Field>
      <Button type="submit" disabled={pending} className="justify-self-start">
        {pending ? "Enviando…" : "Cambiar correo"}
      </Button>
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(changePassword, {});
  const [visible, setVisible] = useState(false);
  const f = state.fields ?? {};
  const type = visible ? "text" : "password";
  return (
    // key: tras un cambio exitoso, los campos quedan vacíos.
    <form key={state.success ?? "form"} action={action} className="grid gap-4" noValidate>
      <FormMessage error={state.error} success={state.success} />
      <Field label="Contraseña actual" error={f.current_password}>
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            name="current_password"
            type={type}
            autoComplete="current-password"
            required
            aria-describedby={describedBy}
            aria-invalid={invalid}
          />
        )}
      </Field>
      <Field label="Contraseña nueva" error={f.new_password} hint="Mínimo 8 caracteres.">
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            name="new_password"
            type={type}
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            required
            aria-describedby={describedBy}
            aria-invalid={invalid}
          />
        )}
      </Field>
      <Field label="Repite la contraseña nueva" error={f.confirm_password}>
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            name="confirm_password"
            type={type}
            autoComplete="new-password"
            required
            aria-describedby={describedBy}
            aria-invalid={invalid}
          />
        )}
      </Field>
      <Button
        variant="ghost"
        size="sm"
        className="justify-self-start"
        aria-pressed={visible}
        onClick={() => setVisible((v) => !v)}
      >
        {visible ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
        {visible ? "Ocultar contraseñas" : "Mostrar contraseñas"}
      </Button>
      <Button type="submit" disabled={pending} className="justify-self-start">
        {pending ? "Guardando…" : "Cambiar contraseña"}
      </Button>
    </form>
  );
}
