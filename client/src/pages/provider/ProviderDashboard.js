import React, { useState } from 'react';
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
import { EARNINGS_DATA, PROVIDER_REQUESTS } from '../../constants';

import { useSession } from '../../auth/authContext';

const ProviderDashboard = () => {
    const navigate = useNavigate();
    const { profile } = useSession();
    const [requests] = useState(PROVIDER_REQUESTS); // Using mock data

    const firstName = profile?.name?.split(' ')[0] || 'Provider';

    return (
        <div className="max-w-7xl mx-auto space-y-8">

            {/* Header Greeting */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
                    <p className="text-gray-500 mt-1">Welcome, {firstName}! You have {requests.length} new requests.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate('/provider/schedule')}
                        className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 shadow-sm transition-colors flex items-center gap-2"
                    >
                        <Icons.Clock size={16} />
                        Edit Availability
                    </button>
                    <button
                        onClick={() => navigate('/provider/jobs')}
                        className="px-4 py-2 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600 shadow-md shadow-brand-200"
                    >
                        + Create Promotion
                    </button>
                </div>
            </div>

            {/* Stats Row - Fresh Account State */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Total Earnings"
                    value="$0.00"
                    icon={Icons.Wallet}
                    colorClass="bg-emerald-500 text-emerald-500"
                />
                <StatCard
                    label="Bookings"
                    value="0"
                    icon={Icons.Calendar}
                    colorClass="bg-blue-500 text-blue-500"
                />
                <StatCard
                    label="Avg Rating"
                    value="New"
                    icon={Icons.Star}
                    colorClass="bg-gray-300 text-gray-400"
                />
                <StatCard
                    label="Profile Views"
                    value="2"
                    trend="100%"
                    trendUp={true}
                    icon={Icons.Trending}
                    colorClass="bg-purple-500 text-purple-500"
                />
            </div>

            {/* Main Content Area: Chart & Requests */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Earnings Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-900">Weekly Earnings</h3>
                        <select className="text-sm border-gray-200 border rounded-lg px-2 py-1 text-gray-500 outline-none">
                            <option>This Week</option>
                        </select>
                    </div>
                    <div className="h-80 w-full relative">
                        {/* Overlay for empty state chart to make it look intentional */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                            <p className="text-gray-400 text-sm font-medium bg-white/80 px-3 py-1 rounded-full backdrop-blur-sm">No earnings data to display yet</p>
                        </div>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={EARNINGS_DATA}>
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
                                    tickFormatter={(value) => `$${value}`}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                                    {EARNINGS_DATA.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill="#e2e8f0" />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Requests */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[600px] lg:h-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-900">Booking Requests</h3>
                        {requests.length > 0 && (
                            <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                                {requests.length} New
                            </span>
                        )}
                    </div>

                    {requests.length > 0 ? (
                        <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                            {requests.map((request) => (
                                <div key={request.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <img src={request.clientAvatar} alt={request.clientName} className="w-10 h-10 rounded-full object-cover shadow-sm" />
                                            <div>
                                                <h4 className="font-bold text-gray-900 text-sm">{request.clientName}</h4>
                                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Icons.MapPin size={10} /> {request.location}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-1 rounded-lg">
                                            ${request.price}
                                        </span>
                                    </div>

                                    <div className="mb-4 pl-1">
                                        <p className="font-bold text-gray-800 text-sm mb-1">{request.serviceName}</p>
                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                            <Icons.Calendar size={12} /> {request.date} at {request.time}
                                        </p>
                                    </div>

                                    <div className="flex gap-2">
                                        <button className="flex-1 bg-gray-900 text-white py-2.5 rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200">
                                            Accept
                                        </button>
                                        <button className="flex-1 bg-white border border-gray-200 text-gray-700 py-2.5 rounded-lg text-xs font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors">
                                            Decline
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-gray-100 rounded-xl bg-gray-50/50">
                            <div className="w-14 h-14 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 text-brand-200">
                                <Icons.Bell size={28} className="text-gray-300" />
                            </div>
                            <h4 className="text-gray-900 font-bold mb-1">All caught up!</h4>
                            <p className="text-gray-500 text-xs mb-6 max-w-[200px]">
                                You have no pending booking requests. Improve your profile to attract more clients.
                            </p>
                            <button className="text-xs font-bold text-brand-600 bg-brand-50 px-4 py-2 rounded-lg hover:bg-brand-100 transition-colors">
                                View Services
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Upcoming Schedule Preview */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Upcoming Schedule</h3>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <p className="text-sm text-gray-500">Available</p>
                    </div>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4">
                    {[...Array(7)].map((_, i) => {
                        const date = new Date();
                        date.setDate(date.getDate() + i);
                        const isToday = i === 0;
                        return (
                            <div key={i} className={`flex-shrink-0 w-28 p-4 rounded-xl border text-center cursor-pointer transition-all group ${isToday ? 'bg-gray-800 border-gray-800 text-white shadow-md' : 'bg-white border-gray-100 hover:border-brand-300'}`}>
                                <div className={`text-xs mb-1 ${isToday ? 'text-gray-400' : 'text-gray-400'}`}>
                                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                </div>
                                <div className={`text-xl font-bold mb-2 ${isToday ? 'text-white' : 'text-gray-800'}`}>
                                    {date.getDate()}
                                </div>

                                {/* Empty State Dots or content */}
                                <div className="flex justify-center gap-1">
                                    <div className={`w-1 h-1 rounded-full ${isToday ? 'bg-gray-600' : 'bg-gray-200 group-hover:bg-brand-200'}`}></div>
                                    <div className={`w-1 h-1 rounded-full ${isToday ? 'bg-gray-600' : 'bg-gray-200 group-hover:bg-brand-200'}`}></div>
                                </div>
                            </div>
                        )
                    })}
                    <div
                        onClick={() => navigate('/provider/schedule')}
                        className="flex-shrink-0 w-28 p-4 rounded-xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-50 hover:text-brand-500 hover:border-brand-200 transition-colors"
                    >
                        <Icons.Calendar size={20} className="mb-1" />
                        <span className="text-xs font-medium">View All</span>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default ProviderDashboard;
