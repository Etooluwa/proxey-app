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
import Footer from '../../components/ui/Footer';
import AppointmentDrawer from '../../components/AppointmentDrawer';

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

function fmtTime(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
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

// ─── Schedule row ─────────────────────────────────────────────────────────────

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

// ─── Page ─────────────────────────────────────────────────────────────────────

const ProviderDashboard = () => {
    const navigate = useNavigate();
    const { onMenu, isDesktop } = useOutletContext() || {};
    const { profile: sessionProfile } = useSession();
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
                const [dash, prof] = await Promise.all([
                    request('/provider/dashboard'),
                    fetchProviderProfile(),
                ]);
                if (!cancelled) {
                    setSchedule(dash.schedule || []);
                    setWeeklyEarnings(dash.weeklyEarnings || 0);
                    setNewClients(dash.newClientsThisWeek || 0);
                    setHandle(prof?.handle || '');
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

    const firstName = sessionProfile?.name?.split(' ')[0] || 'there';
    const initials = getInitials(sessionProfile?.name);
    const isEmpty = !loading && schedule.length === 0 && weeklyEarnings === 0;
    const upNext = schedule[0] || null;

    // Stats display — faded color when empty
    const earningsColor = isEmpty ? '#B0948F' : '#C25E4A';
    const clientsColor = isEmpty ? '#B0948F' : '#C25E4A';

    const handleApptClick = (appt) => {
        if (isDesktop) {
            setDrawerAppt({
                id: appt.id,
                name: appt.clientName,
                initials: getInitials(appt.clientName),
                scheduledDate: new Date(appt.scheduledAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
                time: fmtTime(appt.scheduledAt),
                service: appt.serviceName,
                duration: fmtDuration(appt.duration),
                status: appt.status,
                messagesPath: '/provider/messages',
            });
            setDrawerOpen(true);
        } else {
            navigate(`/provider/appointments/${appt.id}`);
        }
    };

    const handleDrawerNavigate = (path) => {
        navigate(path);
    };

    const handleDrawerCompleted = () => {
        // Refresh schedule after completion
        request('/provider/dashboard').then((dash) => {
            setSchedule(dash.schedule || []);
            setWeeklyEarnings(dash.weeklyEarnings || 0);
            setNewClients(dash.newClientsThisWeek || 0);
        }).catch(() => {});
    };

    return (
        <div className="flex flex-col min-h-screen bg-base">
            <Header
                onMenu={onMenu}
                showAvatar
                initials={initials}
                notifCount={unreadCount}
                onNotif={() => navigate('/provider/notifications')}
            />

            {/* ── Hero card ── */}
            <div className="px-5 mb-6">
                <HeroCard>
                    {/* Date pill + greeting */}
                    <div className="mb-5">
                        <HeroPill className="mb-3">{todayPill()}</HeroPill>
                        <h1 className="text-[32px] font-semibold text-ink tracking-[-0.03em] leading-tight m-0">
                            {greeting()},<br />{firstName}
                        </h1>
                    </div>

                    {/* Up Next / empty message */}
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
                            <p className="text-[15px] text-muted m-0">No upcoming sessions today.</p>
                        )}
                    </div>
                </HeroCard>
            </div>

            {/* ── Stats row ── */}
            <div className="px-5 flex-1 flex flex-col">
                <Divider />
                <div className="flex gap-6 pt-5 pb-5 relative">
                    {/* Vertical divider */}
                    <div className="absolute inset-y-5 left-1/2 w-px" style={{ background: 'rgba(140,106,100,0.2)' }} />

                    {/* Weekly Earnings */}
                    <div className="flex-1">
                        <Lbl className="block mb-2">Weekly Earnings</Lbl>
                        <div className="flex items-end gap-1">
                            <ArrowIcon size={28} color={earningsColor} />
                            <span
                                className="text-[52px] font-semibold tracking-[-0.05em] leading-none"
                                style={{ color: earningsColor }}
                            >
                                {fmtEarnings(weeklyEarnings)}
                            </span>
                        </div>
                    </div>

                    {/* New Clients */}
                    <div className="flex-1 flex flex-col items-end">
                        <Lbl className="block mb-2">New Clients</Lbl>
                        <span
                            className="text-[52px] font-semibold tracking-[-0.05em] leading-none"
                            style={{ color: clientsColor }}
                        >
                            {newClients}
                        </span>
                    </div>
                </div>

                {/* Context line */}
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

                {/* Loading skeleton */}
                {loading && (
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
                )}

                {/* Empty schedule */}
                {!loading && schedule.length === 0 && (
                    <>
                        <div className="py-8 text-center">
                            <p className="text-[16px] text-ink m-0 mb-1">Your day is wide open.</p>
                            <p className="text-[14px] text-muted m-0">
                                Once clients book, their sessions show up here.
                            </p>
                        </div>
                        <Divider />
                    </>
                )}

                {/* Appointment rows */}
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

            {/* Desktop appointment drawer */}
            {isDesktop && (
                <AppointmentDrawer
                    open={drawerOpen}
                    onClose={() => setDrawerOpen(false)}
                    appointment={drawerAppt}
                    onNavigate={handleDrawerNavigate}
                    onCompleted={handleDrawerCompleted}
                />
            )}
        </div>
    );
};

export default ProviderDashboard;
