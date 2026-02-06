import { request } from "./apiClient";

// Admin Dashboard Stats
export async function fetchAdminStats() {
  return request("/admin/stats");
}

// Admin Users
export async function fetchAdminUsers({ role, search, page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams();
  if (role) params.set("role", role);
  if (search) params.set("search", search);
  params.set("page", page);
  params.set("limit", limit);
  return request(`/admin/users?${params.toString()}`);
}

export async function toggleUserActive(userId) {
  return request(`/admin/users/${userId}/toggle-active`, { method: "PATCH" });
}

// Admin Bookings
export async function fetchAdminBookings({ status, from, to, page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  params.set("page", page);
  params.set("limit", limit);
  return request(`/admin/bookings?${params.toString()}`);
}

// Admin Services
export async function fetchAdminServices() {
  return request("/admin/services");
}

// Admin Reviews
export async function fetchAdminReviews({ rating, is_visible, page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams();
  if (rating) params.set("rating", rating);
  if (is_visible !== undefined) params.set("is_visible", is_visible);
  params.set("page", page);
  params.set("limit", limit);
  return request(`/admin/reviews?${params.toString()}`);
}

export async function updateAdminReview(reviewId, updates) {
  return request(`/admin/reviews/${reviewId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

// Admin Revenue
export async function fetchAdminRevenue() {
  return request("/admin/revenue");
}

// Admin Promotions
export async function fetchAdminPromotions() {
  return request("/admin/promotions");
}

// Admin Activity Feed
export async function fetchAdminActivity() {
  return request("/admin/activity");
}

// Admin Analytics
export async function fetchAdminAnalytics({ period = "month" } = {}) {
  return request(`/admin/analytics?period=${period}`);
}
