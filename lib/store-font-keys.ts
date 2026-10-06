/** Claves de los tipos de letra de tienda (iguales a stores_font_check en la base). Sin next/font: se usa en validaciones. */
export const STORE_FONT_KEYS = ["atkinson", "elegante", "redondeada", "manuscrita", "moderna", "clasica"] as const;
export type StoreFont = (typeof STORE_FONT_KEYS)[number];
