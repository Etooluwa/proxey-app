import React, { useEffect, useState } from 'react';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    Legend
} from 'recharts';
import { Icons } from '../../components/Icons';
import { StatCard } from '../../components/StatCard';
import { PeriodSelector } from '../../components/charts/PeriodSelector';
import { HeatmapChart } from '../../components/charts/HeatmapChart';
import { fetchProviderAnalytics } from '../../data/provider';

const ProviderAnalytics = () => {
    const [period, setPeriod] = useState('month');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            try {
                const result = await fetchProviderAnalytics({ period });
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
        if (!cents) return '$0.00';
        return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto flex items-center justify-center h-64">
                <Icons.Loader className="w-8 h-8 animate-spin text-brand-500" />
            </div>
        );
    }

    const { servicePerformance, clientInsights, peakTimes, bookingTrends, completionRate } = data || {};

    // Calculate total revenue from service performance
    const totalRevenue = (servicePerformance || []).reduce((sum, s) => sum + (s.revenue || 0), 0);
    const totalBookings = (servicePerformance || []).reduce((sum, s) => sum + (s.bookings || 0), 0);

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
                    <p className="text-gray-500 mt-1">Your performance metrics and insights</p>
                </div>
                <PeriodSelector value={period} onChange={setPeriod} />
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Total Revenue"
                    value={formatCurrency(totalRevenue)}
                    icon={Icons.Wallet}
                    colorClass="bg-emerald-500 text-emerald-500"
                />
                <StatCard
                    label="Total Bookings"
                    value={totalBookings}
                    icon={Icons.Calendar}
                    colorClass="bg-blue-500 text-blue-500"
                />
                <StatCard
                    label="Completion Rate"
                    value={`${completionRate?.rate || 0}%`}
                    icon={Icons.CheckCircle}
                    colorClass="bg-green-500 text-green-500"
                />
                <StatCard
                    label="Repeat Clients"
                    value={`${clientInsights?.repeatRate || 0}%`}
                    icon={Icons.Users}
                    colorClass="bg-purple-500 text-purple-500"
                />
            </div>

            {/* Booking Trends */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Booking Trends</h3>
                <div className="h-72">
                    {bookingTrends && bookingTrends.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={bookingTrends}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                                    tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                />
                                <YAxis
                                    yAxisId="left"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                />
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                    tickFormatter={(v) => `$${(v / 100).toFixed(0)}`}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    formatter={(value, name) => [
                                        name === 'revenue' ? formatCurrency(value) : value,
                                        name === 'revenue' ? 'Revenue' : 'Bookings'
                                    ]}
                                    labelFormatter={(d) => new Date(d).toLocaleDateString()}
                                />
                                <Legend />
                                <Line yAxisId="left" type="monotone" dataKey="bookings" name="Bookings" stroke="#F58027" strokeWidth={2} dot={false} />
                                <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue" stroke="#12a6a1" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400">
                            <div className="text-center">
                                <Icons.TrendingUp size={32} className="mx-auto mb-2 text-gray-300" />
                                <p>No booking data for this period</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Service Performance + Client Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Service Performance */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Revenue by Service</h3>
                    <div className="h-64">
                        {servicePerformance && servicePerformance.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={servicePerformance}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                                        interval={0}
                                        angle={-20}
                                        textAnchor="end"
                                        height={50}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                                        tickFormatter={(v) => `$${(v / 100).toFixed(0)}`}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                        formatter={(value) => [formatCurrency(value), 'Revenue']}
                                    />
                                    <Bar dataKey="revenue" radius={[6, 6, 0, 0]} barSize={30}>
                                        {servicePerformance.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill="#F58027" />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400">
                                <p>No service data</p>
                            </div>
                        )}
                    </div>

                    {/* Service Breakdown Table */}
                    {servicePerformance && servicePerformance.length > 0 && (
                        <div className="mt-4 border-t border-gray-100 pt-4">
                            <div className="space-y-2">
                                {servicePerformance.map((service, index) => (
                                    <div key={index} className="flex items-center justify-between text-sm">
                                        <span className="text-gray-700 truncate flex-1">{service.name}</span>
                                        <span className="text-gray-500 mx-4">{service.bookings} bookings</span>
                                        <span className="font-medium text-gray-900">{formatCurrency(service.revenue)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Client Insights */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Client Insights</h3>

                    <div className="space-y-6">
                        {/* Total Clients */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <Icons.Users size={20} className="text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Total Clients</p>
                                    <p className="text-xl font-bold text-gray-900">{clientInsights?.totalClients || 0}</p>
                                </div>
                            </div>
                        </div>

                        {/* Repeat Client Rate */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-500">Repeat Client Rate</span>
                                <span className="text-sm font-bold text-brand-600">{clientInsights?.repeatRate || 0}%</span>
                            </div>
                            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-brand-500 rounded-full transition-all duration-500"
                                    style={{ width: `${clientInsights?.repeatRate || 0}%` }}
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                                {clientInsights?.repeatClients || 0} out of {clientInsights?.totalClients || 0} clients returned
                            </p>
                        </div>

                        {/* Average Satisfaction */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <div>
                                <p className="text-sm text-gray-500">Avg. Satisfaction</p>
                                <div className="flex items-center gap-1 mt-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Icons.Star
                                            key={star}
                                            size={16}
                                            className={star <= Math.round(clientInsights?.avgSatisfaction || 0)
                                                ? 'text-yellow-400 fill-yellow-400'
                                                : 'text-gray-200'
                                            }
                                        />
                                    ))}
                                    <span className="ml-2 font-bold text-gray-900">
                                        {clientInsights?.avgSatisfaction?.toFixed(1) || '0.0'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Completion Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-green-50 rounded-xl text-center">
                                <Icons.CheckCircle size={20} className="text-green-600 mx-auto mb-1" />
                                <p className="text-lg font-bold text-green-700">{completionRate?.completed || 0}</p>
                                <p className="text-xs text-green-600">Completed</p>
                            </div>
                            <div className="p-3 bg-red-50 rounded-xl text-center">
                                <Icons.XCircle size={20} className="text-red-600 mx-auto mb-1" />
                                <p className="text-lg font-bold text-red-700">{completionRate?.cancelled || 0}</p>
                                <p className="text-xs text-red-600">Cancelled</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Peak Times Heatmap */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Peak Booking Times</h3>
                <p className="text-sm text-gray-500 mb-6">When clients book you most often</p>
                {peakTimes && peakTimes.length > 0 ? (
                    <HeatmapChart data={peakTimes} />
                ) : (
                    <div className="h-48 flex items-center justify-center text-gray-400">
                        <div className="text-center">
                            <Icons.Clock size={32} className="mx-auto mb-2 text-gray-300" />
                            <p>No booking time data for this period</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProviderAnalytics;
