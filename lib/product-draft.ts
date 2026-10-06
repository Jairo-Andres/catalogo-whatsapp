/**
 * Borrador del formulario de producto en sessionStorage. En celulares con poca memoria, Android
 * cierra Chrome al abrir la cámara o la galería y la página se recarga al volver: sin borrador
 * se perdería lo escrito y las fotos ya subidas. Cada acceso va en try/catch porque el
 * almacenamiento puede no existir (modo privado, bloqueado o lleno).
 */
export type ProductDraft = Record<string, string>;

type DraftStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const PREFIX = "catalogo:borrador-producto:";
/** Campos que se guardan (los mismos nombres del formulario). */
export const DRAFT_FIELDS = [
  "name",
  "description",
  "price",
  "sale_price",
  "stock",
  "status",
  "is_unique",
  "image_url",
  "image_url_2",
  "image_url_3",
] as const;

export function draftKey(storeId: string, productId?: string | null): string {
  return `${PREFIX}${storeId}:${productId || "nuevo"}`;
}

function sessionStore(): DraftStorage | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

/** Solo los campos conocidos, como texto; null si no hay nada escrito. */
export function formToDraft(entries: Iterable<[string, FormDataEntryValue]>): ProductDraft | null {
  const draft: ProductDraft = {};
  for (const [name, value] of entries) {
    if (typeof value === "string" && (DRAFT_FIELDS as readonly string[]).includes(name)) draft[name] = value;
  }
  return Object.values(draft).some((v) => v !== "" && v !== "disponible") ? draft : null;
}

export function loadDraft(key: string, storage: DraftStorage | null = sessionStore()): ProductDraft | null {
  try {
    const raw = storage?.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const draft: ProductDraft = {};
    for (const name of DRAFT_FIELDS) {
      const value = (parsed as Record<string, unknown>)[name];
      if (typeof value === "string") draft[name] = value;
    }
    return Object.keys(draft).length ? draft : null;
  } catch {
    return null;
  }
}

export function saveDraft(
  key: string,
  draft: ProductDraft | null,
  storage: DraftStorage | null = sessionStore(),
): boolean {
  try {
    if (!storage) return false;
    if (draft) storage.setItem(key, JSON.stringify(draft));
    else storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function clearDraft(key: string, storage: DraftStorage | null = sessionStore()): void {
  try {
    storage?.removeItem(key);
  } catch {
    // Sin almacenamiento no hay nada que borrar.
  }
}
