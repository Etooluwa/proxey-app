import { request } from "./apiClient";

const FALLBACK_BOOKINGS = [];

export async function fetchBookings() {
  try {
    const data = await request("/bookings/me");
    return data.bookings || [];
  } catch (error) {
    console.warn("[bookings] Falling back to stub data", error);
    return FALLBACK_BOOKINGS;
  }
}

export async function createBooking(payload) {
  try {
    const data = await request("/bookings", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return data.booking;
  } catch (error) {
    console.error("[bookings] Failed to create booking", error);
    throw error;
  }
}

export async function cancelBooking(id) {
  try {
    const data = await request(`/bookings/${id}/cancel`, {
      method: "PATCH",
    });
    return data.booking;
  } catch (error) {
    console.error("[bookings] Failed to cancel booking", error);
    throw error;
  }
}

export async function requestCheckout(bookingId) {
  try {
    const data = await request("/payments/create-checkout", {
      method: "POST",
      body: JSON.stringify({ bookingId }),
    });
    return data;
  } catch (error) {
    console.error("[bookings] Failed to create checkout session", error);
    throw error;
  }
}

export async function fetchBookingById(id) {
  const bookings = await fetchBookings();
  return bookings.find((booking) => booking.id === id);
}
