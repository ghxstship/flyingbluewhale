import { ModuleHeader } from "@/components/Shell";
import { LocationPickerDemo } from "./LocationPickerDemo";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <>
      <ModuleHeader
        eyebrow="Locations"
        title="Location picker"
        subtitle="Async typeahead — paste this into any form"
      />
      <div className="page-content max-w-2xl space-y-4">
        <LocationPickerDemo />
        <pre className="surface overflow-x-auto p-4 text-xs">{`<Combobox
  optionsLoader={async (query) => {
    const r = await fetch(\`/api/v1/locations?q=\${encodeURIComponent(query)}\`);
    const json = await r.json();
    return json.data.locations.map(l => ({
      value: l.id,
      label: l.name,
      keywords: l.secondary ? [l.secondary] : [],
    }));
  }}
  value={value}
  onChange={setValue}
  placeholder="Search locations…"
/>`}</pre>
      </div>
    </>
  );
}
