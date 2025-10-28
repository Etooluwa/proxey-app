import { request } from "./apiClient";

export async function fetchProviderJobs({ status } = {}) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  const query = params.toString();
  const data = await request(
    query ? `/provider/jobs?${query}` : "/provider/jobs"
  );
  return data.jobs || [];
}

export async function updateProviderJobStatus(jobId, nextStatus) {
  if (!jobId || !nextStatus) {
    throw new Error("Both jobId and nextStatus are required.");
  }
  const data = await request(`/provider/jobs/${jobId}`, {
    method: "PATCH",
    body: JSON.stringify({ status: nextStatus }),
  });
  return data.job;
}

export async function fetchProviderEarnings() {
  const data = await request("/provider/earnings");
  return data.earnings || {
    totalEarned: 0,
    pendingPayout: 0,
    transactions: [],
  };
}

export async function fetchProviderProfile() {
  const data = await request("/provider/me");
  return data.profile || null;
}

export async function updateProviderProfile(payload) {
  const data = await request("/provider/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return data.profile;
}

export async function updateProviderSchedule(schedule) {
  const data = await request("/provider/schedule", {
    method: "PATCH",
    body: JSON.stringify({ schedule }),
  });
  return data.schedule || [];
}

export async function fetchProviderTodayJobs() {
  return fetchProviderJobs({ status: "today" });
}
