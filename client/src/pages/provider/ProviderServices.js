/**
 * ProviderServices — v6 Warm Editorial
 * Route: /provider/services
 *
 * API: GET /api/provider/services
 *   → { services: [...], groups: [...] }
 *
 * Services are organised under group headers.
 * Ungrouped services appear under an implicit "General" group.
 */
import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useSession } from '../../auth/authContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { request } from '../../data/apiClient';
import { formatMoney } from '../../utils/formatMoney';
import Header from '../../components/ui/Header';
import Lbl from '../../components/ui/Lbl';
import Divider from '../../components/ui/Divider';
import ArrowIcon from '../../components/ui/ArrowIcon';
import HeroCard from '../../components/ui/HeroCard';
import Footer from '../../components/ui/Footer';

// ─── Desktop tokens ────────────────────────────────────────────────────────────
const T = { ink: '#3D231E', muted: '#8C6A64', faded: '#B0948F', accent: '#C25E4A', line: 'rgba(140,106,100,0.18)', card: '#FFFFFF', avatarBg: '#F2EBE5', success: '#5A8A5E' };
const F = "'Sora',system-ui,sans-serif";
const APP_ORIGIN = process.env.REACT_APP_APP_URL || window.location.origin;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtPrice = (val, currency = 'cad') => (val == null ? null : formatMoney(val, currency));

function fmtDuration(mins) {
    if (!mins) return null;
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
}

function isPerHourService(service) {
    return service?.metadata?.pricingType === 'per_hour' || service?.unit === 'hour';
}

function fmtServiceMeta(service) {
    if (!service) return '—';
    const price = fmtPrice(service.base_price || service.basePrice, service.currency);
    if (isPerHourService(service)) {
        const minHours = Math.max(Number(service?.metadata?.minHours ?? 1) || 1, 1);
        const maxHours = Math.max(Number(service?.metadata?.maxHours ?? minHours) || minHours, minHours);
        const hoursLabel = minHours === maxHours
            ? `${minHours} ${minHours === 1 ? 'hour' : 'hours'}`
            : `${minHours}–${maxHours} hours`;
        return [hoursLabel, price ? `${price}/hr` : null].filter(Boolean).join(' · ') || '—';
    }
    const duration = fmtDuration(service.duration);
    return [duration, price].filter(Boolean).join(' · ') || '—';
}

function buildGrouped(services, groups) {
    // Map group_id → group
    const groupMap = {};
    for (const g of groups) groupMap[g.id] = g;

    // Sort groups by sort_order, then "ungrouped" at end
    const ordered = [...groups].sort((a, b) => a.sort_order - b.sort_order);

    const result = [];

    for (const g of ordered) {
        const svcs = services.filter((s) => s.group_id === g.id);
        result.push({ group: g, services: svcs });
    }

    // Ungrouped
    const ungrouped = services.filter((s) => !s.group_id || !groupMap[s.group_id]);
    if (ungrouped.length > 0 || groups.length === 0) {
        result.push({ group: null, services: ungrouped });
    }

    return result;
}

// ─── Empty state ──────────────────────────────────────────────────────────────

const EmptyServices = ({ onAdd }) => (
    <HeroCard className="mb-5">
        <div
            className="w-12 h-12 rounded-[14px] flex items-center justify-center mb-5"
            style={{ background: 'rgba(255,255,255,0.5)', border: '2px solid rgba(255,255,255,0.7)' }}
        >
            <svg width="22" height="22" fill="none" stroke="#8C6A64" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </div>
        <h2 className="text-[22px] font-weight-[400] text-ink tracking-[-0.02em] leading-snug m-0 mb-2">
            What do you offer?
        </h2>
        <p className="text-[14px] text-muted leading-relaxed m-0 mb-5">
            Define your services — name, duration, price, and how you'd like to get paid. Clients will see this when they book.
        </p>
        <button
            onClick={onAdd}
            className="flex items-center gap-2 px-5 py-3 rounded-[12px] text-[13px] font-semibold text-white focus:outline-none active:opacity-80"
            style={{ background: '#3D231E', border: 'none' }}
        >
            <svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            Create Your First Service
        </button>
    </HeroCard>
);

// ─── Copy link button ─────────────────────────────────────────────────────────

const CopyLinkBtn = ({ url }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded-[8px] text-[11px] font-semibold focus:outline-none active:opacity-60 flex-shrink-0"
            style={{
                background: copied ? '#EBF2EC' : 'rgba(140,106,100,0.1)',
                color: copied ? '#5A8A5E' : '#8C6A64',
                border: 'none',
                transition: 'all .2s',
            }}
            title="Copy booking link for this service"
        >
            {copied ? (
                <>
                    <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    Copied
                </>
            ) : (
                <>
                    <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2M16 8h2a2 2 0 012 2v8a2 2 0 01-2 2h-8a2 2 0 01-2-2v-2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    Copy link
                </>
            )}
        </button>
    );
};

// ─── Service row ──────────────────────────────────────────────────────────────

const ServiceRow = ({ svc, onClick, isLast, handle }) => {
    const booked = svc.bookings_this_month || 0;
    const isDraft = svc.is_active === false;
    const meta = fmtServiceMeta(svc);
    const bookingUrl = handle ? `${APP_ORIGIN}/book/${handle}?service=${svc.id}` : null;

    return (
        <>
            <button
                onClick={onClick}
                className="w-full flex items-center justify-between py-4 text-left focus:outline-none active:bg-avatarBg/40 transition-colors"
            >
                <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="text-[15px] text-ink m-0 truncate">{svc.name}</p>
                        {isDraft && (
                            <span
                                className="text-[10px] font-semibold uppercase tracking-[0.05em] flex-shrink-0"
                                style={{ color: '#B0948F' }}
                            >
                                Draft
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap mt-1">
                        <p className="text-[13px] text-muted m-0">
                            {meta || '—'}
                            {booked > 0 && (
                                <span className="ml-2 text-[12px]" style={{ color: '#5A8A5E' }}>
                                    {booked} booked
                                </span>
                            )}
                        </p>
                        {bookingUrl && <CopyLinkBtn url={bookingUrl} />}
                    </div>
                </div>
                <ArrowIcon size={16} />
            </button>
            {!isLast && <Divider />}
        </>
    );
};

// ─── Group section ────────────────────────────────────────────────────────────

const GroupSection = ({ group, services, onServiceClick, onAddToGroup, onGroupClick, handle }) => {
    const groupName = group ? group.name : 'General';
    const count = services.length;

    return (
        <div className="mb-6">
            {/* Group header */}
            <div className="flex items-center justify-between mb-1">
                <div>
                    {group ? (
                        <button
                            onClick={() => onGroupClick(group)}
                            className="focus:outline-none active:opacity-60 text-left"
                        >
                            <Lbl className="block underline-offset-2" style={{ textDecoration: 'underline', textDecorationColor: 'rgba(140,106,100,0.3)' }}>{groupName}</Lbl>
                        </button>
                    ) : (
                        <Lbl className="block">{groupName}</Lbl>
                    )}
                    <p className="text-[12px] text-faded m-0 mt-0.5">
                        {count} service{count !== 1 ? 's' : ''}
                    </p>
                </div>
                {group && (
                    <button
                        onClick={() => onAddToGroup(group)}
                        className="text-[12px] font-semibold focus:outline-none active:opacity-60"
                        style={{ color: '#C25E4A' }}
                    >
                        + Add to group
                    </button>
                )}
            </div>

            {/* Service rows */}
            {count === 0 ? (
                <p className="text-[13px] text-faded py-3 m-0">No services in this group yet.</p>
            ) : (
                <div>
                    <Divider />
                    {services.map((svc, i) => (
                        <ServiceRow
                            key={svc.id}
                            svc={svc}
                            onClick={() => onServiceClick(svc)}
                            isLast={i === services.length - 1}
                            handle={handle}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// ─── Add Group modal (inline sheet) ──────────────────────────────────────────

const AddGroupSheet = ({ onConfirm, onCancel, saving }) => {
    const [name, setName] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        setTimeout(() => inputRef.current?.focus(), 80);
    }, []);

    return (
        <div
            className="fixed inset-0 z-50 flex items-end"
            style={{ background: 'rgba(61,35,30,0.35)' }}
            onClick={onCancel}
        >
            <div
                className="w-full rounded-t-[24px] p-6 pb-10"
                style={{ background: '#FBF7F2' }}
                onClick={(e) => e.stopPropagation()}
            >
                <p className="text-[18px] font-semibold text-ink tracking-[-0.02em] m-0 mb-4">New Group</p>
                <input
                    ref={inputRef}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && name.trim() && onConfirm(name.trim())}
                    placeholder="e.g. Private Sessions, Workshops"
                    className="w-full px-4 py-3 rounded-[12px] text-[15px] text-ink focus:outline-none mb-4"
                    style={{
                        background: '#F2EBE5',
                        border: '1px solid rgba(140,106,100,0.2)',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box',
                    }}
                />
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3.5 rounded-[12px] text-[13px] font-semibold text-ink focus:outline-none"
                        style={{ border: '1px solid rgba(140,106,100,0.35)', background: 'transparent' }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => name.trim() && onConfirm(name.trim())}
                        disabled={!name.trim() || saving}
                        className="flex-[2] py-3.5 rounded-[12px] text-[13px] font-semibold text-white focus:outline-none"
                        style={{
                            background: '#3D231E',
                            opacity: (!name.trim() || saving) ? 0.5 : 1,
                            border: 'none',
                        }}
                    >
                        {saving ? 'Creating…' : 'Create Group'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const ProviderServices = () => {
    const navigate = useNavigate();
    const { onMenu, isDesktop } = useOutletContext() || {};
    const { profile } = useSession();
    const { unreadCount } = useNotifications();

    const [services, setServices] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);

    const initials = (profile?.name || '').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || 'P';

    async function load() {
        setLoading(true);
        try {
            const data = await request('/provider/services');
            setServices(data.services || []);
            setGroups(data.groups || []);
        } catch (err) {
            console.error('[ProviderServices] load error:', err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(); }, []);

    const grouped = buildGrouped(services, groups);
    const totalGroups = groups.length;
    const totalServices = services.length;

    const handleServiceClick = (svc) => navigate(`/provider/services/${svc.id}`);
    const handleGroupClick = (group) => navigate(`/provider/services/groups/${group.id}`);

    const handleAddToGroup = (group) => {
        // Navigate to new service pre-assigned to this group
        navigate('/provider/services/new', { state: { groupId: group.id, groupName: group.name } });
    };

    const subtitle = loading
        ? '…'
        : `${totalServices} service${totalServices !== 1 ? 's' : ''}${totalGroups > 0 ? ` · ${totalGroups} group${totalGroups !== 1 ? 's' : ''}` : ''}`;

    // ── Desktop layout ─────────────────────────────────────────────────────────
    if (isDesktop) {
        return (
            <div style={{ padding: '40px', fontFamily: F }}>
                <div style={{ maxWidth: 900, margin: '0 auto' }}>
                    {/* Header row */}
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
                        <div>
                            <span style={{ fontFamily: F, fontSize: 11, fontWeight: 500, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>{subtitle}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button
                                onClick={() => navigate('/provider/services/groups/new')}
                                style={{ padding: '8px 16px', borderRadius: 10, border: `1px solid ${T.line}`, background: 'transparent', fontFamily: F, fontSize: 12, fontWeight: 500, color: T.muted, cursor: 'pointer' }}
                            >
                                + Group
                            </button>
                            <button
                                onClick={() => navigate('/provider/services/new')}
                                style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: T.ink, fontFamily: F, fontSize: 12, fontWeight: 500, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                            >
                                <svg width="12" height="12" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
                                Add Service
                            </button>
                        </div>
                    </div>

                    {/* Empty state — only when no services AND no groups */}
                    {!loading && services.length === 0 && groups.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '48px 0' }}>
                            {/* Tag icon */}
                            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(194,94,74,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                <svg width="24" height="24" fill="none" stroke="#C25E4A" strokeWidth="1.5" viewBox="0 0 24 24">
                                    <path d="M7 7h.01M7 3H5a2 2 0 00-2 2v2a2 2 0 00.586 1.414l9 9a2 2 0 002.828 0l4-4a2 2 0 000-2.828l-9-9A2 2 0 0010 3H7z" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <p style={{ fontFamily: F, fontSize: 20, fontWeight: 600, color: T.ink, margin: '0 0 8px', letterSpacing: '-0.02em' }}>What do you offer?</p>
                            <p style={{ fontFamily: F, fontSize: 14, color: T.muted, margin: '0 0 20px' }}>Define your services — name, duration, price, and deposit options.</p>
                            <button onClick={() => navigate('/provider/services/new')} style={{ padding: '10px 24px', borderRadius: 12, background: T.ink, border: 'none', fontFamily: F, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>Create Your First Service</button>
                        </div>
                    )}

                    {/* Grouped tables */}
                    {!loading && grouped.map((section) => {
                        // Skip the ungrouped "General" section if it's empty and there are named groups
                        if (!section.group && section.services.length === 0 && groups.length > 0) return null;
                        const groupName = section.group ? section.group.name : 'General';
                        return (
                            <div key={section.group?.id || 'ungrouped'} style={{ marginBottom: 28 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        {section.group ? (
                                            <button onClick={() => handleGroupClick(section.group)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: F, fontSize: 11, fontWeight: 500, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em', textDecoration: 'underline', textDecorationColor: 'rgba(140,106,100,0.35)' }}>
                                                {groupName}
                                            </button>
                                        ) : (
                                            <span style={{ fontFamily: F, fontSize: 11, fontWeight: 500, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{groupName}</span>
                                        )}
                                        <span style={{ fontFamily: F, fontSize: 11, color: T.faded }}>{section.services.length} service{section.services.length !== 1 ? 's' : ''}</span>
                                    </div>
                                    {section.group && (
                                        <button
                                            onClick={() => handleAddToGroup(section.group)}
                                            style={{ fontFamily: F, fontSize: 12, fontWeight: 500, color: T.accent, background: 'none', border: 'none', cursor: 'pointer' }}
                                        >
                                            + Add to group
                                        </button>
                                    )}
                                </div>
                                <div style={{ background: T.card, borderRadius: 16, border: `1px solid ${T.line}`, overflow: 'hidden' }}>
                                    {/* Table header */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 80px 80px 120px 32px', padding: '10px 20px', borderBottom: `1px solid ${T.line}` }}>
                                        {['Service', 'Duration', 'Price', 'Booked', '', ''].map((h, idx) => (
                                            <span key={idx} style={{ fontFamily: F, fontSize: 11, fontWeight: 500, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
                                        ))}
                                    </div>
                                    {section.services.length === 0 ? (
                                        <div style={{ padding: '16px 20px' }}>
                                            <span style={{ fontFamily: F, fontSize: 13, color: T.faded }}>No services yet.</span>
                                        </div>
                                    ) : section.services.map((svc, i) => {
                                        const duration = fmtDuration(svc.duration);
                                        const price = fmtPrice(svc.base_price || svc.basePrice, svc.currency);
                                        const booked = svc.bookings_this_month || 0;
                                        const isDraft = svc.is_active === false;
                                        const bookingUrl = profile?.handle ? `${APP_ORIGIN}/book/${profile.handle}?service=${svc.id}` : null;
                                        return (
                                            <div
                                                key={svc.id}
                                                style={{ display: 'grid', gridTemplateColumns: '1fr 100px 80px 80px 120px 32px', alignItems: 'center', padding: '14px 20px', borderBottom: i < section.services.length - 1 ? `1px solid ${T.line}` : 'none' }}
                                            >
                                                <button
                                                    onClick={() => handleServiceClick(svc)}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
                                                >
                                                    <span style={{ fontFamily: F, fontSize: 14, color: T.ink }}>{svc.name}</span>
                                                    {isDraft && <span style={{ fontFamily: F, fontSize: 10, fontWeight: 600, color: T.faded, textTransform: 'uppercase', letterSpacing: '0.04em', marginLeft: 8 }}>Draft</span>}
                                                </button>
                                                <span style={{ fontFamily: F, fontSize: 13, color: T.muted }}>{duration || '—'}</span>
                                                <span style={{ fontFamily: F, fontSize: 13, color: T.muted }}>{price || '—'}</span>
                                                <span style={{ fontFamily: F, fontSize: 13, color: booked > 0 ? T.success : T.faded }}>{booked > 0 ? booked : '—'}</span>
                                                {bookingUrl && <CopyLinkBtn url={bookingUrl} />}
                                                <button onClick={() => handleServiceClick(svc)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                                                    <svg width="14" height="14" fill="none" stroke={T.muted} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M7 17L17 7M17 7H7M17 7v10" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-base">
            <Header
                onMenu={onMenu}
                showAvatar
                initials={initials}
                notifCount={unreadCount}
                onNotif={() => navigate('/provider/notifications')}
            />

            {/* ── Title + Add button ── */}
            <div className="px-5 pb-5 flex items-end justify-between">
                <div>
                    <Lbl className="block mb-1.5">{subtitle}</Lbl>
                    <h1 className="text-[32px] font-semibold text-ink tracking-[-0.03em] leading-tight m-0">
                        Services
                    </h1>
                </div>
                <button
                    onClick={() => navigate('/provider/services/new')}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-[12px] text-[13px] font-semibold text-white focus:outline-none active:opacity-80"
                    style={{ background: '#3D231E', border: 'none', marginBottom: 4 }}
                >
                    <svg width="13" height="13" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                    </svg>
                    Add
                </button>
            </div>

            <div className="px-5 flex-1 flex flex-col">
                {/* Loading skeleton */}
                {loading && (
                    <div className="flex flex-col gap-5 pt-2">
                        {[1, 2].map((g) => (
                            <div key={g}>
                                <div className="h-3 w-24 bg-line/60 rounded animate-pulse mb-1" />
                                <div className="h-2.5 w-16 bg-line/60 rounded animate-pulse mb-3" />
                                <div className="w-full h-px bg-line/60 mb-1" />
                                {[1, 2].map((i) => (
                                    <div key={i} className="flex items-center py-4 gap-3">
                                        <div className="flex-1">
                                            <div className="h-4 w-40 bg-line/60 rounded animate-pulse mb-1.5" />
                                            <div className="h-3 w-24 bg-line/60 rounded animate-pulse" />
                                        </div>
                                        <div className="w-4 h-4 bg-line/60 rounded animate-pulse" />
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty state */}
                {!loading && services.length === 0 && (
                    <EmptyServices onAdd={() => navigate('/provider/services/new')} />
                )}

                {/* Grouped services */}
                {!loading && services.length > 0 && (
                    <>
                        {grouped.map((section, idx) => (
                            <GroupSection
                                key={section.group?.id || 'ungrouped'}
                                group={section.group}
                                services={section.services}
                                onServiceClick={handleServiceClick}
                                onAddToGroup={handleAddToGroup}
                                onGroupClick={handleGroupClick}
                                handle={profile?.handle}
                            />
                        ))}

                        {/* + Add Group dashed button */}
                        <button
                            onClick={() => navigate('/provider/services/groups/new')}
                            className="w-full py-4 rounded-[14px] flex items-center justify-center gap-2 text-[13px] font-semibold focus:outline-none active:opacity-60 mb-6"
                            style={{
                                border: '1.5px dashed rgba(140,106,100,0.4)',
                                background: 'transparent',
                                color: '#8C6A64',
                            }}
                        >
                            <svg width="14" height="14" fill="none" stroke="#8C6A64" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                            </svg>
                            Add Group
                        </button>
                    </>
                )}

                <Footer />
            </div>

        </div>
    );
};

export default ProviderServices;
