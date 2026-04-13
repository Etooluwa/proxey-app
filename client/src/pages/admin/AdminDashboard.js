import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
  Users, User, CalendarBlank, CurrencyDollar, Scales, UserPlus, ArrowUpRight,
} from '@phosphor-icons/react';
import { fetchAdminStats, fetchAdminActivity } from '../../data/admin';

const INK = '#3D231E';
const MUTED = '#8C6A64';
const FADED = '#B0948F';
const ACCENT = '#C25E4A';
const LINE = 'rgba(140,106,100,0.2)';
const AVATAR_BG = '#F2EBE5';

const MetricCard = ({ label, value, icon: Icon, sub }) => (
  <div className="py-5" style={{ borderBottom: `1px solid ${LINE}` }}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[11px] uppercase tracking-widest font-medium mb-1" style={{ color: FADED }}>
          {label}
        </p>
        <p className="text-2xl font-semibold" style={{ color: INK, letterSpacing: '-0.02em' }}>
          {value}
        </p>
        {sub && <p className="text-xs mt-1" style={{ color: MUTED }}>{sub}</p>}
      </div>
      <div className="p-2 rounded-xl" style={{ background: AVATAR_BG }}>
        <Icon size={20} weight="regular" style={{ color: ACCENT }} />
      </div>
    </div>
  </div>
);

const formatCurrency = (cents) => {
  if (!cents) return '$0';
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
};

const statusStyle = (status) => {
  switch (status?.toLowerCase()) {
    case 'completed': return { background: '#EBF2EC', color: '#5A8A5E' };
    case 'confirmed': return { background: '#EBF0FA', color: '#4A6CA8' };
    case 'pending': return { background: '#FFF5E6', color: '#A07030' };
    case 'cancelled': return { background: '#FDEDEA', color: '#A04030' };
    default: return { background: AVATAR_BG, color: MUTED };
  }
};

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
          fetchAdminActivity(),
        ]);
        if (!cancelled) {
          setStats(statsData);
          setActivity(activityData.activity || []);
        }
      } catch (err) {
        console.error('Failed to load admin dashboard', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const monthlyData = stats?.monthlyBookings || [
    { name: 'Jan', value: 0 }, { name: 'Feb', value: 0 }, { name: 'Mar', value: 0 },
    { name: 'Apr', value: 0 }, { name: 'May', value: 0 }, { name: 'Jun', value: 0 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: LINE, borderTopColor: ACCENT }} />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Page title */}
      <div>
        <h1 className="text-3xl font-semibold" style={{ color: INK, letterSpacing: '-0.03em' }}>
          Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: MUTED }}>Platform overview</p>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10">
        <MetricCard
          label="Total Providers"
          value={stats?.totalProviders ?? 0}
          icon={Users}
        />
        <MetricCard
          label="Total Clients"
          value={stats?.totalClients ?? 0}
          icon={User}
        />
        <MetricCard
          label="Total Bookings"
          value={stats?.totalBookings ?? 0}
          icon={CalendarBlank}
        />
        <MetricCard
          label="Platform Revenue"
          value={formatCurrency(stats?.platformRevenue ?? stats?.totalRevenue)}
          icon={CurrencyDollar}
          sub="Your cut"
        />
        <MetricCard
          label="Pending Disputes"
          value={stats?.pendingDisputes ?? 0}
          icon={Scales}
        />
        <MetricCard
          label="New Signups This Week"
          value={stats?.newSignupsThisWeek ?? 0}
          icon={UserPlus}
        />
      </div>

      {/* Chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Monthly bookings chart */}
        <div className="lg:col-span-2">
          <h2 className="text-base font-semibold mb-5" style={{ color: INK }}>Monthly Bookings</h2>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} barCategoryGap="40%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={LINE} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: FADED, fontSize: 11, fontFamily: 'Sora, sans-serif' }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: FADED, fontSize: 11, fontFamily: 'Sora, sans-serif' }}
                />
                <Tooltip
                  cursor={{ fill: AVATAR_BG }}
                  contentStyle={{
                    borderRadius: '12px',
                    border: `1px solid ${LINE}`,
                    boxShadow: 'none',
                    fontFamily: 'Sora, sans-serif',
                    fontSize: 12,
                    color: INK,
                  }}
                />
                <Bar dataKey="value" radius={[5, 5, 0, 0]} barSize={28}>
                  {monthlyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.value > 0 ? ACCENT : LINE} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent activity */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold" style={{ color: INK }}>Recent Activity</h2>
            <button
              onClick={() => navigate('/admin/bookings')}
              className="flex items-center gap-1 text-xs font-medium"
              style={{ color: ACCENT }}
            >
              View all <ArrowUpRight size={13} />
            </button>
          </div>

          {activity.length > 0 ? (
            <div className="space-y-0">
              {activity.slice(0, 8).map((item, i) => (
                <div
                  key={item.id}
                  className="py-3"
                  style={{ borderBottom: i < activity.slice(0, 8).length - 1 ? `1px solid ${LINE}` : 'none' }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate" style={{ color: INK }}>
                      {item.client_name || 'Client'}
                    </p>
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                      style={statusStyle(item.status)}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="text-xs mt-0.5 truncate" style={{ color: MUTED }}>
                    {item.service_name || 'Service'}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: FADED }}>
                    {item.scheduled_at ? new Date(item.scheduled_at).toLocaleDateString() : ''}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center py-10 rounded-xl text-center"
              style={{ border: `1px dashed ${LINE}` }}
            >
              <CalendarBlank size={28} style={{ color: FADED }} className="mb-2" />
              <p className="text-sm" style={{ color: MUTED }}>No recent activity</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick nav */}
      <div>
        <h2 className="text-base font-semibold mb-4" style={{ color: INK }}>Quick Access</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Users', sub: 'Manage all users', path: '/admin/users' },
            { label: 'Services', sub: 'Browse all services', path: '/admin/services' },
            { label: 'Reviews', sub: 'Moderate reviews', path: '/admin/reviews' },
            { label: 'Revenue', sub: 'Financial reports', path: '/admin/revenue' },
          ].map(({ label, sub, path }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="text-left p-4 rounded-2xl transition-colors"
              style={{ background: AVATAR_BG }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#EAE0D8'}
              onMouseLeave={(e) => e.currentTarget.style.background = AVATAR_BG}
            >
              <p className="text-sm font-semibold" style={{ color: INK }}>{label}</p>
              <p className="text-xs mt-0.5" style={{ color: MUTED }}>{sub}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
