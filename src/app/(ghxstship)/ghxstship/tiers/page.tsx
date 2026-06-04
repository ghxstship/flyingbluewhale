import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TIERS, paths } from "@/lib/ghxstship";
import { GhxstshipJsonLd, breadcrumbSchema } from "@/components/ghxstship/JsonLd";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Experience Modes — Social, Digital, Physical, Theatrical | GHXSTSHIP",
  description:
    "Six experience modes that classify what kind of experience the production delivers — social, digital, virtual, physical, experiential, theatrical.",
  alternates: { canonical: "https://ghxstship.pro/ghxstship/tiers" },
};

export default function TiersHub() {
  return (
    <>
      <GhxstshipJsonLd
        data={breadcrumbSchema([
          { label: "GHXSTSHIP", href: "/ghxstship" },
          { label: "Experience Modes", href: "/ghxstship/tiers" },
        ])}
      />
      <div className="space-y-16 pb-24">
        <section className="mx-auto max-w-6xl px-6 pt-16">
          <div className="text-xs font-semibold tracking-[0.25em] uppercase" style={{ color: "var(--org-primary)" }}>
            Experience Modes
          </div>
          <h1 className="mt-4 text-5xl uppercase sm:text-7xl" style={{ fontFamily: "var(--font-display)" }}>
            How the audience
            <br />
            experiences it.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-[var(--text-secondary)]">
            A festival main stage, a theatrical run, a livestream broadcast, and a sponsor activation village all
            deliver different kinds of audience experience. The mode shapes the design, the staffing, and the success
            metric. Most engagements span two or three modes at once.
          </p>
        </section>

        <section className="mx-auto max-w-6xl px-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {TIERS.map((t) => (
              <Link
                key={t.slug}
                href={paths.tierDetail(t.slug)}
                className="surface hover-lift group flex h-full flex-col p-6"
              >
                <div className="text-xl uppercase" style={{ fontFamily: "var(--font-display)" }}>
                  {t.name}
                </div>
                <p className="mt-3 line-clamp-3 text-sm text-[var(--text-secondary)]">{t.definition}</p>
                <div className="mt-4 flex items-center gap-2 text-[10px] font-semibold tracking-[0.2em] uppercase">
                  <span className="text-[var(--text-muted)]">
                    {t.anchoredServices.length > 0 ? `${t.anchoredServices.length} anchored` : "Cross-cutting"}
                  </span>
                  <ArrowRight className="ms-auto h-3 w-3 text-[var(--text-muted)] group-hover:text-[var(--org-primary)]" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
