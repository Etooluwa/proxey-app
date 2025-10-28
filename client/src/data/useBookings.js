import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchBookings, cancelBooking } from "./bookings";
import { useToast } from "../components/ui/ToastProvider";

export function useBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBookings();
      setBookings(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const upcoming = useMemo(
    () =>
      bookings
        .filter((booking) => booking.status === "upcoming" || booking.status === "draft")
        .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt)),
    [bookings]
  );

  const past = useMemo(
    () =>
      bookings
        .filter((booking) => booking.status === "completed" || booking.status === "cancelled")
        .sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt)),
    [bookings]
  );

  const cancel = useCallback(
    async (bookingId) => {
      try {
        await cancelBooking(bookingId);
        toast.push({
          title: "Booking cancelled",
          description: "We’ll notify the provider about the change.",
          variant: "info",
        });
        load();
      } catch (err) {
        toast.push({
          title: "Unable to cancel booking",
          description: err.message,
          variant: "error",
        });
        throw err;
      }
    },
    [load, toast]
  );

  const empty = !loading && !error && bookings.length === 0;

  return {
    bookings,
    upcoming,
    past,
    loading,
    error,
    empty,
    refresh: load,
    cancel,
  };
}

export default useBookings;
