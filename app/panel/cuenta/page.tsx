import type { Metadata } from "next";
import { KeyRound, Mail } from "lucide-react";
import { ChangeEmailForm, ChangePasswordForm } from "@/components/panel/account-forms";
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
        <p className="text-fg-muted">Cambia el correo con el que entras y tu contraseña.</p>
      </div>
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
