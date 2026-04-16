import { useState } from 'react';
import { request } from '../data/apiClient';
import { formatMoney } from '../utils/formatMoney';

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
    base: '#FBF7F2',
    ink: '#3D231E',
    muted: '#8C6A64',
    faded: '#B0948F',
    accent: '#C25E4A',
    hero: '#FDDCC6',
    avatarBg: '#F2EBE5',
    line: 'rgba(140,106,100,0.18)',
    successBg: '#EBF2EC',
    success: '#5A8A5E',
    dangerBg: '#FDEDEA',
};
const F = "'Sora',system-ui,sans-serif";

// ─── Small helpers ────────────────────────────────────────────────────────────
function Lbl({ children, color = T.muted, style = {} }) {
    return (
        <span style={{
            fontFamily: F, fontSize: '11px', fontWeight: 500, color,
            letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', ...style,
        }}>
            {children}
        </span>
    );
}

function Divider() {
    return <div style={{ height: '1px', background: T.line }} />;
}

function InitialsAvatar({ initials, size = 44 }) {
    return (
        <div style={{
            width: size, height: size, borderRadius: '50%', background: T.avatarBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: F, fontSize: size * 0.34, fontWeight: 500, color: T.muted, flexShrink: 0,
        }}>
            {initials}
        </div>
    );
}

// ─── AppointmentDrawer ────────────────────────────────────────────────────────
/**
 * Desktop-only slide-in drawer for appointment details.
 *
 * Props:
 *   open        {boolean}
 *   onClose     {function}
 *   appointment {object}  — { id, name, initials, scheduledDate, time, service,
 *                             duration, price, deposit, remaining, status,
 *                             lastSessionNote, clientSince }
 *   onNavigate  {function(path)} — called with a route path to navigate
 *   onCompleted {function}       — called after successful completion (refresh data)
 */
export default function AppointmentDrawer({ open, onClose, appointment, onNavigate, onCompleted }) {
    const [sessionNote, setSessionNote] = useState('');
    const [completing, setCompleting] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [error, setError] = useState(null);

    if (!appointment) return null;
    const a = appointment;

    const statusLabel = a.status === 'confirmed'
        ? 'Confirmed'
        : a.status === 'pending'
            ? 'Pending'
            : a.status === 'completed'
                ? 'Completed'
                : a.status || 'Confirmed';

    const statusBg = a.status === 'completed' ? T.successBg : T.hero;
    const statusColor = a.status === 'completed' ? T.success : T.accent;

    const handleComplete = async () => {
        if (!a.id) return;
        setCompleting(true);
        setError(null);
        try {
            await request(`/bookings/${a.id}/complete`, {
                method: 'POST',
                body: JSON.stringify({ session_note: sessionNote }),
            });
            setCompleted(true);
            onCompleted?.();
            setTimeout(() => {
                setCompleted(false);
                onClose();
            }, 1800);
        } catch (err) {
            setError(err.message || 'Could not complete booking');
        } finally {
            setCompleting(false);
        }
    };

    const handleMessage = () => {
        onNavigate?.(a.messagesPath || '/provider/messages');
        onClose();
    };

    return (
        <>
            {/* Backdrop */}
            {open && (
                <div
                    onClick={onClose}
                    style={{
                        position: 'fixed', inset: 0,
                        background: 'rgba(61,35,30,0.2)', zIndex: 30,
                    }}
                />
            )}

            {/* Panel */}
            <div style={{
                position: 'fixed', top: 0, right: open ? 0 : -520,
                width: '480px', height: '100vh', background: T.base, zIndex: 31,
                boxShadow: '-8px 0 40px rgba(61,35,30,0.10)', overflowY: 'auto',
                transition: 'right 0.35s cubic-bezier(0.4,0,0.2,1)',
            }}>
                <div style={{ padding: '28px' }}>

                    {/* Header row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <Lbl>Appointment Detail</Lbl>
                        <button
                            onClick={onClose}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                        >
                            <svg width="24" height="24" fill="none" stroke={T.ink} strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>

                    {/* Client row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                        <InitialsAvatar initials={a.initials || '?'} size={44} />
                        <div>
                            <p style={{ fontFamily: F, fontSize: '20px', fontWeight: 400, letterSpacing: '-0.02em', color: T.ink, margin: 0 }}>
                                {a.name}
                            </p>
                            {a.clientSince && (
                                <p style={{ fontFamily: F, fontSize: '13px', color: T.muted, margin: '4px 0 0' }}>
                                    Client since {a.clientSince}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Status pill */}
                    <div style={{
                        display: 'inline-flex', padding: '6px 12px',
                        borderRadius: '9999px', background: statusBg, marginBottom: '20px',
                    }}>
                        <Lbl color={statusColor} style={{ fontSize: '10px', margin: 0 }}>{statusLabel}</Lbl>
                    </div>

                    <Divider />

                    {/* Date / time / service */}
                    <div style={{ padding: '20px 0' }}>
                        <p style={{ fontFamily: F, fontSize: '18px', fontWeight: 400, letterSpacing: '-0.02em', color: T.ink, margin: 0 }}>
                            {a.scheduledDate ? `${a.scheduledDate} at ${a.time}` : a.time}
                        </p>
                        <p style={{ fontFamily: F, fontSize: '14px', color: T.muted, margin: '6px 0 0' }}>
                            {[a.duration, a.service, a.price != null ? formatMoney(a.price, a.currency) : null].filter(Boolean).join(' · ')}
                        </p>
                    </div>

                    <Divider />

                    {/* Payment status */}
                    {(a.deposit != null || a.remaining != null) && (
                        <>
                            <div style={{ padding: '20px 0' }}>
                                <Lbl style={{ marginBottom: '8px' }}>Payment Status</Lbl>
                                {a.deposit != null && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                        <span style={{ fontFamily: F, fontSize: '14px', color: T.muted }}>Deposit paid</span>
                                        <span style={{ fontFamily: F, fontSize: '14px', fontWeight: 500, color: T.ink }}>${a.deposit}</span>
                                    </div>
                                )}
                                {a.remaining != null && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontFamily: F, fontSize: '14px', color: T.muted }}>Remaining</span>
                                        <span style={{ fontFamily: F, fontSize: '14px', fontWeight: 500, color: T.accent }}>${a.remaining}</span>
                                    </div>
                                )}
                            </div>
                            <Divider />
                        </>
                    )}

                    {/* Last session note */}
                    {a.lastSessionNote && (
                        <>
                            <div style={{ padding: '20px 0' }}>
                                <Lbl style={{ marginBottom: '8px' }}>Notes From Last Session</Lbl>
                                <div style={{ padding: '14px 16px', background: T.avatarBg, borderRadius: '12px' }}>
                                    <p style={{ fontFamily: F, fontSize: '14px', color: T.ink, margin: 0, lineHeight: 1.6, fontStyle: 'italic' }}>
                                        "{a.lastSessionNote}"
                                    </p>
                                </div>
                            </div>
                            <Divider />
                        </>
                    )}

                    {/* Session notes textarea */}
                    {a.status !== 'completed' && (
                        <div style={{ padding: '20px 0' }}>
                            <Lbl style={{ marginBottom: '8px' }}>Session Notes</Lbl>
                            <textarea
                                placeholder="How did this session go?"
                                rows={3}
                                value={sessionNote}
                                onChange={(e) => setSessionNote(e.target.value)}
                                style={{
                                    width: '100%', padding: '14px 16px', borderRadius: '12px',
                                    border: `1px solid ${T.line}`, fontFamily: F, fontSize: '13px',
                                    color: T.ink, resize: 'vertical', outline: 'none',
                                    background: T.avatarBg, boxSizing: 'border-box',
                                }}
                            />
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div style={{
                            padding: '12px 16px', borderRadius: '10px',
                            background: T.dangerBg, marginBottom: '12px',
                        }}>
                            <p style={{ fontFamily: F, fontSize: '13px', color: '#B04040', margin: 0 }}>{error}</p>
                        </div>
                    )}

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={handleMessage}
                            style={{
                                flex: 1, padding: '12px 24px', borderRadius: '12px',
                                border: `1px solid ${T.line}`, background: 'transparent',
                                fontFamily: F, fontSize: '13px', fontWeight: 500, color: T.ink, cursor: 'pointer',
                            }}
                        >
                            Message
                        </button>

                        {a.status !== 'completed' && (
                            <button
                                onClick={handleComplete}
                                disabled={completing || completed}
                                style={{
                                    flex: 2, padding: '12px 24px', borderRadius: '12px',
                                    border: 'none',
                                    background: completed ? T.successBg : T.ink,
                                    color: completed ? T.success : '#fff',
                                    fontFamily: F, fontSize: '13px', fontWeight: 500, cursor: completing ? 'wait' : 'pointer',
                                    opacity: completing ? 0.7 : 1, transition: 'background 0.3s, color 0.3s',
                                }}
                            >
                                {completed ? '✓ Completed' : completing ? 'Completing…' : 'Mark Complete'}
                            </button>
                        )}
                    </div>

                </div>
            </div>
        </>
    );
}
