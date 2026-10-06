import { ProductForm } from "@/components/panel/product-form";
import { FormMessage } from "@/components/ui/field";
import { requireStore } from "@/lib/auth";

export const metadata = { title: "Nuevo producto" };

export default async function NuevoProductoPage({ searchParams }: PageProps<"/panel/productos/nuevo">) {
  const { store } = await requireStore("/panel/productos/nuevo");
  const welcome = (await searchParams).bienvenida === "1";
  return (
    <div className="grid max-w-2xl gap-6">
      {welcome && <FormMessage success="¡Tu tienda quedó creada! Ahora sube tu primer producto." />}
      <h1 className="ja-display text-3xl">Nuevo producto</h1>
      <ProductForm storeId={store.id} />
    </div>
  );
}
