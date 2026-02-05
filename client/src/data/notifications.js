import { request } from "./apiClient";

// Client notification functions
export async function fetchClientNotifications() {
  const data = await request("/client/notifications");
  return data.notifications || [];
}

export async function createClientNotification(payload) {
  const data = await request("/client/notifications", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.notification;
}

export async function markClientNotificationRead(id) {
  const data = await request(`/client/notifications/${id}/read`, {
    method: "PATCH",
  });
  return data.notification;
}

// Provider notification functions
export async function fetchProviderNotifications() {
  const data = await request("/provider/notifications");
  return data.notifications || [];
}

export async function markProviderNotificationRead(id) {
  const data = await request(`/notifications/${id}/read`, {
    method: "PATCH",
  });
  return data.notification;
}

// Bulk operations
export async function markAllNotificationsRead(role = 'client') {
  const endpoint = role === 'provider' ? '/provider/notifications/read-all' : '/client/notifications/read-all';
  const data = await request(endpoint, { method: "PATCH" });
  return data;
}

export async function deleteNotification(id, role = 'client') {
  const endpoint = role === 'provider' ? `/provider/notifications/${id}` : `/client/notifications/${id}`;
  const data = await request(endpoint, { method: "DELETE" });
  return data;
}
