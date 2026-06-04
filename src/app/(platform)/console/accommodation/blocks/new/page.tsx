import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { getRequestT } from "@/lib/i18n/request";
import { createAccommodationBlock } from "./actions";

export default async function Page() {
  const { t } = await getRequestT();
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.accommodation.blocks.new.eyebrow", undefined, "Accommodation")}
        title={t("console.accommodation.blocks.new.title", undefined, "New Room Block")}
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={createAccommodationBlock}
          cancelHref="/console/accommodation/blocks"
          submitLabel={t("console.accommodation.blocks.new.submit", undefined, "Create Block")}
        >
          <Input
            label={t("console.accommodation.blocks.new.fields.name", undefined, "Block Name")}
            name="name"
            required
            maxLength={120}
            placeholder={t(
              "console.accommodation.blocks.new.fields.namePlaceholder",
              undefined,
              "e.g. Athletes Tier 1",
            )}
          />
          <Input
            label={t("console.accommodation.blocks.new.fields.property", undefined, "Property")}
            name="property"
            required
            maxLength={160}
            placeholder={t("console.accommodation.blocks.new.fields.propertyPlaceholder", undefined, "Hotel / venue")}
          />
          <Input
            label={t("console.accommodation.blocks.new.fields.city", undefined, "City")}
            name="city"
            maxLength={120}
          />
          <Input
            label={t("console.accommodation.blocks.new.fields.stakeholderGroup", undefined, "Stakeholder Group")}
            name="stakeholder_group"
            maxLength={80}
            placeholder={t(
              "console.accommodation.blocks.new.fields.stakeholderGroupPlaceholder",
              undefined,
              "e.g. delegations, sponsors, media",
            )}
          />
          <Input
            label={t("console.accommodation.blocks.new.fields.roomsReserved", undefined, "Rooms Reserved")}
            name="rooms_reserved"
            type="number"
            min={0}
            defaultValue={0}
            required
          />
          <Input
            label={t("console.accommodation.blocks.new.fields.startsOn", undefined, "Starts On")}
            name="starts_on"
            type="date"
          />
          <Input
            label={t("console.accommodation.blocks.new.fields.endsOn", undefined, "Ends On")}
            name="ends_on"
            type="date"
          />
        </FormShell>
      </div>
    </>
  );
}
