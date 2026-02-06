import React, { useEffect, useState } from 'react';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    Legend
} from 'recharts';
import { Icons } from '../../components/Icons';
import { PeriodSelector } from '../../components/charts/PeriodSelector';
import { fetchAdminAnalytics } from '../../data/admin';

const COLORS = ['#F58027', '#12a6a1', '#8b5cf6', '#ec4899', '#eab308', '#22c55e'];

const AdminAnalytics = () => {
    const [period, setPeriod] = useState('month');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            try {
                const result = await fetchAdminAnalytics({ period });
                if (!cancelled) {
                    setData(result);
                }
            } catch (error) {
                console.error("Failed to load analytics", error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, [period]);

    const formatCurrency = (cents) => {
        if (!cents) return '$0';
        return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto flex items-center justify-center h-64">
                <Icons.Loader className="w-8 h-8 animate-spin text-brand-500" />
            </div>
        );
    }

    const { userGrowth, categoryPerformance, topProviders, bookingsByStatus, revenueByCategory } = data || {};

    // Prepare pie chart data for booking status
    const statusData = bookingsByStatus ? [
        { name: 'Pending', value: bookingsByStatus.pending, color: '#eab308' },
        { name: 'Confirmed', value: bookingsByStatus.confirmed, color: '#3b82f6' },
        { name: 'Completed', value: bookingsByStatus.completed, color: '#22c55e' },
        { name: 'Cancelled', value: bookingsByStatus.cancelled, color: '#ef4444' },
    ].filter(s => s.value > 0) : [];

    const totalBookings = statusData.reduce((sum, s) => sum + s.value, 0);

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Platform Analytics</h1>
                    <p className="text-gray-500 mt-1">Insights and growth metrics</p>
                </div>
                <PeriodSelector value={period} onChange={setPeriod} />
            </div>

            {/* User Growth Chart */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-6">User Growth</h3>
                <div className="h-72">
                    {userGrowth && userGrowth.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={userGrowth}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                                    tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    labelFormatter={(d) => new Date(d).toLocaleDateString()}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="providers" name="Providers" stroke="#F58027" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="clients" name="Clients" stroke="#12a6a1" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400">
                            <div className="text-center">
                                <Icons.TrendingUp size={32} className="mx-auto mb-2 text-gray-300" />
                                <p>No user growth data for this period</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Category Performance + Booking Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Performance */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Bookings by Category</h3>
                    <div className="h-64">
                        {categoryPerformance && categoryPerformance.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={categoryPerformance} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                    <YAxis
                                        type="category"
                                        dataKey="category"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                                        width={100}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Bar dataKey="bookings" name="Bookings" fill="#F58027" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400">
                                <p>No category data</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Booking Status Breakdown */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Booking Status</h3>
                    <div className="h-64">
                        {statusData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                        formatter={(value) => [`${value} (${Math.round(value / totalBookings * 100)}%)`, '']}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400">
                                <p>No booking data</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Revenue by Category */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Revenue by Category</h3>
                <div className="h-64">
                    {revenueByCategory && revenueByCategory.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={revenueByCategory}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    dataKey="revenue"
                                    nameKey="category"
                                    label={({ category, percent }) => `${category} (${(percent * 100).toFixed(0)}%)`}
                                    labelLine={false}
                                >
                                    {revenueByCategory.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    formatter={(value) => [formatCurrency(value), 'Revenue']}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400">
                            <p>No revenue data</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Top Providers */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Top Providers</h3>
                {topProviders && topProviders.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {topProviders.map((provider, index) => (
                            <div
                                key={provider.id}
                                className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 text-center hover:shadow-md transition-shadow"
                            >
                                <div className="relative inline-block mb-3">
                                    <img
                                        src={provider.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(provider.name || 'P')}&background=random`}
                                        alt=""
                                        className="w-16 h-16 rounded-full object-cover mx-auto"
                                    />
                                    <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                                        index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-gray-300'
                                    }`}>
                                        {index + 1}
                                    </div>
                                </div>
                                <h4 className="font-bold text-gray-900 text-sm truncate">{provider.name || 'Provider'}</h4>
                                <div className="flex items-center justify-center gap-1 mt-1">
                                    <Icons.Star size={12} className="text-yellow-400 fill-yellow-400" />
                                    <span className="text-xs text-gray-600">{provider.rating?.toFixed(1) || '0.0'}</span>
                                </div>
                                <div className="mt-2 text-xs text-gray-500">
                                    <p>{provider.bookings} bookings</p>
                                    <p className="font-medium text-brand-600">{formatCurrency(provider.revenue)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-400">
                        <Icons.Users size={32} className="mx-auto mb-2 text-gray-300" />
                        <p>No provider data for this period</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminAnalytics;
