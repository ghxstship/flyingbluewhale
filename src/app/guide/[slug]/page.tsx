import { guides, guideSlugs } from '@/data';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import GuideView from '@/components/GuideView';

export function generateStaticParams() {
  return guideSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = guides[slug];
  if (!guide) return {};
  return {
    title: `${guide.title} — Know Before You Go — MMW26`,
    description: `${guide.title} guide for Black Coffee + Carlita + Kaz James Open Air at the Racetrack.`,
  };
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = guides[slug];
  if (!guide) notFound();
  return <GuideView guide={guide} />;
}
