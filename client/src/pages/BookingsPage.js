import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../components/Icons';
import { useSession } from '../auth/authContext';

const BookingsPage = () => {
    const navigate = useNavigate();
    const { session } = useSession();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('upcoming');

    useEffect(() => {
        loadBookings();
    }, []);

    const loadBookings = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/bookings/me', {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch bookings');
            }

            const data = await response.json();
            setBookings(Array.isArray(data.bookings) ? data.bookings : []);
        } catch (error) {
            console.error('Failed to load bookings:', error);
            setBookings([]);
        } finally {
            setLoading(false);
        }
    };

    // Filter bookings by status
    const upcomingBookings = bookings.filter(b => {
        const scheduledDate = new Date(b.scheduled_at);
        const now = new Date();
        return scheduledDate >= now && b.status !== 'cancelled' && b.status !== 'completed';
    });

    const pastBookings = bookings.filter(b => {
        const scheduledDate = new Date(b.scheduled_at);
        const now = new Date();
        return scheduledDate < now || b.status === 'completed';
    });

    const cancelledBookings = bookings.filter(b => b.status === 'cancelled');

    // Get current list based on active tab
    const getCurrentBookings = () => {
        switch (activeTab) {
            case 'upcoming':
                return upcomingBookings;
            case 'past':
                return pastBookings;
            case 'cancelled':
                return cancelledBookings;
            default:
                return [];
        }
    };

    const currentBookings = getCurrentBookings();

    // Format date nicely
    const formatDate = (dateString) => {
        if (!dateString) return 'TBD';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Format time nicely
    const formatTime = (dateString) => {
        if (!dateString) return 'TBD';
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    // Get status badge color
    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'confirmed':
                return 'bg-green-100 text-green-700';
            case 'pending':
                return 'bg-yellow-100 text-yellow-700';
            case 'completed':
                return 'bg-blue-100 text-blue-700';
            case 'cancelled':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    // Download invoice for a booking
    const handleDownloadInvoice = async (bookingId) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE || '/api'}/bookings/${bookingId}/invoice`, {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to generate invoice');
            }

            // Create a blob from the response
            const blob = await response.blob();

            // Create a temporary URL for the blob
            const url = window.URL.createObjectURL(blob);

            // Create a temporary anchor element and trigger download
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice-${bookingId}.pdf`;
            document.body.appendChild(a);
            a.click();

            // Cleanup
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Failed to download invoice:', error);
            alert('Failed to download invoice. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
            <div className="px-4 md:px-10 py-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
                        <p className="text-gray-600">Manage your appointments and history</p>
                    </div>
                    <button
                        onClick={() => navigate('/app/booking-flow')}
                        className="bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-700 transition-colors flex items-center gap-2"
                    >
                        <Icons.Plus size={20} />
                        New Booking
                    </button>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-2xl p-6 mb-6 border border-gray-100">
                    <div className="flex gap-2 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('upcoming')}
                            className={`px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
                                activeTab === 'upcoming'
                                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-200'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            Upcoming
                            {upcomingBookings.length > 0 && (
                                <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-xs">
                                    {upcomingBookings.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('past')}
                            className={`px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
                                activeTab === 'past'
                                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-200'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            Past
                            {pastBookings.length > 0 && (
                                <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-xs">
                                    {pastBookings.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('cancelled')}
                            className={`px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
                                activeTab === 'cancelled'
                                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-200'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            Cancelled
                            {cancelledBookings.length > 0 && (
                                <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-xs">
                                    {cancelledBookings.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
                        <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading bookings...</p>
                    </div>
                )}

                {/* Bookings List */}
                {!loading && currentBookings.length > 0 && (
                    <div className="space-y-4">
                        {currentBookings.map((booking) => (
                            <div
                                key={booking.id}
                                className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-xl transition-all duration-200 hover:border-orange-200"
                            >
                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                                <Icons.Calendar size={24} className="text-orange-600" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="text-lg font-bold text-gray-900">
                                                        {booking.service_name || 'Service'}
                                                    </h3>
                                                    <span className={`text-xs px-3 py-1 rounded-full font-semibold ${getStatusColor(booking.status)}`}>
                                                        {booking.status || 'Pending'}
                                                    </span>
                                                </div>
                                                <p className="text-gray-600 mb-3">
                                                    with {booking.provider_name || 'Professional'}
                                                </p>
                                                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                                    <div className="flex items-center gap-2">
                                                        <Icons.Calendar size={16} className="text-gray-400" />
                                                        <span>{formatDate(booking.scheduled_at)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Icons.Clock size={16} className="text-gray-400" />
                                                        <span>{formatTime(booking.scheduled_at)}</span>
                                                    </div>
                                                    {booking.location && (
                                                        <div className="flex items-center gap-2">
                                                            <Icons.MapPin size={16} className="text-gray-400" />
                                                            <span>{booking.location}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {booking.notes && (
                                            <div className="ml-16 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                                <p className="font-semibold text-gray-700 mb-1">Notes:</p>
                                                <p>{booking.notes}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-2 md:ml-4">
                                        {booking.total_price && (
                                            <div className="text-right mb-2">
                                                <p className="text-xs text-gray-500">Total</p>
                                                <p className="text-2xl font-bold text-gray-900">
                                                    ${(booking.total_price / 100).toFixed(2)}
                                                </p>
                                            </div>
                                        )}
                                        <button
                                            onClick={() => navigate(`/app/booking/${booking.id}`)}
                                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors text-sm"
                                        >
                                            View Details
                                        </button>
                                        {(booking.payment_status === 'succeeded' || booking.payment_status === 'completed') && (
                                            <button
                                                onClick={() => handleDownloadInvoice(booking.id)}
                                                className="px-4 py-2 bg-orange-50 text-orange-600 rounded-xl font-semibold hover:bg-orange-100 transition-colors text-sm flex items-center justify-center gap-2"
                                            >
                                                <Icons.Download size={16} />
                                                Download Invoice
                                            </button>
                                        )}
                                        {activeTab === 'upcoming' && booking.status !== 'cancelled' && (
                                            <button
                                                onClick={() => {
                                                    // TODO: Implement cancel booking
                                                    console.log('Cancel booking:', booking.id);
                                                }}
                                                className="px-4 py-2 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-colors text-sm"
                                            >
                                                Cancel Booking
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!loading && currentBookings.length === 0 && (
                    <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Icons.Calendar size={32} className="text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {activeTab === 'upcoming' && 'No upcoming bookings'}
                            {activeTab === 'past' && 'No past bookings'}
                            {activeTab === 'cancelled' && 'No cancelled bookings'}
                        </h3>
                        <p className="text-gray-600 max-w-md mx-auto mb-6">
                            {activeTab === 'upcoming' && "You don't have any upcoming appointments. Book a service to get started!"}
                            {activeTab === 'past' && "You don't have any completed bookings yet."}
                            {activeTab === 'cancelled' && "You haven't cancelled any bookings."}
                        </p>
                        {activeTab !== 'upcoming' && (
                            <button
                                onClick={() => setActiveTab('upcoming')}
                                className="text-orange-600 font-semibold hover:text-orange-700 flex items-center gap-2 mx-auto"
                            >
                                <Icons.ArrowLeft size={16} />
                                View Upcoming
                            </button>
                        )}
                        {activeTab === 'upcoming' && (
                            <button
                                onClick={() => navigate('/app/booking-flow')}
                                className="bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-700 transition-colors inline-flex items-center gap-2"
                            >
                                <Icons.Plus size={20} />
                                Book a Service
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingsPage;
