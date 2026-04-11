/**
 * AvailabilityPage — v6 Warm Editorial
 * Route: /provider/availability
 *
 * Providers set explicit time slots per day of week (e.g. 9:00 AM, 1:30 PM, 5:00 PM).
 * Clients see only those exact slots when booking.
 *
 * API:
 *   GET  /api/provider/weekly-hours  → { hours: [{ day_index, is_available, time_slots }] }
 *   POST /api/provider/weekly-hours  → { hours: [{ dayIndex, isAvailable, timeSlots }], bookingWindowDays }
 */
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { request } from '../../data/apiClient';
import BackBtn from '../../components/ui/BackBtn';
import Lbl from '../../components/ui/Lbl';
import Divider from '../../components/ui/Divider';
import Footer from '../../components/ui/Footer';
import { useToast } from '../../components/ui/ToastProvider';

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Time options in 15-min increments 6am–11:45pm
const TIME_OPTIONS = (() => {
    const opts = [];
    for (let h = 6; h <= 23; h++) {
        for (const m of [0, 15, 30, 45]) {
            const ampm = h >= 12 ? 'PM' : 'AM';
            const hr = h % 12 || 12;
            const label = `${hr}:${String(m).padStart(2, '0')} ${ampm}`;
            const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            opts.push({ label, value });
        }
    }
    return opts;
})();

const WINDOW_OPTIONS = [
    { id: 7,   label: '1 week' },
    { id: 14,  label: '2 weeks' },
    { id: 28,  label: '4 weeks' },
    { id: 56,  label: '8 weeks' },
    { id: -1,  label: 'Custom' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(val) {
    const opt = TIME_OPTIONS.find((o) => o.value === val);
    return opt ? opt.label : val;
}

// ─── Add Slot Sheet ───────────────────────────────────────────────────────────

const AddSlotSheet = ({ existingSlots, onAdd, onClose }) => (
    <div
        className="fixed inset-0 z-50 flex items-end"
        style={{ background: 'rgba(61,35,30,0.35)' }}
        onClick={onClose}
    >
        <div
            className="w-full rounded-t-[24px] pb-8"
            style={{ background: '#FBF7F2', maxHeight: '65vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(140,106,100,0.15)' }}>
                <p className="text-[16px] font-semibold text-ink m-0">Add time slot</p>
                <button onClick={onClose} className="focus:outline-none text-[14px] font-semibold" style={{ color: '#C25E4A' }}>Done</button>
            </div>
            <div>
                {TIME_OPTIONS.map((t) => {
                    const already = existingSlots.includes(t.value);
                    return (
                        <button
                            key={t.value}
                            onClick={() => { if (!already) { onAdd(t.value); onClose(); } }}
                            disabled={already}
                            className="w-full flex items-center justify-between px-5 py-3.5 focus:outline-none"
                            style={{
                                borderBottom: '1px solid rgba(140,106,100,0.08)',
                                opacity: already ? 0.4 : 1,
                                cursor: already ? 'not-allowed' : 'pointer',
                            }}
                        >
                            <span className="text-[15px] text-ink">{t.label}</span>
                            {already && (
                                <svg width="16" height="16" fill="none" stroke="#C25E4A" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const AvailabilityPage = () => {
    const navigate = useNavigate();
    const toast = useToast();

    // schedule[0]=Mon … schedule[6]=Sun
    const [schedule, setSchedule] = useState(DAYS.map(() => ({ enabled: false, slots: [] })));
    const [windowDays, setWindowDays] = useState(28);
    const [customDays, setCustomDays] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Which day's add-slot sheet is open
    const [addingFor, setAddingFor] = useState(null); // dayIdx | null

    // ── Load ─────────────────────────────────────────────────────────────────
    const load = useCallback(async () => {
        setLoading(true);
        try {
            const hoursResult = await request('/provider/weekly-hours');

            const hours = hoursResult?.hours || [];
            const newSchedule = DAYS.map(() => ({ enabled: false, slots: [] }));
            for (const h of hours) {
                const idx = h.day_index;
                if (idx >= 0 && idx < 7) {
                    newSchedule[idx] = {
                        enabled: h.is_available !== false,
                        slots: Array.isArray(h.time_slots) ? [...h.time_slots].sort() : [],
                    };
                }
            }
            setSchedule(newSchedule);

            const wd = hoursResult?.bookingWindowDays;
            if (wd) {
                const known = WINDOW_OPTIONS.find((o) => o.id === wd);
                if (known) { setWindowDays(wd); setCustomDays(''); }
                else { setWindowDays(-1); setCustomDays(String(wd)); }
            }
        } catch (err) {
            console.error('[AvailabilityPage] load error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    // ── Slot helpers ──────────────────────────────────────────────────────────
    const toggleDay = (i) => {
        setSchedule((prev) => {
            const next = [...prev];
            next[i] = { ...next[i], enabled: !next[i].enabled };
            return next;
        });
    };

    const addSlot = (dayIdx, time) => {
        setSchedule((prev) => {
            const next = [...prev];
            const slots = [...next[dayIdx].slots];
            if (!slots.includes(time)) slots.push(time);
            slots.sort();
            next[dayIdx] = { ...next[dayIdx], slots };
            return next;
        });
    };

    const removeSlot = (dayIdx, time) => {
        setSchedule((prev) => {
            const next = [...prev];
            next[dayIdx] = { ...next[dayIdx], slots: next[dayIdx].slots.filter((s) => s !== time) };
            return next;
        });
    };

    // ── Save ─────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        setSaving(true);
        try {
            const hours = schedule.map((d, i) => ({
                dayIndex: i,
                isAvailable: d.enabled,
                timeSlots: d.slots,
            }));
            const effectiveWindowDays = windowDays === -1 ? (parseInt(customDays) || 28) : windowDays;
            await request('/provider/weekly-hours', {
                method: 'POST',
                body: JSON.stringify({ hours, bookingWindowDays: effectiveWindowDays }),
            });
            toast.push({ title: 'Hours saved', variant: 'success' });
            navigate('/provider/schedule');
        } catch (err) {
            console.error('[AvailabilityPage] save error:', err);
            toast.push({ title: 'Failed to save', variant: 'error' });
        } finally {
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
                <p className="text-[14px] mt-2 m-0" style={{ color: '#8C6A64' }}>
                    Set the exact times clients can book you each day.
                </p>
            </div>

            <div className="flex-1 overflow-y-auto pb-32">
                <div className="px-5">
                    <Divider />
                    {DAYS.map((dayName, i) => {
                        const d = schedule[i];
                        return (
                            <div key={dayName}>
                                {/* Day header row */}
                                <div className="flex items-center gap-3 py-4">
                                    {/* Toggle switch */}
                                    <button
                                        onClick={() => toggleDay(i)}
                                        className="focus:outline-none flex-shrink-0"
                                        style={{
                                            width: 44, height: 26, borderRadius: 13,
                                            border: 'none',
                                            background: d.enabled ? '#C25E4A' : 'rgba(140,106,100,0.2)',
                                            position: 'relative',
                                            transition: 'background 0.2s',
                                            padding: 0,
                                        }}
                                    >
                                        <span style={{
                                            position: 'absolute', top: 3,
                                            left: d.enabled ? 21 : 3,
                                            width: 20, height: 20, borderRadius: '50%',
                                            background: '#fff',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
                                            transition: 'left 0.2s',
                                            display: 'block',
                                        }} />
                                    </button>

                                    {/* Day name */}
                                    <span
                                        className="text-[15px] flex-1"
                                        style={{ fontWeight: d.enabled ? 600 : 400, color: d.enabled ? '#3D231E' : '#B0948F' }}
                                    >
                                        {dayName}
                                    </span>

                                    {/* Off label or slot count */}
                                    {!d.enabled ? (
                                        <span className="text-[13px]" style={{ color: '#B0948F' }}>Off</span>
                                    ) : (
                                        <span className="text-[12px]" style={{ color: '#8C6A64' }}>
                                            {d.slots.length === 0 ? 'No slots' : `${d.slots.length} slot${d.slots.length !== 1 ? 's' : ''}`}
                                        </span>
                                    )}
                                </div>

                                {/* Slot pills + Add button */}
                                {d.enabled && (
                                    <div className="flex flex-wrap gap-2 pb-4">
                                        {d.slots.map((slot) => (
                                            <div
                                                key={slot}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px]"
                                                style={{ background: '#F2EBE5', border: '1px solid rgba(140,106,100,0.2)' }}
                                            >
                                                <span className="text-[13px] font-semibold text-ink">{fmtTime(slot)}</span>
                                                <button
                                                    onClick={() => removeSlot(i, slot)}
                                                    className="focus:outline-none flex items-center justify-center"
                                                    style={{ width: 16, height: 16, borderRadius: '50%', background: 'rgba(140,106,100,0.2)', flexShrink: 0 }}
                                                >
                                                    <svg width="8" height="8" fill="none" stroke="#8C6A64" strokeWidth="2.5" viewBox="0 0 24 24">
                                                        <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                        {/* Add time button */}
                                        <button
                                            onClick={() => setAddingFor(i)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] focus:outline-none"
                                            style={{ border: '1.5px dashed rgba(140,106,100,0.35)', background: 'transparent', color: '#8C6A64' }}
                                        >
                                            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                                            </svg>
                                            <span className="text-[13px] font-semibold">Add time</span>
                                        </button>
                                    </div>
                                )}

                                <Divider />
                            </div>
                        );
                    })}
                </div>

                {/* ─ Booking window ─ */}
                <div className="px-5 pt-6 pb-6">
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
            <div className="sticky bottom-0 px-5 py-3 mt-auto" style={{ background: '#FBF7F2' }}>
                <div
                    className="flex gap-3"
                    style={{
                        borderTop: '1px solid rgba(140,106,100,0.15)',
                        paddingTop: 12,
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
            </div>

            {/* Add slot sheet */}
            {addingFor !== null && (
                <AddSlotSheet
                    existingSlots={schedule[addingFor].slots}
                    onAdd={(time) => addSlot(addingFor, time)}
                    onClose={() => setAddingFor(null)}
                />
            )}

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default AvailabilityPage;
