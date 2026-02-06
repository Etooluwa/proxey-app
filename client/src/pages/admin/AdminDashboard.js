import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { fetchAdminStats, fetchAdminActivity } from '../../data/admin';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [activity, setActivity] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            try {
                const [statsData, activityData] = await Promise.all([
                    fetchAdminStats(),
                    fetchAdminActivity()
                ]);
                if (!cancelled) {
                    setStats(statsData);
                    setActivity(activityData.activity || []);
                }
            } catch (error) {
                console.error("Failed to load admin dashboard", error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, []);

    const monthlyData = stats?.monthlyBookings || [
        { name: 'Jan', value: 0 },
        { name: 'Feb', value: 0 },
        { name: 'Mar', value: 0 },
        { name: 'Apr', value: 0 },
        { name: 'May', value: 0 },
        { name: 'Jun', value: 0 },
    ];

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

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                    <p className="text-gray-500 mt-1">Platform overview and metrics</p>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Total Providers"
                    value={stats?.totalProviders || 0}
                    icon={Icons.Users}
                    colorClass="bg-blue-500 text-blue-500"
                />
                <StatCard
                    label="Total Clients"
                    value={stats?.totalClients || 0}
                    icon={Icons.User}
                    colorClass="bg-emerald-500 text-emerald-500"
                />
                <StatCard
                    label="Total Bookings"
                    value={stats?.totalBookings || 0}
                    icon={Icons.Calendar}
                    colorClass="bg-purple-500 text-purple-500"
                />
                <StatCard
                    label="Total Revenue"
                    value={formatCurrency(stats?.totalRevenue)}
                    icon={Icons.Wallet}
                    colorClass="bg-amber-500 text-amber-500"
                />
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Bookings Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-900">Monthly Bookings</h3>
                    </div>
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
                                />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                                    {monthlyData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.value > 0 ? '#F58027' : '#e2e8f0'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden min-w-0">
                    <div className="mb-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-3">Recent Activity</h3>
                        <button
                            onClick={() => navigate('/admin/bookings')}
                            className="text-sm font-bold text-brand-600 hover:text-brand-700 transition-colors"
                        >
                            View All Bookings →
                        </button>
                    </div>

                    {activity.length > 0 ? (
                        <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                            {activity.slice(0, 10).map((item) => (
                                <div key={item.id} className="p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center">
                                            <Icons.Calendar size={12} className="text-brand-600" />
                                        </div>
                                        <span className="text-xs font-bold text-gray-900">{item.client_name || 'Client'}</span>
                                        <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${
                                            item.status === 'completed' ? 'bg-green-100 text-green-700' :
                                            item.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                            item.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>
                                            {item.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-600 truncate">{item.service_name || 'Service'}</p>
                                    <p className="text-[10px] text-gray-400 mt-1">
                                        {item.scheduled_at ? new Date(item.scheduled_at).toLocaleDateString() : ''}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-gray-100 rounded-xl bg-gray-50/50">
                            <Icons.Calendar size={28} className="text-gray-300 mb-2" />
                            <p className="text-gray-500 text-sm">No recent activity</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                    onClick={() => navigate('/admin/users')}
                    className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow text-left"
                >
                    <Icons.Users size={24} className="text-blue-500 mb-2" />
                    <h4 className="font-bold text-gray-900">Manage Users</h4>
                    <p className="text-xs text-gray-500">View and manage all users</p>
                </button>
                <button
                    onClick={() => navigate('/admin/services')}
                    className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow text-left"
                >
                    <Icons.Wrench size={24} className="text-emerald-500 mb-2" />
                    <h4 className="font-bold text-gray-900">Services</h4>
                    <p className="text-xs text-gray-500">Browse all services</p>
                </button>
                <button
                    onClick={() => navigate('/admin/reviews')}
                    className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow text-left"
                >
                    <Icons.Star size={24} className="text-amber-500 mb-2" />
                    <h4 className="font-bold text-gray-900">Reviews</h4>
                    <p className="text-xs text-gray-500">Moderate reviews</p>
                </button>
                <button
                    onClick={() => navigate('/admin/revenue')}
                    className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow text-left"
                >
                    <Icons.Wallet size={24} className="text-purple-500 mb-2" />
                    <h4 className="font-bold text-gray-900">Revenue</h4>
                    <p className="text-xs text-gray-500">View financial reports</p>
                </button>
            </div>
        </div>
    );
};

export default AdminDashboard;
