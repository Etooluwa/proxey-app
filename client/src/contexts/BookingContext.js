import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchBookings, createBooking, cancelBooking } from '../data/bookings';
import { useToast } from '../components/ui/ToastProvider';

const BookingContext = createContext();

export const useBookings = () => {
    const context = useContext(BookingContext);
    if (!context) {
        throw new Error('useBookings must be used within a BookingProvider');
    }
    return context;
};

export const BookingProvider = ({ children }) => {
    const toast = useToast();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    const addBooking = async (bookingData) => {
        const payload = {
            ...bookingData,
            status: bookingData?.status || "upcoming",
        };
        const created = await createBooking(payload);
        await load();
        return created;
    };

    const updateBooking = async (updatedBooking) => {
        // No dedicated update endpoint; refresh after optimistic replace
        setBookings((prev) =>
            prev.map((b) => (b.id === updatedBooking.id ? updatedBooking : b))
        );
        await load();
    };

    const cancel = async (bookingId) => {
        try {
            await cancelBooking(bookingId);
            toast.push({
                title: "Booking cancelled",
                description: "We’ll notify the provider about the change.",
                variant: "info",
            });
            await load();
        } catch (err) {
            toast.push({
                title: "Unable to cancel booking",
                description: err.message,
                variant: "error",
            });
            throw err;
        }
    };

    const getUpcomingBookings = () => {
        return bookings.filter(b => b.status === 'confirmed' || b.status === 'pending');
    };

    return (
        <BookingContext.Provider value={{
            bookings,
            loading,
            error,
            addBooking,
            updateBooking,
            cancelBooking: cancel,
            cancel,
            getUpcomingBookings,
            refresh: load
        }}>
            {children}
        </BookingContext.Provider>
    );
};
