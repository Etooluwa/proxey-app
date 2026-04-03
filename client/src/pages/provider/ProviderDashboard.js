/**
 * ProviderDashboard — v6 Warm Editorial
 * Route: /provider
 *
 * API: GET /api/provider/dashboard  → { schedule, weeklyEarnings, newClientsThisWeek }
 *      GET /api/provider/me         → { profile }  (for handle used by ShareLinks)
 */
import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useSession } from '../../auth/authContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { request } from '../../data/apiClient';
import { fetchProviderProfile } from '../../data/provider';
import Header from '../../components/ui/Header';
import HeroCard from '../../components/ui/HeroCard';
import HeroPill from '../../components/ui/HeroPill';
import Lbl from '../../components/ui/Lbl';
import Divider from '../../components/ui/Divider';
import Avatar from '../../components/ui/Avatar';
import ArrowIcon from '../../components/ui/ArrowIcon';
import ShareLinks from '../../components/ui/ShareLinks';
import DesktopShareLinks from '../../components/DesktopShareLinks';
import Footer from '../../components/ui/Footer';
import AppointmentDrawer from '../../components/AppointmentDrawer';
import ProviderStripeReadinessBanner from '../../components/provider/ProviderStripeReadinessBanner';

// ─── Design tokens (desktop inline styles) ────────────────────────────────────
const T = {
    ink: '#3D231E',
    muted: '#8C6A64',
    faded: '#B0948F',
    accent: '#C25E4A',
    line: 'rgba(140,106,100,0.18)',
    card: '#FFFFFF',
    avatarBg: '#F2EBE5',
};
const F = "'Sora',system-ui,sans-serif";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name) {
    return (name || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function greeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
}

function todayPill() {
    return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function parseLocalDateTime(value) {
    if (!value) return null;
    const localValue = String(value).replace(' ', 'T').replace(/(Z|[+-]\d{2}:\d{2})$/, '');
    const parsed = new Date(localValue);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function fmtTime(iso) {
    if (!iso) return '';
    const date = parseLocalDateTime(iso);
    if (!date) return '';
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function fmtDuration(mins) {
    if (!mins) return null;
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h} hr ${m} min` : `${h} hr`;
}

function fmtEarnings(cents) {
    if (!cents) return '$0';
    return `$${(cents / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function getDashboardStatus(appt) {
    const explicitStatus = String(appt?.status || '').toLowerCase();
    if (explicitStatus === 'completed' || explicitStatus === 'cancelled') {
        return explicitStatus;
    }

    const start = parseLocalDateTime(appt?.scheduledAt);
    if (!start) return explicitStatus || 'confirmed';

    const durationMs = (Number(appt?.duration) || 60) * 60000;
    const endedAt = new Date(start.getTime() + durationMs);
    if (endedAt.getTime() <= Date.now()) {
        return 'completed';
    }

    return explicitStatus || 'confirmed';
}

function statusPillMeta(status) {
    if (status === 'completed') {
        return { label: 'Completed', bg: '#EBF2EC', color: '#5A8A5E' };
    }
    if (status === 'pending') {
        return { label: 'Pending', bg: '#FFF5E6', color: '#C25E4A' };
    }
    return { label: 'Upcoming', bg: '#F2EBE5', color: '#8C6A64' };
}

// ─── Mobile: schedule row ─────────────────────────────────────────────────────

const ApptRow = ({ appt, onClick }) => (
    <>
        <button
            onClick={onClick}
            className="w-full flex items-center justify-between py-4 text-left focus:outline-none active:bg-avatarBg/40 transition-colors"
        >
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <Avatar initials={getInitials(appt.clientName)} size={40} />
                <div className="min-w-0">
                    <p className="text-[16px] text-ink m-0 mb-0.5 truncate">{appt.clientName}</p>
                    <p className="text-[13px] text-muted m-0 truncate">
                        {appt.serviceName}
                        {appt.duration ? ` · ${fmtDuration(appt.duration)}` : ''}
                    </p>
                    <span
                        className="inline-flex mt-2 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.04em]"
                        style={{ background: statusPillMeta(appt.dashboardStatus).bg, color: statusPillMeta(appt.dashboardStatus).color }}
                    >
                        {statusPillMeta(appt.dashboardStatus).label}
                    </span>
                </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0 ml-3">
                <span className="text-[15px] text-ink">{fmtTime(appt.scheduledAt)}</span>
                <ArrowIcon size={18} />
            </div>
        </button>
        <Divider />
    </>
);

// ─── Desktop: stat card ───────────────────────────────────────────────────────

const DesktopStatCard = ({ label, value, onClick }) => {
    const [hovered, setHovered] = useState(false);
    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: T.card, borderRadius: '20px', border: `1px solid ${T.line}`,
                padding: '24px', display: 'flex', flexDirection: 'column',
                justifyContent: 'space-between', cursor: 'pointer', textAlign: 'left',
                transition: 'transform 0.15s, box-shadow 0.2s', width: '100%',
                transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
                boxShadow: hovered ? '0 8px 24px rgba(61,35,30,0.08)' : 'none',
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: F, fontSize: '11px', fontWeight: 500, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {label}
                </span>
                <ArrowIcon size={16} />
            </div>
            <span style={{ fontFamily: F, fontSize: '40px', fontWeight: 400, letterSpacing: '-0.04em', lineHeight: 0.9, color: T.accent, display: 'block', marginTop: '12px' }}>
                {value}
            </span>
        </button>
    );
};

// ─── Desktop: schedule row inside white card ──────────────────────────────────

const DesktopApptRow = ({ appt, onClick }) => (
    <>
        <button
            onClick={onClick}
            style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '18px 0', width: '100%', background: 'none', border: 'none',
                cursor: 'pointer', textAlign: 'left', fontFamily: F,
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                    width: 38, height: 38, borderRadius: '50%', background: T.avatarBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: F, fontSize: '13px', fontWeight: 500, color: T.muted, flexShrink: 0,
                }}>
                    {getInitials(appt.clientName)}
                </div>
                <div>
                    <p style={{ fontFamily: F, fontSize: '15px', color: T.ink, margin: '0 0 2px' }}>{appt.clientName}</p>
                    <p style={{ fontFamily: F, fontSize: '13px', color: T.muted, margin: 0 }}>
                        {appt.serviceName}{appt.duration ? ` · ${fmtDuration(appt.duration)}` : ''}
                    </p>
                    <span
                        style={{
                            display: 'inline-flex',
                            marginTop: 8,
                            padding: '5px 10px',
                            borderRadius: 999,
                            background: statusPillMeta(appt.dashboardStatus).bg,
                            color: statusPillMeta(appt.dashboardStatus).color,
                            fontFamily: F,
                            fontSize: 10,
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                        }}
                    >
                        {statusPillMeta(appt.dashboardStatus).label}
                    </span>
                </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontFamily: F, fontSize: '14px', color: T.ink }}>{fmtTime(appt.scheduledAt)}</span>
                <ArrowIcon size={16} />
            </div>
        </button>
        <div style={{ height: '1px', background: T.line }} />
    </>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const ProviderDashboard = () => {
    const navigate = useNavigate();
    const { onMenu, isDesktop } = useOutletContext() || {};
    const { profile: sessionProfile, updateProfile } = useSession();
    const { unreadCount } = useNotifications();

    const [schedule, setSchedule] = useState([]);
    const [weeklyEarnings, setWeeklyEarnings] = useState(0);
    const [newClients, setNewClients] = useState(0);
    const [handle, setHandle] = useState('');
    const [loading, setLoading] = useState(true);

    // Drawer state (desktop only)
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerAppt, setDrawerAppt] = useState(null);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            try {
                const [dashResult, profileResult] = await Promise.allSettled([
                    request('/provider/dashboard'),
                    fetchProviderProfile(),
                ]);

                const dash = dashResult.status === 'fulfilled' ? dashResult.value : null;
                const prof = profileResult.status === 'fulfilled' ? profileResult.value : null;

                if (!cancelled) {
                    if (dash) {
                        setSchedule((dash.schedule || []).map((appt) => ({
                            ...appt,
                            dashboardStatus: getDashboardStatus(appt),
                        })));
                        setWeeklyEarnings(dash.weeklyEarnings || 0);
                        setNewClients(dash.newClientsThisWeek || 0);
                    } else {
                        setSchedule([]);
                        setWeeklyEarnings(0);
                        setNewClients(0);
                    }

                    if (prof?.handle) {
                        setHandle(prof.handle);
                    }

                    // Sync photo/avatar from DB into authContext if missing from localStorage
                    const dbPhoto = prof?.photo || prof?.avatar;
                    if (dbPhoto && !sessionProfile?.photo && !sessionProfile?.avatar) {
                        updateProfile({ photo: dbPhoto, avatar: dbPhoto }).catch(() => {});
                    }
                }
            } catch (err) {
                console.error('[ProviderDashboard] load error:', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, []);

    const providerDisplayName = sessionProfile?.name?.trim() || 'there';
    const initials = getInitials(sessionProfile?.name);
    const avatarSrc = sessionProfile?.photo || sessionProfile?.avatar || '';
    const isEmpty = !loading && schedule.length === 0 && weeklyEarnings === 0;
    const upNext = schedule.find((appt) => appt.dashboardStatus !== 'completed') || null;

    // Mobile-only color
    const earningsColor = isEmpty ? '#B0948F' : '#C25E4A';
    const clientsColor  = isEmpty ? '#B0948F' : '#C25E4A';

    const openDrawer = (appt) => {
        setDrawerAppt({
            id: appt.id,
            name: appt.clientName,
            initials: getInitials(appt.clientName),
            scheduledDate: new Date(appt.scheduledAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
            time: fmtTime(appt.scheduledAt),
            service: appt.serviceName,
            duration: fmtDuration(appt.duration),
            status: appt.dashboardStatus || appt.status,
            messagesPath: '/provider/messages',
        });
        setDrawerOpen(true);
    };

    const handleApptClick = (appt) => {
        if (isDesktop) openDrawer(appt);
        else navigate(`/provider/appointments/${appt.id}`);
    };

    const handleDrawerCompleted = () => {
        request('/provider/dashboard').then((dash) => {
            setSchedule((dash.schedule || []).map((appt) => ({
                ...appt,
                dashboardStatus: getDashboardStatus(appt),
            })));
            setWeeklyEarnings(dash.weeklyEarnings || 0);
            setNewClients(dash.newClientsThisWeek || 0);
        }).catch(() => {});
    };

    // ── Loading skeleton (shared) ─────────────────────────────────────────────
    const schedSkeleton = (
        <div className="py-5 flex flex-col gap-4">
            {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-line/60 animate-pulse" />
                    <div className="flex-1">
                        <div className="h-4 w-32 bg-line/60 rounded animate-pulse mb-2" />
                        <div className="h-3 w-24 bg-line/60 rounded animate-pulse" />
                    </div>
                </div>
            ))}
        </div>
    );

    // ══════════════════════════════════════════════════════════════════════════
    // DESKTOP LAYOUT
    // ══════════════════════════════════════════════════════════════════════════
    if (isDesktop) {
        return (
            <div style={{ padding: '32px 40px', fontFamily: F }}>

                {/* ── Top grid: HeroCard + two stat cards ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>

                    {/* HeroCard — clickable → opens drawer for upNext */}
                    <HeroCard onClick={upNext ? () => openDrawer(upNext) : undefined}>
                        <div>
                            <HeroPill className="mb-3">{todayPill()}</HeroPill>
                            <h2 style={{ fontFamily: F, fontSize: '28px', fontWeight: 400, letterSpacing: '-0.03em', lineHeight: 1.15, color: T.ink, margin: 0 }}>
                                {greeting()},<br />{providerDisplayName}
                            </h2>
                        </div>
                        <div>
                            <div style={{ height: '1px', background: 'rgba(61,35,30,0.1)', margin: '20px 0 12px' }} />
                            {upNext ? (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <span style={{ fontFamily: F, fontSize: '11px', fontWeight: 500, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>
                                            Up Next
                                        </span>
                                        <p style={{ fontFamily: F, fontSize: '14px', color: T.ink, margin: 0 }}>
                                            {upNext.clientName} · {upNext.serviceName}
                                        </p>
                                    </div>
                                    <ArrowIcon size={18} />
                                </div>
                            ) : (
                                <p style={{ fontFamily: F, fontSize: '14px', color: T.muted, margin: 0 }}>
                                    No upcoming appointments for today.
                                </p>
                            )}
                        </div>
                    </HeroCard>

                    {/* Two stacked stat cards */}
                    <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: '16px' }}>
                        <DesktopStatCard
                            label="Weekly Earnings"
                            value={fmtEarnings(weeklyEarnings)}
                            onClick={() => navigate('/provider/earnings')}
                        />
                        <DesktopStatCard
                            label="New Clients This Week"
                            value={newClients}
                            onClick={() => navigate('/provider/clients')}
                        />
                    </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <ProviderStripeReadinessBanner />
                </div>

                {/* ── Schedule card ── */}
                <div style={{ background: T.card, borderRadius: '20px', border: `1px solid ${T.line}`, padding: '28px', marginBottom: '0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <span style={{ fontFamily: F, fontSize: '11px', fontWeight: 500, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Today's Schedule
                        </span>
                        <button
                            onClick={() => navigate('/provider/calendar')}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: F, fontSize: '11px', fontWeight: 500, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                        >
                            View Calendar →
                        </button>
                    </div>
                    <div style={{ height: '1px', background: T.line }} />

                    {loading && schedSkeleton}

                    {!loading && schedule.length === 0 && (
                        <div style={{ padding: '32px 0', textAlign: 'center' }}>
                            <p style={{ fontFamily: F, fontSize: '16px', color: T.ink, margin: '0 0 6px' }}>No upcoming appointments for today.</p>
                            <p style={{ fontFamily: F, fontSize: '14px', color: T.muted, margin: 0 }}>Once clients book for today, they show up here.</p>
                        </div>
                    )}

                    {!loading && schedule.map((appt) => (
                        <DesktopApptRow
                            key={appt.id}
                            appt={appt}
                            onClick={() => openDrawer(appt)}
                        />
                    ))}
                </div>

                {/* ── Share Links ── */}
                <DesktopShareLinks handle={handle} />

                {/* ── Appointment Drawer ── */}
                <AppointmentDrawer
                    open={drawerOpen}
                    onClose={() => setDrawerOpen(false)}
                    appointment={drawerAppt}
                    onNavigate={(path) => navigate(path)}
                    onCompleted={handleDrawerCompleted}
                />
            </div>
        );
    }

    // ══════════════════════════════════════════════════════════════════════════
    // MOBILE LAYOUT
    // ══════════════════════════════════════════════════════════════════════════
    return (
        <div className="flex flex-col min-h-screen bg-base">
            <Header
                onMenu={onMenu}
                showAvatar
                initials={initials}
                avatarSrc={avatarSrc}
                notifCount={unreadCount}
                onNotif={() => navigate('/provider/notifications')}
            />

            {/* ── Hero card ── */}
            <div className="px-5 mb-6">
                <HeroCard>
                    <div className="mb-5">
                        <HeroPill className="mb-3">{todayPill()}</HeroPill>
                        <h1 className="text-[32px] font-semibold text-ink tracking-[-0.03em] leading-tight m-0">
                            {greeting()},<br />{providerDisplayName}
                        </h1>
                    </div>
                    <div>
                        <div className="h-px mb-4" style={{ background: 'rgba(61,35,30,0.1)' }} />
                        {upNext ? (
                            <button
                                onClick={() => handleApptClick(upNext)}
                                className="w-full flex items-end justify-between focus:outline-none"
                            >
                                <div>
                                    <Lbl className="block mb-1">Up Next</Lbl>
                                    <p className="text-[15px] text-ink m-0">
                                        {upNext.clientName} · {upNext.serviceName}
                                    </p>
                                </div>
                                <ArrowIcon />
                            </button>
                        ) : (
                            <p className="text-[15px] text-muted m-0">No upcoming appointments for today.</p>
                        )}
                    </div>
                </HeroCard>
            </div>

            {/* ── Stats row ── */}
            <div className="px-5 flex-1 flex flex-col">
                <div className="mb-5">
                    <ProviderStripeReadinessBanner compact />
                </div>
                <Divider />
                <div className="flex gap-6 pt-5 pb-5 relative">
                    <div className="absolute inset-y-5 left-1/2 w-px" style={{ background: 'rgba(140,106,100,0.2)' }} />
                    <div className="flex-1">
                        <Lbl className="block mb-2">Weekly Earnings</Lbl>
                        <div className="flex items-end gap-1">
                            <ArrowIcon size={28} color={earningsColor} />
                            <span className="text-[52px] font-semibold tracking-[-0.05em] leading-none" style={{ color: earningsColor }}>
                                {fmtEarnings(weeklyEarnings)}
                            </span>
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col items-end">
                        <Lbl className="block mb-2">New Clients</Lbl>
                        <span className="text-[52px] font-semibold tracking-[-0.05em] leading-none" style={{ color: clientsColor }}>
                            {newClients}
                        </span>
                    </div>
                </div>

                <p className="text-[15px] text-muted mb-7 mt-0">
                    {isEmpty
                        ? 'Share your links below to start booking clients.'
                        : "You're on track to beat last week's earnings."}
                </p>

                {/* ── Today's Schedule ── */}
                <div className="flex items-end justify-between mb-2">
                    <Lbl>Today's Schedule</Lbl>
                    {schedule.length > 0 && (
                        <button
                            onClick={() => navigate('/provider/appointments')}
                            className="text-[11px] font-semibold text-accent uppercase tracking-[0.04em] focus:outline-none"
                        >
                            View All
                        </button>
                    )}
                </div>
                <Divider />

                {loading && schedSkeleton}

                {!loading && schedule.length === 0 && (
                    <>
                        <div className="py-8 text-center">
                            <p className="text-[16px] text-ink m-0 mb-1">No upcoming appointments for today.</p>
                            <p className="text-[14px] text-muted m-0">Once clients book for today, they show up here.</p>
                        </div>
                        <Divider />
                    </>
                )}

                {!loading && schedule.map((appt) => (
                    <ApptRow
                        key={appt.id}
                        appt={appt}
                        onClick={() => handleApptClick(appt)}
                    />
                ))}

                {/* ── Share Links ── */}
                <div className="mt-7">
                    <ShareLinks handle={handle} />
                </div>

                <Footer />
            </div>
        </div>
    );
};

export default ProviderDashboard;
