/**
 * AvailabilityPage — v6 Warm Editorial
 * Route: /provider/availability
 *
 * Weekly hours schedule + buffer + booking window.
 * API:
 *   GET  /api/provider/weekly-hours  → { hours: [...] }
 *   GET  /api/provider/me            → { profile: { metadata: { bufferMinutes, bookingWindowDays } } }
 *   POST /api/provider/weekly-hours  → { hours: [...] }
 */
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { request } from '../../data/apiClient';
import { fetchProviderProfile } from '../../data/provider';
import BackBtn from '../../components/ui/BackBtn';
import Lbl from '../../components/ui/Lbl';
import Divider from '../../components/ui/Divider';
import Footer from '../../components/ui/Footer';
import { useToast } from '../../components/ui/ToastProvider';

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Time options in 30-min increments 6am–11pm
const TIME_OPTIONS = (() => {
    const opts = [];
    for (let h = 6; h <= 23; h++) {
        for (const m of [0, 30]) {
            const ampm = h >= 12 ? 'PM' : 'AM';
            const hr = h % 12 || 12;
            const label = `${hr}:${String(m).padStart(2, '0')} ${ampm}`;
            const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            opts.push({ label, value });
        }
    }
    return opts;
})();

const BUFFER_OPTIONS = [
    { id: 0,  label: 'None' },
    { id: 10, label: '10 min' },
    { id: 15, label: '15 min' },
    { id: 30, label: '30 min' },
];

const WINDOW_OPTIONS = [
    { id: 7,   label: '1 week' },
    { id: 14,  label: '2 weeks' },
    { id: 28,  label: '4 weeks' },
    { id: 56,  label: '8 weeks' },
    { id: -1,  label: 'Custom' },
];

const DEFAULT_DAY = { enabled: false, start: '09:00', end: '17:00' };

// ─── Time picker sheet ────────────────────────────────────────────────────────

const TimePickerSheet = ({ value, onSelect, onClose }) => (
    <div
        className="fixed inset-0 z-50 flex items-end"
        style={{ background: 'rgba(61,35,30,0.35)' }}
        onClick={onClose}
    >
        <div
            className="w-full rounded-t-[24px] pb-8"
            style={{ background: '#FBF7F2', maxHeight: '60vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(140,106,100,0.15)' }}>
                <p className="text-[16px] font-semibold text-ink m-0">Select time</p>
                <button onClick={onClose} className="focus:outline-none text-muted">Done</button>
            </div>
            <div>
                {TIME_OPTIONS.map((t) => (
                    <button
                        key={t.value}
                        onClick={() => { onSelect(t.value); onClose(); }}
                        className="w-full flex items-center justify-between px-5 py-3.5 focus:outline-none active:bg-avatarBg/40"
                        style={{ borderBottom: '1px solid rgba(140,106,100,0.08)' }}
                    >
                        <span className="text-[15px] text-ink">{t.label}</span>
                        {value === t.value && (
                            <svg width="16" height="16" fill="none" stroke="#C25E4A" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        )}
                    </button>
                ))}
            </div>
        </div>
    </div>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(val) {
    const opt = TIME_OPTIONS.find((o) => o.value === val);
    return opt ? opt.label : val;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const AvailabilityPage = () => {
    const navigate = useNavigate();
    const toast = useToast();

    // schedule[0]=Mon … schedule[6]=Sun
    const [schedule, setSchedule] = useState(DAYS.map(() => ({ ...DEFAULT_DAY })));
    const [buffer, setBuffer] = useState(0);
    const [windowDays, setWindowDays] = useState(28);
    const [customDays, setCustomDays] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Time picker state
    const [picker, setPicker] = useState(null); // { dayIdx, field }

    // ── Load ─────────────────────────────────────────────────────────────────
    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [hoursData, prof] = await Promise.all([
                request('/provider/weekly-hours'),
                fetchProviderProfile(),
            ]);
            const hours = hoursData.hours || [];
            const newSchedule = DAYS.map((_, i) => ({ ...DEFAULT_DAY }));
            for (const h of hours) {
                const idx = h.day_index; // 0=Mon
                if (idx >= 0 && idx < 7) {
                    newSchedule[idx] = {
                        enabled: h.is_available !== false,
                        start: h.start_time || '09:00',
                        end: h.end_time || '17:00',
                    };
                }
            }
            setSchedule(newSchedule);
            const meta = prof?.metadata || {};
            if (meta.bufferMinutes !== undefined) setBuffer(meta.bufferMinutes);
            const wd = meta.bookingWindowDays;
            if (wd) {
                const known = WINDOW_OPTIONS.find((o) => o.id === wd);
                if (known) { setWindowDays(wd); }
                else { setWindowDays(-1); setCustomDays(String(wd)); }
            }
        } catch (err) {
            console.error('[AvailabilityPage] load error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    // ── Helpers ───────────────────────────────────────────────────────────────
    const toggleDay = (i) => {
        setSchedule((prev) => {
            const next = [...prev];
            next[i] = { ...next[i], enabled: !next[i].enabled };
            return next;
        });
    };

    const setTime = (dayIdx, field, val) => {
        setSchedule((prev) => {
            const next = [...prev];
            next[dayIdx] = { ...next[dayIdx], [field]: val };
            return next;
        });
    };

    // ── Save ─────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        setSaving(true);
        const slowTimer = setTimeout(() => {}, 5000);
        try {
            const hours = schedule.map((d, i) => ({
                dayIndex: i,
                startTime: d.start,
                endTime: d.end,
                isAvailable: d.enabled,
            }));
            const effectiveWindowDays = windowDays === -1 ? (parseInt(customDays) || 28) : windowDays;
            await request('/provider/weekly-hours', {
                method: 'POST',
                body: JSON.stringify({ hours, bufferMinutes: buffer, bookingWindowDays: effectiveWindowDays }),
            });
            toast.push({ title: 'Hours saved', variant: 'success' });
            navigate('/provider/schedule');
        } catch (err) {
            console.error('[AvailabilityPage] save error:', err);
            toast.push({ title: 'Failed to save', variant: 'error' });
        } finally {
            clearTimeout(slowTimer);
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-base items-center justify-center">
                <div className="w-9 h-9 rounded-full" style={{ border: '2px solid rgba(140,106,100,0.2)', borderTop: '2px solid #C25E4A', animation: 'spin 0.8s linear infinite' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div className="flex flex-col bg-base" style={{ minHeight: '100dvh' }}>

            {/* ── Back nav ── */}
            <div className="flex items-center px-5 pt-10 pb-2">
                <BackBtn onClick={() => navigate('/provider/schedule')} />
            </div>

            {/* ── Title ── */}
            <div className="px-5 pb-5">
                <Lbl className="block mb-1.5">Weekly schedule</Lbl>
                <h1 className="text-[32px] font-semibold text-ink tracking-[-0.03em] leading-tight m-0">
                    Working Hours
                </h1>
            </div>

            <div className="flex-1 overflow-y-auto pb-32">
                {/* ─ Day rows ─ */}
                <div className="px-5">
                    <Divider />
                    {DAYS.map((dayName, i) => {
                        const d = schedule[i];
                        return (
                            <div key={dayName}>
                                <div className="flex items-center gap-3 py-4">
                                    {/* Checkbox */}
                                    <button
                                        onClick={() => toggleDay(i)}
                                        className="focus:outline-none flex-shrink-0"
                                        style={{
                                            width: 22, height: 22, borderRadius: 6,
                                            border: d.enabled ? 'none' : '2px solid rgba(140,106,100,0.3)',
                                            background: d.enabled ? '#3D231E' : 'transparent',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}
                                    >
                                        {d.enabled && (
                                            <svg width="12" height="12" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24">
                                                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        )}
                                    </button>

                                    {/* Day name */}
                                    <span
                                        className="text-[15px] flex-shrink-0"
                                        style={{ width: 88, fontWeight: d.enabled ? 600 : 400, color: d.enabled ? '#3D231E' : '#B0948F' }}
                                    >
                                        {dayName}
                                    </span>

                                    {/* Time buttons or "Off" */}
                                    {d.enabled ? (
                                        <div className="flex items-center gap-2 flex-1 justify-end">
                                            <button
                                                onClick={() => setPicker({ dayIdx: i, field: 'start' })}
                                                className="px-3 py-1.5 rounded-[10px] text-[13px] font-semibold text-ink focus:outline-none"
                                                style={{ background: '#F2EBE5', border: '1px solid rgba(140,106,100,0.2)' }}
                                            >
                                                {fmtTime(d.start)}
                                            </button>
                                            <span className="text-[12px] text-muted">–</span>
                                            <button
                                                onClick={() => setPicker({ dayIdx: i, field: 'end' })}
                                                className="px-3 py-1.5 rounded-[10px] text-[13px] font-semibold text-ink focus:outline-none"
                                                style={{ background: '#F2EBE5', border: '1px solid rgba(140,106,100,0.2)' }}
                                            >
                                                {fmtTime(d.end)}
                                            </button>
                                        </div>
                                    ) : (
                                        <span className="text-[13px] text-faded flex-1 text-right">Off</span>
                                    )}
                                </div>
                                <Divider />
                            </div>
                        );
                    })}
                </div>

                {/* ─ Buffer ─ */}
                <div className="px-5 pt-6 pb-2">
                    <Lbl className="block mb-3">Buffer between bookings</Lbl>
                    <div className="flex gap-2 flex-wrap">
                        {BUFFER_OPTIONS.map((opt) => (
                            <button
                                key={opt.id}
                                onClick={() => setBuffer(opt.id)}
                                className="px-4 py-2.5 rounded-[12px] text-[13px] font-semibold focus:outline-none"
                                style={{
                                    border: buffer === opt.id ? '2px solid #C25E4A' : '1px solid rgba(140,106,100,0.2)',
                                    background: buffer === opt.id ? '#FDDCC6' : 'transparent',
                                    color: buffer === opt.id ? '#C25E4A' : '#8C6A64',
                                }}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                <Divider className="mx-5 my-4" />

                {/* ─ Booking window ─ */}
                <div className="px-5 pb-6">
                    <Lbl className="block mb-1">Booking window</Lbl>
                    <p className="text-[13px] text-muted mb-3">How far in advance clients can book</p>
                    <div className="flex gap-2 flex-wrap">
                        {WINDOW_OPTIONS.map((opt) => (
                            <button
                                key={opt.id}
                                onClick={() => setWindowDays(opt.id)}
                                className="px-4 py-2.5 rounded-[12px] text-[13px] font-semibold focus:outline-none"
                                style={{
                                    border: windowDays === opt.id ? '2px solid #C25E4A' : '1px solid rgba(140,106,100,0.2)',
                                    background: windowDays === opt.id ? '#FDDCC6' : 'transparent',
                                    color: windowDays === opt.id ? '#C25E4A' : '#8C6A64',
                                }}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {windowDays === -1 && (
                        <div className="mt-3 flex items-center gap-3">
                            <input
                                type="number"
                                value={customDays}
                                onChange={(e) => setCustomDays(e.target.value)}
                                placeholder="e.g. 42"
                                className="w-24 px-3 py-2.5 rounded-[12px] text-[14px] text-ink focus:outline-none"
                                style={{ background: '#F2EBE5', border: '1px solid rgba(140,106,100,0.2)', fontFamily: 'inherit' }}
                            />
                            <span className="text-[14px] text-muted">days ahead</span>
                        </div>
                    )}
                </div>

                <Footer />
            </div>

            {/* ── Sticky bottom bar ── */}
            <div
                className="fixed bottom-0 left-0 right-0 flex gap-3 px-5 py-3"
                style={{
                    background: '#FBF7F2',
                    borderTop: '1px solid rgba(140,106,100,0.15)',
                    paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
                }}
            >
                <button
                    onClick={() => navigate('/provider/schedule')}
                    className="flex-1 py-3.5 rounded-[12px] text-[13px] font-semibold text-ink focus:outline-none active:opacity-70"
                    style={{ border: '1px solid rgba(140,106,100,0.35)', background: 'transparent' }}
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-[2] py-3.5 rounded-[12px] text-[13px] font-semibold text-white focus:outline-none flex items-center justify-center gap-2"
                    style={{ background: '#3D231E', border: 'none', opacity: saving ? 0.7 : 1 }}
                >
                    {saving && (
                        <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                    )}
                    {saving ? 'Saving…' : 'Save Changes'}
                </button>
            </div>

            {/* Time picker sheet */}
            {picker && (
                <TimePickerSheet
                    value={schedule[picker.dayIdx][picker.field]}
                    onSelect={(val) => setTime(picker.dayIdx, picker.field, val)}
                    onClose={() => setPicker(null)}
                />
            )}

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default AvailabilityPage;
