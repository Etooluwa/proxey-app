import React, { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useSession } from '../auth/authContext';
import { useNotifications } from '../contexts/NotificationContext';
import { request } from '../data/apiClient';
import { supabase } from '../utils/supabase';
import Header from '../components/ui/Header';
import Avatar from '../components/ui/Avatar';
import Lbl from '../components/ui/Lbl';
import Divider from '../components/ui/Divider';
import ArrowIcon from '../components/ui/ArrowIcon';
import HeroCard from '../components/ui/HeroCard';
import Footer from '../components/ui/Footer';

const T = { ink: '#3D231E', muted: '#8C6A64', faded: '#B0948F', accent: '#C25E4A', line: 'rgba(140,106,100,0.18)', card: '#FFFFFF', hero: '#FDDCC6', avatarBg: '#F2EBE5', success: '#5A8A5E' };
const F = "'Sora',system-ui,sans-serif";

function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getInitials(name) {
    return (name || '?')
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

// ─── Empty state ────────────────────────────────────────────────────────────

const ClientEmptyKliques = () => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingBottom: 16 }}>
        {/* Hero card with topo texture + ghost avatars */}
        <HeroCard>
            <div style={{ display: 'flex', marginBottom: 28 }}>
                {[0, 1, 2].map((i) => (
                    <div
                        key={i}
                        style={{
                            width: 48, height: 48, borderRadius: '50%',
                            background: 'rgba(255,255,255,0.5)',
                            border: '2px solid rgba(255,255,255,0.7)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            marginLeft: i > 0 ? -12 : 0, zIndex: 3 - i,
                        }}
                    >
                        <svg width="20" height="20" fill="none" stroke="#B0948F" strokeWidth="1.5" viewBox="0 0 24 24" style={{ opacity: 1 - i * 0.25 }}>
                            <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                ))}
            </div>
            <h2 style={{ fontFamily: F, fontSize: 24, fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.2, color: T.ink, margin: '0 0 10px' }}>
                Your circle<br />starts here.
            </h2>
            <p style={{ fontFamily: F, fontSize: 14, color: T.muted, margin: 0, lineHeight: 1.7, maxWidth: 280 }}>
                Every great relationship begins with a first step. Book with a provider or accept an invite — your shared history will live here.
            </p>
        </HeroCard>

        <Divider />

        {/* Got an invite? */}
        <div style={{ padding: '20px 0', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#FFF5E6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" fill="none" stroke="#92400E" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
            <div>
                <p style={{ fontFamily: F, fontSize: 15, fontWeight: 500, color: T.ink, margin: '0 0 4px' }}>Got an invite?</p>
                <p style={{ fontFamily: F, fontSize: 14, color: T.muted, margin: 0, lineHeight: 1.6 }}>Tap the link your provider sent you. One tap and you're connected.</p>
            </div>
        </div>

        <Divider />

        {/* Everything in one place */}
        <div style={{ padding: '20px 0', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#F2EBE5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" fill="none" stroke="#8C6A64" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
            <div>
                <p style={{ fontFamily: F, fontSize: 15, fontWeight: 500, color: T.ink, margin: '0 0 4px' }}>Everything in one place</p>
                <p style={{ fontFamily: F, fontSize: 14, color: T.muted, margin: 0, lineHeight: 1.6 }}>Session history, provider notes, bookings, and messages — all tied to each relationship.</p>
            </div>
        </div>

        <Divider />

        {/* Built around people */}
        <div style={{ padding: '20px 0', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#F2EBE5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" fill="none" stroke="#8C6A64" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
            <div>
                <p style={{ fontFamily: F, fontSize: 15, fontWeight: 500, color: T.ink, margin: '0 0 4px' }}>Built around people, not transactions</p>
                <p style={{ fontFamily: F, fontSize: 14, color: T.muted, margin: 0, lineHeight: 1.6 }}>Kliques remembers your journey with each provider so the relationship only gets better.</p>
            </div>
        </div>
    </div>
);

// ─── Provider row ────────────────────────────────────────────────────────────

const ProviderRow = ({ provider, onClick, showDivider }) => (
    <>
        <button
            onClick={onClick}
            className="w-full flex items-center gap-3.5 py-3.5 px-1 text-left focus:outline-none active:bg-avatarBg/40 transition-colors"
        >
            <Avatar initials={getInitials(provider.name)} size={44} src={provider.avatar || ''} />

            <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-ink m-0 mb-0.5 truncate">
                    {provider.name}
                </p>
                {provider.role && (
                    <p className="text-[13px] text-muted m-0 mb-1 truncate">{provider.role}</p>
                )}
                <Lbl>
                    {provider.visits} {provider.visits === 1 ? 'visit' : 'visits'}
                    {' · '}
                    Last: {formatDate(provider.last_visit)}
                </Lbl>
            </div>

            <ArrowIcon size={18} />
        </button>
        {showDivider && <Divider />}
    </>
);

// ─── Page ────────────────────────────────────────────────────────────────────

const AppDashboard = () => {
    const navigate = useNavigate();
    const { onMenu, isDesktop } = useOutletContext() || {};
    const { session } = useSession();

    const { notifications } = useNotifications();

    // Find unread session_complete notifications that need a review
    const sessionCompleteNotifs = (notifications || []).filter(
        (n) => (n.type === 'session_complete' || n.type === 'booking_completed')
            && !n.is_read
            && (n.data?.show_review_prompt !== false)
            && (n.booking_id || n.data?.booking_id)
    );
    const firstReviewNotif = sessionCompleteNotifs[0];
    const [kliques, setKliques] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);


    useEffect(() => {
        if (!session?.accessToken) {
            setLoading(false);
            return;
        }

        const fetchKliques = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await request('/client/kliques');
                setKliques(data.kliques || []);
            } catch (err) {
                console.error('Failed to load kliques:', err);
                setError('Could not load your kliques.');
            } finally {
                setLoading(false);
            }
        };

        fetchKliques();
    }, [session]);

    useEffect(() => {
        if (!supabase || !session?.user?.id) return undefined;

        const refresh = async () => {
            try {
                const data = await request('/client/kliques');
                setKliques(data.kliques || []);
            } catch (_) {}
        };

        const channel = supabase
            .channel(`client-kliques:${session.user.id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'provider_clients',
                filter: `client_id=eq.${session.user.id}`,
            }, refresh)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'bookings',
                filter: `client_id=eq.${session.user.id}`,
            }, refresh)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [session?.user?.id]);

    if (isDesktop) {
        return (
            <div style={{ padding: '40px', fontFamily: F }}>
                <div style={{ maxWidth: 800, margin: '0 auto' }}>
                    {/* Loading */}
                    {loading && (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid #C25E4A', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
                        </div>
                    )}

                    {/* Error */}
                    {!loading && error && (
                        <p style={{ fontFamily: F, fontSize: 14, color: T.muted, textAlign: 'center' }}>{error}</p>
                    )}

                    {/* Empty state */}
                    {!loading && !error && kliques.length === 0 && (
                        <div style={{ maxWidth: 480, margin: '60px auto 0', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                            <div style={{ display: 'flex', marginBottom: 24, justifyContent: 'center' }}>
                                {[0, 1, 2].map((i) => (
                                    <div key={i} style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(194,94,74,0.1)', border: '2px solid rgba(194,94,74,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: i > 0 ? -12 : 0 }}>
                                        <svg width="20" height="20" fill="none" stroke="#B0948F" strokeWidth="1.5" viewBox="0 0 24 24" style={{ opacity: 1 - i * 0.25 }}>
                                            <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                ))}
                            </div>
                            <p style={{ fontFamily: F, fontSize: 20, fontWeight: 500, color: T.ink, margin: '0 0 8px', letterSpacing: '-0.02em' }}>Your circle starts here.</p>
                            <p style={{ fontFamily: F, fontSize: 14, color: T.muted, margin: '0 0 32px', lineHeight: 1.7 }}>Book with a provider or accept an invite to start building your history together.</p>
                            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 0 }}>
                                {[
                                    { bg: '#FFF5E6', iconColor: '#92400E', path: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1', label: 'Got an invite?', desc: 'Tap the link your provider sent you.' },
                                    { bg: '#F2EBE5', iconColor: '#8C6A64', path: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Everything in one place', desc: 'History, bookings, and messages — all per relationship.' },
                                    { bg: '#F2EBE5', iconColor: '#8C6A64', path: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', label: 'Built around people', desc: 'Your relationship only gets better over time.' },
                                ].map((r, i, arr) => (
                                    <React.Fragment key={r.label}>
                                        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '16px 0', textAlign: 'left' }}>
                                            <div style={{ width: 40, height: 40, borderRadius: 12, background: r.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <svg width="18" height="18" fill="none" stroke={r.iconColor} strokeWidth="1.5" viewBox="0 0 24 24"><path d={r.path} strokeLinecap="round" strokeLinejoin="round" /></svg>
                                            </div>
                                            <div>
                                                <p style={{ fontFamily: F, fontSize: 14, fontWeight: 500, color: T.ink, margin: '0 0 3px' }}>{r.label}</p>
                                                <p style={{ fontFamily: F, fontSize: 13, color: T.muted, margin: 0, lineHeight: 1.6 }}>{r.desc}</p>
                                            </div>
                                        </div>
                                        {i < arr.length - 1 && <div style={{ height: 1, background: 'rgba(140,106,100,0.2)' }} />}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Provider list */}
                    {!loading && !error && kliques.length > 0 && (
                        <>
                            {/* Review banner (desktop) */}
                            {firstReviewNotif && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '14px 18px', background: '#FFF5E6', borderRadius: 14, border: '1px solid rgba(194,94,74,0.15)', marginBottom: 20 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <svg width="18" height="18" fill="none" stroke="#C25E4A" strokeWidth="1.5" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                                            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <div>
                                            <p style={{ fontFamily: F, fontSize: 13, fontWeight: 500, color: '#92400E', margin: '0 0 2px' }}>How was your last session?</p>
                                            <p style={{ fontFamily: F, fontSize: 12, color: '#B45309', margin: 0 }}>{firstReviewNotif.body || firstReviewNotif.message}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/app/review/${firstReviewNotif.booking_id || firstReviewNotif.data?.booking_id}`)}
                                        style={{ flexShrink: 0, padding: '8px 18px', borderRadius: 9999, background: '#FDDCC6', border: 'none', fontFamily: F, fontSize: 13, fontWeight: 600, color: '#C25E4A', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                    >
                                        Leave a review →
                                    </button>
                                </div>
                            )}

                            <span style={{ fontFamily: F, fontSize: 11, fontWeight: 500, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 14 }}>
                                {kliques.length} provider{kliques.length !== 1 ? 's' : ''}
                            </span>
                            <div style={{ background: T.card, borderRadius: 16, border: `1px solid ${T.line}`, overflow: 'hidden' }}>
                                {/* Table header */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 80px 120px 40px', padding: '10px 20px', borderBottom: `1px solid ${T.line}` }}>
                                    {['Provider', 'Role', 'Visits', 'Last Visit', ''].map((h) => (
                                        <span key={h} style={{ fontFamily: F, fontSize: 11, fontWeight: 500, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
                                    ))}
                                </div>
                                {kliques.map((provider, i) => (
                                    <button
                                        key={provider.provider_id}
                                        onClick={() => navigate(`/app/relationship/${provider.provider_id}`)}
                                        style={{ display: 'grid', gridTemplateColumns: '1fr 160px 80px 120px 40px', alignItems: 'center', padding: '14px 20px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', borderBottom: i < kliques.length - 1 ? `1px solid ${T.line}` : 'none', textAlign: 'left' }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <Avatar initials={getInitials(provider.name)} size={36} src={provider.avatar || ''} />
                                            <span style={{ fontFamily: F, fontSize: 14, fontWeight: 500, color: T.ink }}>{provider.name}</span>
                                        </div>
                                        <span style={{ fontFamily: F, fontSize: 13, color: T.muted }}>{provider.role || '—'}</span>
                                        <span style={{ fontFamily: F, fontSize: 13, color: T.muted }}>{provider.visits}</span>
                                        <span style={{ fontFamily: F, fontSize: 13, color: T.muted }}>{formatDate(provider.last_visit)}</span>
                                        <svg width="16" height="16" fill="none" stroke={T.muted} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M7 17L17 7M17 7H7M17 7v10" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-base">
            <Header onMenu={onMenu} showAvatar={false} />

            <div className="px-5 pt-4 flex-1 flex flex-col">
                {/* Loading */}
                {loading && (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="w-7 h-7 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-[14px] text-muted text-center px-8">{error}</p>
                    </div>
                )}

                {/* Empty state */}
                {!loading && !error && kliques.length === 0 && <ClientEmptyKliques />}

                {/* Provider list */}
                {!loading && !error && kliques.length > 0 && (
                    <div className="flex-1 flex flex-col">
                        {/* Title + count */}
                        <div className="mb-4">
                            <Lbl className="block mb-1">{kliques.length} provider{kliques.length !== 1 ? 's' : ''}</Lbl>
                            <h1 className="text-[32px] font-semibold text-ink tracking-[-0.03em] leading-tight m-0">
                                My kliques
                            </h1>
                        </div>

                        {/* Review banner (mobile) */}
                        {firstReviewNotif && (
                            <div
                                className="flex items-center justify-between gap-3 p-4 rounded-[14px] mb-5"
                                style={{ background: '#FFF5E6', border: '1px solid rgba(194,94,74,0.15)' }}
                            >
                                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                    <svg width="16" height="16" fill="none" stroke="#C25E4A" strokeWidth="1.5" viewBox="0 0 24 24" className="flex-shrink-0">
                                        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <p className="text-[13px] font-medium truncate m-0" style={{ color: '#92400E', fontFamily: "'Sora',system-ui,sans-serif" }}>How was your last session?</p>
                                </div>
                                <button
                                    onClick={() => navigate(`/app/review/${firstReviewNotif.booking_id || firstReviewNotif.data?.booking_id}`)}
                                    style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 9999, background: '#FDDCC6', border: 'none', fontFamily: "'Sora',system-ui,sans-serif", fontSize: 12, fontWeight: 600, color: '#C25E4A', cursor: 'pointer' }}
                                >
                                    Review →
                                </button>
                            </div>
                        )}
                        <div>
                            {kliques.map((provider, i) => (
                                <ProviderRow
                                    key={provider.provider_id}
                                    provider={provider}
                                    onClick={() => navigate(`/app/relationship/${provider.provider_id}`)}
                                    showDivider={i < kliques.length - 1}
                                />
                            ))}
                        </div>
                    </div>
                )}

                <Footer />
            </div>
        </div>
    );
};

export default AppDashboard;
