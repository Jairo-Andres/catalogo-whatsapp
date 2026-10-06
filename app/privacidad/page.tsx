import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { AUTHOR_LINKEDIN, AUTHOR_NAME, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = { title: "Política de privacidad", alternates: { canonical: "/privacidad" } };

export default function PrivacidadPage() {
  return (
    <LegalPage title="Política de privacidad" updated="6 de octubre de 2026">
      <p>
        Esta política explica cómo {SITE_NAME} trata los datos personales, conforme a la Ley 1581 de 2012 (Habeas Data)
        y sus decretos reglamentarios.
      </p>
      <h2>Responsable</h2>
      <p>
        {AUTHOR_NAME}, como proyecto de portafolio. Canal de contacto para consultas y reclamos:{" "}
        <a href={AUTHOR_LINKEDIN} className="font-bold underline underline-offset-4">
          LinkedIn
        </a>
        .
      </p>
      <h2>Datos de los vendedores</h2>
      <ul>
        <li>Nombre, correo y contraseña (la contraseña se guarda cifrada por Supabase Auth).</li>
        <li>Datos de la tienda: nombre, descripción, ciudad, número de WhatsApp, logo, banner y productos.</li>
        <li>Ventas que el vendedor marca como realizadas.</li>
      </ul>
      <p>
        Finalidad: crear y mostrar la tienda, permitir que los clientes hagan pedidos y mostrar estadísticas al
        vendedor. El número de WhatsApp y los datos de la tienda son públicos por diseño. Al registrarse, el vendedor
        autoriza este tratamiento.
      </p>
      <h2>Datos de los clientes</h2>
      <p>
        Los clientes no se registran y no guardamos sus datos personales. El nombre y la nota del pedido solo se
        escriben en el mensaje de WhatsApp que el cliente envía; no llegan a nuestra base de datos.
      </p>
      <h2>Analítica y almacenamiento en el navegador</h2>
      <ul>
        <li>
          Usamos un identificador aleatorio guardado en el navegador (localStorage) para contar visitas sin duplicarlas.
          No guardamos la dirección IP ni datos que identifiquen a la persona.
        </li>
        <li>El carrito se guarda en el navegador de cada cliente.</li>
        <li>Los vendedores usan cookies de sesión para mantener la cuenta abierta.</li>
      </ul>
      <h2>Derechos</h2>
      <p>
        Puedes conocer, actualizar, rectificar y pedir la eliminación de tus datos, y revocar la autorización. El
        vendedor puede editar su tienda desde el panel y pedir la eliminación de su cuenta por el canal de contacto.
      </p>
      <h2>Encargados</h2>
      <p>Los datos se alojan en Supabase (base de datos, autenticación y fotos) y el sitio en Vercel.</p>
    </LegalPage>
  );
}
