/**
 * URL base del proyecto de Supabase, sin "/" final ni espacios (la variable se pega a mano
 * en Vercel y supabase-js normaliza la suya, así que aquí se hace lo mismo).
 */
export function supabaseBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL (ver .env.example).");
  return raw.replace(/\/+$/, "");
}

/** Variables públicas de Supabase. La publishable key (o anon key) es pública por diseño: la protege la RLS. */
export function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();
  if (!url || !key) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (ver .env.example).",
    );
  }
  return { url: supabaseBaseUrl(), key };
}
