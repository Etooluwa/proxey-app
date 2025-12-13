import { request } from "./apiClient";

export async function fetchProviders(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, value);
    }
  });

  try {
    const data = await request(`/providers?${params.toString()}`);
    return data.providers || [];
  } catch (error) {
    console.warn("[providers] Failed to load providers", error);
    return [];
  }
}

export default fetchProviders;
