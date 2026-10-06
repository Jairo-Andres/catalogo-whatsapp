import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { AUTHOR_LINKEDIN, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = { title: "Términos y condiciones", alternates: { canonical: "/terminos" } };

export default function TerminosPage() {
  return (
    <LegalPage title="Términos y condiciones" updated="6 de octubre de 2026">
      <h2>1. Qué es {SITE_NAME}</h2>
      <p>
        Es una plataforma gratuita que permite a vendedores publicar un catálogo y recibir pedidos por WhatsApp. La
        plataforma solo conecta a vendedores y clientes: no vende, no cobra, no procesa pagos ni hace entregas.
      </p>
      <h2>2. Responsabilidad del vendedor</h2>
      <ul>
        <li>
          La venta, el precio final, el pago, la entrega y la calidad de los productos son responsabilidad exclusiva del
          vendedor.
        </li>
        <li>El vendedor debe publicar información veraz y tener derecho a usar las fotos que sube.</li>
        <li>El número de WhatsApp de la tienda es público para que los clientes puedan escribir.</li>
      </ul>
      <h2>3. Contenido no permitido</h2>
      <ul>
        <li>Productos o servicios ilegales en Colombia, armas, drogas, medicamentos sin registro o falsificaciones.</li>
        <li>Contenido engañoso, ofensivo, sexual o que vulnere derechos de terceros.</li>
      </ul>
      <p>El administrador puede aprobar, suspender o eliminar tiendas que incumplan estas reglas.</p>
      <h2>4. Pedidos</h2>
      <p>
        El botón “Pedir por WhatsApp” abre un mensaje con el pedido armado. El vendedor confirma disponibilidad y precio
        final por WhatsApp. Los precios del catálogo son informativos.
      </p>
      <h2>5. Servicio</h2>
      <p>
        El servicio se ofrece “tal cual”, en planes gratuitos de terceros (Vercel y Supabase), y puede tener
        interrupciones. Contacto:{" "}
        <a href={AUTHOR_LINKEDIN} className="font-bold underline underline-offset-4">
          LinkedIn del responsable
        </a>
        .
      </p>
    </LegalPage>
  );
}
