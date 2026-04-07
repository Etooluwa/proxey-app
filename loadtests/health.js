import http from "k6/http";
import { check, sleep } from "k6";

import { authHeaders, BASE_URL, defaultStages } from "./config.js";

export const options = {
  stages: defaultStages,
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<800"],
  },
};

export default function () {
  const response = http.get(`${BASE_URL}/api/health`, {
    headers: authHeaders(),
  });

  check(response, {
    "health status is 200": (res) => res.status === 200,
    "health response has ok=true": (res) => {
      try {
        return JSON.parse(res.body).ok === true;
      } catch {
        return false;
      }
    },
  });

  sleep(1);
}
