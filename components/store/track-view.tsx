"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

/** Registra la visita a la tienda o al producto una vez por carga (la base deduplica 30 min). */
export function TrackView({ storeId, productId }: { storeId: string; productId?: string }) {
  useEffect(() => {
    void track(storeId, productId ? "visita_producto" : "visita_tienda", productId);
  }, [storeId, productId]);
  return null;
}
