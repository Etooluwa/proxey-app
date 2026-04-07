import http from "k6/http";
import { check, sleep } from "k6";

import {
  authHeaders,
  BASE_URL,
  PAYMENT_METHOD_ID,
  PROVIDER_ID,
  SERVICE_ID,
} from "./config.js";

function nextBookingTime() {
  const date = new Date(Date.now() + 72 * 60 * 60 * 1000);
  date.setMinutes(0, 0, 0);
  return date.toISOString();
}

export const options = {
  scenarios: {
    booking_create: {
      executor: "ramping-vus",
      stages: [
        { duration: "30s", target: 2 },
        { duration: "1m", target: 5 },
        { duration: "30s", target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<2000"],
  },
};

export default function () {
  if (!PROVIDER_ID || !SERVICE_ID) {
    throw new Error(
      "Set PROVIDER_ID and SERVICE_ID before running the booking load test."
    );
  }

  const payload = {
    providerId: PROVIDER_ID,
    serviceId: SERVICE_ID,
    scheduledAt: nextBookingTime(),
    notes: "k6 load test booking",
    price: 0,
  };

  if (PAYMENT_METHOD_ID) {
    payload.price = 25;
    payload.paymentMethodId = PAYMENT_METHOD_ID;
    payload.saveCard = true;
  }

  const response = http.post(`${BASE_URL}/api/bookings/create`, JSON.stringify(payload), {
    headers: authHeaders(),
  });

  check(response, {
    "booking create avoids 5xx": (res) => res.status < 500,
    "booking create returns expected status": (res) =>
      [200, 400, 401, 403, 409].includes(res.status),
  });

  sleep(1);
}
