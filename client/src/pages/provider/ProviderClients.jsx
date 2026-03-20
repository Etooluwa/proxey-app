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
import Header from '../../components/ui/Header';
import Avatar from '../../components/ui/Avatar';
import Lbl from '../../components/ui/Lbl';
import Divider from '../../components/ui/Divider';
import ArrowIcon from '../../components/ui/ArrowIcon';
import HeroCard from '../../components/ui/HeroCard';
import ShareLinks from '../../components/ui/ShareLinks';
import Footer from '../../components/ui/Footer';
import { fetchProviderProfile } from '../../data/provider';

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
                            {lastVisit ? ` · Last: ${lastVisit}` : ''}
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
    const { onMenu } = useOutletContext() || {};
    const { profile } = useSession();
    const { unreadCount } = useNotifications();

    const [clients, setClients] = useState([]);
    const [handle, setHandle] = useState('');
    const [loading, setLoading] = useState(true);

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
