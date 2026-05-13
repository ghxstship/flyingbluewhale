import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { JsonLd } from "@/components/marketing/JsonLd";
import { FAQSection } from "@/components/marketing/FAQ";
import { CTASection } from "@/components/marketing/CTASection";
import {
  buildMetadata,
  organizationSchema,
  websiteSchema,
  softwareApplicationSchema,
  CANONICAL_CTAS,
  SITE,
} from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "ATLVS — La Producción Corre Sobre Esto",
  description:
    "La plataforma para producción en vivo. Tres apps, un esquema, cada módulo — desde el pitch hasta el wrap. RLS en la base de datos. Construido por operadores.",
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
  ogImageTitle: "La Producción Corre Sobre Esto.",
});

const FAQ_ES = [
  {
    q: "¿Qué hace la plataforma?",
    a: "Cuarenta y siete módulos en tres apps que comparten una base de datos. ATLVS es la consola de oficina — RFIs, submittals, daily logs, punch, advancing, finanzas, procurement, IA. GVTEWAY es el portal de stakeholders. COMPVSS es la PWA offline-first del campo — escaneo de puertas, fichaje de turno, incidentes, médico, briefing diario de seguridad.",
  },
  {
    q: "¿Para quién es?",
    a: "Equipos de producción que corren trabajo real en vivo. Festivales, residencias, giras, talleres de fabricación, activaciones de marca, compounds de broadcast, eventos privados. El esquema es genérico; el vocabulario es específico.",
  },
  {
    q: "¿Cómo funcionan los precios?",
    a: "Por organización, no por asiento. Gratis para siempre para equipos pequeños. Crew abre el equipo. Production desbloquea cada módulo. Festival es multi-org con SSO, DPA personalizado y SLA del 99.9%.",
  },
  {
    q: "¿La app de campo funciona realmente offline?",
    a: "Sí. COMPVSS es una PWA offline-first. Escaneo, fichaje, daily log, intake de incidente, intake médico — todo se encola localmente y sincroniza al volver la señal. Probado en puertas de 15,000 invitados.",
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
            description: "La plataforma para producción en vivo.",
            url: `${SITE.baseUrl}/es-ES`,
            price: "0",
          }),
        ]}
      />

      <section className="relative mx-auto max-w-6xl px-6 pt-24 pb-12 text-balance">
        <div className="text-xs font-semibold tracking-[0.25em] text-[var(--org-primary)] uppercase">
          ATLVS Technologies
        </div>
        <h1 className="mt-4 text-5xl leading-[1.05] font-semibold tracking-tight sm:text-7xl">
          La Producción
          <br />
          Corre Sobre Esto.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-[var(--text-secondary)]">
          La plataforma para trabajo en vivo. Del pitch al wrap, en una consola. Tres apps, un esquema, cada módulo —
          desde pre-producción hasta strike.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button href={CANONICAL_CTAS.primary.href} size="lg">
            Abrir La Consola
          </Button>
          <Button href={CANONICAL_CTAS.secondary.href} size="lg" variant="secondary">
            Habla Con El Estudio
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">ATLVS · GVTEWAY · COMPVSS</h2>
        <p className="mt-3 max-w-2xl text-sm text-[var(--text-secondary)]">
          Una base de datos. Tres superficies optimizadas. El mismo registro desde la oficina, el portal y el campo.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            {
              name: "ATLVS · La Consola",
              body: "RFIs, submittals, daily logs, punch, advancing, finanzas, procurement, IA. Un solo sidebar. Del pitch al wrap.",
              href: "/solutions/atlvs",
            },
            {
              name: "GVTEWAY · El Portal",
              body: "Doce personas. Cada una en su carril. Artistas ven riders. Vendors ven POs. Clientes ven propuestas.",
              href: "/solutions/gvteway",
            },
            {
              name: "COMPVSS · El Campo",
              body: "Offline. Sub-100ms. Escaneo, fichaje, incidente, médico, brief diario. Funciona con una barra de LTE.",
              href: "/solutions/compvss",
            },
          ].map((app) => (
            <Link key={app.name} href={app.href} className="surface hover-lift p-6">
              <div className="text-sm font-semibold">{app.name}</div>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{app.body}</p>
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[var(--org-primary)]">
                Ver más <ArrowRight size={12} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <FAQSection title="FAQ" faqs={FAQ_ES} />

      <CTASection
        title="La Consola Está Abierta."
        subtitle="Gratis, para siempre, para equipos pequeños. Precios por organización, no por asiento."
        primaryLabel="Abrir la consola"
        secondaryLabel="Habla con el estudio"
      />
    </div>
  );
}
