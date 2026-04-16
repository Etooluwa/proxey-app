import React, { useEffect, useState } from 'react';
import {
    BarChart, Bar, LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell,
} from 'recharts';
import { fetchProviderAnalytics } from '../../data/provider';
import { formatMoney } from '../../utils/formatMoney';
import { useSession } from '../../auth/authContext';

const T = {
    base: '#FBF7F2',
    ink: '#3D231E',
    muted: '#8C6A64',
    faded: '#B0948F',
    accent: '#C25E4A',
    avatarBg: '#F2EBE5',
    line: 'rgba(140,106,100,0.2)',
    successBg: '#EBF2EC',
    success: '#5A8A5E',
};
const F = "'Sora', system-ui, sans-serif";

const PERIODS = [
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
    { id: 'year', label: 'Year' },
];

function StatTile({ label, value, sub }) {
    return (
        <div style={{ padding: '18px 20px', borderRadius: 18, background: T.avatarBg }}>
            <p style={{ margin: '0 0 6px', fontFamily: F, fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: T.faded }}>
                {label}
            </p>
            <p style={{ margin: '0 0 2px', fontFamily: F, fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em', color: T.ink }}>
                {value}
            </p>
            {sub && <p style={{ margin: 0, fontFamily: F, fontSize: 12, color: T.muted }}>{sub}</p>}
        </div>
    );
}

const ProviderAnalytics = () => {
    const { profile } = useSession();
    const [period, setPeriod] = useState('month');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            try {
                const result = await fetchProviderAnalytics({ period });
                if (!cancelled) setData(result);
            } catch (error) {
                console.error('Failed to load analytics', error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, [period]);

    const fmt = (cents) => formatMoney(cents ?? 0, profile?.currency || 'cad');

    const { servicePerformance, clientInsights, peakTimes, bookingTrends, completionRate } = data || {};
    const totalRevenue = (servicePerformance || []).reduce((s, x) => s + (x.revenue || 0), 0);
    const totalBookings = (servicePerformance || []).reduce((s, x) => s + (x.bookings || 0), 0);

    return (
        <div style={{ fontFamily: F, maxWidth: 760, margin: '0 auto', padding: '0 20px 60px' }}>
            <style>{`
                @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>

            {/* Header + period selector */}
            <div style={{
                display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
                padding: '20px 0 24px', animation: 'fadeUp 0.35s ease both',
            }}>
                <div>
                    <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: T.accent }}>
                        Insights
                    </p>
                    <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: '-0.03em', color: T.ink }}>
                        Analytics
                    </h1>
                </div>
                <div style={{ display: 'flex', gap: 4, padding: '4px', borderRadius: 12, background: T.avatarBg }}>
                    {PERIODS.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => setPeriod(p.id)}
                            style={{
                                padding: '6px 14px', borderRadius: 9,
                                border: 'none', cursor: 'pointer',
                                fontFamily: F, fontSize: 13, fontWeight: 500,
                                background: period === p.id ? '#fff' : 'transparent',
                                color: period === p.id ? T.ink : T.muted,
                                boxShadow: period === p.id ? '0 1px 4px rgba(61,35,30,0.08)' : 'none',
                                transition: 'all 0.15s ease',
                            }}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                    <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        border: `2px solid ${T.accent}`, borderTopColor: 'transparent',
                        animation: 'spin 0.7s linear infinite',
                    }} />
                </div>
            ) : (
                <>
                    {/* Stat tiles */}
                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10,
                        marginBottom: 28, animation: 'fadeUp 0.35s ease 0.05s both',
                    }}>
                        <StatTile label="Revenue" value={fmt(totalRevenue)} />
                        <StatTile label="Bookings" value={totalBookings} />
                        <StatTile label="Completion" value={`${completionRate?.rate || 0}%`} sub={`${completionRate?.completed || 0} completed`} />
                        <StatTile label="Repeat Clients" value={`${clientInsights?.repeatRate || 0}%`} sub={`${clientInsights?.repeatClients || 0} of ${clientInsights?.totalClients || 0}`} />
                    </div>

                    {/* Booking trends chart */}
                    {bookingTrends && bookingTrends.length > 0 && (
                        <div style={{ marginBottom: 28, animation: 'fadeUp 0.35s ease 0.1s both' }}>
                            <p style={{ margin: '0 0 14px', fontFamily: F, fontSize: 13, fontWeight: 600, color: T.ink }}>
                                Booking Trends
                            </p>
                            <div style={{ height: 200 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={bookingTrends}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={T.line} />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false} tickLine={false}
                                            tick={{ fill: T.faded, fontSize: 11, fontFamily: F }}
                                            tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        />
                                        <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: T.faded, fontSize: 11, fontFamily: F }} />
                                        <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: T.faded, fontSize: 11, fontFamily: F }} tickFormatter={(v) => fmt(v)} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: 12, border: `1px solid ${T.line}`, fontFamily: F, fontSize: 13, background: '#fff' }}
                                            formatter={(value, name) => [
                                                name === 'revenue' ? fmt(value) : value,
                                                name === 'revenue' ? 'Revenue' : 'Bookings',
                                            ]}
                                            labelFormatter={(d) => new Date(d).toLocaleDateString()}
                                        />
                                        <Line yAxisId="left" type="monotone" dataKey="bookings" stroke={T.accent} strokeWidth={2} dot={false} />
                                        <Line yAxisId="right" type="monotone" dataKey="revenue" stroke={T.success} strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                            <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: F, fontSize: 12, color: T.muted }}>
                                    <span style={{ width: 12, height: 2, borderRadius: 2, background: T.accent, display: 'inline-block' }} /> Bookings
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: F, fontSize: 12, color: T.muted }}>
                                    <span style={{ width: 12, height: 2, borderRadius: 2, background: T.success, display: 'inline-block' }} /> Revenue
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Revenue by service */}
                    {servicePerformance && servicePerformance.length > 0 && (
                        <div style={{ marginBottom: 28, animation: 'fadeUp 0.35s ease 0.15s both' }}>
                            <p style={{ margin: '0 0 14px', fontFamily: F, fontSize: 13, fontWeight: 600, color: T.ink }}>
                                Revenue by Service
                            </p>
                            <div style={{ height: 180 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={servicePerformance}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={T.line} />
                                        <XAxis
                                            dataKey="name" axisLine={false} tickLine={false}
                                            tick={{ fill: T.faded, fontSize: 10, fontFamily: F }}
                                            interval={0} angle={-15} textAnchor="end" height={40}
                                        />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: T.faded, fontSize: 11, fontFamily: F }} tickFormatter={(v) => fmt(v)} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: 12, border: `1px solid ${T.line}`, fontFamily: F, fontSize: 13, background: '#fff' }}
                                            formatter={(value) => [fmt(value), 'Revenue']}
                                        />
                                        <Bar dataKey="revenue" radius={[6, 6, 0, 0]} barSize={28}>
                                            {servicePerformance.map((_, i) => (
                                                <Cell key={i} fill={T.accent} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Service breakdown rows */}
                            <div style={{ borderTop: `1px solid ${T.line}`, marginTop: 12 }}>
                                {servicePerformance.map((svc, i) => (
                                    <div key={i} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '12px 0', borderBottom: `1px solid ${T.line}`,
                                    }}>
                                        <span style={{ fontFamily: F, fontSize: 14, color: T.ink, flex: 1 }}>{svc.name}</span>
                                        <span style={{ fontFamily: F, fontSize: 13, color: T.muted, marginRight: 16 }}>{svc.bookings} bookings</span>
                                        <span style={{ fontFamily: F, fontSize: 14, fontWeight: 500, color: T.ink }}>{fmt(svc.revenue)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Client insights */}
                    {clientInsights && (
                        <div style={{ marginBottom: 28, animation: 'fadeUp 0.35s ease 0.2s both' }}>
                            <p style={{ margin: '0 0 14px', fontFamily: F, fontSize: 13, fontWeight: 600, color: T.ink }}>
                                Client Insights
                            </p>
                            <div style={{ borderTop: `1px solid ${T.line}` }}>
                                {[
                                    { label: 'Total Clients', value: clientInsights.totalClients || 0 },
                                    { label: 'Repeat Clients', value: clientInsights.repeatClients || 0 },
                                    { label: 'Avg. Satisfaction', value: clientInsights.avgSatisfaction ? `${clientInsights.avgSatisfaction.toFixed(1)} / 5` : '—' },
                                ].map(({ label, value }) => (
                                    <div key={label} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '14px 0', borderBottom: `1px solid ${T.line}`,
                                    }}>
                                        <span style={{ fontFamily: F, fontSize: 14, color: T.muted }}>{label}</span>
                                        <span style={{ fontFamily: F, fontSize: 14, fontWeight: 500, color: T.ink }}>{value}</span>
                                    </div>
                                ))}
                                {/* Repeat rate bar */}
                                <div style={{ padding: '14px 0', borderBottom: `1px solid ${T.line}` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <span style={{ fontFamily: F, fontSize: 14, color: T.muted }}>Repeat Rate</span>
                                        <span style={{ fontFamily: F, fontSize: 14, fontWeight: 500, color: T.ink }}>{clientInsights.repeatRate || 0}%</span>
                                    </div>
                                    <div style={{ height: 6, borderRadius: 3, background: T.avatarBg, overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%', borderRadius: 3, background: T.accent,
                                            width: `${Math.min(clientInsights.repeatRate || 0, 100)}%`,
                                            transition: 'width 0.6s ease',
                                        }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Peak times heatmap (simple grid) */}
                    {peakTimes && peakTimes.length > 0 && (
                        <div style={{ animation: 'fadeUp 0.35s ease 0.25s both' }}>
                            <p style={{ margin: '0 0 6px', fontFamily: F, fontSize: 13, fontWeight: 600, color: T.ink }}>
                                Peak Booking Times
                            </p>
                            <p style={{ margin: '0 0 14px', fontFamily: F, fontSize: 12, color: T.muted }}>
                                When clients book you most often
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                {peakTimes.map((slot, i) => {
                                    const max = Math.max(...peakTimes.map((s) => s.count || 0), 1);
                                    const intensity = (slot.count || 0) / max;
                                    return (
                                        <div
                                            key={i}
                                            title={`${slot.day} ${slot.hour}: ${slot.count} bookings`}
                                            style={{
                                                width: 28, height: 28, borderRadius: 6,
                                                background: intensity > 0
                                                    ? `rgba(194,94,74,${0.15 + intensity * 0.75})`
                                                    : T.avatarBg,
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Empty fallback */}
                    {!bookingTrends?.length && !servicePerformance?.length && !clientInsights && (
                        <div style={{
                            padding: '48px 24px', borderRadius: 20,
                            border: `1px dashed ${T.line}`, textAlign: 'center',
                        }}>
                            <p style={{ margin: '0 0 6px', fontFamily: F, fontSize: 15, fontWeight: 500, color: T.ink }}>No data yet</p>
                            <p style={{ margin: 0, fontFamily: F, fontSize: 13, color: T.muted }}>
                                Analytics will appear once you have completed bookings.
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ProviderAnalytics;
