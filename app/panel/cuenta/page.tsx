import type { Metadata } from "next";
import { KeyRound, Mail } from "lucide-react";
import { ChangeEmailForm, ChangePasswordForm } from "@/components/panel/account-forms";
import { SignOutButton } from "@/components/panel/sign-out-button";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Mi cuenta" };

/** Cuenta del vendedor (y del admin): cambiar correo y contraseña. No necesita tienda. */
export default async function CuentaPage() {
  const session = await requireUser("/panel/cuenta");
  return (
    <div className="grid max-w-2xl gap-6">
      <div className="grid gap-1">
        <p className="ja-label">Cuenta</p>
        <h1 className="ja-display text-3xl">Mi cuenta</h1>
        <p className="text-fg-muted">Cierra sesión o cambia el correo con el que entras y tu contraseña.</p>
      </div>
      <section aria-labelledby="sesion-titulo" className="mt-card flex flex-wrap items-center justify-between gap-4">
        <div className="grid min-w-0 gap-1">
          <h2 id="sesion-titulo" className="font-display text-xl font-black">
            Sesión
          </h2>
          <p className="break-all text-sm text-fg-muted">
            Entraste como <strong className="text-fg">{session.email ?? "usuario"}</strong>
          </p>
        </div>
        <SignOutButton />
      </section>
      <section aria-labelledby="correo-titulo" className="mt-card grid gap-4">
        <h2 id="correo-titulo" className="flex items-center gap-3 font-display text-xl font-black">
          <span className="mt-icon-tile mt-icon-tile--b" aria-hidden="true">
            <Mail className="size-5" />
          </span>
          Correo
        </h2>
        <ChangeEmailForm currentEmail={session.email} />
      </section>
      <section aria-labelledby="clave-titulo" className="mt-card grid gap-4">
        <h2 id="clave-titulo" className="flex items-center gap-3 font-display text-xl font-black">
          <span className="mt-icon-tile mt-icon-tile--q" aria-hidden="true">
            <KeyRound className="size-5" />
          </span>
          Contraseña
        </h2>
        <ChangePasswordForm />
      </section>
    </div>
  );
}
