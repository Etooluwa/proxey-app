/**
 * Kliques Load Test — k6
 *
 * Usage:
 *   k6 run load-tests/kliques.load.js
 *
 * To test with authenticated flows, set env vars:
 *   k6 run --env CLIENT_TOKEN=<jwt> --env PROVIDER_TOKEN=<jwt> \
 *           --env PROVIDER_ID=<uuid> --env CLIENT_PROVIDER_ID=<uuid> \
 *           load-tests/kliques.load.js
 *
 * Get tokens by logging in on app.mykliques.com, opening DevTools →
 * Application → Local Storage → look for supabase auth token (access_token).
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// ─── Config ──────────────────────────────────────────────────────────────────

const BASE = 'https://proxeybooking-app.onrender.com';

const CLIENT_TOKEN   = __ENV.CLIENT_TOKEN   || '';
const PROVIDER_TOKEN = __ENV.PROVIDER_TOKEN || '';
const PROVIDER_ID    = __ENV.PROVIDER_ID    || '';       // provider's auth UUID
const CLIENT_PROVIDER_ID = __ENV.CLIENT_PROVIDER_ID || ''; // a provider ID the client has a relationship with

// ─── Test stages ─────────────────────────────────────────────────────────────

export const options = {
  stages: [
    { duration: '30s', target: 10  },  // warm up
    { duration: '1m',  target: 10  },  // steady at 10 users
    { duration: '30s', target: 30  },  // ramp to 30
    { duration: '1m',  target: 30  },  // steady at 30
    { duration: '30s', target: 50  },  // ramp to 50
    { duration: '1m',  target: 50  },  // steady at 50 — peak
    { duration: '30s', target: 0   },  // ramp down
  ],
  thresholds: {
    // 95% of all requests must complete under 2s
    http_req_duration: ['p(95)<2000'],
    // Under 2% error rate overall
    http_req_failed: ['rate<0.02'],
    // Public endpoints must be fast
    'http_req_duration{scenario:public}': ['p(95)<1000'],
  },
};

// ─── Custom metrics ───────────────────────────────────────────────────────────

const authErrorRate  = new Rate('auth_errors');
const dbSlowQueries  = new Trend('slow_db_queries_ms');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function authHeaders(token) {
  return {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  };
}

function jsonBody(obj) {
  return JSON.stringify(obj);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function nextWeek() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

// ─── Scenario: Public flows (no auth required) ────────────────────────────────
// These simulate unauthenticated visitors hitting the booking/invite pages.

function runPublicFlows() {
  group('public: health check', () => {
    const r = http.get(`${BASE}/api/health`);
    check(r, { 'health 200': (res) => res.status === 200 });
  });

  sleep(0.5);

  group('public: categories', () => {
    const r = http.get(`${BASE}/api/categories`);
    check(r, { 'categories 200': (res) => res.status === 200 });
  });

  sleep(0.5);

  group('public: provider list', () => {
    const r = http.get(`${BASE}/api/providers`);
    check(r, { 'providers 200': (res) => res.status === 200 });
  });

  sleep(1);
}

// ─── Scenario: Client authenticated flows ─────────────────────────────────────

function runClientFlows() {
  if (!CLIENT_TOKEN) return;

  const opts = authHeaders(CLIENT_TOKEN);

  group('client: profile', () => {
    const r = http.get(`${BASE}/api/client/profile`, opts);
    check(r, { 'client profile 200': (res) => res.status === 200 });
    authErrorRate.add(r.status === 401 || r.status === 403);
  });

  sleep(0.5);

  group('client: my kliques', () => {
    const r = http.get(`${BASE}/api/client/kliques`, opts);
    check(r, { 'kliques 200': (res) => res.status === 200 });
  });

  sleep(0.5);

  group('client: notifications', () => {
    const r = http.get(`${BASE}/api/client/notifications`, opts);
    check(r, { 'client notifs 200': (res) => res.status === 200 });
  });

  sleep(0.5);

  group('client: bookings', () => {
    const r = http.get(`${BASE}/api/bookings/me`, opts);
    check(r, { 'client bookings 200': (res) => res.status === 200 });
  });

  sleep(0.5);

  if (CLIENT_PROVIDER_ID) {
    group('client: relationship timeline', () => {
      const r = http.get(`${BASE}/api/client/relationship/${CLIENT_PROVIDER_ID}`, opts);
      check(r, { 'relationship 200': (res) => res.status === 200 });
      dbSlowQueries.add(r.timings.duration);
    });
    sleep(0.5);
  }

  sleep(1);
}

// ─── Scenario: Provider authenticated flows ───────────────────────────────────

function runProviderFlows() {
  if (!PROVIDER_TOKEN) return;

  const opts = authHeaders(PROVIDER_TOKEN);

  group('provider: dashboard', () => {
    const r = http.get(`${BASE}/api/provider/dashboard`, opts);
    check(r, { 'dashboard 200': (res) => res.status === 200 });
    authErrorRate.add(r.status === 401 || r.status === 403);
  });

  sleep(0.5);

  group('provider: jobs', () => {
    const r = http.get(`${BASE}/api/provider/jobs`, opts);
    check(r, { 'jobs 200': (res) => res.status === 200 });
  });

  sleep(0.5);

  group('provider: services', () => {
    const r = http.get(`${BASE}/api/provider/services`, opts);
    check(r, { 'services 200': (res) => res.status === 200 });
  });

  sleep(0.5);

  group('provider: calendar', () => {
    const now = new Date();
    const r = http.get(
      `${BASE}/api/provider/calendar?year=${now.getFullYear()}&month=${now.getMonth() + 1}`,
      opts
    );
    check(r, { 'calendar 200': (res) => res.status === 200 });
    dbSlowQueries.add(r.timings.duration);
  });

  sleep(0.5);

  group('provider: earnings', () => {
    const r = http.get(`${BASE}/api/provider/earnings`, opts);
    check(r, { 'earnings 200': (res) => res.status === 200 });
  });

  sleep(0.5);

  group('provider: clients', () => {
    const r = http.get(`${BASE}/api/provider/clients`, opts);
    check(r, { 'clients 200': (res) => res.status === 200 });
  });

  sleep(0.5);

  group('provider: notifications', () => {
    const r = http.get(`${BASE}/api/provider/notifications`, opts);
    check(r, { 'provider notifs 200': (res) => res.status === 200 });
  });

  sleep(1);
}

// ─── Main VU function ─────────────────────────────────────────────────────────
// Each virtual user randomly picks a flow weighted toward public (most traffic).

export default function () {
  const roll = Math.random();

  if (roll < 0.5) {
    // 50% — unauthenticated public visitors
    runPublicFlows();
  } else if (roll < 0.75) {
    // 25% — authenticated clients
    runClientFlows();
    runPublicFlows();
  } else {
    // 25% — authenticated providers
    runProviderFlows();
  }
}

// ─── Summary output ───────────────────────────────────────────────────────────

export function handleSummary(data) {
  const passed = Object.values(data.metrics)
    .filter((m) => m.thresholds)
    .every((m) => Object.values(m.thresholds).every((t) => !t.ok === false));

  console.log('\n========== KLIQUES LOAD TEST SUMMARY ==========');
  console.log(`Total requests:     ${data.metrics.http_reqs?.values?.count ?? 0}`);
  console.log(`Failed requests:    ${data.metrics.http_req_failed?.values?.passes ?? 0}`);
  console.log(`Avg response time:  ${(data.metrics.http_req_duration?.values?.avg ?? 0).toFixed(0)}ms`);
  console.log(`p95 response time:  ${(data.metrics.http_req_duration?.values?.['p(95)'] ?? 0).toFixed(0)}ms`);
  console.log(`p99 response time:  ${(data.metrics.http_req_duration?.values?.['p(99)'] ?? 0).toFixed(0)}ms`);
  console.log(`Auth errors:        ${(data.metrics.auth_errors?.values?.rate ?? 0).toFixed(4)}`);
  console.log(`Slow DB queries avg:${(data.metrics.slow_db_queries_ms?.values?.avg ?? 0).toFixed(0)}ms`);
  console.log('================================================\n');

  return {
    'load-tests/results/summary.json': JSON.stringify(data, null, 2),
  };
}
