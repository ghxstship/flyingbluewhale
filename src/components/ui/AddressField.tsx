"use client";

import * as React from "react";
import { Input } from "./Input";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * AddressField — Phase 7.2 of the SmartSuite parity roadmap.
 *
 * Per https://help.smartsuite.com/en/articles/4602675-address-field. Structured
 * address with discrete street1/street2/locality/region/postal_code/country
 * fields. This is the primitive — the autocomplete + map preview integration
 * with Mapbox/Google Places is a Phase 7+ enhancement that wraps this. For
 * now: a clean, accessible, locale-aware field group that emits the same
 * shape callers should persist.
 *
 * Storage shape:
 *   {
 *     street1: string;
 *     street2: string;
 *     locality: string;     // city
 *     region: string;       // state/province
 *     postal_code: string;
 *     country_code: string; // ISO 3166-1 alpha-2
 *     lat?: number;
 *     lng?: number;
 *   }
 *
 * Form integration:
 *   - The component renders 6 sub-inputs whose `name` attributes are
 *     `<name>_street1`, `<name>_locality`, etc., so server actions can pick
 *     them up via FormData. A hidden `<name>_json` posts the merged JSON.
 */

export type AddressValue = {
  street1: string;
  street2?: string;
  locality: string;
  region: string;
  postal_code: string;
  country_code: string;
  lat?: number;
  lng?: number;
};

export type AddressFieldProps = {
  name: string;
  label?: string;
  required?: boolean;
  value?: AddressValue;
  defaultValue?: AddressValue;
  onChange?: (value: AddressValue) => void;
  className?: string;
  hint?: string;
  disabled?: boolean;
  /** Show street2 row. Default true. */
  showStreet2?: boolean;
  /** Lock the country to a single value. */
  lockCountry?: string;
};

const COUNTRIES = [
  { iso: "US", label: "United States" },
  { iso: "CA", label: "Canada" },
  { iso: "GB", label: "United Kingdom" },
  { iso: "AU", label: "Australia" },
  { iso: "NZ", label: "New Zealand" },
  { iso: "IE", label: "Ireland" },
  { iso: "DE", label: "Germany" },
  { iso: "FR", label: "France" },
  { iso: "ES", label: "Spain" },
  { iso: "IT", label: "Italy" },
  { iso: "NL", label: "Netherlands" },
  { iso: "BE", label: "Belgium" },
  { iso: "PT", label: "Portugal" },
  { iso: "CH", label: "Switzerland" },
  { iso: "AT", label: "Austria" },
  { iso: "DK", label: "Denmark" },
  { iso: "NO", label: "Norway" },
  { iso: "SE", label: "Sweden" },
  { iso: "FI", label: "Finland" },
  { iso: "PL", label: "Poland" },
  { iso: "CZ", label: "Czech Republic" },
  { iso: "JP", label: "Japan" },
  { iso: "KR", label: "South Korea" },
  { iso: "MX", label: "Mexico" },
  { iso: "BR", label: "Brazil" },
  { iso: "AR", label: "Argentina" },
  { iso: "ZA", label: "South Africa" },
  { iso: "AE", label: "United Arab Emirates" },
  { iso: "IL", label: "Israel" },
  { iso: "IN", label: "India" },
  { iso: "CN", label: "China" },
  { iso: "HK", label: "Hong Kong" },
  { iso: "SG", label: "Singapore" },
];

const EMPTY: AddressValue = {
  street1: "",
  street2: "",
  locality: "",
  region: "",
  postal_code: "",
  country_code: "US",
};

export function AddressField(props: AddressFieldProps) {
  const {
    name,
    label,
    required,
    value,
    defaultValue,
    onChange,
    className,
    hint,
    disabled,
    showStreet2 = true,
    lockCountry,
  } = props;

  const t = useT();
  const [state, setState] = React.useState<AddressValue>(value ?? defaultValue ?? EMPTY);

  // Sync controlled mode
  React.useEffect(() => {
    if (value !== undefined) setState(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.street1, value?.street2, value?.locality, value?.region, value?.postal_code, value?.country_code]);

  const update = (patch: Partial<AddressValue>) => {
    const next = { ...state, ...patch };
    setState(next);
    onChange?.(next);
  };

  const json = JSON.stringify(state);

  return (
    <div className={className} role="group" aria-labelledby={`${name}-label`}>
      {label ? (
        <div id={`${name}-label`} className="text-xs font-medium text-[var(--p-text-2)]">
          {label}
          {required && <span className="ms-0.5 text-[var(--p-danger)]">*</span>}
        </div>
      ) : null}

      <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input
            label={t("components.addressField.streetLabel", undefined, "Street")}
            name={`${name}_street1`}
            value={state.street1}
            required={required}
            disabled={disabled}
            placeholder={t("components.addressField.street", undefined, "Street and number")}
            autoComplete="address-line1"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => update({ street1: e.target.value })}
          />
        </div>
        {showStreet2 ? (
          <div className="sm:col-span-2">
            <Input
              label={t("components.addressField.street2Label", undefined, "Apt / Suite · Optional")}
              name={`${name}_street2`}
              value={state.street2 ?? ""}
              disabled={disabled}
              placeholder={t("components.addressField.street2", undefined, "Apt, suite, floor")}
              autoComplete="address-line2"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => update({ street2: e.target.value })}
            />
          </div>
        ) : null}
        <Input
          label={t("components.addressField.city", undefined, "City")}
          name={`${name}_locality`}
          value={state.locality}
          required={required}
          disabled={disabled}
          autoComplete="address-level2"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => update({ locality: e.target.value })}
        />
        <Input
          label={t("components.addressField.region", undefined, "State / Region")}
          name={`${name}_region`}
          value={state.region}
          required={required}
          disabled={disabled}
          autoComplete="address-level1"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => update({ region: e.target.value })}
        />
        <Input
          label={t("components.addressField.postalCode", undefined, "Postal code")}
          name={`${name}_postal_code`}
          value={state.postal_code}
          required={required}
          disabled={disabled}
          autoComplete="postal-code"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => update({ postal_code: e.target.value })}
        />
        <div>
          <label className="text-xs font-medium text-[var(--p-text-2)]">
            {t("components.addressField.country", undefined, "Country")}
            {required && <span className="ms-0.5 text-[var(--p-danger)]">*</span>}
          </label>
          <select
            name={`${name}_country_code`}
            value={state.country_code}
            disabled={Boolean(disabled || lockCountry)}
            required={required}
            onChange={(e) => update({ country_code: e.target.value })}
            className="ps-input mt-1.5 w-full"
            autoComplete="country"
          >
            {COUNTRIES.map((c) => (
              <option key={c.iso} value={c.iso}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {hint ? <p className="mt-1.5 text-[11px] text-[var(--p-text-2)]">{hint}</p> : null}

      {/* Single-source-of-truth JSON for server actions that prefer the merged shape. */}
      <input type="hidden" name={`${name}_json`} value={json} />
    </div>
  );
}

/** Coerce a flat JSONB blob into an AddressValue. Tolerant of partial/null data. */
export function coerceAddress(raw: unknown): AddressValue {
  if (!raw || typeof raw !== "object") return { ...EMPTY };
  const r = raw as Record<string, unknown>;
  return {
    street1: typeof r.street1 === "string" ? r.street1 : "",
    street2: typeof r.street2 === "string" ? r.street2 : "",
    locality: typeof r.locality === "string" ? r.locality : "",
    region: typeof r.region === "string" ? r.region : "",
    postal_code: typeof r.postal_code === "string" ? r.postal_code : "",
    country_code: typeof r.country_code === "string" ? r.country_code : "US",
    lat: typeof r.lat === "number" ? r.lat : undefined,
    lng: typeof r.lng === "number" ? r.lng : undefined,
  };
}
