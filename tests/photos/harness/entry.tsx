import { createRoot } from "react-dom/client";
import { ProductForm } from "@/components/panel/product-form";
import * as photos from "@/lib/images";

/**
 * Banco de pruebas: el formulario real de producto (con Supabase y la acción del servidor
 * reemplazados) y las funciones de lib/images expuestas en window.photos.
 */
declare global {
  interface Window {
    photos: typeof photos;
  }
}

window.photos = photos;

const params = new URLSearchParams(location.search);
const product =
  params.get("modo") === "editar"
    ? {
        id: "p1",
        name: "Torta de chocolate",
        description: null,
        price: 30000,
        sale_price: 24000,
        stock: 3,
        is_unique: false,
        status: "disponible" as const,
        images: ["https://abc.supabase.co/storage/v1/object/public/catalogo/t1/productos/a.webp"],
      }
    : undefined;

createRoot(document.getElementById("app")!).render(
  <main style={{ maxWidth: 480, margin: "0 auto", padding: 16 }}>
    <h1>Producto</h1>
    <ProductForm storeId="t1" product={product} />
  </main>,
);
