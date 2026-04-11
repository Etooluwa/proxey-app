/**
 * ProviderClients — v6 Warm Editorial
 * Route: /provider/clients
 *
 * API: GET /api/provider/clients → { clients: [{ client_id, name, visits, ltv, last_visit, status }] }
 */
import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useSession } from '../../auth/authContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { request } from '../../data/apiClient';
import { supabase } from '../../utils/supabase';
import Header from '../../components/ui/Header';
import Avatar from '../../components/ui/Avatar';
import Lbl from '../../components/ui/Lbl';
import Divider from '../../components/ui/Divider';
import ArrowIcon from '../../components/ui/ArrowIcon';
import HeroCard from '../../components/ui/HeroCard';
import ShareLinks from '../../components/ui/ShareLinks';
import Footer from '../../components/ui/Footer';
import { fetchProviderProfile } from '../../data/provider';
import DesktopShareLinks from '../../components/DesktopShareLinks';

// ─── Desktop tokens ────────────────────────────────────────────────────────────
const T = { ink: '#3D231E', muted: '#8C6A64', faded: '#B0948F', accent: '#C25E4A', line: 'rgba(140,106,100,0.18)', card: '#FFFFFF', avatarBg: '#F2EBE5', success: '#5A8A5E' };
const F = "'Sora',system-ui,sans-serif";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name) {
    return (name || 'C').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function fmtLastVisit(iso) {
    if (!iso) return null;
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Status pill config ───────────────────────────────────────────────────────

const STATUS = {
    active:   { label: 'Active',   color: '#5A8A5E' },
    'at-risk':{ label: 'At risk',  color: '#92400E' },
    new:      { label: 'New',      color: '#C25E4A' },
};

// ─── Empty state ──────────────────────────────────────────────────────────────

const EmptyKliques = ({ handle }) => (
    <div className="flex flex-col">
        {/* Hero card with ghost avatars */}
        <HeroCard className="mb-5">
            {/* Overlapping ghost avatar circles */}
            <div className="flex mb-6">
                {[0, 1, 2].map((i) => (
                    <div
                        key={i}
                        className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                            background: 'rgba(255,255,255,0.5)',
                            border: '2px solid rgba(255,255,255,0.7)',
                            marginLeft: i > 0 ? '-10px' : 0,
                            zIndex: 3 - i,
                        }}
                    >
                        <svg
                            width="18" height="18" fill="none"
                            stroke="#B0948F" strokeWidth="1.5" viewBox="0 0 24 24"
                            style={{ opacity: 1 - i * 0.25 }}
                        >
                            <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                ))}
            </div>

            <h2 className="text-[22px] font-semibold text-ink tracking-[-0.02em] leading-snug m-0 mb-2">
                Your people are<br />out there.
            </h2>
            <p className="text-[14px] text-muted leading-relaxed m-0">
                When clients accept your invite or book a session, they become part of your klique. Every session and milestone — tracked here.
            </p>
        </HeroCard>

        <ShareLinks handle={handle} />
    </div>
);

// ─── Client row ───────────────────────────────────────────────────────────────

const ClientRow = ({ client, onClick }) => {
    const statusCfg = STATUS[client.status] || STATUS.active;
    const lastVisit = fmtLastVisit(client.last_visit);
    const sourceLabel = client.source === 'invite' ? 'via invite' : 'via booking';

    return (
        <>
            <button
                onClick={onClick}
                className="w-full flex items-center justify-between py-5 text-left focus:outline-none active:bg-avatarBg/40 transition-colors"
            >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <Avatar initials={getInitials(client.name)} size={44} />
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <p className="text-[16px] text-ink m-0 truncate">{client.name}</p>
                            <span
                                className="text-[10px] font-semibold uppercase tracking-[0.05em] flex-shrink-0"
                                style={{ color: statusCfg.color }}
                            >
                                {statusCfg.label}
                            </span>
                        </div>
                        <p className="text-[13px] text-muted m-0">
                            {client.visits} {client.visits === 1 ? 'visit' : 'visits'}
                            {lastVisit ? ` · Last: ${lastVisit}` : ` · ${sourceLabel}`}
                        </p>
                    </div>
                </div>
                <ArrowIcon size={18} />
            </button>
            <Divider />
        </>
    );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const ProviderClients = () => {
    const navigate = useNavigate();
    const { onMenu, isDesktop } = useOutletContext() || {};
    const { session, profile } = useSession();
    const { unreadCount } = useNotifications();

    const [clients, setClients] = useState([]);
    const [handle, setHandle] = useState('');
    const [loading, setLoading] = useState(true);
    const providerId = session?.user?.id;

    const initials = (profile?.name || '').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || 'P';

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            try {
                const [clientsData, prof] = await Promise.all([
                    request('/provider/clients'),
                    fetchProviderProfile(),
                ]);
                if (!cancelled) {
                    setClients(clientsData.clients || []);
                    setHandle(prof?.handle || '');
                }
            } catch (err) {
                console.error('[ProviderClients] load error:', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        if (!supabase || !providerId) return undefined;

        const refreshClients = async () => {
            try {
                const clientsData = await request('/provider/clients');
                setClients(clientsData.clients || []);
            } catch (err) {
                console.error('[ProviderClients] realtime refresh error:', err);
            }
        };

        const channel = supabase
            .channel(`provider-clients:${providerId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'provider_clients',
                filter: `provider_id=eq.${providerId}`,
            }, refreshClients)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'bookings',
                filter: `provider_id=eq.${providerId}`,
            }, refreshClients)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [providerId]);

  
    // ── Desktop layout ─────────────────────────────────────────────────────────
    if (isDesktop) {
        return (
            <div style={{ padding: '40px', fontFamily: F }}>
                <div style={{ maxWidth: 900, margin: '0 auto' }}>
                    <span style={{ fontFamily: F, fontSize: 11, fontWeight: 500, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                        {loading ? '…' : `${clients.length} client${clients.length !== 1 ? 's' : ''}`}
                    </span>

                    {/* Loading skeleton */}
                    {loading && (
                        <div style={{ background: T.card, borderRadius: 16, border: `1px solid ${T.line}`, overflow: 'hidden' }}>
                            {[1, 2, 3].map((i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderBottom: i < 3 ? `1px solid ${T.line}` : 'none' }}>
                                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(140,106,100,0.1)', flexShrink: 0 }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ height: 14, width: 140, background: 'rgba(140,106,100,0.1)', borderRadius: 6, marginBottom: 6 }} />
                                        <div style={{ height: 12, width: 80, background: 'rgba(140,106,100,0.08)', borderRadius: 4 }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Empty state */}
                    {!loading && clients.length === 0 && (
                        <div style={{ maxWidth: 640, margin: '0 auto' }}>
                            {/* Hero card */}
                            <div style={{ background: '#FDDCC6', borderRadius: 24, padding: '28px 24px', position: 'relative', overflow: 'hidden', marginBottom: 20 }}>
                                <div style={{ position: 'absolute', inset: 0, backgroundImage: `url("data:image/svg+xml,%3Csvg width='400' height='400' viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 200 Q 100 100 200 200 T 400 200' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M-50 250 Q 50 150 150 250 T 350 250' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M50 150 Q 150 50 250 150 T 450 150' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M0 300 Q 100 200 200 300 T 400 300' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3C/svg%3E")`, backgroundSize: 'cover', opacity: 0.1, pointerEvents: 'none' }} />
                                <div style={{ position: 'relative', zIndex: 1 }}>
                                    {/* Ghost avatars */}
                                    <div style={{ display: 'flex', marginBottom: 24 }}>
                                        {[0, 1, 2].map((i) => (
                                            <div key={i} style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.5)', border: '2px solid rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: i > 0 ? -10 : 0, zIndex: 3 - i }}>
                                                <svg width="18" height="18" fill="none" stroke={T.faded} strokeWidth="1.5" viewBox="0 0 24 24" style={{ opacity: 1 - i * 0.25 }}>
                                                    <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                        ))}
                                    </div>
                                    <p style={{ fontFamily: F, fontSize: 22, fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.2, color: T.ink, margin: '0 0 8px' }}>Your people are<br />out there.</p>
                                    <p style={{ fontFamily: F, fontSize: 14, color: T.muted, margin: 0, lineHeight: 1.6 }}>When clients accept your invite or book a session, they become part of your klique. Every session and milestone — tracked here.</p>
                                </div>
                            </div>
                            <DesktopShareLinks handle={handle} />
                        </div>
                    )}

                    {/* Data table */}
                    {!loading && clients.length > 0 && (
                        <div style={{ background: T.card, borderRadius: 16, border: `1px solid ${T.line}`, overflow: 'hidden', marginBottom: 8 }}>
                            {/* Table header */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 80px 120px 40px', gap: 0, padding: '10px 20px', borderBottom: `1px solid ${T.line}` }}>
                                {['Client', 'Status', 'Visits', 'Last Visit', ''].map((h) => (
                                    <span key={h} style={{ fontFamily: F, fontSize: 11, fontWeight: 500, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
                                ))}
                            </div>
                            {clients.map((client, i) => {
                                const statusCfg = STATUS[client.status] || STATUS.active;
                                const lastVisit = fmtLastVisit(client.last_visit);
                                return (
                                    <button
                                        key={client.client_id}
                                        onClick={() => navigate(`/provider/client/${client.client_id}`)}
                                        style={{ display: 'grid', gridTemplateColumns: '1fr 120px 80px 120px 40px', alignItems: 'center', gap: 0, padding: '14px 20px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', borderBottom: i < clients.length - 1 ? `1px solid ${T.line}` : 'none', textAlign: 'left' }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <Avatar initials={getInitials(client.name)} size={36} />
                                            <span style={{ fontFamily: F, fontSize: 14, color: T.ink }}>{client.name}</span>
                                        </div>
                                        <span style={{ fontFamily: F, fontSize: 11, fontWeight: 600, color: statusCfg.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{statusCfg.label}</span>
                                        <span style={{ fontFamily: F, fontSize: 14, color: T.muted }}>{client.visits}</span>
                                        <span style={{ fontFamily: F, fontSize: 14, color: T.muted }}>{lastVisit || '—'}</span>
                                        <svg width="16" height="16" fill="none" stroke={T.muted} strokeWidth="1.5" viewBox="0 0 24 24">
                                            <path d="M7 17L17 7M17 7H7M17 7v10" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {!loading && clients.length > 0 && (
                        <DesktopShareLinks handle={handle} />
                    )}
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

            {/* ── Title ── */}
            <div className="px-5 pb-5">
                <Lbl className="block mb-1.5">
                    {loading ? '…' : `${clients.length} client${clients.length !== 1 ? 's' : ''}`}
                </Lbl>
                <h1 className="text-[32px] font-semibold text-ink tracking-[-0.03em] leading-tight m-0">
                    My kliques
                </h1>
            </div>

            <div className="px-5 flex-1 flex flex-col">
                {/* Loading skeleton */}
                {loading && (
                    <div className="flex flex-col gap-4 pt-2">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-4 py-2">
                                <div className="w-11 h-11 rounded-full bg-line/60 animate-pulse flex-shrink-0" />
                                <div className="flex-1">
                                    <div className="h-4 w-36 bg-line/60 rounded animate-pulse mb-2" />
                                    <div className="h-3 w-24 bg-line/60 rounded animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty state */}
                {!loading && clients.length === 0 && (
                    <EmptyKliques handle={handle} />
                )}

                {/* Client list */}
                {!loading && clients.length > 0 && (
                    <>
                        <Divider />
                        {clients.map((client) => (
                            <ClientRow
                                key={client.client_id}
                                client={client}
                                onClick={() => navigate(`/provider/client/${client.client_id}`)}
                            />
                        ))}

                        <div className="mt-7">
                            <ShareLinks handle={handle} />
                        </div>
                    </>
                )}

                <Footer />
            </div>
        </div>
    );
};

export default ProviderClients;
