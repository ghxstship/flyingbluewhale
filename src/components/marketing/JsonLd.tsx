import { jsonLd } from "@/lib/seo";

export function JsonLd({ data }: { data: object | object[] }) {
  const array = Array.isArray(data) ? data : [data];
  return (
    <>
      {array.map((d, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(d) }} />
      ))}
    </>
  );
}
