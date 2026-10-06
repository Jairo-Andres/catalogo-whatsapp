"use server";

import { createClient, getSession } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/site";
import { changeEmailSchema, changePasswordSchema, fieldErrors } from "@/lib/validators";
import type { AuthState } from "./auth";

/**
 * Cambio de correo: Supabase manda un enlace al correo nuevo (y al actual, si el proyecto
 * tiene activado "Secure email change"). Hasta confirmarlo, se sigue entrando con el de siempre.
 */
export async function changeEmail(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const session = await getSession();
  if (!session) return { error: "Tu sesión terminó. Vuelve a entrar." };
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const values = { email: raw.email ?? "" };
  const parsed = changeEmailSchema.safeParse(raw);
  if (!parsed.success) return { fields: fieldErrors(parsed.error), values };
  if (parsed.data.email === session.email?.toLowerCase()) {
    return { fields: { email: "Ese ya es tu correo actual" }, values };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser(
    { email: parsed.data.email },
    { emailRedirectTo: `${siteUrl()}/auth/callback?next=/panel/cuenta` },
  );
  if (error) {
    const msg = /already|registered|exists/i.test(error.message)
      ? "Ese correo ya está registrado en otra cuenta."
      : /rate|seconds|too many/i.test(error.message)
        ? "Pediste el cambio hace poco. Espera un minuto e intenta de nuevo."
        : "No pudimos pedir el cambio de correo. Intenta de nuevo en unos minutos.";
    return { error: msg, values };
  }
  return {
    success:
      "Te enviamos un enlace para confirmar el cambio. Revisa tu correo nuevo (y el actual, si Supabase lo pide). Hasta que lo confirmes, sigues entrando con el correo de siempre.",
    values: { email: "" },
  };
}

/** Cambio de clave: primero se comprueba la actual (iniciando sesión con ella) y luego se cambia. */
export async function changePassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const session = await getSession();
  if (!session?.email) return { error: "Tu sesión terminó. Vuelve a entrar." };
  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData));
  // Las claves nunca se devuelven al formulario.
  if (!parsed.success) return { fields: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const check = await supabase.auth.signInWithPassword({
    email: session.email,
    password: parsed.data.current_password,
  });
  if (check.error) return { fields: { current_password: "La contraseña actual no es correcta" } };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.new_password });
  if (error) {
    const msg = /weak|pwned|password/i.test(error.message)
      ? "La nueva contraseña es muy fácil de adivinar. Usa una más larga o menos común."
      : "No pudimos cambiar la contraseña. Intenta de nuevo en unos minutos.";
    return { error: msg };
  }
  return { success: "Listo: tu contraseña quedó cambiada. La próxima vez entra con la nueva." };
}
