/**
 * ProviderEarnings — v6 Warm Editorial
 * Route: /provider/earnings
 *
 * API: GET /api/provider/earnings
 *   → { earnings: { totalEarningsThisMonth, monthlyTrend, monthlyData, breakdown,
 *                   availableBalance, nextPayoutDate } }
 */
import { useEffect, useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useSession } from '../../auth/authContext';
import { request } from '../../data/apiClient';
import {
    BarChart, Bar, XAxis, Cell, ResponsiveContainer,
} from 'recharts';
import Header from '../../components/ui/Header';
import Lbl from '../../components/ui/Lbl';
import Divider from '../../components/ui/Divider';
import HeroCard from '../../components/ui/HeroCard';
import Footer from '../../components/ui/Footer';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtMoney(val) {
    if (!val && val !== 0) return '$0';
    return `$${Number(val).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];
const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ─── Empty state bar chart (abstract placeholder) ─────────────────────────────

const EmptyBars = () => {
    const heights = [30, 50, 40, 65, 45, 55];
    return (
        <div className="flex items-end gap-2 h-[72px]">
            {heights.map((h, i) => (
                <div
                    key={i}
                    className="flex-1 rounded-[6px_6px_3px_3px]"
                    style={{ height: `${h}%`, background: 'rgba(140,106,100,0.15)' }}
                />
            ))}
        </div>
    );
};

// ─── Empty state ──────────────────────────────────────────────────────────────

const EarningsEmpty = () => (
    <HeroCard>
        <div className="flex justify-center mb-4">
            <span
                className="font-semibold tracking-[-0.03em]"
                style={{ fontSize: 48, color: '#B0948F' }}
            >
                $0
            </span>
        </div>
        <EmptyBars />
        <p className="text-[18px] font-semibold text-ink text-center leading-tight tracking-[-0.02em] mt-5 mb-2">
            Your first dollar is coming.
        </p>
        <p className="text-[14px] text-muted text-center leading-relaxed">
            Earnings from completed sessions will appear here.
        </p>
    </HeroCard>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const ProviderEarnings = () => {
    const { onMenu } = useOutletContext() || {};
    const { session, profile } = useSession();

    const [earnings, setEarnings] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!session) return;
        let cancelled = false;
        async function load() {
            setLoading(true);
            try {
                const data = await request('/provider/earnings');
                if (!cancelled) setEarnings(data.earnings || null);
            } catch (err) {
                console.error('[ProviderEarnings] load error:', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, [session]);

    const now = useMemo(() => new Date(), []);
    const monthLabel = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;
    const currentMonthIdx = now.getMonth();

    // Last 6 months chart data
    const chartData = useMemo(() => {
        if (!earnings?.monthlyData?.length) {
            return Array.from({ length: 6 }).map((_, i) => {
                const idx = (currentMonthIdx - 5 + i + 12) % 12;
                return { name: SHORT_MONTHS[idx], income: 0, isCurrent: idx === currentMonthIdx };
            });
        }
        return earnings.monthlyData.slice(-6).map((d, i, arr) => ({
            ...d,
            isCurrent: i === arr.length - 1,
        }));
    }, [earnings, currentMonthIdx]);

    const totalThisMonth = earnings?.totalEarningsThisMonth || 0;
    const trend = earnings?.monthlyTrend ?? null;
    const breakdown = earnings?.breakdown || [];
    const nextPayoutAmount = earnings?.availableBalance || 0;
    const nextPayoutDate = earnings?.nextPayoutDate || null;
    const hasEarnings = totalThisMonth > 0 || breakdown.length > 0;

    const trendPositive = trend !== null && trend >= 0;
    const trendLabel = trend !== null ? `${trend >= 0 ? '+' : ''}${trend}%` : null;

    const initials = (profile?.name || profile?.first_name || '?')
        .split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?';

    return (
        <div className="flex flex-col min-h-screen bg-base">
            <Header onMenu={onMenu} showAvatar initials={initials} />

            <div className="px-5 pb-10 flex-1 flex flex-col">

                {/* ── Hero card: month pill + total + trend ── */}
                <div className="mb-6">
                    {/* Month pill */}
                    <div className="flex items-center gap-2 mb-4">
                        <span
                            className="text-[11px] font-semibold uppercase tracking-[0.05em] px-3 py-1 rounded-full"
                            style={{ background: '#FDDCC6', color: '#C25E4A' }}
                        >
                            {monthLabel}
                        </span>
                    </div>

                    <Lbl className="block mb-1">Total This Month</Lbl>

                    <div className="flex items-baseline gap-3">
                        {loading ? (
                            <div className="h-10 w-28 bg-line/60 rounded animate-pulse" />
                        ) : (
                            <>
                                <span
                                    className="font-semibold tracking-[-0.03em]"
                                    style={{ fontSize: 40, color: '#3D231E', lineHeight: 1 }}
                                >
                                    {fmtMoney(totalThisMonth)}
                                </span>
                                {trendLabel && (
                                    <span
                                        className="text-[13px] font-semibold px-2 py-0.5 rounded-full"
                                        style={{
                                            background: trendPositive ? '#EBF2EC' : '#FDEDEA',
                                            color: trendPositive ? '#5A8A5E' : '#C25E4A',
                                        }}
                                    >
                                        {trendLabel}
                                    </span>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* ── Empty state ── */}
                {!loading && !hasEarnings && <EarningsEmpty />}

                {/* ── Bar chart (6 months) ── */}
                {(loading || hasEarnings) && (
                    <div className="mb-6">
                        {loading ? (
                            <div className="h-[110px] w-full bg-line/30 rounded-[12px] animate-pulse" />
                        ) : (
                            <div style={{ height: 110 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={chartData}
                                        margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
                                        barCategoryGap="24%"
                                    >
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontFamily: 'Sora, sans-serif', fontSize: 11, fill: '#8C6A64' }}
                                        />
                                        <Bar dataKey="income" radius={[6, 6, 3, 3]}>
                                            {chartData.map((entry, i) => (
                                                <Cell
                                                    key={`cell-${i}`}
                                                    fill={entry.isCurrent ? '#C25E4A' : '#F2EBE5'}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Breakdown ── */}
                {(loading || hasEarnings) && (
                    <>
                        <Lbl className="block mb-3">Breakdown</Lbl>
                        <Divider />

                        {/* Skeleton */}
                        {loading && [1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between py-4">
                                <div>
                                    <div className="h-4 w-36 bg-line/60 rounded animate-pulse mb-2" />
                                    <div className="h-3 w-20 bg-line/60 rounded animate-pulse" />
                                </div>
                                <div className="h-5 w-14 bg-line/60 rounded animate-pulse" />
                            </div>
                        ))}

                        {/* Rows */}
                        {!loading && breakdown.map((item) => (
                            <div key={item.name}>
                                <div className="flex justify-between items-center py-4">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[15px] font-semibold text-ink m-0 truncate">
                                            {item.name}
                                        </p>
                                        <p className="text-[13px] text-muted m-0 mt-0.5">
                                            {item.sessions} {item.sessions === 1 ? 'session' : 'sessions'}
                                        </p>
                                    </div>
                                    <span
                                        className="text-[15px] font-semibold flex-shrink-0 ml-4"
                                        style={{ color: '#C25E4A' }}
                                    >
                                        {fmtMoney(item.revenue)}
                                    </span>
                                </div>
                                <Divider />
                            </div>
                        ))}
                    </>
                )}

                {/* ── Next payout card ── */}
                {!loading && hasEarnings && (
                    <div
                        className="mt-4 px-5 py-4 rounded-[14px] flex justify-between items-center"
                        style={{ background: '#EBF2EC' }}
                    >
                        <div className="min-w-0">
                            <p
                                className="text-[15px] font-semibold m-0"
                                style={{ color: '#3D6B41' }}
                            >
                                Next Payout
                            </p>
                            <p className="text-[13px] text-muted m-0 mt-0.5">
                                {nextPayoutDate
                                    ? `Arrives via Stripe · ${nextPayoutDate}`
                                    : 'Connect Stripe to receive payouts'}
                            </p>
                        </div>
                        <span
                            className="font-semibold flex-shrink-0 ml-4 tracking-[-0.02em]"
                            style={{ fontSize: 20, color: '#3D6B41' }}
                        >
                            {fmtMoney(nextPayoutAmount)}
                        </span>
                    </div>
                )}

            </div>

            <Footer />
        </div>
    );
};

export default ProviderEarnings;
