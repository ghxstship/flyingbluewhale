// H3-03 / IK-050 — k6 baseline load test.
//
// Run locally:  k6 run -e BASE_URL=http://localhost:3000 scripts/load/baseline.js
// Run on CI:    k6 run -e BASE_URL=https://staging.flyingbluewhale.app \
//                 --summary-export=./k6-summary.json scripts/load/baseline.js
//
// Scenarios:
//   1. marketing_browse  — 50 rps for 5 min against the ISR-backed marketing
//      routes. Tests CDN warm path + 5-min revalidate cadence.
//   2. api_health        — 20 rps for 5 min against /health/liveness and
//      /health/readiness. Validates probe latency P95 stays under 100ms.
//   3. api_public        — 5 rps for 5 min against /p/<slug>/guide for the
//      public MMW26 slug. Exercises the portal anon read path end-to-end.
//
// Thresholds fail the run when crossed — wire the summary into CI when we
// promote this from manual to scheduled.

import http from "k6/http";
import { check, sleep } from "k6";

const BASE = __ENV.BASE_URL || "http://localhost:3000";

export const options = {
  scenarios: {
    marketing_browse: {
      executor: "constant-arrival-rate",
      rate: 50,
      timeUnit: "1s",
      duration: "5m",
      preAllocatedVUs: 30,
      maxVUs: 80,
      exec: "marketing",
    },
    api_health: {
      executor: "constant-arrival-rate",
      rate: 20,
      timeUnit: "1s",
      duration: "5m",
      preAllocatedVUs: 10,
      maxVUs: 30,
      exec: "health",
      startTime: "30s",
    },
    api_public: {
      executor: "constant-arrival-rate",
      rate: 5,
      timeUnit: "1s",
      duration: "5m",
      preAllocatedVUs: 5,
      maxVUs: 15,
      exec: "publicPortal",
      startTime: "1m",
    },
  },
  thresholds: {
    // Correctness
    http_req_failed: ["rate<0.01"], // <1% error rate across all scenarios
    // Latency budgets per scenario
    "http_req_duration{scenario:marketing_browse}": ["p(95)<800"],
    "http_req_duration{scenario:api_health}": ["p(95)<100"],
    "http_req_duration{scenario:api_public}": ["p(95)<1200"],
  },
  summaryTrendStats: ["min", "avg", "med", "p(95)", "p(99)", "max"],
};

export function marketing() {
  const urls = [`${BASE}/`, `${BASE}/pricing`, `${BASE}/features`, `${BASE}/solutions`, `${BASE}/blog`];
  const res = http.get(urls[Math.floor(Math.random() * urls.length)]);
  check(res, { "status is 200": (r) => r.status === 200 });
  sleep(0.1);
}

export function health() {
  const res = http.get(`${BASE}/api/v1/health/liveness`);
  check(res, {
    "liveness 200": (r) => r.status === 200,
    "envelope ok": (r) => r.json("ok") === true,
  });
  const r2 = http.get(`${BASE}/api/v1/health/readiness`);
  check(r2, {
    "readiness 2xx or 5xx": (r) => [200, 500, 503].includes(r.status),
  });
}

export function publicPortal() {
  // mmw26-hialeah is the canonical demo slug with a published guest guide.
  const res = http.get(`${BASE}/p/mmw26-hialeah/guide`);
  check(res, {
    "portal 200": (r) => r.status === 200,
    "has gvteway chrome": (r) => r.body.includes('data-platform="gvteway"'),
  });
  sleep(0.5);
}
