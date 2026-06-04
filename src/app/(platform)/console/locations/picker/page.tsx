import { ModuleHeader } from "@/components/Shell";
import { getRequestT } from "@/lib/i18n/request";
import { LocationPickerDemo } from "./LocationPickerDemo";

export const dynamic = "force-dynamic";

// Internal developer reference for the async location-picker Combobox.
// Intentionally omitted from `platformNav` — this page is a copy-paste
// code sample, not a user destination. Reachable via the deep link
// `/console/locations/picker` for engineers integrating the Combobox.
export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.locations.picker.eyebrow", undefined, "Locations")}
        title={t("console.locations.picker.title", undefined, "Location Picker")}
        subtitle={t("console.locations.picker.subtitle", undefined, "Async typeahead — paste this into any form")}
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
