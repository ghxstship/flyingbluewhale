# Load tests — k6

**H3-03 / IK-050.** Synthetic traffic harnesses for the hot paths we care
about in production. These scripts are intentionally **not** part of CI by
default — they're manual gates you run before a release, and a scheduled
weekly job in staging that alerts when P95 shifts.

## Prereqs

```bash
brew install k6             # or: https://k6.io/docs/get-started/installation/
```

## Run against local dev

```bash
# 1. start dev
npm run dev  # terminal A

# 2. warm ISR cache before measuring (otherwise first-request variance dominates)
curl -s http://localhost:3000 > /dev/null
curl -s http://localhost:3000/pricing > /dev/null
curl -s http://localhost:3000/features > /dev/null

# 3. run baseline
k6 run -e BASE_URL=http://localhost:3000 scripts/load/baseline.js
```

## Run against a preview or staging URL

```bash
k6 run -e BASE_URL=https://flyingbluewhale-pr-42.vercel.app \
  --summary-export=./k6-summary.json \
  scripts/load/baseline.js
```

## What it measures

| Scenario | Rate | Surface | P95 budget |
|---|---:|---|---:|
| marketing_browse | 50 rps / 5m | `/`, `/pricing`, `/features`, `/solutions`, `/blog` | 800 ms |
| api_health | 20 rps / 5m | `/api/v1/health/{liveness,readiness}` | 100 ms |
| api_public | 5 rps / 5m | `/p/mmw26-hialeah/guide` (anon portal) | 1200 ms |

Thresholds are floors, not targets. Tighten per release when the numbers
exceed expectations consistently — but don't let the thresholds rot
against production drift. If k6 fails the run, the regression is real.

## Scheduling in staging

When a staging env exists (H3-09), wire a GitHub Action on a weekly cron:

```yaml
on:
  schedule: [{ cron: "0 6 * * 1" }]  # Mon 06:00 UTC
jobs:
  k6:
    runs-on: ubuntu-latest
    steps:
      - uses: grafana/setup-k6-action@v1
      - run: k6 run -e BASE_URL=${{ secrets.STAGING_URL }} scripts/load/baseline.js
      - uses: actions/upload-artifact@v4
        with: { name: k6-summary, path: summary.json }
```
