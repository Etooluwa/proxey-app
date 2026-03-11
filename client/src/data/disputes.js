import { request } from "./apiClient";

// Dispute reason options
export const DISPUTE_REASONS = [
  { value: "service_not_provided", label: "Service Not Provided" },
  { value: "poor_quality", label: "Poor Quality" },
  { value: "no_show_provider", label: "Provider No-Show" },
  { value: "no_show_client", label: "Client No-Show" },
  { value: "wrong_service", label: "Wrong Service" },
  { value: "billing_issue", label: "Billing Issue" },
  { value: "other", label: "Other" },
];

// Create a new dispute
export async function createDispute({ bookingId, reason, description, evidenceUrls }) {
  return request("/disputes", {
    method: "POST",
    body: JSON.stringify({ bookingId, reason, description, evidenceUrls }),
  });
}

// Respond to an existing dispute
export async function respondToDispute(disputeId, { description, evidenceUrls }) {
  return request(`/disputes/${disputeId}/respond`, {
    method: "POST",
    body: JSON.stringify({ description, evidenceUrls }),
  });
}

// Get all disputes for current user
export async function fetchMyDisputes() {
  return request("/disputes");
}
