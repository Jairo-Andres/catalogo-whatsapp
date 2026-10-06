import type { Database } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/client";

type EventType = Database["public"]["Enums"]["event_type"];
const SOURCES = ["whatsapp", "instagram", "facebook", "qr", "directo"] as const;

/** ID aleatorio del navegador (sin IP ni datos personales). */
export function getVisitorId(): string {
  try {
    let id = localStorage.getItem("cw_visitor");
    if (!id || !/^[A-Za-z0-9_-]{8,64}$/.test(id)) {
      id = crypto.randomUUID().replace(/-/g, "");
      localStorage.setItem("cw_visitor", id);
    }
    return id;
  } catch {
    return `tmp${Math.random().toString(36).slice(2, 14)}`; // navegación privada sin almacenamiento
  }
}

/** Origen del tráfico (?src=whatsapp|instagram|facebook|qr); se recuerda durante la sesión. */
export function getSource(): string {
  try {
    const fromUrl = new URLSearchParams(location.search).get("src");
    if (fromUrl && (SOURCES as readonly string[]).includes(fromUrl)) {
      sessionStorage.setItem("cw_src", fromUrl);
      return fromUrl;
    }
    return sessionStorage.getItem("cw_src") ?? "directo";
  } catch {
    return "directo";
  }
}

/**
 * Registra un evento con la función track_event. Usa fetch con keepalive para que
 * el evento llegue aunque el navegador cambie a WhatsApp, y envía la sesión si la
 * hay para que la base no cuente las visitas del dueño.
 */
export async function track(storeId: string, type: EventType, productId?: string | null): Promise<void> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const { data } = await createClient().auth.getSession();
    const token = data.session?.access_token;
    await fetch(`${url}/rest/v1/rpc/track_event`, {
      method: "POST",
      keepalive: true,
      headers: {
        "Content-Type": "application/json",
        apikey: key,
        ...(token
          ? { Authorization: `Bearer ${token}` }
          : key.startsWith("eyJ")
            ? { Authorization: `Bearer ${key}` }
            : {}),
      },
      body: JSON.stringify({
        p_store_id: storeId,
        p_type: type,
        p_visitor_id: getVisitorId(),
        p_product_id: productId ?? null,
        p_source: getSource(),
      }),
    });
  } catch {
    // La analítica nunca debe romper la compra.
  }
}
