/**
 * Availability load test
 *
 * Simulates visitors hitting the public booking page and checking slot
 * availability across multiple dates — the most frequent DB query in the app.
 *
 * Usage:
 *   PROVIDER_ID=<uuid> BASE_URL=https://proxeybooking-app.onrender.com npm run loadtest:availability
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { BASE_URL, PROVIDER_ID, authHeaders } from "./config.js";

// Spread queries across the next 14 days to simulate real browsing behaviour
function randomFutureDate() {
  const d = new Date();
  d.setDate(d.getDate() + Math.floor(Math.random() * 14) + 1);
  return d.toISOString().slice(0, 10);
}

export const options = {
  scenarios: {
    availability_check: {
      executor: "ramping-vus",
      stages: [
        { duration: "30s", target: 20 },   // ramp up
        { duration: "1m",  target: 20 },   // steady at 20
        { duration: "30s", target: 50 },   // ramp to peak
        { duration: "1m",  target: 50 },   // hold peak
        { duration: "30s", target: 0  },   // ramp down
      ],
    },
  },
  thresholds: {
    http_req_failed:   ["rate<0.02"],       // under 2% errors
    http_req_duration: ["p(95)<1500"],      // 95% under 1.5s
    checks:            ["rate>0.98"],       // 98% checks pass
  },
};

export default function () {
  if (!PROVIDER_ID) {
    throw new Error("Set PROVIDER_ID before running the availability load test.");
  }

  const date = randomFutureDate();
  const url = `${BASE_URL}/api/public/provider/${PROVIDER_ID}/slots?date=${date}`;

  const res = http.get(url, { headers: authHeaders() });

  check(res, {
    "availability returns 200":        (r) => r.status === 200,
    "availability avoids 5xx":         (r) => r.status < 500,
    "availability returns slots array": (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.slots);
      } catch {
        return false;
      }
    },
  });

  sleep(0.5);
}
