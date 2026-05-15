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
  title: "ATLVS — A Produção Roda Aqui",
  description:
    "A plataforma para produção ao vivo. Três apps, um schema, cada módulo — do pitch ao wrap. RLS no banco. Construído por operadores.",
  path: "/pt-BR",
  ogLocale: "pt_BR",
  languages: {
    "en-US": `${SITE.baseUrl}/`,
    "es-ES": `${SITE.baseUrl}/es-ES`,
  },
  keywords: [
    "software de gestão de produção",
    "plataforma de operações de eventos",
    "software de festival",
    "advancing software",
    "plataforma para produção de eventos ao vivo",
  ],
  ogImageTitle: "A Produção Roda Aqui.",
});

const FAQ_PT = [
  {
    q: "O que a plataforma faz?",
    a: "Quarenta e sete módulos em três apps que compartilham um banco de dados. ATLVS é o workspace de operações — RFIs, submittals, daily logs, punch, advancing, financeiro, procurement, IA. GVTEWAY é o portal de stakeholders. COMPVSS é o PWA offline-first do campo — scan de portão, ponto eletrônico, incidentes, médico, briefing diário de segurança.",
  },
  {
    q: "Pra quem é?",
    a: "Times de produção que rodam trabalho real ao vivo. Festivais, residências, turnês, oficinas de fabricação, ativações de marca, compounds de broadcast, eventos privados. O schema é genérico; o vocabulário é específico.",
  },
  {
    q: "Como funciona o preço?",
    a: "Por organização, não por assento. Grátis para sempre para times pequenos. Crew abre o time. Production libera cada módulo. Festival é multi-org com SSO, DPA personalizado e SLA de 99.9%.",
  },
  {
    q: "O app de campo funciona offline mesmo?",
    a: "Sim. COMPVSS é um PWA offline-first. Scan, ponto, daily log, intake de incidente, intake médico — tudo fica em fila localmente e sincroniza quando o sinal volta. Testado em portões com 15,000 convidados.",
  },
];

export default function HomePT() {
  return (
    <div lang="pt-BR">
      <JsonLd
        data={[
          organizationSchema(),
          websiteSchema(),
          softwareApplicationSchema({
            name: "ATLVS Technologies",
            description: "A plataforma para produção ao vivo.",
            url: `${SITE.baseUrl}/pt-BR`,
            price: "0",
          }),
        ]}
      />

      <section className="relative mx-auto max-w-6xl px-6 pt-24 pb-12 text-balance">
        <div className="text-xs font-semibold tracking-[0.25em] text-[var(--org-primary)] uppercase">
          ATLVS Technologies
        </div>
        <h1 className="mt-4 text-5xl leading-[1.05] font-semibold tracking-tight sm:text-7xl">
          A Produção
          <br />
          Roda Aqui.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-[var(--text-secondary)]">
          A plataforma para trabalho ao vivo. Do pitch ao wrap, em um workspace. Três apps, um schema, cada módulo — da
          pré-produção ao strike.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button href={CANONICAL_CTAS.primary.href} size="lg">
            Cadastre-se Grátis
          </Button>
          <Button href={CANONICAL_CTAS.secondary.href} size="lg" variant="secondary">
            Agende Um Walkthrough
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">ATLVS · GVTEWAY · COMPVSS</h2>
        <p className="mt-3 max-w-2xl text-sm text-[var(--text-secondary)]">
          Um banco de dados. Três superfícies otimizadas. O mesmo registro do escritório, do portal e do campo.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            {
              name: "ATLVS",
              body: "RFIs, submittals, daily logs, punch, advancing, financeiro, procurement, IA. Uma sidebar só. Do pitch ao wrap.",
              href: "/solutions/atlvs",
            },
            {
              name: "GVTEWAY",
              body: "Doze personas. Cada uma na sua faixa. Artistas veem riders. Vendors veem POs. Clientes veem propostas.",
              href: "/solutions/gvteway",
            },
            {
              name: "COMPVSS",
              body: "Offline. Sub-100ms. Scan, ponto, incidente, médico, brief diário. Funciona com uma barra de LTE.",
              href: "/solutions/compvss",
            },
          ].map((app) => (
            <Link key={app.name} href={app.href} className="surface hover-lift p-6">
              <div className="text-sm font-semibold">{app.name}</div>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{app.body}</p>
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[var(--org-primary)]">
                Ver mais <ArrowRight size={12} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <FAQSection title="FAQ" faqs={FAQ_PT} />

      <CTASection
        title="ATLVS Está Aberto."
        subtitle="Grátis, pra sempre, para times pequenos. Preço por organização, não por assento."
        primaryLabel="Cadastre-se Grátis"
        secondaryLabel="Agende Um Walkthrough"
      />
    </div>
  );
}
