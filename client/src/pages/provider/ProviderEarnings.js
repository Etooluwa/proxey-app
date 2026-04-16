/**
 * ProviderEarnings — v6 Warm Editorial
 * Route: /provider/earnings
 *
 * API: GET /api/provider/earnings
 *   → { earnings: { totalEarningsThisMonth, monthlyTrend, monthlyData, breakdown,
 *                   availableBalance, nextPayoutDate } }
 */
import { useEffect, useState, useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useSession } from '../../auth/authContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { request } from '../../data/apiClient';
import { formatMoneyFromDollars } from '../../utils/formatMoney';
import {
    BarChart, Bar, XAxis, Cell, ResponsiveContainer,
} from 'recharts';
import Header from '../../components/ui/Header';
import Lbl from '../../components/ui/Lbl';
import Divider from '../../components/ui/Divider';
import HeroCard from '../../components/ui/HeroCard';
import Footer from '../../components/ui/Footer';
import ProviderStripeReadinessBanner from '../../components/provider/ProviderStripeReadinessBanner';

// ─── Desktop tokens ────────────────────────────────────────────────────────────
const T = { ink: '#3D231E', muted: '#8C6A64', accent: '#C25E4A', line: 'rgba(140,106,100,0.18)', card: '#FFFFFF', avatarBg: '#F2EBE5', hero: '#FDDCC6', success: '#5A8A5E', successBg: '#EBF2EC' };
const F = "'Sora',system-ui,sans-serif";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtMoney = (val, currency = 'cad') => formatMoneyFromDollars(val ?? 0, currency);

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
        <p className="text-[20px] text-ink text-center leading-tight tracking-[-0.02em] mt-5 mb-2" style={{ fontWeight: 400 }}>
            Your first dollar<br />is coming.
        </p>
        <p className="text-[14px] text-muted text-center leading-relaxed">
            Once clients start booking and paying, your revenue and payouts show up here.
        </p>
    </HeroCard>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const ProviderEarnings = () => {
    const { onMenu, isDesktop } = useOutletContext() || {};
    const navigate = useNavigate();
    const { session, profile } = useSession();
    const { unreadCount } = useNotifications();

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
        const monthsToShow = Math.min(6, currentMonthIdx + 1);
        const startIdx = Math.max(0, currentMonthIdx - monthsToShow + 1);

        return earnings.monthlyData
            .slice(startIdx, currentMonthIdx + 1)
            .map((d, i, arr) => ({
                ...d,
                isCurrent: i === arr.length - 1,
            }));
    }, [earnings, currentMonthIdx]);

    // Use currency from API response (authoritative); fall back to profile currency
    const earningsCurrency = earnings?.currency || profile?.currency || 'cad';

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

    // ── Desktop layout ─────────────────────────────────────────────────────────
    if (isDesktop) {
        return (
            <div style={{ padding: '40px', fontFamily: F }}>
                <div style={{ maxWidth: 900, margin: '0 auto' }}>
                    <div style={{ marginBottom: 24 }}>
                        <ProviderStripeReadinessBanner />
                    </div>

                    {/* Top 2-col: hero total + next payout */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
                        {/* Hero: monthly total */}
                        <div style={{ background: T.hero, borderRadius: 20, padding: '28px 28px 24px', position: 'relative', overflow: 'hidden' }}>
                            <div aria-hidden="true" style={{ position: 'absolute', inset: 0, opacity: 0.08, pointerEvents: 'none', backgroundSize: 'cover', backgroundImage: `url("data:image/svg+xml,%3Csvg width='400' height='400' viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 200 Q 100 100 200 200 T 400 200' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M-50 250 Q 50 150 150 250 T 350 250' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3C/svg%3E")` }} />
                            <div style={{ position: 'relative' }}>
                                <span style={{ fontFamily: F, fontSize: 11, fontWeight: 500, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Total This Month</span>
                                {loading ? (
                                    <div style={{ height: 48, width: 120, background: 'rgba(61,35,30,0.1)', borderRadius: 8 }} />
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                                        <span style={{ fontFamily: F, fontSize: 44, fontWeight: 600, color: T.ink, letterSpacing: '-0.03em', lineHeight: 1 }}>{fmtMoney(totalThisMonth, earningsCurrency)}</span>
                                        {trendLabel && (
                                            <span style={{ fontFamily: F, fontSize: 12, fontWeight: 600, padding: '3px 8px', borderRadius: 9999, background: trendPositive ? T.successBg : '#FDEDEA', color: trendPositive ? T.success : T.accent }}>{trendLabel}</span>
                                        )}
                                    </div>
                                )}
                                <span style={{ fontFamily: F, fontSize: 12, color: T.muted, display: 'block', marginTop: 6 }}>{monthLabel}</span>
                            </div>
                        </div>

                        {/* Next payout */}
                        <div style={{ background: T.successBg, borderRadius: 20, padding: '28px 28px 24px' }}>
                            <span style={{ fontFamily: F, fontSize: 11, fontWeight: 500, color: T.success, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Next Payout</span>
                            {loading ? (
                                <div style={{ height: 48, width: 100, background: 'rgba(90,138,94,0.15)', borderRadius: 8 }} />
                            ) : (
                                <>
                                    <span style={{ fontFamily: F, fontSize: 40, fontWeight: 600, color: '#3D6B41', letterSpacing: '-0.03em', lineHeight: 1, display: 'block', marginBottom: 6 }}>{fmtMoney(nextPayoutAmount, earningsCurrency)}</span>
                                    <span style={{ fontFamily: F, fontSize: 12, color: T.muted }}>
                                        {nextPayoutDate ? `Arrives via Stripe · ${nextPayoutDate}` : 'Connect Stripe to receive payouts'}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Bar chart */}
                    {(loading || hasEarnings) && (
                        <div style={{ background: T.card, borderRadius: 16, border: `1px solid ${T.line}`, padding: '20px 24px', marginBottom: 24 }}>
                            <span style={{ fontFamily: F, fontSize: 11, fontWeight: 500, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 16 }}>6-Month Trend</span>
                            {loading ? (
                                <div style={{ height: 120, background: 'rgba(140,106,100,0.08)', borderRadius: 10 }} />
                            ) : (
                                <div style={{ height: 120 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }} barCategoryGap="24%">
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontFamily: 'Sora, sans-serif', fontSize: 11, fill: '#8C6A64' }} />
                                            <Bar dataKey="income" radius={[6, 6, 3, 3]}>
                                                {chartData.map((entry, i) => (
                                                    <Cell key={`cell-${i}`} fill={entry.isCurrent ? T.accent : '#F2EBE5'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Breakdown table */}
                    {(loading || hasEarnings) && (
                        <div style={{ background: T.card, borderRadius: 16, border: `1px solid ${T.line}`, overflow: 'hidden' }}>
                            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.line}` }}>
                                <span style={{ fontFamily: F, fontSize: 11, fontWeight: 500, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Breakdown</span>
                            </div>
                            {loading ? [1, 2, 3].map((i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: `1px solid ${T.line}` }}>
                                    <div style={{ height: 14, width: 140, background: 'rgba(140,106,100,0.1)', borderRadius: 6 }} />
                                    <div style={{ height: 14, width: 60, background: 'rgba(140,106,100,0.1)', borderRadius: 6 }} />
                                </div>
                            )) : breakdown.map((item, i) => (
                                <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: i < breakdown.length - 1 ? `1px solid ${T.line}` : 'none' }}>
                                    <div>
                                        <p style={{ fontFamily: F, fontSize: 14, fontWeight: 600, color: T.ink, margin: '0 0 2px' }}>{item.name}</p>
                                        <p style={{ fontFamily: F, fontSize: 12, color: T.muted, margin: 0 }}>{item.sessions} {item.sessions === 1 ? 'session' : 'sessions'}</p>
                                    </div>
                                    <span style={{ fontFamily: F, fontSize: 16, fontWeight: 600, color: T.accent }}>{fmtMoney(item.revenue, earningsCurrency)}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Empty state */}
                    {!loading && !hasEarnings && (
                        <div style={{ textAlign: 'center', padding: '48px 0' }}>
                            {/* Bar chart ghost */}
                            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
                                {[28, 16, 36, 20, 44].map((h, i) => (
                                    <div key={i} style={{ width: 18, height: h, borderRadius: 6, background: i === 4 ? 'rgba(194,94,74,0.25)' : 'rgba(140,106,100,0.12)' }} />
                                ))}
                            </div>
                            <p style={{ fontFamily: F, fontSize: 22, fontWeight: 400, color: T.ink, margin: '0 0 8px', letterSpacing: '-0.02em' }}>Your first dollar<br />is coming.</p>
                            <p style={{ fontFamily: F, fontSize: 14, color: T.muted, margin: 0 }}>Once clients start booking and paying, your revenue and payouts show up here.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-base">
            <Header onMenu={onMenu} showAvatar initials={initials} onNotif={() => navigate('/provider/notifications')} notifCount={unreadCount} />

            <div className="px-5 pb-10 flex-1 flex flex-col">
                <div className="mb-5">
                    <ProviderStripeReadinessBanner compact />
                </div>

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
                                    {fmtMoney(totalThisMonth, earningsCurrency)}
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
                                        {fmtMoney(item.revenue, earningsCurrency)}
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
                            {fmtMoney(nextPayoutAmount, earningsCurrency)}
                        </span>
                    </div>
                )}

            </div>

            <Footer />
        </div>
    );
};

export default ProviderEarnings;
