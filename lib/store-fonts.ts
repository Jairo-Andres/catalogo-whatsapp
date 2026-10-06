import type { CSSProperties } from "react";
import { Lora, Nunito, Pacifico, Playfair_Display, Space_Grotesk } from "next/font/google";
import type { StoreFont } from "./store-font-keys";

/**
 * Tipos de letra que el vendedor puede elegir para el nombre y la descripción de su tienda.
 * Las claves son las mismas de la restricción stores_font_check en la base.
 * Solo se cargan los pesos que se usan y sin precarga: cada archivo baja solo si una tienda lo usa.
 * Se aplican con style (fontFamily) para ganarle a las clases de la marca sin pelear especificidad.
 */
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "800"], display: "swap", preload: false });
const nunito = Nunito({ subsets: ["latin"], weight: ["400", "900"], display: "swap", preload: false });
const pacifico = Pacifico({ subsets: ["latin"], weight: ["400"], display: "swap", preload: false });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["400", "700"], display: "swap", preload: false });
const lora = Lora({ subsets: ["latin"], weight: ["400", "700"], display: "swap", preload: false });

type FontDef = { label: string; title: CSSProperties; body: CSSProperties };

export const STORE_FONTS: Record<StoreFont, FontDef> = {
  atkinson: { label: "Clara (la de MiTiendaW)", title: {}, body: {} },
  elegante: {
    label: "Elegante",
    title: { fontFamily: playfair.style.fontFamily, fontWeight: 800 },
    body: { fontFamily: playfair.style.fontFamily, fontWeight: 400 },
  },
  redondeada: {
    label: "Redondeada",
    title: { fontFamily: nunito.style.fontFamily, fontWeight: 900 },
    body: { fontFamily: nunito.style.fontFamily, fontWeight: 400 },
  },
  manuscrita: {
    label: "Manuscrita",
    // Pacifico solo tiene un peso (400).
    title: { fontFamily: pacifico.style.fontFamily, fontWeight: 400, letterSpacing: 0 },
    body: { fontFamily: pacifico.style.fontFamily, fontWeight: 400 },
  },
  moderna: {
    label: "Moderna",
    title: { fontFamily: spaceGrotesk.style.fontFamily, fontWeight: 700 },
    body: { fontFamily: spaceGrotesk.style.fontFamily, fontWeight: 400 },
  },
  clasica: {
    label: "Clásica",
    title: { fontFamily: lora.style.fontFamily, fontWeight: 700 },
    body: { fontFamily: lora.style.fontFamily, fontWeight: 400 },
  },
};

export function storeFont(font: string | null | undefined): FontDef {
  return font && font in STORE_FONTS ? STORE_FONTS[font as StoreFont] : STORE_FONTS.atkinson;
}
