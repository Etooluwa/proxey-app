/**
 * Service categories for providers
 * These categories are used throughout the app for provider profiles
 */
export const SERVICE_CATEGORIES = [
  { id: "home-cleaning", label: "Home & Cleaning" },
  { id: "beauty-personal-care", label: "Beauty & Personal Care" },
  { id: "health-wellness", label: "Health & Wellness" },
  { id: "events-entertainment", label: "Events & Entertainment" },
  { id: "trades-repair", label: "Trades & Repair" },
  { id: "auto-services", label: "Auto Services" },
  { id: "business-services", label: "Business Services" },
  { id: "child-pet-care", label: "Child & Pet Care" },
  { id: "delivery-errands", label: "Delivery & Errands" },
  { id: "creative-specialty", label: "Creative & Specialty" },
];

/**
 * Major cities in Canada for autocomplete
 */
export const CANADIAN_CITIES = [
  "Toronto",
  "Montreal",
  "Vancouver",
  "Calgary",
  "Edmonton",
  "Ottawa",
  "Winnipeg",
  "Quebec City",
  "Hamilton",
  "Kitchener",
  "London",
  "Victoria",
  "Halifax",
  "Oshawa",
  "Windsor",
  "Saskatoon",
  "Regina",
  "St. John's",
  "Barrie",
  "Kelowna",
  "Abbotsford",
  "Greater Sudbury",
  "Kingston",
  "Saguenay",
  "Trois-Rivières",
  "Guelph",
  "Moncton",
  "Brantford",
  "Saint John",
  "Thunder Bay",
  "Peterborough",
  "Lethbridge",
  "Kamloops",
  "Nanaimo",
  "Red Deer",
  "Medicine Hat",
  "Fredericton",
  "Charlottetown",
  "Yellowknife",
  "Whitehorse",
  "Iqaluit",
  "Mississauga",
  "Brampton",
  "Markham",
  "Vaughan",
  "Richmond Hill",
  "Oakville",
  "Burlington",
  "Scarborough",
  "North York",
  "Etobicoke",
];

/**
 * Filter cities based on search query
 * @param {string} query - The search query
 * @returns {string[]} - Filtered list of cities
 */
export function filterCities(query) {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const normalizedQuery = query.toLowerCase().trim();
  return CANADIAN_CITIES.filter((city) =>
    city.toLowerCase().startsWith(normalizedQuery)
  ).slice(0, 5); // Return top 5 matches
}
