"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fieldErrors, safeNext, signInSchema, signUpSchema, type FieldErrors } from "@/lib/validators";
import { siteUrl } from "@/lib/site";

export type AuthState = { error?: string; success?: string; fields?: FieldErrors; values?: Record<string, string> };

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const parsed = signUpSchema.safeParse(raw);
  const values = { full_name: raw.full_name ?? "", email: raw.email ?? "" };
  if (!parsed.success) return { fields: fieldErrors(parsed.error), values };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.full_name },
      emailRedirectTo: `${siteUrl()}/auth/callback?next=/panel/tienda`,
    },
  });
  if (error) {
    const msg = /already registered|already exists/i.test(error.message)
      ? "Ese correo ya tiene cuenta. Inicia sesión."
      : /password/i.test(error.message)
        ? "La contraseña no cumple los requisitos (mínimo 8 caracteres, evita contraseñas comunes)."
        : "No pudimos crear la cuenta. Intenta de nuevo en unos minutos.";
    return { error: msg, values };
  }
  if (data.session) redirect("/panel/tienda");
  return {
    success: `Te enviamos un correo a ${parsed.data.email}. Abre el enlace para confirmar tu cuenta y crear tu tienda.`,
    values,
  };
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const parsed = signInSchema.safeParse(raw);
  const values = { email: raw.email ?? "" };
  if (!parsed.success) return { fields: fieldErrors(parsed.error), values };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    const msg = /not confirmed/i.test(error.message)
      ? "Confirma tu correo antes de entrar (revisa tu bandeja de entrada o spam)."
      : "Correo o contraseña incorrectos.";
    return { error: msg, values };
  }
  redirect(safeNext(raw.next));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
