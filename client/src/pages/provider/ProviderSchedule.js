/**
 * ProviderSchedule — v6 Warm Editorial
 * Route: /provider/schedule
 *
 * API: GET /api/provider/calendar?year=YYYY&month=M(0-based)
 *   → { byDate: { "YYYY-MM-DD": [...bookings] }, blockedDates: { "YYYY-MM-DD": { block_type, reason } } }
 */
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useSession } from '../../auth/authContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { request } from '../../data/apiClient';
import Header from '../../components/ui/Header';
import Avatar from '../../components/ui/Avatar';
import Lbl from '../../components/ui/Lbl';
import Divider from '../../components/ui/Divider';
import Footer from '../../components/ui/Footer';

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_NAMES_LONG = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function monFirstDow(date) {
    return (date.getDay() + 6) % 7;
}

function fmtTime(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function fmtDuration(mins) {
    if (!mins) return null;
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
}

function fmtBlockTime(t) {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hr = h % 12 || 12;
    return `${hr}:${String(m).padStart(2, '0')} ${ampm}`;
}

function getInitials(name) {
    return (name || 'C').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const ProviderSchedule = () => {
    const navigate = useNavigate();
    const { onMenu } = useOutletContext() || {};
    const { profile } = useSession();
    const { unreadCount } = useNotifications();

    const today = useMemo(() => new Date(), []);
    const [monthOffset, setMonthOffset] = useState(0);
    const [selectedDay, setSelectedDay] = useState(today.getDate());
    const [byDate, setByDate] = useState({});
    const [blockedDates, setBlockedDates] = useState({});
    const [loading, setLoading] = useState(false);

    const initials = (profile?.name || '').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || 'P';

    const { displayYear, displayMonth } = useMemo(() => {
        let m = today.getMonth() + monthOffset;
        let y = today.getFullYear();
        while (m > 11) { m -= 12; y++; }
        while (m < 0)  { m += 12; y--; }
        return { displayMonth: m, displayYear: y };
    }, [today, monthOffset]);

    const isCurrentCalendarMonth =
        displayYear === today.getFullYear() && displayMonth === today.getMonth();

    const loadMonth = useCallback(async () => {
        setLoading(true);
        try {
            const data = await request(`/provider/calendar?year=${displayYear}&month=${displayMonth}`);
            setByDate(data.byDate || {});
            setBlockedDates(data.blockedDates || {});
        } catch (err) {
            console.error('[ProviderSchedule] load error:', err);
            setByDate({});
            setBlockedDates({});
        } finally {
            setLoading(false);
        }
    }, [displayYear, displayMonth]);

    useEffect(() => { loadMonth(); }, [loadMonth]);

    const handlePrevMonth = () => { setMonthOffset((o) => o - 1); setSelectedDay(1); };
    const handleNextMonth = () => { setMonthOffset((o) => o + 1); setSelectedDay(1); };

    const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();
    const firstDow = monFirstDow(new Date(displayYear, displayMonth, 1));

    // Sets for calendar dots
    const daysWithBookings = useMemo(() => {
        const days = new Set();
        Object.keys(byDate).forEach((key) => {
            const d = new Date(key + 'T00:00:00');
            if (d.getFullYear() === displayYear && d.getMonth() === displayMonth && byDate[key]?.length > 0) {
                days.add(d.getDate());
            }
        });
        return days;
    }, [byDate, displayYear, displayMonth]);

    const daysBlocked = useMemo(() => {
        const days = new Set();
        Object.keys(blockedDates).forEach((key) => {
            const d = new Date(key + 'T00:00:00');
            if (d.getFullYear() === displayYear && d.getMonth() === displayMonth) {
                days.add(d.getDate());
            }
        });
        return days;
    }, [blockedDates, displayYear, displayMonth]);

    const selectedDateKey = useMemo(() => {
        const mm = String(displayMonth + 1).padStart(2, '0');
        const dd = String(selectedDay).padStart(2, '0');
        return `${displayYear}-${mm}-${dd}`;
    }, [displayYear, displayMonth, selectedDay]);

    const daySchedule = byDate[selectedDateKey] || [];
    const blockedInfo = blockedDates[selectedDateKey] || null;

    const selectedDow = new Date(displayYear, displayMonth, selectedDay).getDay();
    const selectedLabel = `${DAY_NAMES_LONG[selectedDow]}, ${MONTH_NAMES[displayMonth].slice(0, 3)} ${selectedDay}`;

    return (
        <div className="flex flex-col min-h-screen bg-base">
            <Header
                onMenu={onMenu}
                showAvatar
                initials={initials}
                notifCount={unreadCount}
                onNotif={() => navigate('/provider/notifications')}
            />

            {/* ── Title + action buttons ── */}
            <div className="px-5 pb-4 flex items-end justify-between">
                <div>
                    <Lbl className="block mb-1.5">
                        {loading ? '…' : `${MONTH_NAMES[displayMonth]} ${displayYear}`}
                    </Lbl>
                    <h1 className="text-[32px] font-semibold text-ink tracking-[-0.03em] leading-tight m-0">
                        Calendar
                    </h1>
                </div>
                <div className="flex gap-2 mb-1">
                    <button
                        onClick={() => navigate('/provider/availability')}
                        className="px-3.5 py-2.5 rounded-[12px] text-[12px] font-semibold focus:outline-none active:opacity-70"
                        style={{ border: '1px solid rgba(140,106,100,0.35)', background: 'transparent', color: '#8C6A64' }}
                    >
                        Hours
                    </button>
                    <button
                        onClick={() => navigate('/provider/block-time')}
                        className="px-3.5 py-2.5 rounded-[12px] text-[12px] font-semibold text-white focus:outline-none active:opacity-70"
                        style={{ background: '#3D231E', border: 'none' }}
                    >
                        Block Time
                    </button>
                </div>
            </div>

            <div className="px-5 flex-1 flex flex-col">
                {/* ── Calendar grid ── */}
                <div
                    className="rounded-[20px] p-5 mb-2"
                    style={{ background: '#FFFFFF', border: '1px solid rgba(140,106,100,0.15)' }}
                >
                    {/* Month nav */}
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={handlePrevMonth}
                            className="flex items-center justify-center focus:outline-none active:opacity-60"
                            style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(140,106,100,0.2)', background: '#F2EBE5' }}
                        >
                            <svg width="14" height="14" fill="none" stroke="#3D231E" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                        <span className="text-[16px] font-semibold text-ink">
                            {MONTH_NAMES[displayMonth]} {displayYear}
                        </span>
                        <button
                            onClick={handleNextMonth}
                            className="flex items-center justify-center focus:outline-none active:opacity-60"
                            style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(140,106,100,0.2)', background: '#F2EBE5' }}
                        >
                            <svg width="14" height="14" fill="none" stroke="#3D231E" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>

                    {/* Day-of-week header */}
                    <div className="grid grid-cols-7 mb-1">
                        {DAY_LABELS.map((d) => (
                            <div key={d} className="text-center text-[11px] font-semibold uppercase tracking-[0.04em] text-muted py-1">
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Date grid */}
                    <div className="grid grid-cols-7 gap-y-0.5">
                        {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const isSelected = day === selectedDay;
                            const isToday = isCurrentCalendarMonth && day === today.getDate();
                            const hasBooking = daysWithBookings.has(day);
                            const isBlocked = daysBlocked.has(day);

                            return (
                                <button
                                    key={day}
                                    onClick={() => setSelectedDay(day)}
                                    className="flex flex-col items-center justify-center focus:outline-none relative"
                                    style={{
                                        aspectRatio: '1',
                                        borderRadius: '50%',
                                        border: 'none',
                                        background: isSelected ? '#C25E4A' : 'transparent',
                                        outline: isToday && !isSelected ? '2px solid #C25E4A' : 'none',
                                        outlineOffset: '-2px',
                                        opacity: isBlocked && !isSelected ? 0.5 : 1,
                                        padding: 0,
                                    }}
                                >
                                    <span
                                        className="text-[14px]"
                                        style={{
                                            fontWeight: isSelected || isToday ? 700 : 400,
                                            color: isSelected ? '#FFFFFF' : '#3D231E',
                                        }}
                                    >
                                        {day}
                                    </span>
                                    {(hasBooking || isBlocked) && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                bottom: 3,
                                                width: 4,
                                                height: 4,
                                                borderRadius: '50%',
                                                background: isSelected ? '#FFFFFF' : isBlocked ? '#B0948F' : '#C25E4A',
                                            }}
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Legend */}
                    <div className="flex gap-4 mt-3 pt-3" style={{ borderTop: '1px solid rgba(140,106,100,0.1)' }}>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ background: '#C25E4A' }} />
                            <span className="text-[11px] text-muted">Booked</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ background: '#B0948F' }} />
                            <span className="text-[11px] text-muted">Blocked</span>
                        </div>
                    </div>
                </div>

                {/* ── Selected day label ── */}
                <div className="flex items-center justify-between mt-4 mb-3">
                    <p className="text-[17px] font-semibold text-ink m-0">{selectedLabel}</p>
                    {loading && <span className="text-[12px] text-muted">Loading…</span>}
                </div>

                {/* ── Blocked day card ── */}
                {blockedInfo && (
                    <div
                        className="flex items-start gap-3 px-4 py-4 rounded-[16px] mb-3"
                        style={{ background: '#F2EBE5', border: '1px solid rgba(140,106,100,0.15)' }}
                    >
                        <div
                            className="w-1 rounded-full flex-shrink-0 mt-0.5"
                            style={{ height: 36, background: '#B0948F' }}
                        />
                        <div>
                            <p className="text-[14px] font-semibold text-ink m-0 mb-0.5">
                                Time Blocked
                                {blockedInfo.block_type === 'hours' && blockedInfo.start_time
                                    ? ` · ${fmtBlockTime(blockedInfo.start_time)}–${fmtBlockTime(blockedInfo.end_time)}`
                                    : ' · All day'}
                            </p>
                            {blockedInfo.reason && (
                                <p className="text-[13px] text-muted m-0 italic">"{blockedInfo.reason}"</p>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Empty state ── */}
                {!loading && !blockedInfo && daySchedule.length === 0 && (
                    <div className="py-10 flex flex-col items-center">
                        <p className="text-[15px] text-muted text-center m-0">Nothing scheduled.</p>
                        <button
                            onClick={() => navigate('/provider/block-time')}
                            className="mt-2 text-[13px] font-semibold focus:outline-none"
                            style={{ color: '#C25E4A', background: 'none', border: 'none' }}
                        >
                            Block this day
                        </button>
                    </div>
                )}

                {/* ── Appointment rows ── */}
                {!loading && daySchedule.length > 0 && (
                    <>
                        <Divider />
                        {daySchedule.map((booking, i) => {
                            const duration = fmtDuration(booking.duration);
                            return (
                                <div key={booking.id}>
                                    <button
                                        onClick={() => navigate(`/provider/appointments/${booking.id}`)}
                                        className="w-full flex items-center gap-3 py-4 text-left focus:outline-none active:opacity-70"
                                    >
                                        <div
                                            className="flex-shrink-0 rounded-full"
                                            style={{ width: 4, height: 40, background: '#C25E4A' }}
                                        />
                                        <Avatar initials={getInitials(booking.client_name)} size={40} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[15px] font-semibold text-ink m-0 truncate">
                                                {booking.client_name || 'Client'}
                                            </p>
                                            <p className="text-[13px] text-muted m-0 mt-0.5 truncate">
                                                {booking.service_name || 'Session'}
                                                {duration ? ` · ${duration}` : ''}
                                            </p>
                                        </div>
                                        <span className="text-[14px] font-semibold text-ink flex-shrink-0">
                                            {fmtTime(booking.scheduled_at)}
                                        </span>
                                    </button>
                                    {i < daySchedule.length - 1 && <Divider />}
                                </div>
                            );
                        })}
                    </>
                )}

                <Footer />
            </div>
        </div>
    );
};

export default ProviderSchedule;
