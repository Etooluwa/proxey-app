import { request } from "./apiClient";

const FALLBACK_SERVICES = [
  {
    id: "svc-home-clean",
    name: "Home Cleaning",
    description: "Detailed cleaning for condos, apartments, and houses.",
    category: "Home",
    basePrice: 12000,
    unit: "per visit",
    duration: 120,
  },
  {
    id: "svc-personal-training",
    name: "Personal Training",
    description: "One-on-one fitness session tailored to your goals.",
    category: "Wellness",
    basePrice: 9000,
    unit: "per hour",
    duration: 60,
  },
];

export async function fetchServices() {
  try {
    const data = await request("/services");
    return data.services || [];
  } catch (error) {
    console.warn("[services] Falling back to stub data", error);
    return FALLBACK_SERVICES;
  }
}

export default fetchServices;
