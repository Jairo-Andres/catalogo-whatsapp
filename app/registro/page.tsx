import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/page-shell";
import { getSession } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Crear mi tienda",
  description: "Regístrate gratis y crea tu catálogo con pedidos por WhatsApp.",
};

export default async function RegistroPage() {
  if (await getSession()) redirect("/panel");
  return (
    <AuthShell title="Crea tu tienda gratis" intro="Primero tu cuenta; luego, en una sola pantalla, los datos de tu tienda.">
      <AuthForm mode="registro" />
    </AuthShell>
  );
}
