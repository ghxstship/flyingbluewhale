// ISR — regenerate static HTML every 5 min. Uses the static English
// translator (no session, no cookies) so the page stays static-compatible.
export const revalidate = 300;

import type { Metadata } from "next";
import { FileScan, Gauge, Lock, Quote, ShieldCheck, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { JsonLd } from "@/components/marketing/JsonLd";
import { FAQSection } from "@/components/marketing/FAQ";
import { CTASection } from "@/components/marketing/CTASection";
import {
  buildMetadata,
  breadcrumbSchema,
  faqSchema,
  softwareApplicationSchema,
  CANONICAL_CTAS,
} from "@/lib/seo";
import { urlFor } from "@/lib/urls";
import { getStaticEnT } from "../_lib/static-t";
import { WaitlistForm } from "../_lib/WaitlistForm";

const K = "marketing.pages.aurora";

/**
 * Aurora AI (powered by Brio) — the ecosystem-wide assistant product page.
 *
 * Every workflow listed here is verified against the repo and labeled
 * honestly: "Live today" means the code path ships and runs, "In preview"
 * means the surface exists with a deliberately limited backend, "Coming
 * with <product>" means the workflow is built (or specified) and arrives
 * when that product opens. Nothing on this page claims autonomy the
 * platform does not have.
 *
 * The northern-lights identity is page-scoped CSS only (the .aurora-*
 * classes in the <style> block below). It deliberately does NOT touch the
 * product token system: Aurora is a capability across all four products,
 * not a fifth accent in tokens.json.
 */

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getStaticEnT();
  return buildMetadata({
    title: t(`${K}.meta.title`, undefined, "Aurora AI, Powered by Brio: One Assistant Across the Ecosystem"),
    description: t(
      `${K}.meta.description`,
      undefined,
      "Aurora AI answers from your workspace records with citations and a confidence grade. Live in the COMPVSS field app today; the console workflows arrive with ATLVS. Powered by Brio.",
    ),
    path: "/aurora",
    keywords: [
      "Aurora AI",
      "Brio",
      "AI for event production",
      "production AI assistant",
      "AI concierge for events",
      "grounded AI with citations",
      "AI receipt scanning",
      "AI for live events",
    ],
    ogImageEyebrow: "Aurora AI",
    ogImageTitle: t(`${K}.meta.ogImageTitle`, undefined, "Ask Aurora."),
  });
}

type WorkflowStatus = "live" | "preview" | "coming";

function StatusChip({ status, label }: { status: WorkflowStatus; label: string }) {
  return (
    <span className="aurora-chip" data-status={status}>
      {label}
    </span>
  );
}

export default async function AuroraPage() {
  const { t } = await getStaticEnT();

  const crumbs = [
    { label: t(`${K}.crumbs.home`, undefined, "Home"), href: "/" },
    { label: "Aurora AI", href: "/aurora" },
  ];

  const statusLabels: Record<WorkflowStatus, (product?: string) => string> = {
    live: () => t(`${K}.status.live`, undefined, "Live today"),
    preview: () => t(`${K}.status.preview`, undefined, "In preview"),
    coming: (product?: string) =>
      t(`${K}.status.coming`, { product: product ?? "" }, `Coming with ${product}`),
  };

  const products: Array<{
    name: string;
    role: string;
    workflows: Array<{ title: string; body: string; status: WorkflowStatus; statusProduct?: string }>;
  }> = [
    {
      name: "COMPVSS",
      role: t(`${K}.products.compvss.role`, undefined, "The field app. Live now."),
      workflows: [
        {
          title: t(`${K}.products.compvss.scan.title`, undefined, "Scan-to-draft capture"),
          body: t(
            `${K}.products.compvss.scan.body`,
            undefined,
            "Point the phone camera at a receipt or an invoice. Aurora reads the vendor, the total, and the date into a draft, suggests a cost code from your own spending history, and waits for you to confirm. Nothing writes itself into the books.",
          ),
          status: "live",
        },
        {
          title: t(`${K}.products.compvss.chat.title`, undefined, "Aurora field chat"),
          body: t(
            `${K}.products.compvss.chat.body`,
            undefined,
            "The Aurora tab ships in the field app today as a guided assistant. Ask where your next shift is and it walks you to the right surface; it will not fake a number it cannot see. The conversational runtime arrives with Brio.",
          ),
          status: "preview",
        },
      ],
    },
    {
      name: "LEG3ND",
      role: t(`${K}.products.legend.role`, undefined, "Where the organization lives."),
      workflows: [
        {
          title: t(`${K}.products.legend.knowledge.title`, undefined, "Knowledge that answers back"),
          body: t(
            `${K}.products.legend.knowledge.body`,
            undefined,
            "Your standards, SOPs, and event guides become the corpus Aurora answers from, synced per event. The answer at the gate matches the binder in the production office because it is the same document.",
          ),
          status: "coming",
          statusProduct: "LEG3ND",
        },
      ],
    },
    {
      name: "ATLVS",
      role: t(`${K}.products.atlvs.role`, undefined, "The producer's console. In active development, and Aurora is already wired into it."),
      workflows: [
        {
          title: t(`${K}.products.atlvs.copilot.title`, undefined, "Grounded Copilot"),
          body: t(
            `${K}.products.atlvs.copilot.body`,
            undefined,
            "Ask a question and get an answer built only from your org's indexed documents, with each claim cited by source number and a confidence grade on the whole answer. When no source matches, it says so instead of guessing.",
          ),
          status: "coming",
          statusProduct: "ATLVS",
        },
        {
          title: t(`${K}.products.atlvs.assistant.title`, undefined, "Workspace assistant"),
          body: t(
            `${K}.products.atlvs.assistant.body`,
            undefined,
            "Streaming chat with conversation history, kept inside your tenant. Claude Sonnet for the day-to-day, Claude Opus when a question deserves the long think.",
          ),
          status: "coming",
          statusProduct: "ATLVS",
        },
        {
          title: t(`${K}.products.atlvs.suggests.title`, undefined, "Copilot Suggests"),
          body: t(
            `${K}.products.atlvs.suggests.body`,
            undefined,
            "A rail of next actions computed from real org data: blocked tasks, approvals waiting, open incidents. It never applies anything on its own. Every card deep-links to the surface that clears it, and you do the clearing.",
          ),
          status: "coming",
          statusProduct: "ATLVS",
        },
        {
          title: t(`${K}.products.atlvs.drafting.title`, undefined, "Paperwork drafting"),
          body: t(
            `${K}.products.atlvs.drafting.body`,
            undefined,
            "Client-ready proposal drafts from the record's own metadata plus your instructions. You accept or discard; a draft never publishes itself.",
          ),
          status: "coming",
          statusProduct: "ATLVS",
        },
        {
          title: t(`${K}.products.atlvs.intake.title`, undefined, "Document intake"),
          body: t(
            `${K}.products.atlvs.intake.body`,
            undefined,
            "AP invoices, COIs, and W-9s read into structured fields with a confidence score on every extraction. Anything under the bar routes to a human review queue instead of the ledger.",
          ),
          status: "coming",
          statusProduct: "ATLVS",
        },
        {
          title: t(`${K}.products.atlvs.recaps.title`, undefined, "Meeting recaps and field agents"),
          body: t(
            `${K}.products.atlvs.recaps.body`,
            undefined,
            "A transcript in, a tight recap and concrete action items out, saved on the meeting note. Field agents keep a derived column fresh from a record's own values whenever the record changes, against a whitelist of tables you control.",
          ),
          status: "coming",
          statusProduct: "ATLVS",
        },
      ],
    },
    {
      name: "GVTEWAY",
      role: t(`${K}.products.gvteway.role`, undefined, "Where the world is experienced."),
      workflows: [
        {
          title: t(`${K}.products.gvteway.concierge.title`, undefined, "Guest and crew concierge"),
          body: t(
            `${K}.products.gvteway.concierge.body`,
            undefined,
            "Aurora answers the phone. Box office questions, parking, lost and found, credential lookups, over voice, SMS, or web chat, around the clock, with a human paged the moment a conversation needs one. This is the Brio channel layer end to end.",
          ),
          status: "coming",
          statusProduct: "GVTEWAY",
        },
      ],
    },
  ];

  const faqs = [
    {
      q: t(`${K}.faq.what.q`, undefined, "What is Aurora AI?"),
      a: t(
        `${K}.faq.what.a`,
        undefined,
        "Aurora is the one AI assistant across the ATLVS ecosystem: the producer's console, the field app, the public portals, and the knowledge layer. One agent identity everywhere, so the crew asks Aurora at the gate and the producer asks Aurora in the console, and both get answers grounded in the same records.",
      ),
    },
    {
      q: t(`${K}.faq.brio.q`, undefined, "What is Brio?"),
      a: t(
        `${K}.faq.brio.a`,
        undefined,
        "Brio (heybrio.ai) is the conversational runtime that powers Aurora: the chat, voice, and SMS channels it answers on. Brio runs the conversation; ATLVS stays the system of record and supplies the live data and knowledge Aurora answers from. You will never hand your records to a black box.",
      ),
    },
    {
      q: t(`${K}.faq.today.q`, undefined, "What can Aurora do today?"),
      a: t(
        `${K}.faq.today.a`,
        undefined,
        "Two things are on phones right now. Scan-to-draft capture in COMPVSS reads receipts and invoices into confirmed-by-you drafts, and the Aurora tab runs as a guided assistant in preview. The console workflows, from the grounded Copilot to document intake, are built and arrive with ATLVS.",
      ),
    },
    {
      q: t(`${K}.faq.grounding.q`, undefined, "How is Aurora grounded, and what happens to our data?"),
      a: t(
        `${K}.faq.grounding.a`,
        undefined,
        "Aurora reads through the same row-level security your team does, so your tenant is walled off in the database itself. Grounded answers cite their sources and carry a confidence grade. We do not train models on your data; Aurora runs on Anthropic Claude, and your conversations stay inside your tenant.",
      ),
    },
    {
      q: t(`${K}.faq.when.q`, undefined, "When does the full conversational runtime arrive?"),
      a: t(
        `${K}.faq.when.a`,
        undefined,
        "We will not dress a roadmap up as a promise, so no date until it is a real one. The COMPVSS preview is on phones now, scan capture is live, and the console workflows ship with ATLVS. Waitlist members hear first when each surface opens.",
      ),
    },
  ];

  return (
    <div className="aurora-scope">
      {/* Page-scoped northern-lights identity. Layered green-family gradients
          only; no product tokens are redefined. Motion is a slow drift on a
          blurred veil and is disabled under prefers-reduced-motion. */}
      <style>{`
        .aurora-band {
          position: relative;
          overflow: hidden;
          border-radius: var(--p-r-xl, 16px);
          background:
            radial-gradient(90% 120% at 15% 0%, rgba(34, 197, 94, 0.42) 0%, rgba(34, 197, 94, 0) 55%),
            radial-gradient(70% 100% at 80% 8%, rgba(94, 234, 212, 0.34) 0%, rgba(94, 234, 212, 0) 60%),
            radial-gradient(120% 140% at 50% 120%, rgba(15, 118, 110, 0.6) 0%, rgba(15, 118, 110, 0) 70%),
            linear-gradient(160deg, #03150f 0%, #052e22 45%, #064e3b 100%);
        }
        .aurora-band::before {
          content: "";
          position: absolute;
          inset: -40%;
          pointer-events: none;
          background: linear-gradient(
            100deg,
            transparent 18%,
            rgba(134, 239, 172, 0.16) 34%,
            rgba(94, 234, 212, 0.22) 50%,
            rgba(52, 211, 153, 0.14) 63%,
            transparent 82%
          );
          filter: blur(26px);
          transform: translateX(-16%) rotate(-2deg);
          animation: aurora-drift 16s ease-in-out infinite alternate;
        }
        @keyframes aurora-drift {
          from { transform: translateX(-16%) rotate(-2deg); }
          to { transform: translateX(12%) rotate(2deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .aurora-band::before { animation: none; }
        }
        .aurora-eyebrow-hero { color: #86efac; }
        .aurora-accent-ink { color: light-dark(#0f766e, #5eead4); }
        .aurora-ink { color: #ecfdf5; }
        .aurora-ink-2 { color: rgba(236, 253, 245, 0.78); }
        .aurora-grad-text {
          background: linear-gradient(92deg, #86efac 0%, #34d399 42%, #5eead4 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .aurora-rule {
          height: 3px;
          border-radius: 999px;
          background: linear-gradient(90deg, #0f766e 0%, #22c55e 45%, #5eead4 100%);
        }
        .aurora-chip {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 3px 10px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.02em;
          white-space: nowrap;
          border: 1px solid var(--p-border);
          color: var(--p-text-2);
          background: transparent;
        }
        .aurora-chip[data-status="live"] {
          background: color-mix(in oklab, #22c55e 14%, transparent);
          border-color: color-mix(in oklab, #22c55e 45%, transparent);
          color: light-dark(#15803d, #6ee7b7);
        }
        .aurora-chip[data-status="preview"] {
          background: color-mix(in oklab, #14b8a6 12%, transparent);
          border-color: color-mix(in oklab, #14b8a6 40%, transparent);
          color: light-dark(#0f766e, #5eead4);
        }
      `}</style>

      <JsonLd
        data={[
          breadcrumbSchema(crumbs),
          softwareApplicationSchema({
            name: "Aurora AI",
            appName: "Aurora AI",
            description: t(
              `${K}.jsonLd.description`,
              undefined,
              "Aurora AI, powered by Brio: the assistant across the ATLVS ecosystem. Answers grounded in your workspace records with citations and a confidence grade.",
            ),
            url: urlFor("marketing", "/aurora"),
          }),
          faqSchema(faqs),
        ]}
      />
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />

      {/* Hero — the northern-lights band */}
      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <div className="aurora-band p-10 md:p-14">
          <div className="relative">
            <div className="eyebrow aurora-eyebrow-hero">
              {t(`${K}.hero.eyebrow`, undefined, "Aurora AI · Powered by Brio")}
            </div>
            <h1 className="hed-3xl aurora-ink mt-4 max-w-3xl">
              {t(`${K}.hero.titlePrefix`, undefined, "Ask ")}
              <span className="aurora-grad-text">Aurora</span>
              {t(`${K}.hero.titleSuffix`, undefined, ". It already read the run-of-show.")}
            </h1>
            <p className="aurora-ink-2 mt-5 max-w-2xl text-lg">
              {t(
                `${K}.hero.body`,
                undefined,
                "Aurora is the one assistant across the whole ecosystem. It answers from your workspace: the projects, schedules, invoices, and call sheets your team already keeps here. Grounded answers, cited sources, and a human holding the publish key.",
              )}
            </p>
            <p className="aurora-ink-2 mt-4 max-w-2xl text-sm">
              {t(
                `${K}.hero.attribution`,
                undefined,
                "Powered by Brio, the conversational runtime that gives Aurora its chat, voice, and SMS channels. Brio runs the conversation; your org's records supply the truth.",
              )}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href={CANONICAL_CTAS.primary.href}>{CANONICAL_CTAS.primary.label}</Button>
              <Button href="#waitlist" variant="secondary">
                {t(`${K}.hero.secondaryCta`, undefined, "Join the Aurora waitlist")}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Where Aurora works — one row per product, honestly labeled */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="hed-xl">{t(`${K}.where.heading`, undefined, "Where Aurora works")}</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--p-text-2)]">
          {t(
            `${K}.where.body`,
            undefined,
            "Every item below carries its real state. Live means shipping, preview means a deliberately limited surface you can touch today, and coming means built for a product that has not opened yet.",
          )}
        </p>
        <div className="mt-8 space-y-10">
          {products.map((p) => (
            <div key={p.name} className="grid gap-6 md:grid-cols-[220px_1fr]">
              <div>
                <div className="hed-lg">{p.name}</div>
                <div className="aurora-rule mt-3 w-16" />
                <p className="mt-3 text-sm text-[var(--p-text-2)]">{p.role}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {p.workflows.map((w) => (
                  <div key={w.title} className="surface p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-base font-semibold">{w.title}</h3>
                      <StatusChip status={w.status} label={statusLabels[w.status](w.statusProduct)} />
                    </div>
                    <p className="mt-2 text-sm text-[var(--p-text-2)]">{w.body}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Grounding and trust */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="surface p-10">
          <div className="eyebrow aurora-accent-ink">
            {t(`${K}.trust.eyebrow`, undefined, "Grounded by design")}
          </div>
          <h2 className="hed-xl mt-3">{t(`${K}.trust.heading`, undefined, "It shows its work.")}</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {[
              {
                icon: Lock,
                title: t(`${K}.trust.rls.title`, undefined, "Walled per organization"),
                body: t(
                  `${K}.trust.rls.body`,
                  undefined,
                  "Aurora reads through the same row-level security your team does. Your tenant is separated in the database itself, and another org's data is unreachable by construction.",
                ),
              },
              {
                icon: Quote,
                title: t(`${K}.trust.citations.title`, undefined, "Citations and a confidence grade"),
                body: t(
                  `${K}.trust.citations.body`,
                  undefined,
                  "Grounded answers come only from your indexed corpus, cite each claim by source number, and grade how well the sources support the answer. No matching sources means it says so instead of guessing.",
                ),
              },
              {
                icon: UserCheck,
                title: t(`${K}.trust.hitl.title`, undefined, "A human holds the publish key"),
                body: t(
                  `${K}.trust.hitl.body`,
                  undefined,
                  "Drafts stay drafts until someone accepts them, and suggestions never apply themselves. Extractions below 90 percent confidence route to a review queue.",
                ),
              },
              {
                icon: ShieldCheck,
                title: t(`${K}.trust.training.title`, undefined, "No training on your data"),
                body: t(
                  `${K}.trust.training.body`,
                  undefined,
                  "We do not train models. Aurora runs on Anthropic Claude, and your conversations are logged inside your own tenant where you can query and export them.",
                ),
              },
              {
                icon: Gauge,
                title: t(`${K}.trust.metered.title`, undefined, "Metered and capped"),
                body: t(
                  `${K}.trust.metered.body`,
                  undefined,
                  "Every call is rate-limited before it reaches the model and usage is metered per org, so a runaway script cannot run up your bill.",
                ),
              },
              {
                icon: FileScan,
                title: t(`${K}.trust.kit.title`, undefined, "One AI surface language"),
                body: t(
                  `${K}.trust.kit.body`,
                  undefined,
                  "Streaming, thinking, citations, and confidence share one design language across every product, so you always know when Aurora is generating, what it consulted, and how sure it is.",
                ),
              },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <item.icon size={18} className="aurora-accent-ink mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <h3 className="text-sm font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm text-[var(--p-text-2)]">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Waitlist */}
      <section id="waitlist" className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-2 md:items-start">
          <div>
            <div className="eyebrow aurora-accent-ink">
              {t(`${K}.waitlist.eyebrow`, undefined, "Waitlist")}
            </div>
            <h2 className="hed-xl mt-3">
              {t(`${K}.waitlist.heading`, undefined, "First in line when the lights come up.")}
            </h2>
            <p className="mt-4 max-w-md text-sm text-[var(--p-text-2)]">
              {t(
                `${K}.waitlist.body`,
                undefined,
                "The conversational runtime lands surface by surface, and waitlist members hear about each one before anyone else. One email per opening. No drip campaign.",
              )}
            </p>
          </div>
          <WaitlistForm product="aurora" productName="Aurora AI" />
        </div>
      </section>

      <FAQSection title={t(`${K}.faq.title`, undefined, "Aurora AI, asked and answered")} faqs={faqs} />

      <CTASection
        title={t(`${K}.cta.title`, undefined, "Bring Aurora to the next build.")}
        subtitle={t(
          `${K}.cta.subtitle`,
          undefined,
          "Start free, scan a receipt tonight, and let the rest of Aurora meet you where the work is.",
        )}
      />
    </div>
  );
}
