/**
 * PublicBookingPage — /book/:handle
 *
 * Steps:
 *   1 — Provider profile + service selection
 *   2 — Date & time picker
 *   3 — Intake questions (skipped if none)
 *   3.5 — Auth gate (skipped if logged in)
 *   4 — Review & request
 *   5 — Confirmation (pending)
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import posthog from 'posthog-js';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSession } from '../auth/authContext';
import { supabase } from '../utils/supabase';
import { request } from '../data/apiClient';
import klogo from '../klogo.png';
import BookingPaymentForm from '../components/payment/BookingPaymentForm';
import { formatMoney } from '../utils/formatMoney';

// ─── Design tokens ─────────────────────────────────────────────────────────────
const T = {
    base: '#FBF7F2', ink: '#3D231E', muted: '#8C6A64', faded: '#B0948F',
    accent: '#C25E4A', hero: '#FDDCC6', abg: '#F2EBE5',
    line: 'rgba(140,106,100,0.18)', card: '#FFFFFF',
    success: '#5A8A5E', successBg: '#EBF2EC',
    danger: '#B04040', dangerBg: '#FDEDEA',
    callout: '#FFF5E6', calloutText: '#92400E',
};
const F = "'Sora',system-ui,sans-serif";
const APP_ORIGIN = process.env.REACT_APP_APP_URL || window.location.origin;

const TOPO_SVG = `url("data:image/svg+xml,%3Csvg width='400' height='400' viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 200 Q 100 100 200 200 T 400 200' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M-50 250 Q 50 150 150 250 T 350 250' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M50 150 Q 150 50 250 150 T 450 150' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3C/svg%3E")`;

// ─── Helpers ───────────────────────────────────────────────────────────────────
const initials = (n = '') => n.split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?';
const isValidEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

const fmtPrice = (cents, currency = 'cad') => (cents == null ? '' : formatMoney(cents, currency));
function fmtDuration(mins) {
    if (!mins) return '';
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60), m = mins % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
}
function fmtDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
function normalizeTimeValue(timeStr) {
    if (!timeStr) return '';
    const raw = String(timeStr).trim();
    const match = raw.match(/^(\d{1,2}):(\d{2})/);
    if (!match) return raw;
    const [, hours, minutes] = match;
    return `${hours.padStart(2, '0')}:${minutes}`;
}
function fmtTime(timeStr) {
    if (!timeStr) return '';
    const normalized = normalizeTimeValue(timeStr);
    const [h, m] = normalized.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return normalized;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getWeekDates(weekOffset) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7) + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d;
    });
}

function dateToStr(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isPerHourService(service) {
    return service?.metadata?.pricingType === 'per_hour' || service?.unit === 'hour';
}

function getServiceMinHours(service) {
    return Math.max(Number(service?.metadata?.minHours ?? 1) || 1, 1);
}

function getServiceMaxHours(service) {
    const minHours = getServiceMinHours(service);
    return Math.max(Number(service?.metadata?.maxHours ?? minHours) || minHours, minHours);
}

function getSelectedServiceHours(service, selectedHours) {
    if (!isPerHourService(service)) return null;
    return Math.min(
        Math.max(Number(selectedHours) || getServiceMinHours(service), getServiceMinHours(service)),
        getServiceMaxHours(service)
    );
}

function getSelectedServiceDuration(service, selectedHours) {
    if (!service) return 0;
    if (isPerHourService(service)) return getSelectedServiceHours(service, selectedHours) * 60;
    return Number(service?.duration) || 60;
}

function getSelectedServicePrice(service, selectedHours) {
    if (!service) return 0;
    const basePrice = Number(service?.base_price ?? 0) || 0;
    if (isPerHourService(service)) return basePrice * getSelectedServiceHours(service, selectedHours);
    return basePrice;
}

function fmtServiceDurationSummary(service, selectedHours = null) {
    if (!service) return '';
    if (isPerHourService(service)) {
        if (selectedHours) {
            return `${selectedHours} ${selectedHours === 1 ? 'hour' : 'hours'}`;
        }
        return `${getServiceMinHours(service)}–${getServiceMaxHours(service)} hours`;
    }
    return fmtDuration(service?.duration);
}

function fmtServicePriceSummary(service, selectedHours = null) {
    if (!service) return '';
    if (isPerHourService(service)) {
        return `${fmtPrice(service?.base_price, service?.currency)}/hr`;
    }
    return fmtPrice(getSelectedServicePrice(service, selectedHours), service?.currency);
}

// ─── Shared primitives ─────────────────────────────────────────────────────────
const Lbl = ({ children, style = {} }) => (
    <span style={{ fontFamily: F, fontSize: 11, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', color: T.muted, display: 'block', ...style }}>
        {children}
    </span>
);

const BtnPrimary = ({ onClick, disabled, children, style = {} }) => (
    <button type="button" onClick={onClick} disabled={disabled} style={{
        width: '100%', padding: 16, borderRadius: 12, border: 'none',
        background: disabled ? T.faded : T.ink, color: '#fff',
        fontFamily: F, fontSize: 14, fontWeight: 500,
        cursor: disabled ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        ...style,
    }}>
        {children}
    </button>
);

const BtnOutlined = ({ onClick, children, style = {} }) => (
    <button type="button" onClick={onClick} style={{
        width: '100%', padding: 14, borderRadius: 12,
        border: `1px solid ${T.line}`, background: 'transparent',
        fontFamily: F, fontSize: 13, fontWeight: 500, color: T.ink,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        cursor: 'pointer', ...style,
    }}>
        {children}
    </button>
);

const BackBtn = ({ onClick }) => (
    <button
        type="button"
        onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClick?.(e);
        }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}
    >
        <svg width="22" height="22" fill="none" stroke={T.ink} strokeWidth="2" viewBox="0 0 24 24">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    </button>
);

const HRule = () => <div style={{ height: 1, background: T.line, margin: '0' }} />;

function StepDots({ current, total }) {
    return (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', padding: '16px 0 8px' }}>
            {Array.from({ length: total }, (_, i) => (
                <div key={i} style={{
                    width: i + 1 === current ? 20 : 6, height: 6, borderRadius: 3,
                    background: i + 1 <= current ? T.accent : T.line,
                    transition: 'all .2s',
                }} />
            ))}
        </div>
    );
}

function ProviderAvatar({ provider, size = 72 }) {
    const src = provider?.avatar || provider?.photo;
    const name = provider?.business_name || provider?.name || '';
    if (src) return <img src={src} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />;
    return (
        <div style={{ width: size, height: size, borderRadius: '50%', background: 'rgba(255,255,255,0.6)', border: '2px solid rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F, fontSize: size * 0.28, fontWeight: 500, color: T.ink }}>
            {initials(name)}
        </div>
    );
}

function Spinner() {
    return <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite', display: 'inline-block', flexShrink: 0 }} />;
}

const inputStyle = {
    width: '100%', padding: '14px 16px', borderRadius: 12,
    border: `1px solid ${T.line}`, fontFamily: F, fontSize: 14,
    color: T.ink, outline: 'none', background: T.abg, boxSizing: 'border-box',
};

function PwField({ value, onChange, placeholder }) {
    const [show, setShow] = useState(false);
    return (
        <div style={{ position: 'relative' }}>
            <input type={show ? 'text' : 'password'} value={value} onChange={onChange} placeholder={placeholder} autoComplete="current-password" style={{ ...inputStyle, paddingRight: 44 }} />
            <button type="button" onClick={() => setShow(s => !s)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', padding: 4, background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                {show
                    ? <svg width="18" height="18" fill="none" stroke={T.faded} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" /></svg>
                    : <svg width="18" height="18" fill="none" stroke={T.faded} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                }
            </button>
        </div>
    );
}

const GoogleIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

// ─── Booking summary card ───────────────────────────────────────────────────────
function BookingSummaryCard({ service, date, time }) {
    return (
        <div style={{ background: T.abg, borderRadius: 14, padding: '16px 20px', marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <p style={{ fontFamily: F, fontSize: 15, fontWeight: 500, color: T.ink, margin: 0 }}>{service?.name}</p>
                <p style={{ fontFamily: F, fontSize: 15, fontWeight: 600, color: T.accent, margin: 0 }}>{fmtPrice(service?.base_price, service?.currency)}</p>
            </div>
            {(date || time) && (
                <p style={{ fontFamily: F, fontSize: 13, color: T.muted, margin: 0 }}>
                    {fmtDate(date)}{date && time ? ' · ' : ''}{fmtTime(time)}
                </p>
            )}
            {service?.duration && <p style={{ fontFamily: F, fontSize: 12, color: T.faded, margin: '4px 0 0' }}>{fmtDuration(service.duration)}</p>}
        </div>
    );
}

const StarIcon = ({ filled }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? T.accent : T.faded}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
);

function StarRow({ rating, max = 5 }) {
    return (
        <div style={{ display: 'flex', gap: 2, marginBottom: 8 }}>
            {Array.from({ length: max }, (_, i) => <StarIcon key={i} filled={i < rating} />)}
        </div>
    );
}

// ─── STEP 1: Provider Profile ───────────────────────────────────────────────────
function Step1Profile({ provider, services, groups, reviews, portfolio, selectedService, selectedHours, onSelectService, onContinue, onViewPhoto }) {
    const displayName = provider?.business_name || provider?.name || 'Provider';
    const category = provider?.category || (provider?.categories?.[0]) || '';
    const subtitle = [category, provider?.city].filter(Boolean).join(' · ');

    // Group services
    const grouped = [];
    const ungrouped = services.filter(s => !s.group_id);
    for (const g of (groups || [])) {
        const gServices = services.filter(s => s.group_id === g.id);
        if (gServices.length > 0) grouped.push({ group: g, services: gServices });
    }
    if (ungrouped.length > 0) grouped.push({ group: { id: 'general', name: 'Services' }, services: ungrouped });

    const noServices = services.length === 0;

    return (
        <div style={{ minHeight: '100dvh', background: T.base, fontFamily: F }}>
            <style>{`
                @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
                @keyframes spin{to{transform:rotate(360deg)}}
                .fade-1{animation:fadeUp .5s ease .05s both}
                .fade-2{animation:fadeUp .5s ease .15s both}
                .fade-3{animation:fadeUp .5s ease .25s both}
                .fade-4{animation:fadeUp .5s ease .35s both}
                .svc-card{transition:all .2s;position:relative;padding:18px 22px;background:#fff;border:1px solid rgba(140,106,100,0.18);border-radius:16px;margin-bottom:8px;cursor:pointer;text-align:left;width:100%}
                .svc-card:hover{border-color:#C25E4A;box-shadow:0 4px 16px rgba(194,94,74,0.06);transform:translateY(-1px)}
                .svc-card.selected{border:2px solid #C25E4A;background:rgba(194,94,74,0.02)}
                .svc-check{position:absolute;top:18px;right:22px;width:24px;height:24px;border-radius:50%;border:1.5px solid rgba(140,106,100,0.18);display:flex;align-items:center;justify-content:center;transition:all .15s;flex-shrink:0}
                .svc-card.selected .svc-check{background:#C25E4A;border-color:#C25E4A}
            `}</style>

            {/* Hero */}
            <div className="fade-1" style={{ maxWidth: 720, margin: '0 auto', padding: '28px 24px 0' }}>
                <div style={{ background: T.hero, borderRadius: 24, padding: '40px 36px 36px', position: 'relative', overflow: 'hidden', marginBottom: 28 }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: TOPO_SVG, backgroundSize: 'cover', opacity: 0.08, pointerEvents: 'none', borderRadius: 24 }} />
                    {/* Profile row */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, position: 'relative', zIndex: 1 }}>
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.5)', border: '3px solid rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                {(provider?.avatar || provider?.photo)
                                    ? <img src={provider.avatar || provider.photo} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                    : <span style={{ fontFamily: F, fontSize: 26, fontWeight: 500, color: T.muted }}>{initials(displayName)}</span>
                                }
                            </div>
                            <div style={{ position: 'absolute', bottom: 2, right: 2, width: 22, height: 22, borderRadius: '50%', background: T.success, border: `3px solid ${T.hero}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="10" height="10" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </div>
                        </div>
                        <div style={{ flex: 1, paddingTop: 4 }}>
                            <h1 style={{ fontFamily: F, fontSize: 26, fontWeight: 400, letterSpacing: '-0.03em', color: T.ink, margin: '0 0 4px', lineHeight: 1.2 }}>{displayName}</h1>
                            {subtitle && <p style={{ fontFamily: F, fontSize: 14, color: T.muted, margin: '0 0 14px' }}>{subtitle}</p>}
                            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                                {provider?.client_count > 0 && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: T.muted }}>
                                        <svg width="14" height="14" fill="none" stroke={T.muted} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        {provider.client_count} clients
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* Bio */}
                    {provider?.bio && (
                        <div style={{ position: 'relative', zIndex: 1, marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(61,35,30,0.08)' }}>
                            <p style={{ fontFamily: F, fontSize: 14, color: T.muted, lineHeight: 1.7, margin: 0 }}>{provider.bio}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Portfolio Gallery */}
            {portfolio?.length > 0 && (
                <div className="fade-2" style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px 24px' }}>
                    <span style={{ fontFamily: F, fontSize: 15, fontWeight: 500, color: T.ink, display: 'block', marginBottom: 12 }}>Portfolio</span>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                        {portfolio.map((item) => (
                            <div key={item.id} style={{ aspectRatio: '1', borderRadius: 12, overflow: 'hidden', background: T.abg }}>
                                <img
                                    src={item.url || item.media_url}
                                    alt={item.title || 'Portfolio'}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Services + Reviews */}
            <div className="content" style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px 120px' }}>
                {noServices ? (
                    <div className="fade-2" style={{ padding: '32px 0', textAlign: 'center' }}>
                        <p style={{ fontFamily: F, fontSize: 14, color: T.muted }}>{displayName} hasn't added any services yet.</p>
                    </div>
                ) : (
                    <div className="fade-2">
                        {grouped.map(({ group, services: gsvcs }) => (
                            <div key={group.id} style={{ marginBottom: 28 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                    <span style={{ fontFamily: F, fontSize: 15, fontWeight: 500, color: T.ink }}>{group.name}</span>
                                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: T.abg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 500, color: T.muted, fontFamily: F }}>{gsvcs.length}</div>
                                </div>
                                {gsvcs.map(svc => {
                                    const selected = selectedService?.id === svc.id;
                                    return (
                                        <button
                                            key={svc.id}
                                            onClick={() => onSelectService(selected ? null : svc)}
                                            className={`svc-card${selected ? ' selected' : ''}`}
                                        >
                                            {svc.image_url && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); onViewPhoto(svc.image_url); }}
                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 10, padding: '5px 12px', borderRadius: 20, border: '1px solid rgba(140,106,100,0.25)', background: T.abg, cursor: 'pointer', fontFamily: F, fontSize: 12, fontWeight: 500, color: T.muted }}
                                                >
                                                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 16l5-5 4 4 3-3 5 5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                                    View photo
                                                </button>
                                            )}
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, paddingRight: 32 }}>
                                                    <span style={{ fontFamily: F, fontSize: 15, fontWeight: 500, color: T.ink }}>{svc.name}</span>
                                                    {svc.base_price && <span style={{ fontFamily: F, fontSize: 16, fontWeight: 500, color: T.accent, flexShrink: 0, marginLeft: 16 }}>{fmtServicePriceSummary(svc, selected ? selectedHours : null)}</span>}
                                                </div>
                                                {(svc.duration || isPerHourService(svc)) && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                                                        <svg width="12" height="12" fill="none" stroke={T.muted} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 6v6l4 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                        <span style={{ fontFamily: F, fontSize: 12, color: T.muted }}>{fmtServiceDurationSummary(svc, selected ? selectedHours : null)}</span>
                                                    </div>
                                                )}
                                                {svc.description && <p style={{ fontFamily: F, fontSize: 13, color: T.faded, lineHeight: 1.5, margin: 0 }}>{svc.description}</p>}
                                            </div>
                                            <div className="svc-check">
                                                <svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                )}

                {/* Reviews */}
                {reviews?.length > 0 && (
                    <div className="fade-3" style={{ marginTop: 32 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                            <span style={{ fontFamily: F, fontSize: 15, fontWeight: 500, color: T.ink }}>Reviews</span>
                            {provider?.review_count > reviews.length && (
                                <span style={{ fontFamily: F, fontSize: 13, color: T.accent, fontWeight: 500 }}>See all {provider.review_count}</span>
                            )}
                        </div>
                        {reviews.slice(0, 3).map(r => {
                            const name = r.client_name || 'Client';
                            const reviewInitials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
                            const dateStr = r.created_at ? new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
                            return (
                                <div key={r.id} style={{ padding: '18px 22px', background: T.card, border: `1px solid ${T.line}`, borderRadius: 16, marginBottom: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: T.abg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 500, color: T.muted, fontFamily: F, flexShrink: 0 }}>{reviewInitials}</div>
                                        <span style={{ fontFamily: F, fontSize: 13, fontWeight: 500, color: T.ink, flex: 1 }}>{name}</span>
                                        {dateStr && <span style={{ fontFamily: F, fontSize: 11, color: T.faded }}>{dateStr}</span>}
                                    </div>
                                    <StarRow rating={r.rating} />
                                    {r.comment && <p style={{ fontFamily: F, fontSize: 13, color: T.muted, lineHeight: 1.6, margin: 0 }}>{r.comment}</p>}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Powered by */}
                <div
                    className="fade-4"
                    style={{
                        padding: '36px 0 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 10,
                    }}
                >
                    <span style={{ fontFamily: F, fontSize: 15, fontWeight: 500, color: T.faded, lineHeight: 1 }}>Powered by</span>
                    <img
                        src={klogo}
                        alt="kliques"
                        style={{ height: 'clamp(36px, 5vw, 52px)', width: 'auto', display: 'block' }}
                    />
                </div>
            </div>

            {/* Sticky CTA */}
            {!noServices && (
                <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px 24px 24px', background: `linear-gradient(transparent, ${T.base} 20%)`, zIndex: 10 }}>
                    <div style={{ maxWidth: 672, margin: '0 auto' }}>
                        <BtnPrimary onClick={onContinue} disabled={!selectedService} style={{ padding: 18, borderRadius: 14, fontSize: 15 }}>
                            {selectedService ? `Continue with ${selectedService.name} · ${fmtServicePriceSummary(selectedService, selectedHours)}` : 'Select a service to continue'}
                        </BtnPrimary>
                    </div>
                </div>
            )}
        </div>
    );
}

// Shared layout wrapper for steps 2–5
const StepWrap = ({ children, padBottom = 120 }) => (
    <div style={{ minHeight: '100dvh', background: T.base, fontFamily: F }}>
        <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}} @keyframes spin{to{transform:rotate(360deg)}} .step-fade{animation:fadeUp .35s ease both}`}</style>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: `0 0 ${padBottom}px` }}>{children}</div>
    </div>
);

const StepHeader = ({ onBack, current, total }) => (
    <div style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <BackBtn onClick={onBack} />
        <StepDots current={current} total={total} />
    </div>
);

const StepTitle = ({ title, sub }) => (
    <div style={{ padding: '12px 24px 24px' }}>
        <h1 style={{ fontFamily: F, fontSize: 26, fontWeight: 600, letterSpacing: '-0.03em', margin: '0 0 6px', color: T.ink }}>{title}</h1>
        {sub && <p style={{ fontFamily: F, fontSize: 14, color: T.muted, margin: 0 }}>{sub}</p>}
    </div>
);

const StickyFooter = ({ children }) => (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px 24px 28px', background: `linear-gradient(transparent, ${T.base} 20%)`, zIndex: 10 }}>
        <div style={{ maxWidth: 512, margin: '0 auto' }}>{children}</div>
    </div>
);

// ─── STEP 2: Date & Time ────────────────────────────────────────────────────────
function Step2DateTime({ provider, service, selectedDate, selectedTime, selectedHours, onHoursChange, onDateSelect, onTimeSelect, onBack, onContinue }) {
    const [weekOffset, setWeekOffset] = useState(0);
    const [slots, setSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [noSlots, setNoSlots] = useState(false);

    const bookingWindow = provider?.booking_window_weeks || 8;
    const maxWeekOffset = Math.ceil(bookingWindow);
    const weekDates = getWeekDates(weekOffset);
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const weekLabel = (() => {
        const first = weekDates[0], last = weekDates[6];
        if (first.getMonth() === last.getMonth())
            return `${MONTH_ABBR[first.getMonth()]} ${first.getDate()} – ${last.getDate()}, ${last.getFullYear()}`;
        return `${MONTH_ABBR[first.getMonth()]} ${first.getDate()} – ${MONTH_ABBR[last.getMonth()]} ${last.getDate()}, ${last.getFullYear()}`;
    })();

    useEffect(() => {
        if (!selectedDate || !provider?.id) return;
        setLoadingSlots(true); setNoSlots(false);
        request(`/public/provider/${provider.id}/slots?date=${selectedDate}&duration=${getSelectedServiceDuration(service, selectedHours) || 60}&buffer=${provider.buffer_minutes || 0}`)
            .then(data => {
                const normalizedSlots = (data.slots || []).map(normalizeTimeValue);
                setSlots(normalizedSlots);
                setNoSlots(!normalizedSlots.length);
            })
            .catch(() => { setSlots([]); setNoSlots(true); })
            .finally(() => setLoadingSlots(false));
    }, [selectedDate, provider?.id, service, selectedHours]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleWeekChange = (dir) => { setWeekOffset(o => o + dir); onDateSelect(null); onTimeSelect(null); setSlots([]); };
    const displayName = provider?.business_name || provider?.name || 'Provider';

    return (
        <StepWrap>
            <StepHeader onBack={onBack} current={2} total={5} />
            <StepTitle title="Pick a date & time" sub="Choose when you'd like your session" />
            <div style={{ padding: '0 24px' }} className="step-fade">
                {/* Booking window note */}
                <div style={{ background: T.abg, borderRadius: 12, padding: '10px 16px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="14" height="14" fill="none" stroke={T.muted} strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" strokeLinecap="round" /></svg>
                    <p style={{ fontFamily: F, fontSize: 12, color: T.muted, margin: 0 }}>
                        {displayName} accepts bookings up to <strong>{bookingWindow} weeks</strong> ahead
                    </p>
                </div>

                {isPerHourService(service) && (
                    <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 16, padding: '18px 20px', marginBottom: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <span style={{ fontFamily: F, fontSize: 14, fontWeight: 500, color: T.ink }}>How many hours?</span>
                            <span style={{ fontFamily: F, fontSize: 13, color: T.muted }}>{fmtServicePriceSummary(service, selectedHours)}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <button
                                type="button"
                                onClick={() => onHoursChange(Math.max(getServiceMinHours(service), selectedHours - 1))}
                                disabled={selectedHours <= getServiceMinHours(service)}
                                style={{ width: 42, height: 42, borderRadius: '50%', border: 'none', background: selectedHours <= getServiceMinHours(service) ? T.abg : T.ink, cursor: selectedHours <= getServiceMinHours(service) ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <svg width="16" height="16" fill="none" stroke={selectedHours <= getServiceMinHours(service) ? T.faded : '#fff'} strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14" strokeLinecap="round" /></svg>
                            </button>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontFamily: F, fontSize: 30, fontWeight: 600, color: T.ink, lineHeight: 1 }}>{selectedHours}</div>
                                <div style={{ fontFamily: F, fontSize: 12, color: T.muted }}>{selectedHours === 1 ? 'hour' : 'hours'}</div>
                                <div style={{ fontFamily: F, fontSize: 12, color: T.accent, marginTop: 4 }}>{fmtPrice(getSelectedServicePrice(service, selectedHours), service?.currency)} total</div>
                            </div>
                            <button
                                type="button"
                                onClick={() => onHoursChange(Math.min(getServiceMaxHours(service), selectedHours + 1))}
                                disabled={selectedHours >= getServiceMaxHours(service)}
                                style={{ width: 42, height: 42, borderRadius: '50%', border: 'none', background: selectedHours >= getServiceMaxHours(service) ? T.abg : T.ink, cursor: selectedHours >= getServiceMaxHours(service) ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <svg width="16" height="16" fill="none" stroke={selectedHours >= getServiceMaxHours(service) ? T.faded : '#fff'} strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
                            </button>
                        </div>
                        <p style={{ fontFamily: F, fontSize: 12, color: T.faded, margin: '12px 0 0' }}>
                            Book between {getServiceMinHours(service)} and {getServiceMaxHours(service)} hours.
                        </p>
                    </div>
                )}

                {/* Week navigation */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <button onClick={() => handleWeekChange(-1)} disabled={weekOffset === 0} style={{ background: 'none', border: 'none', cursor: weekOffset === 0 ? 'default' : 'pointer', padding: 8, opacity: weekOffset === 0 ? 0.25 : 1, display: 'flex' }}>
                        <svg width="20" height="20" fill="none" stroke={T.ink} strokeWidth="2" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                    <span style={{ fontFamily: F, fontSize: 13, fontWeight: 500, color: T.ink }}>{weekLabel}</span>
                    <button onClick={() => handleWeekChange(1)} disabled={weekOffset >= maxWeekOffset} style={{ background: 'none', border: 'none', cursor: weekOffset >= maxWeekOffset ? 'default' : 'pointer', padding: 8, opacity: weekOffset >= maxWeekOffset ? 0.25 : 1, display: 'flex' }}>
                        <svg width="20" height="20" fill="none" stroke={T.ink} strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                </div>

                {/* Date pills */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 28 }}>
                    {weekDates.map(d => {
                        const isPast = d < today, ds = dateToStr(d), isSel = selectedDate === ds;
                        return (
                            <button key={ds} onClick={() => { if (!isPast) { onDateSelect(ds); onTimeSelect(null); } }} disabled={isPast}
                                style={{ padding: '10px 4px', borderRadius: 12, border: `1px solid ${isSel ? T.accent : T.line}`, background: isSel ? T.hero : T.card, cursor: isPast ? 'default' : 'pointer', opacity: isPast ? 0.3 : 1, fontFamily: F, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, transition: 'all .15s' }}>
                                <span style={{ fontSize: 10, color: isSel ? T.accent : T.muted, fontWeight: 500 }}>{DAY_ABBR[d.getDay()]}</span>
                                <span style={{ fontSize: 15, fontWeight: isSel ? 600 : 400, color: isSel ? T.accent : T.ink }}>{d.getDate()}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Time slots */}
                {selectedDate && (
                    <>
                        <Lbl style={{ marginBottom: 12 }}>Available times</Lbl>
                        {loadingSlots ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
                                <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${T.hero}`, borderTopColor: T.accent, animation: 'spin 0.8s linear infinite' }} />
                            </div>
                        ) : noSlots ? (
                            <div style={{ padding: '20px', background: T.abg, borderRadius: 14, textAlign: 'center' }}>
                                <p style={{ fontFamily: F, fontSize: 13, color: T.muted, margin: 0 }}>No available times on this date. Try another day.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                                {slots.map(slot => {
                                    const isSel = selectedTime === slot;
                                    return (
                                        <button key={slot} onClick={() => onTimeSelect(slot)}
                                            style={{ padding: '13px 8px', borderRadius: 12, border: `1px solid ${isSel ? T.accent : T.line}`, background: isSel ? T.hero : T.card, fontFamily: F, fontSize: 13, fontWeight: isSel ? 600 : 400, color: isSel ? T.accent : T.ink, cursor: 'pointer', transition: 'all .15s' }}>
                                            {fmtTime(slot)}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>
            <StickyFooter>
                <BtnPrimary onClick={onContinue} disabled={!selectedDate || !selectedTime} style={{ padding: 18, borderRadius: 14, fontSize: 15 }}>
                    {selectedDate && selectedTime ? `Continue — ${fmtDate(selectedDate)} at ${fmtTime(selectedTime)}` : 'Select a date & time'}
                </BtnPrimary>
            </StickyFooter>
        </StepWrap>
    );
}

// ─── STEP 3: Intake Questions ───────────────────────────────────────────────────
function Step3Intake({ service, provider, answers, onAnswersChange, onBack, onContinue, onSkip }) {
    const [questions, setQuestions] = useState([]);
    const [loaded, setLoaded] = useState(false);
    const [freeform, setFreeform] = useState('');
    const displayName = provider?.business_name || provider?.name || 'Provider';

    useEffect(() => {
        if (!service?.id) { setLoaded(true); return; }
        request(`/services/${service.id}/intake`)
            .then(data => { setQuestions(data.questions || []); setLoaded(true); })
            .catch(() => setLoaded(true));
    }, [service?.id]);

    const toggleOption = (questionId, optionText) => {
        const current = answers[questionId] || [];
        onAnswersChange({ ...answers, [questionId]: current.includes(optionText) ? current.filter(o => o !== optionText) : [...current, optionText] });
    };

    if (!loaded) return (
        <div style={{ minHeight: '100dvh', background: T.base, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: `2px solid ${T.hero}`, borderTopColor: T.accent, animation: 'spin 0.8s linear infinite' }} />
        </div>
    );

    if (questions.length === 0) { onContinue({ freeform: '' }); return null; }

    return (
        <StepWrap>
            <StepHeader onBack={onBack} current={3} total={5} />
            <StepTitle title="A few questions" sub={`Help ${displayName} prepare for your session`} />
            <div style={{ padding: '0 24px' }} className="step-fade">
                {questions.map(q => (
                    <div key={q.id} style={{ marginBottom: 28, padding: '20px 22px', background: T.card, border: `1px solid ${T.line}`, borderRadius: 16 }}>
                        <p style={{ fontFamily: F, fontSize: 15, fontWeight: 500, color: T.ink, margin: '0 0 14px' }}>{q.question_text}</p>
                        {q.options?.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {q.options.map(opt => {
                                    const sel = (answers[q.id] || []).includes(opt.option_text);
                                    return (
                                        <button key={opt.id}
                                            onClick={() => {
                                                // Single-select: pick one, tap again to deselect
                                                const current = answers[q.id]?.[0];
                                                onAnswersChange({
                                                    ...answers,
                                                    [q.id]: current === opt.option_text ? [] : [opt.option_text],
                                                });
                                            }}
                                            style={{ padding: '10px 16px', borderRadius: 20, border: `1px solid ${sel ? T.accent : T.line}`, background: sel ? T.hero : 'transparent', fontFamily: F, fontSize: 13, fontWeight: sel ? 600 : 400, color: sel ? T.accent : T.ink, cursor: 'pointer', transition: 'all .15s' }}>
                                            {opt.option_text}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <textarea value={answers[q.id]?.[0] || ''} onChange={e => onAnswersChange({ ...answers, [q.id]: [e.target.value] })} placeholder="Your answer…" rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                        )}
                    </div>
                ))}

                {/* Freeform */}
                <div style={{ padding: '20px 22px', background: T.card, border: `1px solid ${T.line}`, borderRadius: 16, marginBottom: 8 }}>
                    <p style={{ fontFamily: F, fontSize: 15, fontWeight: 500, color: T.ink, margin: '0 0 12px' }}>Anything else you'd like to share?</p>
                    <textarea value={freeform} onChange={e => e.target.value.length <= 500 && setFreeform(e.target.value)} placeholder="Optional notes for your provider…" rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
                    <p style={{ fontFamily: F, fontSize: 11, color: T.faded, textAlign: 'right', margin: '4px 0 0' }}>{freeform.length}/500</p>
                </div>
            </div>
            <StickyFooter>
                <BtnPrimary onClick={() => onContinue({ freeform })} style={{ padding: 18, borderRadius: 14, fontSize: 15 }}>Continue</BtnPrimary>
                <button onClick={() => onSkip()} style={{ width: '100%', padding: '12px', fontFamily: F, fontSize: 13, color: T.muted, background: 'none', border: 'none', cursor: 'pointer', marginTop: 4 }}>Skip</button>
            </StickyFooter>
        </StepWrap>
    );
}

// ─── STEP 3.5: Auth Gate ────────────────────────────────────────────────────────
function Step35Auth({ provider, service, selectedDate, selectedTime, selectedHours, onAuth, onBack }) {
    const [mode, setMode] = useState('signup');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const { loginWithGoogle } = useSession();
    const displayName = provider?.business_name || provider?.name || 'Provider';

    const handleSubmit = async () => {
        setError(null);
        if (!isValidEmail(email.trim())) { setError('Please enter a valid email.'); return; }
        if (!password || password.length < 8) { setError('Password must be at least 8 characters.'); return; }
        if (mode === 'signup' && !name.trim()) { setError('Please enter your full name.'); return; }
        setSubmitting(true);
        try {
            if (mode === 'signup') {
                const { error: err } = await supabase.auth.signUp({
                    email: email.trim(),
                    password,
                    options: {
                        data: { role: 'client', full_name: name.trim() },
                        emailRedirectTo: `${APP_ORIGIN}/auth/callback?signup_role=client&signup_name=${encodeURIComponent(name.trim())}`,
                    },
                });
                if (err) throw err;
                window.localStorage.setItem('proxey.pending_role', 'client');
                window.localStorage.setItem('proxey.pendingName', name.trim());
            } else {
                const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
                if (err) throw err;
            }
            onAuth();
        } catch (err) { setError(err.message || 'Something went wrong.'); }
        finally { setSubmitting(false); }
    };

    return (
        <StepWrap>
            <StepHeader onBack={onBack} current={4} total={5} />
            <StepTitle
                title={mode === 'signup' ? 'Almost there' : 'Sign in to book'}
                sub={mode === 'signup' ? 'Create an account to complete your booking' : `Sign in to complete your booking with ${displayName}`}
            />
            <div style={{ padding: '0 24px' }} className="step-fade">
                {/* Booking summary */}
                <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 16, padding: '18px 22px', marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <p style={{ fontFamily: F, fontSize: 15, fontWeight: 500, color: T.ink, margin: 0 }}>{service?.name}</p>
                        <p style={{ fontFamily: F, fontSize: 15, fontWeight: 600, color: T.accent, margin: 0 }}>{isPerHourService(service) ? `${fmtPrice(getSelectedServicePrice(service, selectedHours), service?.currency)} total` : fmtPrice(service?.base_price, service?.currency)}</p>
                    </div>
                    <p style={{ fontFamily: F, fontSize: 13, color: T.muted, margin: 0 }}>{fmtDate(selectedDate)}{selectedDate && selectedTime ? ' · ' : ''}{fmtTime(selectedTime)}</p>
                    {(service?.duration || isPerHourService(service)) && <p style={{ fontFamily: F, fontSize: 12, color: T.faded, margin: '4px 0 0' }}>{fmtServiceDurationSummary(service, selectedHours)}</p>}
                </div>

                {mode === 'signup' && (
                    <div style={{ marginBottom: 14 }}>
                        <Lbl style={{ marginBottom: 8 }}>Full Name</Lbl>
                        <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={inputStyle} />
                    </div>
                )}
                <div style={{ marginBottom: 14 }}>
                    <Lbl style={{ marginBottom: 8 }}>Email</Lbl>
                    <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" type="email" autoComplete="email" style={inputStyle} />
                </div>
                <div style={{ marginBottom: mode === 'signup' ? 6 : 20 }}>
                    <Lbl style={{ marginBottom: 8 }}>Password</Lbl>
                    <PwField value={password} onChange={e => setPassword(e.target.value)} placeholder={mode === 'signup' ? 'Create a password (8+ chars)' : 'Enter your password'} />
                </div>

                {error && <p style={{ fontFamily: F, fontSize: 12, color: T.danger, margin: '0 0 12px' }}>{error}</p>}

                <BtnPrimary onClick={handleSubmit} disabled={submitting} style={{ padding: 18, borderRadius: 14, fontSize: 15 }}>
                    {submitting && <Spinner />}
                    {submitting ? 'Please wait…' : mode === 'signup' ? 'Create Account & Continue' : 'Sign In & Continue'}
                </BtnPrimary>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
                    <div style={{ flex: 1, height: 1, background: T.line }} />
                    <span style={{ fontFamily: F, fontSize: 11, color: T.faded, letterSpacing: '0.05em', textTransform: 'uppercase' }}>or</span>
                    <div style={{ flex: 1, height: 1, background: T.line }} />
                </div>
                <BtnOutlined onClick={() => loginWithGoogle('client', mode === 'signup' ? name : '', mode === 'signup').catch(() => {})} style={{ padding: 16, borderRadius: 14 }}>
                    <GoogleIcon /> Continue with Google
                </BtnOutlined>

                <div style={{ textAlign: 'center', marginTop: 20 }}>
                    <button onClick={() => setMode(m => m === 'signup' ? 'login' : 'signup')} style={{ fontFamily: F, fontSize: 13, color: T.muted, background: 'none', border: 'none', cursor: 'pointer' }}>
                        {mode === 'signup'
                            ? <>Already have an account? <span style={{ color: T.accent, fontWeight: 500 }}>Sign in</span></>
                            : <>Don't have an account? <span style={{ color: T.accent, fontWeight: 500 }}>Sign up</span></>}
                    </button>
                </div>
            </div>
        </StepWrap>
    );
}

// ─── STEP 4: Review & Request ───────────────────────────────────────────────────
function Step4Review({ provider, service, selectedDate, selectedTime, selectedHours, onBack, onSubmit, submitting }) {
    const displayName = provider?.business_name || provider?.name || 'Provider';
    const category = provider?.category || (provider?.categories?.[0]) || '';
    const paymentType = service?.payment_type;
    const hasPayment = paymentType && paymentType !== 'none';

    const paymentLabel = hasPayment
        ? { save_card: 'Card on file required', deposit: 'Deposit required', full: 'Full payment required' }[paymentType] || ''
        : null;
    const btnLabel = hasPayment ? 'Continue to Payment →' : 'Request Booking';

    const rows = [
        { label: 'Service', value: service?.name },
        { label: 'Duration', value: fmtServiceDurationSummary(service, selectedHours) },
        { label: 'Date', value: fmtDate(selectedDate) },
        { label: 'Time', value: fmtTime(selectedTime) },
    ].filter(r => r.value);

    return (
        <StepWrap>
            <StepHeader onBack={onBack} current={4} total={5} />
            <StepTitle title="Review your booking" sub="Confirm the details before requesting" />
            <div style={{ padding: '0 24px' }} className="step-fade">
                {/* Provider row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 22px', background: T.card, border: `1px solid ${T.line}`, borderRadius: 16, marginBottom: 12 }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: T.abg, border: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                        {(provider?.avatar || provider?.photo)
                            ? <img src={provider.avatar || provider.photo} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <span style={{ fontFamily: F, fontSize: 16, fontWeight: 500, color: T.muted }}>{initials(displayName)}</span>
                        }
                    </div>
                    <div>
                        <p style={{ fontFamily: F, fontSize: 15, fontWeight: 500, color: T.ink, margin: '0 0 2px' }}>{displayName}</p>
                        {category && <p style={{ fontFamily: F, fontSize: 13, color: T.muted, margin: 0 }}>{category}</p>}
                    </div>
                </div>

                {/* Detail card */}
                <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}>
                    {rows.map((r, i) => (
                        <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 22px', borderBottom: i < rows.length - 1 ? `1px solid ${T.line}` : 'none' }}>
                            <span style={{ fontFamily: F, fontSize: 14, color: T.muted }}>{r.label}</span>
                            <span style={{ fontFamily: F, fontSize: 14, fontWeight: 500, color: T.ink }}>{r.value}</span>
                        </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 22px', borderTop: `1px solid ${T.line}`, background: T.abg }}>
                        <span style={{ fontFamily: F, fontSize: 14, color: T.muted }}>Total</span>
                        <span style={{ fontFamily: F, fontSize: 20, fontWeight: 600, color: T.accent }}>{fmtPrice(getSelectedServicePrice(service, selectedHours), service?.currency)}</span>
                    </div>
                </div>

                {/* Callout */}
                <div style={{ background: T.callout, borderRadius: 14, padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: hasPayment ? 10 : 0 }}>
                    <svg width="18" height="18" fill="none" stroke={T.calloutText} strokeWidth="1.5" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 1 }}>
                        <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" strokeLinecap="round" />
                    </svg>
                    <p style={{ fontFamily: F, fontSize: 13, color: T.calloutText, margin: 0, lineHeight: 1.6 }}>
                        This is a booking request. <strong>{displayName}</strong> will review and confirm it. You'll be notified once it's accepted.
                    </p>
                </div>
                {/* Payment type notice */}
                {hasPayment && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: T.abg, borderRadius: 12 }}>
                        <svg width="14" height="14" fill="none" stroke={T.muted} strokeWidth="1.5" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" /><path d="M1 10h22" /></svg>
                        <span style={{ fontFamily: F, fontSize: 13, color: T.muted }}>{paymentLabel}</span>
                    </div>
                )}
            </div>
            <StickyFooter>
                <BtnPrimary onClick={onSubmit} disabled={submitting} style={{ padding: 18, borderRadius: 14, fontSize: 15 }}>
                    {submitting && <Spinner />}
                    {submitting ? 'Sending request…' : btnLabel}
                </BtnPrimary>
            </StickyFooter>
        </StepWrap>
    );
}

// ─── STEP 5: Confirmation ───────────────────────────────────────────────────────
function Step5Confirm({ provider, service, selectedDate, selectedTime, selectedHours, handle }) {
    const navigate = useNavigate();
    const displayName = provider?.business_name || provider?.name || 'Provider';

    return (
        <div style={{ minHeight: '100dvh', background: T.base, fontFamily: F }}>
            <div style={{ maxWidth: 560, margin: '0 auto', padding: '24px 24px 60px' }}>
                <StepDots current={5} total={5} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingTop: 16, marginBottom: 32 }}>
                    <div style={{ width: 72, height: 72, borderRadius: 20, background: T.callout, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                        <svg width="32" height="32" fill="none" stroke={T.calloutText} strokeWidth="1.5" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <h1 style={{ fontFamily: F, fontSize: 26, fontWeight: 600, letterSpacing: '-0.03em', margin: '0 0 8px' }}>Request sent!</h1>
                    <p style={{ fontFamily: F, fontSize: 15, color: T.muted, margin: '0 0 4px', lineHeight: 1.6 }}>
                        Your booking request has been sent to {displayName}.
                    </p>
                    <p style={{ fontFamily: F, fontSize: 14, color: T.muted, margin: 0, lineHeight: 1.6 }}>
                        {displayName} will review it and you'll get a notification once it's confirmed.
                    </p>
                </div>

                {/* Booking summary */}
                <div style={{ background: T.abg, borderRadius: 16, padding: '20px', marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div>
                            <p style={{ fontFamily: F, fontSize: 15, fontWeight: 500, color: T.ink, margin: '0 0 4px' }}>{service?.name}</p>
                            <p style={{ fontFamily: F, fontSize: 13, color: T.muted, margin: '0 0 2px' }}>{fmtDate(selectedDate)} · {fmtTime(selectedTime)}</p>
                            {(service?.duration || isPerHourService(service)) && <p style={{ fontFamily: F, fontSize: 12, color: T.faded, margin: 0 }}>{fmtServiceDurationSummary(service, selectedHours)}</p>}
                        </div>
                        <p style={{ fontFamily: F, fontSize: 16, fontWeight: 600, color: T.accent, margin: 0 }}>{fmtPrice(getSelectedServicePrice(service, selectedHours), service?.currency)}</p>
                    </div>
                    <HRule />
                    <div style={{ paddingTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: T.callout, borderRadius: 20 }}>
                        <svg width="12" height="12" fill="none" stroke={T.calloutText} strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        <span style={{ fontFamily: F, fontSize: 12, fontWeight: 500, color: T.calloutText }}>Pending confirmation</span>
                    </div>
                </div>

                {/* No payment note */}
                <div style={{ background: T.successBg, borderRadius: 12, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'center', marginBottom: 28 }}>
                    <svg width="16" height="16" fill="none" stroke={T.success} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <p style={{ fontFamily: F, fontSize: 13, color: T.success, margin: 0 }}>No payment required until {displayName} confirms.</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <BtnPrimary onClick={() => navigate('/app/bookings')}>Go to My Bookings</BtnPrimary>
                    <BtnOutlined onClick={() => navigate(`/book/${handle}`)}>Back to {displayName}'s Profile</BtnOutlined>
                </div>
            </div>
        </div>
    );
}

// ─── STEP 45: Payment ───────────────────────────────────────────────────────────

function Step45Payment({ service, provider, session, onSuccess, onBack, bookingError }) {
    return (
        <StepWrap>
            <StepHeader onBack={onBack} current={5} total={5} />
            <StepTitle
                title={{ save_card: 'Save your card', deposit: 'Pay deposit', full: 'Pay in full' }[service?.payment_type || 'full']}
                sub={{ save_card: 'Your card is saved securely. No charge is made now.', deposit: 'The remaining balance is due after your session.', full: 'Your card will be charged now to secure the booking.' }[service?.payment_type || 'full']}
            />
            <div style={{ padding: '0 24px 100px' }} className="step-fade">
                {bookingError && (
                    <div style={{ marginBottom: 16, padding: '14px 18px', borderRadius: 12, background: T.dangerBg, fontFamily: F, fontSize: 13, color: T.danger }}>
                        {bookingError}
                    </div>
                )}
                <BookingPaymentForm
                    service={service}
                    provider={provider}
                    session={session}
                    onSuccess={onSuccess}
                    onError={() => {}}
                    key={bookingError || 'form'}
                />
            </div>
        </StepWrap>
    );
}

// ─── Loading / Error screens ────────────────────────────────────────────────────
function ScreenLoading() {
    return (
        <div style={{ minHeight: '100dvh', background: T.base, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F }}>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <div style={{ textAlign: 'center' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', border: `2px solid ${T.hero}`, borderTopColor: T.accent, animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                <span style={{ fontSize: 14, color: T.muted }}>Loading…</span>
            </div>
        </div>
    );
}

function ScreenError({ message }) {
    const navigate = useNavigate();
    return (
        <div style={{ minHeight: '100dvh', background: T.base, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: F, textAlign: 'center' }}>
            <p style={{ fontSize: 22, fontWeight: 400, margin: '0 0 8px', color: T.ink }}>Something went wrong</p>
            <p style={{ fontSize: 14, color: T.muted, margin: '0 0 28px' }}>{message || 'This provider could not be found.'}</p>
            <button onClick={() => navigate('/')} style={{ padding: '14px 32px', borderRadius: 12, border: 'none', background: T.ink, color: '#fff', fontFamily: F, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>Go home</button>
        </div>
    );
}

// ─── Main page ──────────────────────────────────────────────────────────────────
export default function PublicBookingPage() {
    const { handle } = useParams();
    const [searchParams] = useSearchParams();
    const { session, loading: authLoading } = useSession();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [loadingProvider, setLoadingProvider] = useState(true);
    const [error, setError] = useState(null);

    // Data
    const [provider, setProvider] = useState(null);
    const [services, setServices] = useState([]);
    const [groups, setGroups] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [portfolio, setPortfolio] = useState([]);

    // Selections
    const [selectedService, setSelectedService] = useState(null);
    const [selectedHours, setSelectedHours] = useState(1);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);
    const [intakeAnswers, setIntakeAnswers] = useState({});
    const [intakeFreeform, setIntakeFreeform] = useState('');
    const [hasIntake, setHasIntake] = useState(false);
    const [lightboxImg, setLightboxImg] = useState(null);

    // Intercept browser back button and map to in-app step navigation
    useEffect(() => {
        window.history.pushState({ step }, '', window.location.href);
        const handlePopState = (e) => {
            // Always push a new state so the back button stays interceptable
            window.history.pushState({ step }, '', window.location.href);
            // Map current step to its previous step
            if (step === 45) setStep(4);
            else if (step === 4) setStep(session ? (hasIntake ? 3 : 2) : 35);
            else if (step === 35) setStep(hasIntake ? 3 : 2);
            else if (step === 3) setStep(2);
            else if (step === 2) setStep(1);
            else if (step === 1) navigate(-1); // leave the page
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [step, session, hasIntake, navigate]);

    // Submission
    const [submitting, setSubmitting] = useState(false);
    const [bookingId, setBookingId] = useState(null);
    const [paymentData, setPaymentData] = useState(null);
    const preselectedServiceAppliedRef = useRef(false);
    const bookingStartedTrackedRef = useRef(false);

    // Load provider
    useEffect(() => {
        if (!handle) { setError('No provider handle.'); setLoadingProvider(false); return; }
        request(`/provider/public/${handle}`)
            .then(data => {
                if (!data.provider) { setError('Provider not found.'); return; }
                setProvider(data.provider);
                setServices(data.services || []);
                setGroups(data.groups || []);
                setReviews(data.reviews || []);
                setPortfolio(data.portfolio || []);
            })
            .catch(() => setError('Failed to load provider.'))
            .finally(() => setLoadingProvider(false));
    }, [handle]);

    // Handle invite param
    useEffect(() => {
        const inviteCode = searchParams.get('invite');
        if (inviteCode) sessionStorage.setItem('kliques.pending_invite_code', inviteCode);
    }, [searchParams]);

    useEffect(() => {
        const serviceId = searchParams.get('service');
        if (
            preselectedServiceAppliedRef.current ||
            step !== 1 ||
            !serviceId ||
            services.length === 0
        ) {
            return;
        }

        const matchedService = services.find((svc) => svc.id === serviceId);
        if (!matchedService) return;

        preselectedServiceAppliedRef.current = true;
        setSelectedService(matchedService);
        setStep(2);
    }, [searchParams, services, step]);

    useEffect(() => {
        if (!selectedService) {
            setSelectedHours(1);
            return;
        }
        if (isPerHourService(selectedService)) {
            setSelectedHours(getServiceMinHours(selectedService));
            return;
        }
        setSelectedHours(1);
    }, [selectedService]);

    // Connect to provider (provider_clients) after auth
    const ensureConnected = useCallback(async (providerId) => {
        if (!session) return;
        try {
            await supabase.from('provider_clients').upsert(
                { provider_id: providerId, client_id: session.user.id, source: 'booking', connected_at: new Date().toISOString() },
                { onConflict: 'provider_id,client_id', ignoreDuplicates: true }
            );
        } catch { }
    }, [session]);

    const [bookingError, setBookingError] = useState(null);

    const handleSubmitBooking = async (pmtData) => {
        if (!session) return;
        setSubmitting(true);
        setBookingError(null);
        try {
            // Ensure client_profiles row exists
            await supabase.from('client_profiles').upsert(
                { user_id: session.user.id },
                { onConflict: 'user_id', ignoreDuplicates: true }
            );

            // Ensure provider_clients connection
            await ensureConnected(provider.user_id || provider.id);

            // Create booking
            const body = {
                provider_id: provider.user_id || provider.id,
                service_id: selectedService.id,
                requested_date: selectedDate,
                requested_time: selectedTime,
                requested_duration_minutes: getSelectedServiceDuration(selectedService, selectedHours),
                requested_price_cents: getSelectedServicePrice(selectedService, selectedHours),
                message: intakeFreeform || null,
                ...(pmtData || {}),
            };
            const data = await request('/bookings/request-time', { method: 'POST', body: JSON.stringify(body) });

            // Save intake responses if any
            const intakeRows = Object.entries(intakeAnswers).flatMap(([qId, answers]) =>
                answers.map(ans => ({ booking_id: data.booking.id, question_id: qId, response_text: ans }))
            );
            if (intakeRows.length > 0) {
                await supabase.from('booking_intake_responses').insert(intakeRows);
            }

            if (posthog.__loaded) {
                posthog.capture('booking_submitted', {
                    provider_id: provider.user_id || provider.id,
                    service_id: selectedService.id,
                    payment_type: pmtData?.payment_type || selectedService?.payment_type || 'none',
                    has_intake: intakeRows.length > 0 || Boolean(intakeFreeform),
                    requested_duration_minutes: getSelectedServiceDuration(selectedService, selectedHours),
                    requested_price_cents: getSelectedServicePrice(selectedService, selectedHours),
                });
            }

            setBookingId(data.booking.id);
            setStep(5);
        } catch (err) {
            console.error('[PublicBookingPage] submit error:', err);
            const msg = err?.message || 'Something went wrong. Please try again.';
            setBookingError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingProvider || authLoading) return <ScreenLoading />;
    if (error) return <ScreenError message={error} />;

    // Step routing
    if (step === 1) return (
        <>
            <Step1Profile
                provider={provider}
                services={services}
                groups={groups}
                reviews={reviews}
                portfolio={portfolio}
                selectedService={selectedService}
                selectedHours={selectedHours}
                onSelectService={setSelectedService}
                onViewPhoto={setLightboxImg}
                onContinue={() => {
                    if (!bookingStartedTrackedRef.current && selectedService && posthog.__loaded) {
                        bookingStartedTrackedRef.current = true;
                        posthog.capture('booking_started', {
                            provider_id: provider?.user_id || provider?.id,
                            service_id: selectedService.id,
                            payment_type: selectedService?.payment_type || 'none',
                            selected_hours: isPerHourService(selectedService) ? getSelectedServiceHours(selectedService, selectedHours) : null,
                        });
                    }
                    setStep(2);
                }}
            />
            {lightboxImg && (
                <div
                    onClick={() => setLightboxImg(null)}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 9999,
                        background: 'rgba(0,0,0,0.85)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: 24,
                    }}
                >
                    <button
                        onClick={() => setLightboxImg(null)}
                        style={{
                            position: 'absolute', top: 20, right: 20,
                            width: 36, height: 36, borderRadius: '50%',
                            background: 'rgba(255,255,255,0.15)', border: 'none',
                            color: '#fff', fontSize: 22, lineHeight: 1, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                    >×</button>
                    <img
                        src={lightboxImg}
                        alt="Service"
                        onClick={(e) => e.stopPropagation()}
                        style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: 16, objectFit: 'contain', display: 'block' }}
                    />
                </div>
            )}
        </>
    );

    if (step === 2) return (
        <Step2DateTime
            provider={provider}
            service={selectedService}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            selectedHours={selectedHours}
            onDateSelect={setSelectedDate}
            onTimeSelect={setSelectedTime}
            onHoursChange={setSelectedHours}
            onBack={() => setStep(1)}
            onContinue={() => setStep(3)}
        />
    );

    if (step === 3) return (
        <Step3Intake
            service={selectedService}
            provider={provider}
            answers={intakeAnswers}
            onAnswersChange={setIntakeAnswers}
            onBack={() => setStep(2)}
            onContinue={({ freeform }) => {
                setIntakeFreeform(freeform);
                setHasIntake(true);
                // Skip auth gate if logged in
                if (session) setStep(4);
                else setStep(35);
            }}
            onSkip={() => {
                setIntakeFreeform('');
                if (session) setStep(4);
                else setStep(35);
            }}
        />
    );

    if (step === 35) return (
        <Step35Auth
            provider={provider}
            service={selectedService}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            selectedHours={selectedHours}
            onAuth={() => setStep(4)}
            onBack={() => setStep(hasIntake ? 3 : 2)}
        />
    );

    if (step === 4) return (
        <Step4Review
            provider={provider}
            service={selectedService}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            selectedHours={selectedHours}
            onBack={() => session ? setStep(hasIntake ? 3 : 2) : setStep(35)}
            onSubmit={() => {
                const pt = selectedService?.payment_type;
                if (pt && pt !== 'none') {
                    setStep(45);
                } else {
                    handleSubmitBooking(null);
                }
            }}
            submitting={submitting}
        />
    );

    if (step === 45) return (
        <Step45Payment
            service={{
                ...selectedService,
                base_price: getSelectedServicePrice(selectedService, selectedHours),
                duration: getSelectedServiceDuration(selectedService, selectedHours),
            }}
            provider={provider}
            session={session}
            onBack={() => setStep(4)}
            bookingError={bookingError}
            onSuccess={(pmtData) => {
                if (posthog.__loaded) {
                    posthog.capture('payment_succeeded', {
                        provider_id: provider?.user_id || provider?.id,
                        service_id: selectedService?.id,
                        payment_type: pmtData?.payment_type || selectedService?.payment_type || 'none',
                        amount_cents: getSelectedServicePrice(selectedService, selectedHours),
                    });
                }
                setPaymentData(pmtData);
                handleSubmitBooking(pmtData);
            }}
        />
    );

    if (step === 5) return (
        <Step5Confirm
            provider={provider}
            service={selectedService}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            selectedHours={selectedHours}
            handle={handle}
        />
    );

    return null;
}
