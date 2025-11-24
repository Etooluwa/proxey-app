import React, { createContext, useContext, useState, useEffect } from 'react';
import { CLIENT_BOOKINGS } from '../constants';

const BookingContext = createContext();

export const useBookings = () => {
    const context = useContext(BookingContext);
    if (!context) {
        throw new Error('useBookings must be used within a BookingProvider');
    }
    return context;
};

export const BookingProvider = ({ children }) => {
    // Initialize from localStorage or default constant
    const [bookings, setBookings] = useState(() => {
        const saved = localStorage.getItem('client_bookings');
        return saved ? JSON.parse(saved) : CLIENT_BOOKINGS;
    });

    // Persist to localStorage whenever bookings change
    useEffect(() => {
        localStorage.setItem('client_bookings', JSON.stringify(bookings));
    }, [bookings]);

    const addBooking = (bookingData) => {
        const newBooking = {
            id: `bk_${Date.now()}`,
            status: 'confirmed', // Default to confirmed for prototype
            ...bookingData
        };
        setBookings(prev => [newBooking, ...prev]);
        return newBooking;
    };

    const updateBooking = (updatedBooking) => {
        setBookings(prev => prev.map(b => b.id === updatedBooking.id ? updatedBooking : b));
    };

    const cancelBooking = (bookingId) => {
        setBookings(prev => prev.map(b =>
            b.id === bookingId ? { ...b, status: 'cancelled' } : b
        ));
    };

    const getUpcomingBookings = () => {
        return bookings.filter(b => b.status === 'confirmed' || b.status === 'pending');
    };

    return (
        <BookingContext.Provider value={{
            bookings,
            addBooking,
            updateBooking,
            cancelBooking,
            getUpcomingBookings
        }}>
            {children}
        </BookingContext.Provider>
    );
};
