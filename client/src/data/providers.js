import { request } from "./apiClient";

const FALLBACK_PROVIDERS = [
  {
    id: "prov-ella-hughes",
    name: "Ella Hughes",
    avatar:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop",
    rating: 4.9,
    reviewCount: 184,
    location: "Toronto, ON",
    categories: ["Home", "Cleaning"],
    hourlyRate: 4500,
    headline: "Luxury home cleaning specialist",
    servicesOffered: ["svc-home-clean"],
  },
];

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
    console.warn("[providers] Falling back to stub data", error);
    return FALLBACK_PROVIDERS;
  }
}

export default fetchProviders;
