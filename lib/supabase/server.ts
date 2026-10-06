import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import type { Database } from "@/lib/database.types";
import { supabaseEnv } from "./env";

/** Cliente del servidor (Server Components, Server Actions y Route Handlers). */
export async function createClient() {
  const { url, key } = supabaseEnv();
  const cookieStore = await cookies();
  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // En un Server Component no se pueden escribir cookies; el proxy ya refrescó la sesión.
        }
      },
    },
  });
}

export type SessionInfo = {
  userId: string;
  email: string | null;
  role: "vendedor" | "admin";
  store: Database["public"]["Tables"]["stores"]["Row"] | null;
};

/** Usuario actual con su rol y su tienda (una consulta por petición). */
export const getSession = cache(async (): Promise<SessionInfo | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  const [{ data: profile }, { data: store }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", claims.sub).maybeSingle(),
    supabase.from("stores").select("*").eq("owner_id", claims.sub).maybeSingle(),
  ]);
  return {
    userId: claims.sub,
    email: (claims.email as string | undefined) ?? null,
    role: profile?.role ?? "vendedor",
    store: store ?? null,
  };
});
