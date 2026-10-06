"use client";

import { LogOut } from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import { buttonClass } from "@/components/ui/button";

/** Cerrar sesión con una confirmación sencilla (para no salir por un toque sin querer). */
export function SignOutButton() {
  return (
    <form
      action={signOut}
      onSubmit={(e) => {
        if (!confirm("¿Cerrar sesión en este dispositivo?")) e.preventDefault();
      }}
    >
      <button type="submit" className={buttonClass("danger")}>
        <LogOut aria-hidden="true" className="size-5" />
        Cerrar sesión
      </button>
    </form>
  );
}
