import React, { useEffect, useState } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { Icons } from '../../components/Icons';
import { StatCard } from '../../components/StatCard';
import { fetchAdminRevenue } from '../../data/admin';

const AdminRevenue = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            try {
                const result = await fetchAdminRevenue();
                if (!cancelled) {
                    setData(result);
                }
            } catch (error) {
                console.error("Failed to load revenue data", error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, []);

    const formatCurrency = (cents) => {
        if (!cents) return '$0.00';
        return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    };

    const monthlyData = data?.monthlyRevenue || [
        { name: 'Jan', value: 0 },
        { name: 'Feb', value: 0 },
        { name: 'Mar', value: 0 },
        { name: 'Apr', value: 0 },
        { name: 'May', value: 0 },
        { name: 'Jun', value: 0 },
    ];

    const transactions = data?.transactions || [];

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto flex items-center justify-center h-64">
                <Icons.Loader className="w-8 h-8 animate-spin text-brand-500" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Revenue</h1>
                <p className="text-gray-500 mt-1">Platform financial overview</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    label="Total Revenue"
                    value={formatCurrency(data?.totalRevenue)}
                    icon={Icons.Wallet}
                    colorClass="bg-emerald-500 text-emerald-500"
                />
                <StatCard
                    label="This Month"
                    value={formatCurrency(data?.thisMonthRevenue)}
                    icon={Icons.TrendingUp}
                    colorClass="bg-blue-500 text-blue-500"
                />
                <StatCard
                    label="Avg per Booking"
                    value={formatCurrency(data?.avgPerBooking)}
                    icon={Icons.Calendar}
                    colorClass="bg-purple-500 text-purple-500"
                />
            </div>

            {/* Revenue Chart */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Monthly Revenue</h3>
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                tickFormatter={(value) => `$${(value / 100).toFixed(0)}`}
                            />
                            <Tooltip
                                cursor={{ fill: '#f8fafc' }}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                formatter={(value) => [formatCurrency(value), 'Revenue']}
                            />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                                {monthlyData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.value > 0 ? '#10b981' : '#e2e8f0'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">Recent Transactions</h3>
                </div>
                {transactions.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Date</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Client</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Provider</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Amount</th>
                                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {tx.created_at ? new Date(tx.created_at).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">{tx.client_name || '-'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{tx.provider_name || '-'}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                            {formatCurrency(tx.amount)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                tx.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                tx.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                                {tx.status || 'unknown'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                        <Icons.Wallet size={32} className="text-gray-300 mb-2" />
                        <p>No transactions yet</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminRevenue;
