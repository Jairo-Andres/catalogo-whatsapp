import type { FormState } from "@/lib/actions/store";

declare global {
  interface Window {
    __saved?: Record<string, FormDataEntryValue>;
  }
}

/** Acción falsa: guarda lo enviado para revisarlo en la prueba. */
export async function saveProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  window.__saved = Object.fromEntries(formData);
  return {};
}
