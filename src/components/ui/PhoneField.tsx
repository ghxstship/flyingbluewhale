"use client";

import * as React from "react";
import { Input } from "./Input";

/**
 * PhoneField — Phase 7.2 of the SmartSuite parity roadmap.
 *
 * Per https://help.smartsuite.com/en/articles/4602359-phone-field. Lightweight
 * structured phone input: ISO country select, optional type tag (Office /
 * Mobile / Home / Fax), and a tel input. We don't ship `libphonenumber-js`
 * here — input is preserved as the user typed it, with a parsed E.164 form
 * persisted alongside as best-effort. Validation is character-class only.
 *
 * Storage shape:
 *   { country: "US", number: "+1 (555) 123-4567", type: "mobile" }
 *
 * Form integration:
 *   - Hidden inputs `<name>_country`, `<name>_type`, `<name>_e164` post
 *     alongside the main `<name>` field for server actions to pick up.
 */

export type PhoneType = "office" | "mobile" | "home" | "fax";

export type PhoneValue = {
  country: string; // ISO 3166-1 alpha-2 (e.g. "US")
  number: string; // user-typed
  type?: PhoneType;
};

export type PhoneFieldProps = {
  /** HTML name. Posts the user-typed `number` value; structured fields post under `<name>_country`, `<name>_type`. */
  name: string;
  label?: string;
  required?: boolean;
  value?: PhoneValue;
  defaultValue?: PhoneValue;
  onChange?: (value: PhoneValue) => void;
  /** Show the type tag select. Default false. */
  showType?: boolean;
  className?: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
};

// Curated list — top 25 dialing codes by population. Operators can extend.
const COUNTRIES: Array<{ iso: string; dialCode: string; label: string }> = [
  { iso: "US", dialCode: "+1", label: "United States" },
  { iso: "CA", dialCode: "+1", label: "Canada" },
  { iso: "GB", dialCode: "+44", label: "United Kingdom" },
  { iso: "AU", dialCode: "+61", label: "Australia" },
  { iso: "NZ", dialCode: "+64", label: "New Zealand" },
  { iso: "IE", dialCode: "+353", label: "Ireland" },
  { iso: "DE", dialCode: "+49", label: "Germany" },
  { iso: "FR", dialCode: "+33", label: "France" },
  { iso: "ES", dialCode: "+34", label: "Spain" },
  { iso: "IT", dialCode: "+39", label: "Italy" },
  { iso: "NL", dialCode: "+31", label: "Netherlands" },
  { iso: "BE", dialCode: "+32", label: "Belgium" },
  { iso: "PT", dialCode: "+351", label: "Portugal" },
  { iso: "CH", dialCode: "+41", label: "Switzerland" },
  { iso: "AT", dialCode: "+43", label: "Austria" },
  { iso: "DK", dialCode: "+45", label: "Denmark" },
  { iso: "NO", dialCode: "+47", label: "Norway" },
  { iso: "SE", dialCode: "+46", label: "Sweden" },
  { iso: "FI", dialCode: "+358", label: "Finland" },
  { iso: "PL", dialCode: "+48", label: "Poland" },
  { iso: "CZ", dialCode: "+420", label: "Czech Republic" },
  { iso: "JP", dialCode: "+81", label: "Japan" },
  { iso: "KR", dialCode: "+82", label: "South Korea" },
  { iso: "MX", dialCode: "+52", label: "Mexico" },
  { iso: "BR", dialCode: "+55", label: "Brazil" },
  { iso: "AR", dialCode: "+54", label: "Argentina" },
  { iso: "ZA", dialCode: "+27", label: "South Africa" },
  { iso: "AE", dialCode: "+971", label: "United Arab Emirates" },
  { iso: "IL", dialCode: "+972", label: "Israel" },
  { iso: "IN", dialCode: "+91", label: "India" },
  { iso: "CN", dialCode: "+86", label: "China" },
  { iso: "HK", dialCode: "+852", label: "Hong Kong" },
  { iso: "SG", dialCode: "+65", label: "Singapore" },
];

function dialCodeFor(iso: string): string {
  return COUNTRIES.find((c) => c.iso === iso)?.dialCode ?? "+1";
}

/** Best-effort E.164 normalization — strip non-digits, prepend dial code if not already there. */
export function toE164(value: PhoneValue): string {
  const digits = value.number.replace(/[^\d]/g, "");
  if (!digits) return "";
  const code = dialCodeFor(value.country).replace(/[^\d]/g, "");
  if (digits.startsWith(code)) return `+${digits}`;
  return `+${code}${digits}`;
}

const TYPE_OPTIONS: { value: PhoneType; label: string }[] = [
  { value: "mobile", label: "Mobile" },
  { value: "office", label: "Office" },
  { value: "home", label: "Home" },
  { value: "fax", label: "Fax" },
];

export function PhoneField(props: PhoneFieldProps) {
  const {
    name,
    label,
    required,
    value,
    defaultValue,
    onChange,
    showType = false,
    className,
    hint,
    error,
    disabled,
  } = props;

  const [country, setCountry] = React.useState(value?.country ?? defaultValue?.country ?? "US");
  const [number, setNumber] = React.useState(value?.number ?? defaultValue?.number ?? "");
  const [type, setType] = React.useState<PhoneType | undefined>(
    value?.type ?? defaultValue?.type ?? (showType ? "mobile" : undefined),
  );

  // Sync controlled mode
  React.useEffect(() => {
    if (value === undefined) return;
    if (value.country !== country) setCountry(value.country);
    if (value.number !== number) setNumber(value.number);
    if (value.type !== type) setType(value.type);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.country, value?.number, value?.type]);

  const fire = (next: Partial<PhoneValue>) => {
    const merged: PhoneValue = { country, number, type, ...next };
    if (next.country !== undefined) setCountry(next.country);
    if (next.number !== undefined) setNumber(next.number);
    if (next.type !== undefined) setType(next.type);
    onChange?.(merged);
  };

  const e164 = toE164({ country, number, type });

  return (
    <div className={className}>
      {label ? (
        <label className="text-xs font-medium text-[var(--p-text-2)]">
          {label}
          {required && <span className="ms-0.5 text-[var(--p-danger)]">*</span>}
        </label>
      ) : null}
      <div className="mt-1.5 flex gap-2">
        <select
          aria-label={label ? `${label} country` : "Country"}
          value={country}
          disabled={disabled}
          onChange={(e) => fire({ country: e.target.value })}
          className="ps-input w-32 shrink-0"
        >
          {COUNTRIES.map((c) => (
            <option key={c.iso} value={c.iso}>
              {c.iso} {c.dialCode}
            </option>
          ))}
        </select>
        <Input
          name={name}
          type="tel"
          required={required}
          disabled={disabled}
          value={number}
          inputMode="tel"
          autoComplete="tel"
          placeholder={dialCodeFor(country) + "  XXX XXX XXXX"}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => fire({ number: e.target.value })}
          className="flex-1"
          error={error}
          hint={hint}
          aria-invalid={Boolean(error) || undefined}
        />
        {showType ? (
          <select
            aria-label={label ? `${label} type` : "Type"}
            value={type ?? "mobile"}
            disabled={disabled}
            onChange={(e) => fire({ type: e.target.value as PhoneType })}
            className="ps-input w-28 shrink-0"
          >
            {TYPE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        ) : null}
      </div>
      {/* Hidden structured inputs so server actions pick up everything. */}
      <input type="hidden" name={`${name}_country`} value={country} />
      <input type="hidden" name={`${name}_e164`} value={e164} />
      {showType ? <input type="hidden" name={`${name}_type`} value={type ?? ""} /> : null}
    </div>
  );
}
