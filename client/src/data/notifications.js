import { request } from "./apiClient";

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
