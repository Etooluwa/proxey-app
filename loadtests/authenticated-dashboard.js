import http from "k6/http";
import { check, sleep } from "k6";

import { authHeaders, BASE_URL } from "./config.js";

export const options = {
  stages: [
    { duration: "30s", target: 5 },
    { duration: "1m", target: 15 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.02"],
    http_req_duration: ["p(95)<1500"],
  },
};

export default function () {
  const response = http.get(`${BASE_URL}/api/admin/stats`, {
    headers: authHeaders(),
  });

  check(response, {
    "dashboard auth returns non-5xx": (res) => res.status < 500,
    "dashboard auth is authorized or rejected cleanly": (res) =>
      [200, 401, 403].includes(res.status),
  });

  sleep(1);
}
