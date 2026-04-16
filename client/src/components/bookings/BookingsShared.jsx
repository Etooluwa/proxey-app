import React from 'react';

export const BOOKING_TOKENS = {
    base: '#FBF7F2',
    ink: '#3D231E',
    muted: '#8C6A64',
    faded: '#B0948F',
    accent: '#C25E4A',
    hero: '#FDDCC6',
    avatarBg: '#F2EBE5',
    line: 'rgba(140,106,100,0.18)',
    card: '#FFFFFF',
    callout: '#FFF5E6',
    success: '#5A8A5E',
    successBg: '#EBF2EC',
    amber: '#C27A1A',
    amberBg: '#FEF3E2',
    danger: '#B04040',
    dangerBg: '#FDEDEA',
};

export const BODY_FONT = "'Sora', system-ui, sans-serif";

export function formatBookingPrice(value, currency = 'CAD') {
    if (value === null || value === undefined || value === '') return null;
    const cents = Number(value);
    if (!Number.isFinite(cents)) return null;
    const dollars = cents / 100;
    const cur = (currency || 'CAD').toUpperCase();
    return new Intl.NumberFormat('en-CA', {
        style: 'currency',
        currency: cur,
        maximumFractionDigits: dollars % 1 === 0 ? 0 : 2,
    }).format(dollars);
}

export function formatBookingDuration(minutes) {
    const total = Number(minutes);
    if (!Number.isFinite(total) || total <= 0) return null;
    if (total < 60) return `${total} min`;
    const hours = Math.floor(total / 60);
    const remainder = total % 60;
    return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`;
}

function parseLocalDate(iso) {
    if (!iso) return null;
    return new Date(String(iso).replace('Z', '').replace(/[+-]\d{2}:\d{2}$/, ''));
}

export function formatBookingTime(iso) {
    const d = parseLocalDate(iso);
    if (!d || isNaN(d)) return 'TBD';
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function getDateBlock(iso) {
    const date = parseLocalDate(iso);
    if (!date || Number.isNaN(date.getTime())) {
        return { day: 'TBD', dayNumber: '—' };
    }

    return {
        day: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
        dayNumber: date.toLocaleDateString('en-US', { day: 'numeric' }),
    };
}

export function getStatusTheme(status) {
    const normalized = String(status || '').toLowerCase();

    if (normalized === 'pending') {
        return {
            dateBackground: BOOKING_TOKENS.amberBg,
            dateColor: BOOKING_TOKENS.amber,
            pillBackground: BOOKING_TOKENS.amberBg,
            pillColor: BOOKING_TOKENS.amber,
            pillLabel: 'Pending',
        };
    }

    if (normalized === 'confirmed') {
        return {
            dateBackground: BOOKING_TOKENS.hero,
            dateColor: BOOKING_TOKENS.accent,
            pillBackground: BOOKING_TOKENS.successBg,
            pillColor: BOOKING_TOKENS.success,
            pillLabel: 'Confirmed',
        };
    }

    if (normalized === 'cancelled') {
        return {
            dateBackground: BOOKING_TOKENS.avatarBg,
            dateColor: BOOKING_TOKENS.muted,
            pillBackground: BOOKING_TOKENS.dangerBg,
            pillColor: BOOKING_TOKENS.danger,
            pillLabel: 'Cancelled',
        };
    }

    return {
        dateBackground: BOOKING_TOKENS.avatarBg,
        dateColor: BOOKING_TOKENS.muted,
        pillBackground: BOOKING_TOKENS.avatarBg,
        pillColor: BOOKING_TOKENS.muted,
        pillLabel: 'Completed',
    };
}

export function getPaymentStatusTheme(paymentStatus, paymentType = 'full') {
    const normalized = String(paymentStatus || '').toLowerCase();

    if (normalized === 'paid') {
        return {
            pillBackground: BOOKING_TOKENS.successBg,
            pillColor: BOOKING_TOKENS.success,
            pillLabel: paymentType === 'deposit' ? 'Balance Paid' : 'Paid',
        };
    }

    if (normalized === 'deposit_paid') {
        return {
            pillBackground: BOOKING_TOKENS.successBg,
            pillColor: BOOKING_TOKENS.success,
            pillLabel: 'Deposit Paid',
        };
    }

    if (normalized === 'card_saved') {
        return {
            pillBackground: BOOKING_TOKENS.amberBg,
            pillColor: BOOKING_TOKENS.amber,
            pillLabel: 'Card on File',
        };
    }

    if (normalized === 'payment_failed') {
        return {
            pillBackground: BOOKING_TOKENS.dangerBg,
            pillColor: BOOKING_TOKENS.danger,
            pillLabel: 'Payment Failed',
        };
    }

    return null;
}

export function BookingsPageHeader({ label }) {
    return (
        <section style={{ marginBottom: 28, animation: 'fadeUp 0.4s ease 0.05s both' }}>
            <p
                style={{
                    margin: '0 0 8px',
                    fontFamily: BODY_FONT,
                    fontSize: 11,
                    fontWeight: 500,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: BOOKING_TOKENS.accent,
                }}
            >
                {label}
            </p>
            <h1
                style={{
                    margin: 0,
                    fontFamily: BODY_FONT,
                    fontSize: 34,
                    fontWeight: 400,
                    letterSpacing: '-0.03em',
                    color: BOOKING_TOKENS.ink,
                }}
            >
                Bookings
            </h1>
        </section>
    );
}

export function BookingsTabBar({ tabs, activeTab, onChange }) {
    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: 8,
                marginBottom: 28,
                animation: 'fadeUp 0.4s ease 0.12s both',
            }}
        >
            {tabs.map((tab) => {
                const isActive = tab.id === activeTab;
                return (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => onChange(tab.id)}
                        style={{
                            position: 'relative',
                            padding: '20px 16px',
                            borderRadius: 16,
                            border: isActive
                                ? `2px solid ${BOOKING_TOKENS.accent}`
                                : `1px solid ${BOOKING_TOKENS.line}`,
                            background: isActive
                                ? 'linear-gradient(135deg, rgba(194,94,74,0.04), rgba(253,220,198,0.15))'
                                : BOOKING_TOKENS.card,
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'border-color 0.2s ease, background 0.2s ease',
                        }}
                        onMouseEnter={(event) => {
                            if (!isActive) event.currentTarget.style.borderColor = 'rgba(140,106,100,0.35)';
                        }}
                        onMouseLeave={(event) => {
                            if (!isActive) event.currentTarget.style.borderColor = BOOKING_TOKENS.line;
                        }}
                    >
                        {tab.id === 'pending' && tab.count > 0 && (
                            <span
                                style={{
                                    position: 'absolute',
                                    top: 12,
                                    right: 12,
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    background: BOOKING_TOKENS.accent,
                                }}
                            />
                        )}
                        <span
                            style={{
                                display: 'block',
                                marginBottom: 4,
                                fontFamily: BODY_FONT,
                                fontSize: 28,
                                fontWeight: 400,
                                letterSpacing: '-0.04em',
                                color: isActive ? BOOKING_TOKENS.accent : BOOKING_TOKENS.ink,
                            }}
                        >
                            {tab.count}
                        </span>
                        <span
                            style={{
                                fontFamily: BODY_FONT,
                                fontSize: 10,
                                fontWeight: 600,
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase',
                                color: isActive ? BOOKING_TOKENS.accent : BOOKING_TOKENS.faded,
                            }}
                        >
                            {tab.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

export function BookingsEmptyState({ icon, title, description }) {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '60px 20px',
                animation: 'fadeUp 0.4s ease 0.19s both',
            }}
        >
            <div
                style={{
                    width: 72,
                    height: 72,
                    borderRadius: 20,
                    background: BOOKING_TOKENS.avatarBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 20,
                }}
            >
                {icon}
            </div>
            <h3
                style={{
                    margin: '0 0 8px',
                    fontFamily: BODY_FONT,
                    fontSize: 20,
                    fontWeight: 400,
                    letterSpacing: '-0.02em',
                    color: BOOKING_TOKENS.ink,
                }}
            >
                {title}
            </h3>
            <p
                style={{
                    margin: 0,
                    maxWidth: 300,
                    fontFamily: BODY_FONT,
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: BOOKING_TOKENS.muted,
                }}
            >
                {description}
            </p>
        </div>
    );
}

export function EnvelopeIcon() {
    return (
        <svg width="32" height="32" fill="none" stroke={BOOKING_TOKENS.faded} strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M3 19V9a2 2 0 011.106-1.789L12 3l7.894 4.211A2 2 0 0121 9v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 9l9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function CalendarIcon() {
    return (
        <svg width="32" height="32" fill="none" stroke={BOOKING_TOKENS.faded} strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function ClockIcon() {
    return (
        <svg width="32" height="32" fill="none" stroke={BOOKING_TOKENS.faded} strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function AcceptIcon() {
    return (
        <svg width="14" height="14" fill="none" stroke="#FFFFFF" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function BookingCard({
    booking,
    personName,
    isDesktop,
    onClick,
    showPendingActions = false,
    onAccept,
    onDeclineStart,
    onDeclineCancel,
    onDeclineReasonChange,
    onConfirmDecline,
    decliningId,
    declineReason,
    actioningId,
}) {
    const theme = getStatusTheme(booking.status);
    const paymentTheme = getPaymentStatusTheme(booking.payment_status, booking.payment_type);
    const date = getDateBlock(booking.scheduled_at);
    const subtitle = [personName, formatBookingTime(booking.scheduled_at), formatBookingDuration(booking.duration)]
        .filter(Boolean)
        .join(' · ');
    const isDeclining = decliningId === booking.id;
    const isActioning = actioningId === booking.id;

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onClick?.(event);
                }
            }}
            style={{
                padding: isDesktop ? '20px 24px' : '18px 18px',
                background: BOOKING_TOKENS.card,
                border: `1px solid ${BOOKING_TOKENS.line}`,
                borderRadius: 16,
                marginBottom: 10,
                cursor: onClick ? 'pointer' : 'default',
                transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
            }}
            onMouseEnter={(event) => {
                event.currentTarget.style.borderColor = BOOKING_TOKENS.accent;
                event.currentTarget.style.boxShadow = '0 4px 20px rgba(194,94,74,0.06)';
                event.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(event) => {
                event.currentTarget.style.borderColor = BOOKING_TOKENS.line;
                event.currentTarget.style.boxShadow = 'none';
                event.currentTarget.style.transform = 'translateY(0)';
            }}
        >
            <div
                style={{
                    display: 'flex',
                    flexDirection: isDesktop ? 'row' : 'column',
                    alignItems: isDesktop ? 'center' : 'stretch',
                    gap: 16,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 0 }}>
                    <div
                        style={{
                            width: 52,
                            height: 56,
                            borderRadius: 14,
                            background: theme.dateBackground,
                            color: theme.dateColor,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}
                    >
                        <span
                            style={{
                                fontFamily: BODY_FONT,
                                fontSize: 11,
                                fontWeight: 500,
                                letterSpacing: '0.03em',
                                textTransform: 'uppercase',
                            }}
                        >
                            {date.day}
                        </span>
                        <span
                            style={{
                                fontFamily: BODY_FONT,
                                fontSize: 22,
                                fontWeight: 400,
                                letterSpacing: '-0.03em',
                            }}
                        >
                            {date.dayNumber}
                        </span>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                            style={{
                                margin: '0 0 2px',
                                fontFamily: BODY_FONT,
                                fontSize: 15,
                                fontWeight: 500,
                                color: BOOKING_TOKENS.ink,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}
                        >
                            {booking.service_name || 'Session'}
                        </p>
                        <p
                            style={{
                                margin: 0,
                                fontFamily: BODY_FONT,
                                fontSize: 13,
                                color: BOOKING_TOKENS.muted,
                                whiteSpace: isDesktop ? 'nowrap' : 'normal',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}
                        >
                            {subtitle}
                        </p>
                    </div>
                </div>

                {showPendingActions ? (
                    <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: isDesktop ? 'flex-end' : 'stretch' }}>
                            <button
                                type="button"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onAccept?.(booking);
                                }}
                                disabled={isActioning}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: 10,
                                    border: 'none',
                                    background: BOOKING_TOKENS.ink,
                                    color: '#FFFFFF',
                                    fontFamily: BODY_FONT,
                                    fontSize: 12,
                                    fontWeight: 500,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    opacity: isActioning ? 0.6 : 1,
                                }}
                            >
                                <AcceptIcon />
                                {isActioning ? 'Accepting' : 'Accept'}
                            </button>
                            <button
                                type="button"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    if (isDeclining) {
                                        onDeclineCancel?.();
                                    } else {
                                        onDeclineStart?.(booking.id);
                                    }
                                }}
                                disabled={isActioning}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: 10,
                                    border: `1px solid ${isDeclining ? BOOKING_TOKENS.danger : BOOKING_TOKENS.line}`,
                                    background: isDeclining ? BOOKING_TOKENS.dangerBg : 'transparent',
                                    color: isDeclining ? BOOKING_TOKENS.danger : BOOKING_TOKENS.muted,
                                    fontFamily: BODY_FONT,
                                    fontSize: 12,
                                    fontWeight: 500,
                                    opacity: isActioning ? 0.6 : 1,
                                }}
                            >
                                Decline
                            </button>
                        </div>

                        {isDeclining && (
                            <div
                                onClick={(event) => event.stopPropagation()}
                                style={{
                                    padding: 12,
                                    borderRadius: 12,
                                    border: `1px solid ${BOOKING_TOKENS.line}`,
                                    background: BOOKING_TOKENS.base,
                                    minWidth: isDesktop ? 280 : '100%',
                                }}
                            >
                                <p
                                    style={{
                                        margin: '0 0 8px',
                                        fontFamily: BODY_FONT,
                                        fontSize: 11,
                                        fontWeight: 600,
                                        letterSpacing: '0.05em',
                                        textTransform: 'uppercase',
                                        color: BOOKING_TOKENS.faded,
                                    }}
                                >
                                    Decline Reason
                                </p>
                                <textarea
                                    value={declineReason}
                                    onChange={(event) => onDeclineReasonChange?.(event.target.value)}
                                    placeholder="Optional reason"
                                    rows={2}
                                    style={{
                                        width: '100%',
                                        boxSizing: 'border-box',
                                        padding: '10px 12px',
                                        borderRadius: 10,
                                        border: `1px solid ${BOOKING_TOKENS.line}`,
                                        background: '#FFFFFF',
                                        fontFamily: BODY_FONT,
                                        fontSize: 12,
                                        color: BOOKING_TOKENS.ink,
                                        resize: 'vertical',
                                        outline: 'none',
                                        marginBottom: 8,
                                    }}
                                />
                                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                    <button
                                        type="button"
                                        onClick={onDeclineCancel}
                                        style={{
                                            padding: '8px 12px',
                                            borderRadius: 10,
                                            border: `1px solid ${BOOKING_TOKENS.line}`,
                                            background: 'transparent',
                                            fontFamily: BODY_FONT,
                                            fontSize: 12,
                                            fontWeight: 500,
                                            color: BOOKING_TOKENS.muted,
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onConfirmDecline?.(booking)}
                                        disabled={isActioning}
                                        style={{
                                            padding: '8px 12px',
                                            borderRadius: 10,
                                            border: 'none',
                                            background: BOOKING_TOKENS.danger,
                                            fontFamily: BODY_FONT,
                                            fontSize: 12,
                                            fontWeight: 500,
                                            color: '#FFFFFF',
                                            opacity: isActioning ? 0.6 : 1,
                                        }}
                                    >
                                        {isActioning ? 'Declining' : 'Confirm'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            justifyContent: isDesktop ? 'flex-end' : 'space-between',
                            width: isDesktop ? 'auto' : '100%',
                            flexShrink: 0,
                        }}
                    >
                        <span
                            style={{
                                fontFamily: BODY_FONT,
                                fontSize: 15,
                                fontWeight: 500,
                                color: BOOKING_TOKENS.accent,
                            }}
                        >
                            {formatBookingPrice(booking.price, booking.currency) || '—'}
                        </span>
                        {paymentTheme && (
                            <span
                                style={{
                                    padding: '4px 10px',
                                    borderRadius: 9999,
                                    background: paymentTheme.pillBackground,
                                    color: paymentTheme.pillColor,
                                    fontFamily: BODY_FONT,
                                    fontSize: 10,
                                    fontWeight: 600,
                                    letterSpacing: '0.03em',
                                    textTransform: 'uppercase',
                                }}
                            >
                                {paymentTheme.pillLabel}
                            </span>
                        )}
                        <span
                            style={{
                                padding: '4px 10px',
                                borderRadius: 9999,
                                background: theme.pillBackground,
                                color: theme.pillColor,
                                fontFamily: BODY_FONT,
                                fontSize: 10,
                                fontWeight: 600,
                                letterSpacing: '0.03em',
                                textTransform: 'uppercase',
                            }}
                        >
                            {theme.pillLabel}
                        </span>
                        <svg width="18" height="18" fill="none" stroke={BOOKING_TOKENS.faded} strokeWidth="1.5" viewBox="0 0 24 24">
                            <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                )}
            </div>
        </div>
    );
}
