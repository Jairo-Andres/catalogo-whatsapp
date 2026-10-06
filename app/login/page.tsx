import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/page-shell";
import { getSession } from "@/lib/supabase/server";
import { safeNext } from "@/lib/validators";

export const metadata: Metadata = { title: "Entrar", robots: { index: false } };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  if (await getSession()) redirect(next);
  return (
    <AuthShell title="Entrar" intro="Administra tu tienda, tus productos y tus ventas.">
      <AuthForm
        mode="login"
        next={next}
        initialError={
          sp.error === "enlace" ? "El enlace no es válido o ya se usó. Inicia sesión o regístrate de nuevo." : undefined
        }
      />
    </AuthShell>
  );
}
