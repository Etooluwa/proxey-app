export function getLocalDateKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getProviderBookingTab(booking, today = new Date()) {
  const status = String(booking?.status || "").toLowerCase();
  const todayKey = getLocalDateKey(today);
  const bookingDateKey = getLocalDateKey(booking?.scheduled_at);

  if (status === "pending") return "pending";
  if (status === "completed" || status === "cancelled") return "past";

  if (status === "confirmed") {
    if (!bookingDateKey || !todayKey) return "upcoming";
    return bookingDateKey < todayKey ? "past" : "upcoming";
  }

  return null;
}

export function sortProviderBookings(bookings, tab) {
  const items = [...(bookings || [])];

  if (tab === "pending") {
    return items.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
  }

  if (tab === "upcoming") {
    return items.sort((a, b) => (a.scheduled_at || "").localeCompare(b.scheduled_at || ""));
  }

  if (tab === "past") {
    return items.sort((a, b) => (b.scheduled_at || "").localeCompare(a.scheduled_at || ""));
  }

  return items;
}

export function splitProviderBookings(bookings, today = new Date()) {
  const pending = [];
  const upcoming = [];
  const past = [];

  for (const booking of bookings || []) {
    const tab = getProviderBookingTab(booking, today);
    if (tab === "pending") pending.push(booking);
    if (tab === "upcoming") upcoming.push(booking);
    if (tab === "past") past.push(booking);
  }

  return {
    pending: sortProviderBookings(pending, "pending"),
    upcoming: sortProviderBookings(upcoming, "upcoming"),
    past: sortProviderBookings(past, "past"),
  };
}
