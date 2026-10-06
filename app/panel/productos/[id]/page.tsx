import { notFound } from "next/navigation";
import { ProductForm } from "@/components/panel/product-form";
import { DeleteProduct } from "@/components/panel/delete-product";
import { requireStore } from "@/lib/auth";
import { getProduct } from "@/lib/queries";

export const metadata = { title: "Editar producto" };

export default async function EditarProductoPage({ params }: PageProps<"/panel/productos/[id]">) {
  const { id } = await params;
  const { store } = await requireStore(`/panel/productos/${id}`);
  const product = await getProduct(store.id, id);
  if (!product) notFound();
  return (
    <div className="grid max-w-2xl gap-6">
      <h1 className="ja-display text-3xl">Editar producto</h1>
      <ProductForm storeId={store.id} product={product} />
      <DeleteProduct id={product.id} name={product.name} />
    </div>
  );
}
