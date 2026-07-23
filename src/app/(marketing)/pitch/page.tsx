// Pitch-deck presenter — live, verifiable render of the sample ATLVS deck.
//
// The slides are built on the server (token-styled primitives, no client
// state) and handed to the client-side DeckShell driver for keyboard nav +
// progress chrome. Not a nav target — it's a presenter surface reached by
// direct link, so it's listed in EXEMPT in scripts/generate-sitemap.mjs.
import type { Metadata } from "next";
import { DeckShell } from "@/components/pitch/DeckShell";
import { atlvsPitchDeck } from "@/components/pitch/templates";
import { buildMetadata } from "@/lib/seo";

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: "Pitch deck",
    description: "The ATLVS Technologies story: problem, ecosystem, the four apps, the receipts.",
    path: "/pitch",
    noIndex: true,
  });
}

export default function PitchPage() {
  return <DeckShell slides={atlvsPitchDeck()} label="ATLVS Technologies" />;
}
