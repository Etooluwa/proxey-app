import React, { useEffect, useState } from 'react';
import { Icons } from '../../components/Icons';
import { fetchAdminBookings } from '../../data/admin';

const AdminBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const loadBookings = async () => {
        setLoading(true);
        try {
            const data = await fetchAdminBookings({
                status: status || undefined,
                from: fromDate || undefined,
                to: toDate || undefined,
                page,
                limit: 20
            });
            setBookings(data.bookings || []);
            setTotalPages(data.totalPages || 1);
        } catch (error) {
            console.error("Failed to load bookings", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBookings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    const handleFilter = () => {
        setPage(1);
        loadBookings();
    };

    const getStatusColor = (s) => {
        switch (s?.toLowerCase()) {
            case 'completed': return 'bg-green-100 text-green-700';
            case 'confirmed': return 'bg-blue-100 text-blue-700';
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            case 'cancelled': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const formatCurrency = (cents) => {
        if (!cents) return '-';
        return `$${(cents / 100).toFixed(2)}`;
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
                <p className="text-gray-500 mt-1">View all platform bookings</p>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    {/* Status Filter */}
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-100"
                        >
                            <option value="">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    {/* Date Range */}
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-500 mb-1">From Date</label>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-100"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-500 mb-1">To Date</label>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-100"
                        />
                    </div>

                    <button
                        onClick={handleFilter}
                        className="px-6 py-2 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>

            {/* Bookings Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Icons.Loader className="w-8 h-8 animate-spin text-brand-500" />
                    </div>
                ) : bookings.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Client</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Provider</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Service</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Date</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Price</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {bookings.map((booking) => (
                                    <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-gray-900">{booking.client_name || 'Unknown'}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{booking.provider_name || 'Unknown'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{booking.service_name || '-'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {booking.scheduled_at ? new Date(booking.scheduled_at).toLocaleString() : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                            {formatCurrency(booking.price)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                                                {booking.status || 'unknown'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                        <Icons.Calendar size={32} className="text-gray-300 mb-2" />
                        <p>No bookings found</p>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminBookings;
