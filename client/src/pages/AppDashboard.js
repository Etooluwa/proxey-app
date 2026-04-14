import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useSession } from '../auth/authContext';
import { request } from '../data/apiClient';
import { supabase } from '../utils/supabase';
import Header from '../components/ui/Header';
import Footer from '../components/ui/Footer';
import { useNotifications } from '../contexts/NotificationContext';

const T = {
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
};

const F = "'Sora', system-ui, sans-serif";
const DISPLAY_F = "'Playfair Display', serif";

function getInitials(name) {
    return (name || '?')
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

function getGreeting() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    return 'Good evening';
}

function formatVisitDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getProviderStatus(provider) {
    const visits = Number(provider?.visits || 0);
    const connectedAt = provider?.connected_at ? new Date(provider.connected_at) : null;
    const lastVisit = provider?.last_visit ? new Date(provider.last_visit) : null;
    const now = new Date();

    if (connectedAt && visits === 0) {
        const connectedDays = (now - connectedAt) / (1000 * 60 * 60 * 24);
        if (connectedDays <= 14) {
            return { label: 'New', background: T.hero, color: T.accent };
        }
    }

    if (lastVisit) {
        const lastVisitDays = (now - lastVisit) / (1000 * 60 * 60 * 24);
        if (lastVisitDays <= 30) {
            return { label: 'Active', background: T.successBg, color: T.success };
        }
    }

    return null;
}

function providerCountLabel(count) {
    return `${count} PROVIDER${count === 1 ? '' : 'S'}`;
}

function GreetingBlock({ firstName, count }) {
    return (
        <section
            style={{
                marginBottom: count > 0 ? 34 : 28,
                animation: 'fadeUp 0.4s ease 0.05s both',
            }}
        >
            <p
                style={{
                    margin: '0 0 10px',
                    fontFamily: F,
                    fontSize: 11,
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: T.accent,
                }}
            >
                Your Relationships
            </p>
            <h1
                style={{
                    margin: '0 0 8px',
                    fontFamily: F,
                    fontSize: 34,
                    fontWeight: 400,
                    letterSpacing: '-0.03em',
                    lineHeight: 1.15,
                    color: T.ink,
                }}
            >
                {getGreeting()},{' '}
                <span
                    style={{
                        fontFamily: DISPLAY_F,
                        fontStyle: 'italic',
                        color: T.accent,
                    }}
                >
                    {firstName || 'there'}.
                </span>
            </h1>
            {count > 0 && (
                <p
                    style={{
                        margin: 0,
                        fontFamily: F,
                        fontSize: 15,
                        color: T.muted,
                        lineHeight: 1.6,
                    }}
                >
                    You have {count} provider{count === 1 ? '' : 's'} in your klique.
                </p>
            )}
        </section>
    );
}

function ProviderCard({ provider, onClick }) {
    const status = getProviderStatus(provider);

    return (
        <button
            type="button"
            onClick={onClick}
            className="group w-full text-left"
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                padding: '20px 24px',
                marginBottom: 10,
                borderRadius: 18,
                border: `1px solid ${T.line}`,
                background: T.card,
                transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
            }}
            onMouseEnter={(event) => {
                event.currentTarget.style.borderColor = T.accent;
                event.currentTarget.style.boxShadow = '0 4px 20px rgba(194,94,74,0.06)';
                event.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(event) => {
                event.currentTarget.style.borderColor = T.line;
                event.currentTarget.style.boxShadow = 'none';
                event.currentTarget.style.transform = 'translateY(0)';
            }}
        >
            <div
                style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: provider.avatar ? T.avatarBg : T.hero,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    flexShrink: 0,
                    overflow: 'hidden',
                    fontFamily: F,
                    fontSize: 17,
                    fontWeight: 500,
                    color: T.muted,
                }}
            >
                {provider.avatar ? (
                    <img
                        src={provider.avatar}
                        alt={provider.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                ) : (
                    getInitials(provider.name)
                )}
                <span
                    style={{
                        position: 'absolute',
                        right: 1,
                        bottom: 1,
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        background: T.success,
                        border: '2.5px solid #FFFFFF',
                    }}
                />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
                <p
                    style={{
                        margin: '0 0 2px',
                        fontFamily: F,
                        fontSize: 16,
                        fontWeight: 500,
                        color: T.ink,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {provider.name}
                </p>
                <p
                    style={{
                        margin: 0,
                        fontFamily: F,
                        fontSize: 13,
                        color: T.muted,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {provider.role || 'Provider'}
                </p>
            </div>

            <div
                style={{
                    display: 'flex',
                    gap: 12,
                    flexShrink: 0,
                    alignItems: 'center',
                }}
            >
                <div style={{ textAlign: 'center' }}>
                    <span
                        style={{
                            display: 'block',
                            marginBottom: 1,
                            fontFamily: F,
                            fontSize: 18,
                            fontWeight: 400,
                            letterSpacing: '-0.03em',
                            color: T.ink,
                        }}
                    >
                        {provider.visits || 0}
                    </span>
                    <span
                        style={{
                            fontFamily: F,
                            fontSize: 10,
                            fontWeight: 500,
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                            color: T.faded,
                        }}
                    >
                        Visits
                    </span>
                </div>
                <div style={{ textAlign: 'center', minWidth: 62 }}>
                    <span
                        style={{
                            display: 'block',
                            marginBottom: 1,
                            fontFamily: F,
                            fontSize: 18,
                            fontWeight: 400,
                            letterSpacing: '-0.03em',
                            color: T.ink,
                        }}
                    >
                        {formatVisitDate(provider.last_visit)}
                    </span>
                    <span
                        style={{
                            fontFamily: F,
                            fontSize: 10,
                            fontWeight: 500,
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                            color: T.faded,
                        }}
                    >
                        Last Visit
                    </span>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 'auto' }}>
                {status && (
                    <span
                        style={{
                            padding: '5px 12px',
                            borderRadius: 9999,
                            fontFamily: F,
                            fontSize: 11,
                            fontWeight: 500,
                            color: status.color,
                            background: status.background,
                            flexShrink: 0,
                        }}
                    >
                        {status.label}
                    </span>
                )}
                <svg
                    width="20"
                    height="20"
                    fill="none"
                    stroke={T.faded}
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                    style={{ flexShrink: 0, display: 'block', transition: 'transform 0.2s ease' }}
                    className="group-hover:translate-x-[3px]"
                >
                    <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
        </button>
    );
}

// Ghost avatars — overlapping circles with user icons
function GhostAvatars() {
    return (
        <div style={{ display: 'flex', marginBottom: 24 }}>
            {[0, 1, 2].map((i) => (
                <div key={i} style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.5)',
                    border: '2px solid rgba(255,255,255,0.7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginLeft: i > 0 ? -12 : 0,
                    zIndex: 3 - i,
                    flexShrink: 0,
                }}>
                    <svg width="20" height="20" fill="none" stroke={T.faded} strokeWidth="1.5" viewBox="0 0 24 24" style={{ opacity: 1 - i * 0.25 }}>
                        <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            ))}
        </div>
    );
}

// Full empty state hero card — shown when kliques.length === 0
function EmptyKliquesHero() {
    const TOPO = `url("data:image/svg+xml,%3Csvg width='400' height='400' viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 200 Q 100 100 200 200 T 400 200' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M-50 250 Q 50 150 150 250 T 350 250' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M50 150 Q 150 50 250 150 T 450 150' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3C/svg%3E")`;
    return (
        <div style={{
            background: T.hero, borderRadius: 28, padding: '32px 28px',
            position: 'relative', overflow: 'hidden', marginBottom: 20,
            animation: 'fadeUp 0.4s ease 0.05s both',
        }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: TOPO, backgroundSize: 'cover', opacity: 0.12, borderRadius: 28, pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
                <GhostAvatars />
                <h2 style={{ fontFamily: F, fontSize: 28, fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.2, margin: '16px 0 12px', color: T.ink }}>
                    Your circle starts here.
                </h2>
                <p style={{ fontFamily: F, fontSize: 14, color: T.muted, margin: 0, lineHeight: 1.7 }}>
                    Every great relationship begins with a first step. Book with a provider or accept an invite — your shared history will live here.
                </p>
            </div>
        </div>
    );
}

function InviteHintCard() {
    return (
        <section style={{
            marginTop: 4,
            padding: 20,
            borderRadius: 18,
            background: T.avatarBg,
            display: 'flex',
            gap: 16,
            alignItems: 'flex-start',
            animation: 'fadeUp 0.4s ease 0.19s both',
        }}>
            <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: T.callout,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
                <svg width="18" height="18" fill="none" stroke="#92400E" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
            <div>
                <p style={{ fontFamily: F, fontSize: 14, fontWeight: 500, color: T.ink, margin: '0 0 4px' }}>Got an invite?</p>
                <p style={{ fontFamily: F, fontSize: 13, color: T.muted, margin: 0, lineHeight: 1.6 }}>
                    Tap the link your provider sent you. One tap and you&apos;re connected.
                </p>
            </div>
        </section>
    );
}

function EverythingInOnePlaceCard() {
    return (
        <section style={{
            marginTop: 8,
            padding: 20,
            borderRadius: 18,
            background: T.avatarBg,
            display: 'flex',
            gap: 16,
            alignItems: 'flex-start',
            animation: 'fadeUp 0.4s ease 0.27s both',
        }}>
            <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: 'rgba(140,106,100,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
                <svg width="18" height="18" fill="none" stroke={T.muted} strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
            <div>
                <p style={{ fontFamily: F, fontSize: 14, fontWeight: 500, color: T.ink, margin: '0 0 4px' }}>Everything in one place</p>
                <p style={{ fontFamily: F, fontSize: 13, color: T.muted, margin: 0, lineHeight: 1.6 }}>
                    Session history, messages, and bookings — all tied to each relationship.
                </p>
            </div>
        </section>
    );
}

function ProvidersSection({ kliques, onSelect }) {
    const isEmpty = kliques.length === 0;

    return (
        <section style={{ animation: 'fadeUp 0.4s ease 0.12s both' }}>
            {isEmpty ? (
                <>
                    <EmptyKliquesHero />
                    <InviteHintCard />
                    <EverythingInOnePlaceCard />
                </>
            ) : (
                <>
                    <p style={{
                        margin: '0 0 14px',
                        fontFamily: F,
                        fontSize: 11,
                        fontWeight: 500,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: T.muted,
                    }}>
                        {providerCountLabel(kliques.length)}
                    </p>
                    {kliques.map((provider) => (
                        <ProviderCard
                            key={provider.provider_id}
                            provider={provider}
                            onClick={() => onSelect(provider.provider_id)}
                        />
                    ))}
                </>
            )}
        </section>
    );
}

const AppDashboard = () => {
    const navigate = useNavigate();
    const { onMenu, isDesktop } = useOutletContext() || {};
    const { session, profile: sessionProfile } = useSession();
    const { unreadCount } = useNotifications();
    const [kliques, setKliques] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const clientId = session?.user?.id;
    const accessToken = session?.accessToken;

    useEffect(() => {
        let active = true;

        if (!accessToken) {
            setLoading(false);
            return () => {
                active = false;
            };
        }

        const fetchKliques = async () => {
            if (active) {
                setLoading(true);
                setError(null);
            }
            try {
                const data = await request('/client/kliques');
                if (!active) return;
                setKliques(Array.isArray(data.kliques) ? data.kliques : []);
            } catch (err) {
                if (!active) return;
                console.error('Failed to load kliques:', err);
                setError('Could not load your kliques.');
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        fetchKliques();
        return () => {
            active = false;
        };
    }, [accessToken, clientId]);

    useEffect(() => {
        if (!supabase || !clientId) return undefined;

        const refresh = async () => {
            try {
                const data = await request('/client/kliques');
                setKliques(Array.isArray(data.kliques) ? data.kliques : []);
            } catch (_) {}
        };

        const channel = supabase
            .channel(`client-kliques:${clientId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'provider_clients',
                    filter: `client_id=eq.${clientId}`,
                },
                refresh,
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'bookings',
                    filter: `client_id=eq.${clientId}`,
                },
                refresh,
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [clientId]);

    const firstName = useMemo(() => {
        const fullName = sessionProfile?.name || session?.user?.user_metadata?.full_name || '';
        return fullName.trim().split(/\s+/)[0] || 'there';
    }, [sessionProfile?.name, session?.user?.user_metadata?.full_name]);

    const content = (
        <>
            <style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>

            <GreetingBlock firstName={firstName} count={kliques.length} />

            {loading && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
                    <div
                        style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            border: `2px solid ${T.accent}`,
                            borderTopColor: 'transparent',
                            animation: 'spin 0.7s linear infinite',
                        }}
                    />
                </div>
            )}

            {!loading && error && (
                <p style={{ margin: 0, fontFamily: F, fontSize: 14, color: T.muted }}>
                    {error}
                </p>
            )}

            {!loading && !error && (
                <ProvidersSection
                    kliques={kliques}
                    onSelect={(providerId) => navigate(`/app/relationship/${providerId}`)}
                />
            )}
        </>
    );

    if (isDesktop) {
        return (
            <div style={{ padding: '0 40px 60px', fontFamily: F }}>
                <div style={{ maxWidth: 900, margin: '0 auto' }}>
                    {content}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen" style={{ background: T.base }}>
            <Header onMenu={onMenu} onNotif={() => navigate('/app/notifications')} notifCount={unreadCount} showAvatar={false} />
            <div style={{ padding: '0 20px 24px', flex: 1 }}>
                {content}
            </div>
            <Footer />
        </div>
    );
};

export default AppDashboard;
