import { redirect } from "next/navigation";

/** Las estadísticas ahora están en Resumen. La ruta vieja se mantiene para enlaces guardados. */
export default function EstadisticasPage() {
  redirect("/panel");
}
