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

// Time blocks (provider availability)
export async function fetchProviderTimeBlocks() {
  const data = await request("/provider/time-blocks");
  return data.blocks || [];
}

export async function saveProviderTimeBlocks(blocks) {
  const data = await request("/provider/time-blocks", {
    method: "POST",
    body: JSON.stringify({ blocks }),
  });
  return data.blocks || [];
}

// Invoices
export async function fetchProviderInvoices() {
  const data = await request("/provider/invoices");
  return data.invoices || [];
}

export async function createProviderInvoice(invoice) {
  const data = await request("/provider/invoices", {
    method: "POST",
    body: JSON.stringify(invoice),
  });
  return data.invoice;
}

export async function downloadInvoicePDF(invoiceId) {
  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:3001/api";
  const response = await fetch(`${baseUrl}/provider/invoices/${invoiceId}/pdf`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to download invoice PDF");
  }

  // Get the blob from response
  const blob = await response.blob();

  // Create download link
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;

  // Extract filename from Content-Disposition header or use default
  const contentDisposition = response.headers.get("Content-Disposition");
  let filename = `invoice-${invoiceId}.pdf`;
  if (contentDisposition) {
    const match = contentDisposition.match(/filename=([^;]+)/);
    if (match) {
      filename = match[1].replace(/"/g, "");
    }
  }

  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);

  return true;
}
