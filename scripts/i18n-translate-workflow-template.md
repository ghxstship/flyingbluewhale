# Locale-translation workflow — template & runbook

After `merge-i18n-into-en.mjs` lands and `i18n-locale-gaps.mjs` produces the
per-locale × per-namespace shards, this workflow translates every shard into
each of the 6 non-English locales (es / fr / de / pt / ja / ar).

## Why a workflow

- 10k+ keys per locale × 6 locales = ~60k translation outputs.
- A single agent would blow context.
- Shards are bucketed at depth=2 (`console.workforce`, `p.artist`, etc.) —
  natural unit for one agent per locale × shard.

## Invocation pattern

The translation work itself happens in a Workflow that the runner reads
the gap reports inside the script (via `agent()` calls — agents have
filesystem access through the Read tool, the script itself does not).

```js
// pseudo-shape
export const meta = {
  name: "i18n-translate-locales",
  description: "Translate per-locale × per-namespace shards into 6 locales",
  phases: [{ title: "Translate" }, { title: "Write-back" }],
};

const LOCALES = ["es", "fr", "de", "pt", "ja", "ar"];
// args = list of namespace shards: [{ ns: 'console.workforce', keyCount: 1024 }, ...]
const SHARDS = args;

phase("Translate");
const TRANSLATION_SCHEMA = {
  /* { locale, translations: { keyPath: value } } */
};

const pairs = SHARDS.flatMap((s) => LOCALES.map((loc) => ({ ns: s.ns, locale: loc })));

const results = await parallel(
  pairs.map(
    ({ ns, locale }) =>
      () =>
        agent(
          `Translate the shard reports/i18n-locale-gaps/${locale}/${ns.replace(/\./g, "__")}.json
         into ${locale}. Brand voice: "definitive luxury self-confidence with
         hacker irreverence" — Aesop / Berghain / Patek crossed with operator
         vernacular (load-in, RFI, advancing, ROS). Preserve {placeholder}
         tokens. Brand names ATLVS/COMPVSS/GVTEWAY/GHXSTSHIP stay literal.
         Write the result to reports/i18n-translated/${locale}/${ns.replace(/\./g, "__")}.json
         as { keyPath: target-locale-value } map. Return the path written.`,
          { label: `translate:${locale}:${ns}`, schema: TRANSLATION_SCHEMA },
        ),
  ),
);

phase("Write-back");
// Outside the workflow, run:
//   node scripts/i18n-translate-locale.mjs es fr de pt ja ar
// which deep-merges every reports/i18n-translated/<loc>/<ns>.json into
// src/messages/<loc>.json.
```

## Runbook (post Phase 1b completion)

```sh
# 1. Marketing-shell RTL sweep (deferred from earlier).
bash scripts/rtl-sweep-marketing.sh

# 2. Re-extract from source (captures Phase 1b additions).
node scripts/extract-i18n-keys.mjs

# 3. Merge extracted keys into en.json.
node scripts/merge-i18n-into-en.mjs

# 4. Find gaps per locale, bucket into ns shards.
node scripts/i18n-locale-gaps.mjs

# 5. Launch translation workflow. Args = list of {ns, keyCount} pairs.
#    The script writes per-locale per-namespace JSON shards under
#    reports/i18n-translated/<locale>/<ns>.json.
#    [Manual: build shard list from gap output, launch with appropriate
#    token budget; expect ~30-60M tokens given the scale.]

# 6. Apply translated shards into locale catalogs.
node scripts/i18n-translate-locale.mjs es fr de pt ja ar

# 7. Validate.
for f in src/messages/*.json; do
  node -e "JSON.parse(require('fs').readFileSync('$f','utf8'))" \
    && echo "OK $f" || echo "BAD $f"
done
npx tsc --noEmit -p tsconfig.json

# 8. Browser verify: cookie-flip locale=ar on the homepage,
#    confirm <html dir="rtl"> + nav + body all translate cleanly.
```

## Cost estimate

- 6 locales × ~10k keys ≈ 60k translation outputs.
- ~50 output tokens per translation ≈ 3M output tokens/locale ≈ 18M total.
- Plus per-agent reading the shard input (~5–10k input tokens per shard,
  but cached after first call across shards in the same locale).

Realistic budget: 25–40M tokens for the full translation pass.
