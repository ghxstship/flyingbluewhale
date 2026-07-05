import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { JsonLd } from "@/components/marketing/JsonLd";
import { FAQSection } from "@/components/marketing/FAQ";
import { CTASection } from "@/components/marketing/CTASection";
import { Wordmark } from "@/components/brand/Wordmark";
import {
  buildMetadata,
  organizationSchema,
  websiteSchema,
  softwareApplicationSchema,
  CANONICAL_CTAS,
  SITE,
} from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "ATLVS — El motor que da vida a nuevos mundos",
  description:
    "Desarrolla, construye, opera y vive producciones en vivo sobre una sola plataforma. Un registro, cuatro apps conectadas — ATLVS, COMPVSS, GVTEWAY, LEG3ND. RLS en la base de datos. Construido por operadores.",
  path: "/es-ES",
  ogLocale: "es_ES",
  languages: {
    "en-US": `${SITE.baseUrl}/`,
    "pt-BR": `${SITE.baseUrl}/pt-BR`,
  },
  keywords: [
    "software de gestión de producción",
    "plataforma de operaciones de eventos",
    "software de festival",
    "advancing software",
    "plataforma para producción de eventos en vivo",
  ],
  ogImageTitle: "Crea mundos. Hazlos vivir en vivo.",
});

const FAQ_ES = [
  {
    q: "¿Qué hace la plataforma?",
    a: "Un registro, cuatro apps conectadas. ATLVS desarrolla y construye el mundo — proyectos, advancing, finanzas, compras y una IA que redacta el papeleo. COMPVSS lo opera sobre el terreno — turnos, certificaciones, escaneo en puerta, incidentes, offline-first. GVTEWAY es donde se vive el mundo — entradas, portales, marketplace. LEG3ND es el conocimiento sobre el que se levanta — el Standard, cursos, certificaciones, catálogo y motor de cumplimiento.",
  },
  {
    q: "¿Para quién es?",
    a: "Equipos de producción que levantan trabajo real en vivo. Festivales, residencias, giras, talleres de fabricación, activaciones de marca, compounds de broadcast, eventos privados. El esquema es genérico; el vocabulario es específico.",
  },
  {
    q: "¿Cómo funcionan los precios?",
    a: "Por organización, no por asiento. Gratis para siempre en el plan Access. Los planes superiores desbloquean cada módulo, multi-org con SSO, DPA personalizado y SLA del 99.9%.",
  },
  {
    q: "¿La app de campo funciona de verdad offline?",
    a: "Sí. COMPVSS es una PWA offline-first. Escaneo, fichaje, daily log, intake de incidente, intake médico — todo se encola localmente y sincroniza al volver la señal. Probado en puertas de 15,000 invitados.",
  },
];

const APPS_ES = [
  {
    name: "ATLVS",
    body: "Desarrolla y construye el mundo: proyectos, advancing, finanzas, compras y una IA que redacta el papeleo. La cabina de mando del productor.",
    href: "/solutions/atlvs",
  },
  {
    name: "COMPVSS",
    body: "Opéralo sobre el terreno: turnos, certificaciones, escaneo en puerta, incidentes. Offline-first y veloz en la puerta aunque la señal no acompañe.",
    href: "/solutions/compvss",
  },
  {
    name: "GVTEWAY",
    body: "Donde se vive el mundo: entradas, portales, marketplace. Cada perfil, con su propia puerta de entrada.",
    href: "/solutions/gvteway",
  },
  {
    name: "LEG3ND",
    body: "El conocimiento sobre el que se levanta el mundo: el Standard, los cursos, las certificaciones, el catálogo y el motor de cumplimiento.",
    href: "/solutions/legend",
  },
];

export default function HomeES() {
  return (
    <div lang="es-ES">
      <JsonLd
        data={[
          organizationSchema(),
          websiteSchema(),
          softwareApplicationSchema({
            name: "ATLVS Technologies",
            description: "El motor que da vida a nuevos mundos. Una plataforma para producción en vivo.",
            url: `${SITE.baseUrl}/es-ES`,
            price: "0",
          }),
        ]}
      />

      <section className="relative mx-auto max-w-6xl px-6 pt-24 pb-12 text-balance">
        <div className="eyebrow eyebrow-brand">El motor que da vida a nuevos mundos</div>
        <h1 className="hed-3xl mt-4 leading-[1.05]">
          Crea mundos.
          <br />
          Hazlos vivir en vivo.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-[var(--p-text-2)]">
          No es un CRM pegado a un PM. Un solo motor para el mundo entero — desarrollado, construido, operado y vivido
          sobre un único registro.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button href={CANONICAL_CTAS.primary.href} size="lg">
            Empieza a construir gratis
          </Button>
          <Button href={CANONICAL_CTAS.secondary.href} size="lg" variant="secondary">
            Míralo en acción
          </Button>
        </div>
        <p className="mt-4 text-xs text-[var(--p-text-2)]">
          Gratis para siempre en el plan Access · Sin tarjeta · Precio por organización
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="hed-xl flex flex-wrap items-baseline gap-x-3">
          <Wordmark word="ATLVS" /> <span aria-hidden="true">·</span> <Wordmark word="COMPVSS" />{" "}
          <span aria-hidden="true">·</span> <Wordmark word="GVTEWAY" /> <span aria-hidden="true">·</span>{" "}
          <Wordmark word="LEG3ND" />
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-[var(--p-text-2)]">
          Un registro. Cuatro superficies optimizadas. El mismo mundo desde la oficina, el campo, el público y el
          conocimiento.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {APPS_ES.map((app) => (
            <Link key={app.name} href={app.href} className="surface hover-lift p-6">
              <Wordmark word={app.name} style={{ fontSize: 15 }} />
              <p className="mt-2 text-sm text-[var(--p-text-2)]">{app.body}</p>
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[var(--p-accent)]">
                Ver más <ArrowRight size={12} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <FAQSection title="Preguntas frecuentes" faqs={FAQ_ES} />

      <CTASection
        title="Construye tu próximo mundo en ATLVS."
        subtitle="Gratis para siempre para equipos pequeños. Precio por organización. Sin tarjeta de crédito para empezar."
        primaryLabel="Empieza a construir gratis"
        secondaryLabel="Míralo en acción"
      />
    </div>
  );
}
