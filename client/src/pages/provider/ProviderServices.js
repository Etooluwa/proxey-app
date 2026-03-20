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
import { useEffect, useState, useRef } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useSession } from '../../auth/authContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { request } from '../../data/apiClient';
import { createServiceGroup } from '../../data/provider';
import Header from '../../components/ui/Header';
import Lbl from '../../components/ui/Lbl';
import Divider from '../../components/ui/Divider';
import ArrowIcon from '../../components/ui/ArrowIcon';
import HeroCard from '../../components/ui/HeroCard';
import Footer from '../../components/ui/Footer';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtPrice(val) {
    if (!val && val !== 0) return null;
    const dollars = val > 1000 ? val / 100 : val;
    return `$${Math.round(dollars)}`;
}

function fmtDuration(mins) {
    if (!mins) return null;
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
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
        <h2 className="text-[22px] font-semibold text-ink tracking-[-0.02em] leading-snug m-0 mb-2">
            Set up your menu.
        </h2>
        <p className="text-[14px] text-muted leading-relaxed m-0 mb-5">
            Add the services you offer — name, duration, price, and how you collect payment. Clients will see this when they book.
        </p>
        <button
            onClick={onAdd}
            className="flex items-center gap-2 px-5 py-3 rounded-[12px] text-[13px] font-semibold text-white focus:outline-none active:opacity-80"
            style={{ background: '#3D231E', border: 'none' }}
        >
            <svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            Create first service
        </button>
    </HeroCard>
);

// ─── Service row ──────────────────────────────────────────────────────────────

const ServiceRow = ({ svc, onClick, isLast }) => {
    const duration = fmtDuration(svc.duration);
    const price = fmtPrice(svc.base_price || svc.basePrice);
    const booked = svc.bookings_this_month || 0;
    const isDraft = svc.is_active === false;

    const meta = [duration, price].filter(Boolean).join(' · ');

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
                    <p className="text-[13px] text-muted m-0">
                        {meta || '—'}
                        {booked > 0 && (
                            <span className="ml-2 text-[12px]" style={{ color: '#5A8A5E' }}>
                                {booked} booked
                            </span>
                        )}
                    </p>
                </div>
                <ArrowIcon size={16} />
            </button>
            {!isLast && <Divider />}
        </>
    );
};

// ─── Group section ────────────────────────────────────────────────────────────

const GroupSection = ({ group, services, onServiceClick, onAddToGroup }) => {
    const groupName = group ? group.name : 'General';
    const count = services.length;

    return (
        <div className="mb-6">
            {/* Group header */}
            <div className="flex items-center justify-between mb-1">
                <div>
                    <Lbl className="block">{groupName}</Lbl>
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
    const { onMenu } = useOutletContext() || {};
    const { profile } = useSession();
    const { unreadCount } = useNotifications();

    const [services, setServices] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddGroup, setShowAddGroup] = useState(false);
    const [savingGroup, setSavingGroup] = useState(false);

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

    const handleAddToGroup = (group) => {
        // Navigate to new service pre-assigned to this group
        navigate('/provider/services/new', { state: { groupId: group.id, groupName: group.name } });
    };

    const handleCreateGroup = async (name) => {
        setSavingGroup(true);
        try {
            await createServiceGroup(name);
            setShowAddGroup(false);
            await load();
        } catch (err) {
            console.error('[createGroup]', err);
        } finally {
            setSavingGroup(false);
        }
    };

    const subtitle = loading
        ? '…'
        : `${totalServices} service${totalServices !== 1 ? 's' : ''}${totalGroups > 0 ? ` · ${totalGroups} group${totalGroups !== 1 ? 's' : ''}` : ''}`;

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
                            />
                        ))}

                        {/* + Add Group dashed button */}
                        <button
                            onClick={() => setShowAddGroup(true)}
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

            {/* Add Group sheet */}
            {showAddGroup && (
                <AddGroupSheet
                    onConfirm={handleCreateGroup}
                    onCancel={() => setShowAddGroup(false)}
                    saving={savingGroup}
                />
            )}
        </div>
    );
};

export default ProviderServices;
