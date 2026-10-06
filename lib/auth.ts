import "server-only";
import { notFound, redirect } from "next/navigation";
import { getSession, type SessionInfo } from "@/lib/supabase/server";

export async function requireUser(next = "/panel"): Promise<SessionInfo> {
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(next)}`);
  return session;
}

/** Vendedor con tienda creada; si no la tiene, va al asistente. */
export async function requireStore(next = "/panel") {
  const session = await requireUser(next);
  if (session.role === "admin" && !session.store) redirect("/admin");
  if (!session.store) redirect("/panel/tienda");
  return { ...session, store: session.store };
}

/** Solo admin. A los demás les responde 404 para no revelar la ruta. */
export async function requireAdmin() {
  const session = await requireUser("/admin");
  if (session.role !== "admin") notFound();
  return session;
}
