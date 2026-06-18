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
  title: "ATLVS — O motor por trás de novos mundos",
  description:
    "Desenvolva, construa, opere e viva produções ao vivo em uma só plataforma. Um registro, quatro apps conectados — ATLVS, COMPVSS, GVTEWAY, LEG3ND. RLS na base de dados. Construído por operadores.",
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
  ogImageTitle: "Construa mundos. Comande-os ao vivo.",
});

const FAQ_PT = [
  {
    q: "O que a plataforma faz?",
    a: "Um registro, quatro apps conectados. A ATLVS desenvolve e constrói o mundo — projetos, advancing, finanças, compras e uma IA que redige a papelada. A COMPVSS opera em campo — escalas, certificações, leitura no portão, ocorrências, offline-first. A GVTEWAY é onde o mundo é vivido — bilheteria, portais, marketplace. A LEG3ND é o conhecimento sobre o qual ele é construído — o Standard, cursos, certificações, catálogo e motor de compliance.",
  },
  {
    q: "Para quem é?",
    a: "Equipes de produção que tocam trabalho real ao vivo. Festivais, residências, turnês, oficinas de fabricação, ativações de marca, compounds de broadcast, eventos privados. O esquema é genérico; o vocabulário é específico.",
  },
  {
    q: "Como funciona o preço?",
    a: "Por organização, não por assento. Grátis para sempre no nível Access. Os níveis superiores desbloqueiam cada módulo, multi-org com SSO, DPA personalizado e SLA de 99,9%.",
  },
  {
    q: "O app de campo funciona mesmo offline?",
    a: "Sim. A COMPVSS é um PWA offline-first. Leitura, ponto, daily log, registro de ocorrência, intake médico — tudo é enfileirado localmente e sincroniza quando o sinal volta. Testado em portões de 15.000 convidados.",
  },
];

const APPS_PT = [
  {
    name: "ATLVS",
    body: "Desenvolva e construa o mundo — projetos, advancing, finanças, compras e uma IA que redige a papelada. A central de comando do produtor.",
    href: "/solutions/atlvs",
  },
  {
    name: "COMPVSS",
    body: "Opere em campo — escalas, certificações, leitura no portão, ocorrências. Offline-first, ágil no portão mesmo quando o sinal não está.",
    href: "/solutions/compvss",
  },
  {
    name: "GVTEWAY",
    body: "Onde o mundo é vivido — bilheteria, portais, marketplace. Cada persona com sua própria porta de entrada.",
    href: "/solutions/gvteway",
  },
  {
    name: "LEG3ND",
    body: "O conhecimento sobre o qual o mundo é construído — o Standard, cursos, certificações, o catálogo e o motor de compliance.",
    href: "/solutions/legend",
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
            description: "O motor por trás de novos mundos. Uma plataforma para produção ao vivo.",
            url: `${SITE.baseUrl}/pt-BR`,
            price: "0",
          }),
        ]}
      />

      <section className="relative mx-auto max-w-6xl px-6 pt-24 pb-12 text-balance">
        <div className="eyebrow eyebrow-brand">O motor por trás de novos mundos</div>
        <h1 className="mt-4 text-5xl leading-[1.05] font-semibold tracking-tight sm:text-7xl">
          Construa mundos.
          <br />
          Comande-os ao vivo.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-[var(--p-text-2)]">
          Não é um CRM colado a um PM. Um único motor para o mundo inteiro — desenvolvido, construído, operado e vivido
          sobre um único registro.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button href={CANONICAL_CTAS.primary.href} size="lg">
            Comece a construir de graça
          </Button>
          <Button href={CANONICAL_CTAS.secondary.href} size="lg" variant="secondary">
            Veja em ação
          </Button>
        </div>
        <p className="mt-4 text-xs text-[var(--p-text-2)]">
          Grátis para sempre no nível Access · Sem cartão de crédito · Preço por organização
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="hed-xl flex flex-wrap items-baseline gap-x-3">
          <Wordmark word="ATLVS" /> <span aria-hidden="true">·</span> <Wordmark word="COMPVSS" />{" "}
          <span aria-hidden="true">·</span> <Wordmark word="GVTEWAY" /> <span aria-hidden="true">·</span>{" "}
          <Wordmark word="LEG3ND" />
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-[var(--p-text-2)]">
          Um registro. Quatro superfícies otimizadas. O mesmo mundo do escritório, do campo, do público e do
          conhecimento.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {APPS_PT.map((app) => (
            <Link key={app.name} href={app.href} className="surface hover-lift p-6">
              <Wordmark word={app.name} style={{ fontSize: 15 }} />
              <p className="mt-2 text-sm text-[var(--p-text-2)]">{app.body}</p>
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[var(--p-accent)]">
                Saiba mais <ArrowRight size={12} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <FAQSection title="Perguntas frequentes" faqs={FAQ_PT} />

      <CTASection
        title="Construa seu próximo mundo na ATLVS."
        subtitle="Grátis para sempre para equipes pequenas. Preço por organização. Sem cartão de crédito para começar."
        primaryLabel="Comece a construir de graça"
        secondaryLabel="Veja em ação"
      />
    </div>
  );
}
