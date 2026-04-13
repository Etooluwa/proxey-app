import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend
} from 'recharts';
import { fetchAdminAnalytics } from '../../data/admin';

const INK = '#3D231E';
const MUTED = '#8C6A64';
const FADED = '#B0948F';
const ACCENT = '#C25E4A';
const LINE = 'rgba(140,106,100,0.2)';
const AVATAR_BG = '#F2EBE5';

const COLORS = [ACCENT, '#5A8A5E', '#8b5cf6', '#ec4899', '#eab308', '#22c55e'];

const tooltipStyle = {
  borderRadius: '12px',
  border: `1px solid ${LINE}`,
  boxShadow: 'none',
  fontFamily: 'Sora, sans-serif',
  fontSize: 12,
  color: INK,
};

const formatCurrency = (cents) => {
  if (!cents) return '$0';
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
};

const PERIODS = ['week', 'month', 'quarter', 'year'];

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
        if (!cancelled) setData(result);
      } catch (err) {
        console.error('Failed to load analytics', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [period]);

  const { userGrowth, categoryPerformance, topProviders, bookingsByStatus, revenueByCategory } = data || {};

  const statusData = bookingsByStatus ? [
    { name: 'Pending', value: bookingsByStatus.pending, color: '#eab308' },
    { name: 'Confirmed', value: bookingsByStatus.confirmed, color: '#3b82f6' },
    { name: 'Completed', value: bookingsByStatus.completed, color: '#5A8A5E' },
    { name: 'Cancelled', value: bookingsByStatus.cancelled, color: ACCENT },
  ].filter((s) => s.value > 0) : [];

  const totalBookings = statusData.reduce((sum, s) => sum + s.value, 0);

  const chartSection = (title, children) => (
    <div>
      <h2 className="text-base font-semibold mb-4" style={{ color: INK }}>{title}</h2>
      <div className="h-56">{children}</div>
    </div>
  );

  const empty = (msg) => (
    <div className="h-full flex items-center justify-center">
      <p className="text-sm" style={{ color: FADED }}>{msg}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: LINE, borderTopColor: ACCENT }} />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold" style={{ color: INK, letterSpacing: '-0.03em' }}>Analytics</h1>
          <p className="text-sm mt-1" style={{ color: MUTED }}>Insights and growth metrics</p>
        </div>
        <div className="flex gap-1.5">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors"
              style={{
                background: period === p ? INK : AVATAR_BG,
                color: period === p ? '#fff' : MUTED,
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* User growth */}
      {chartSection('User Growth',
        userGrowth?.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={userGrowth}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={LINE} />
              <XAxis
                dataKey="date"
                axisLine={false} tickLine={false}
                tick={{ fill: FADED, fontSize: 11, fontFamily: 'Sora, sans-serif' }}
                tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: FADED, fontSize: 11, fontFamily: 'Sora, sans-serif' }} />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={(d) => new Date(d).toLocaleDateString()} />
              <Legend wrapperStyle={{ fontFamily: 'Sora, sans-serif', fontSize: 12 }} />
              <Line type="monotone" dataKey="providers" name="Providers" stroke={ACCENT} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="clients" name="Clients" stroke="#5A8A5E" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : empty('No user growth data for this period')
      )}

      {/* Two column: category + status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {chartSection('Bookings by Category',
          categoryPerformance?.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} stroke={LINE} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: FADED, fontSize: 11, fontFamily: 'Sora, sans-serif' }} />
                <YAxis
                  type="category" dataKey="category" axisLine={false} tickLine={false}
                  tick={{ fill: FADED, fontSize: 11, fontFamily: 'Sora, sans-serif' }}
                  width={90}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="bookings" name="Bookings" fill={ACCENT} radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          ) : empty('No category data')
        )}

        {chartSection('Booking Status',
          statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData} cx="50%" cy="50%"
                  innerRadius={50} outerRadius={75}
                  paddingAngle={2} dataKey="value"
                >
                  {statusData.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v) => [`${v} (${totalBookings ? Math.round(v / totalBookings * 100) : 0}%)`, '']}
                />
                <Legend wrapperStyle={{ fontFamily: 'Sora, sans-serif', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : empty('No booking data')
        )}
      </div>

      {/* Revenue by category */}
      {chartSection('Revenue by Category',
        revenueByCategory?.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={revenueByCategory}
                cx="50%" cy="50%" outerRadius={75}
                dataKey="revenue" nameKey="category"
                label={({ category, percent }) => `${category} (${(percent * 100).toFixed(0)}%)`}
                labelLine={false}
              >
                {revenueByCategory.map((_, i) => (
                  <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [formatCurrency(v), 'Revenue']} />
            </PieChart>
          </ResponsiveContainer>
        ) : empty('No revenue data')
      )}

      {/* Top providers */}
      <div>
        <h2 className="text-base font-semibold mb-4" style={{ color: INK }}>Top Providers</h2>
        {topProviders?.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {topProviders.map((provider, index) => (
              <div
                key={provider.id}
                className="p-4 rounded-2xl text-center"
                style={{ background: AVATAR_BG }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold text-white mx-auto mb-2 relative"
                  style={{ background: ACCENT }}
                >
                  {(provider.name || 'P')[0].toUpperCase()}
                  <span
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                    style={{
                      background: index === 0 ? '#eab308' : index === 1 ? '#94a3b8' : index === 2 ? '#b45309' : FADED,
                    }}
                  >
                    {index + 1}
                  </span>
                </div>
                <p className="text-xs font-semibold truncate" style={{ color: INK }}>{provider.name || 'Provider'}</p>
                <p className="text-[11px] mt-1" style={{ color: MUTED }}>{provider.bookings} bookings</p>
                <p className="text-[11px] font-medium" style={{ color: ACCENT }}>{formatCurrency(provider.revenue)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="flex items-center justify-center py-10 rounded-xl"
            style={{ border: `1px dashed ${LINE}` }}
          >
            <p className="text-sm" style={{ color: MUTED }}>No provider data for this period</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAnalytics;
