import { request } from "./apiClient";

export async function fetchMessages() {
  const data = await request("/messages");
  return data.messages || [];
}

export async function fetchThread(threadId) {
  const data = await request(`/messages/${threadId}`);
  return data.messages || [];
}

export async function sendMessage(payload) {
  const data = await request("/messages", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.message;
}
