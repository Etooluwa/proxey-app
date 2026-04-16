import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { fetchAdminRevenue } from '../../data/admin';
import { formatMoney } from '../../utils/formatMoney';

const INK = '#3D231E';
const MUTED = '#8C6A64';
const FADED = '#B0948F';
const ACCENT = '#C25E4A';
const LINE = 'rgba(140,106,100,0.2)';
const AVATAR_BG = '#F2EBE5';

// Render grouped currency totals as "CAD $X · USD $Y"
const formatByCurrency = (groups) => {
  if (!groups || groups.length === 0) return formatMoney(0, 'cad');
  return groups.map(({ currency, total }) => formatMoney(total ?? 0, currency)).join(' · ');
};

const statusStyle = (s) => {
  if (s === 'completed') return { background: '#EBF2EC', color: '#5A8A5E' };
  if (s === 'pending') return { background: '#FFF5E6', color: '#A07030' };
  return { background: AVATAR_BG, color: MUTED };
};

const AdminRevenue = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const result = await fetchAdminRevenue();
        if (!cancelled) setData(result);
      } catch (err) {
        console.error('Failed to load revenue data', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // monthly is [{month, revenue (CAD), byCurrency}]
  const monthlyData = (data?.monthly || []).map(m => ({
    name: m.month,
    value: m.revenue || 0, // CAD total for bar chart height
    byCurrency: m.byCurrency || [],
  }));
  if (monthlyData.length === 0) {
    ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].forEach(name => monthlyData.push({ name, value: 0, byCurrency: [] }));
  }

  const transactions = data?.transactions || [];

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
      <div>
        <h1 className="text-3xl font-semibold" style={{ color: INK, letterSpacing: '-0.03em' }}>Revenue</h1>
        <p className="text-sm mt-1" style={{ color: MUTED }}>Platform financial overview</p>
      </div>

      {/* Metric strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10">
        {[
          { label: 'Total Revenue', value: formatByCurrency(data?.summary?.totalByCurrency) },
          { label: 'This Month', value: formatByCurrency(data?.summary?.thisMonthByCurrency) },
          { label: 'Avg per Booking', value: formatByCurrency(data?.summary?.avgByCurrency?.map(x => ({ currency: x.currency, total: x.avg }))) },
        ].map(({ label, value }) => (
          <div key={label} className="py-5" style={{ borderBottom: `1px solid ${LINE}` }}>
            <p className="text-[11px] uppercase tracking-widest font-medium mb-1" style={{ color: FADED }}>{label}</p>
            <p className="text-2xl font-semibold" style={{ color: INK, letterSpacing: '-0.02em' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div>
        <h2 className="text-base font-semibold mb-5" style={{ color: INK }}>Monthly Revenue</h2>
        <div className="h-56">
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
                tickFormatter={(v) => (v >= 100 ? `$${(v / 100).toFixed(0)}` : String(v))}
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
                formatter={(v, name, props) => {
                  const byCurrency = props?.payload?.byCurrency;
                  if (byCurrency && byCurrency.length > 0) {
                    return [formatByCurrency(byCurrency), 'Revenue'];
                  }
                  return [formatMoney(v ?? 0, 'cad'), 'Revenue'];
                }}
              />
              <Bar dataKey="value" radius={[5, 5, 0, 0]} barSize={28}>
                {monthlyData.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={entry.value > 0 ? '#5A8A5E' : LINE} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transactions */}
      <div>
        <h2 className="text-base font-semibold mb-5" style={{ color: INK }}>Recent Transactions</h2>
        {transactions.length > 0 ? (
          <div>
            <div
              className="grid gap-4 px-4 py-3 text-[11px] uppercase tracking-widest font-medium"
              style={{ gridTemplateColumns: '1.5fr 2fr 2fr 1fr 1fr', borderBottom: `1px solid ${LINE}`, color: FADED }}
            >
              <span>Date</span>
              <span>Client</span>
              <span>Provider</span>
              <span>Amount</span>
              <span>Status</span>
            </div>
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="grid gap-4 px-4 py-4 items-center"
                style={{ gridTemplateColumns: '1.5fr 2fr 2fr 1fr 1fr', borderBottom: `1px solid ${LINE}` }}
              >
                <span className="text-xs" style={{ color: MUTED }}>
                  {tx.created_at ? new Date(tx.created_at).toLocaleDateString() : '—'}
                </span>
                <span className="text-sm" style={{ color: INK }}>{tx.client_name || '—'}</span>
                <span className="text-sm" style={{ color: MUTED }}>{tx.provider_name || '—'}</span>
                <span className="text-sm font-medium" style={{ color: INK }}>{formatMoney(tx.amount ?? 0, tx.currency || 'cad')}</span>
                <span
                  className="text-[11px] font-medium px-2 py-0.5 rounded-full inline-block"
                  style={statusStyle(tx.status)}
                >
                  {tx.status || 'unknown'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="flex items-center justify-center py-12 rounded-xl"
            style={{ border: `1px dashed ${LINE}` }}
          >
            <p className="text-sm" style={{ color: MUTED }}>No transactions yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRevenue;
