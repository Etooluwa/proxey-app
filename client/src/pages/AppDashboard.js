import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useSession } from '../auth/authContext';
import { request } from '../data/apiClient';
import { supabase } from '../utils/supabase';
import Header from '../components/ui/Header';
import Footer from '../components/ui/Footer';

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
                    gap: 20,
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
                style={{
                    flexShrink: 0,
                    transition: 'transform 0.2s ease, color 0.2s ease',
                }}
                className="group-hover:translate-x-[3px]"
            >
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </button>
    );
}

function GhostProviderCard() {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                padding: '20px 24px',
                marginBottom: 10,
                borderRadius: 18,
                border: `1px solid ${T.line}`,
                background: T.card,
                opacity: 0.35,
                pointerEvents: 'none',
            }}
        >
            <div
                style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: T.avatarBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontFamily: F,
                    fontSize: 20,
                    fontWeight: 500,
                    color: T.faded,
                }}
            >
                +
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: '0 0 2px', fontFamily: F, fontSize: 16, fontWeight: 500, color: T.faded }}>
                    Your next connection
                </p>
                <p style={{ margin: 0, fontFamily: F, fontSize: 13, color: T.muted }}>
                    Accept an invite or book a session
                </p>
            </div>
            <svg width="20" height="20" fill="none" stroke={T.faded} strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </div>
    );
}

function InviteHintCard() {
    return (
        <section
            style={{
                marginTop: 28,
                padding: 24,
                borderRadius: 18,
                background: T.avatarBg,
                display: 'flex',
                gap: 16,
                alignItems: 'flex-start',
                animation: 'fadeUp 0.4s ease 0.19s both',
            }}
        >
            <div
                style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    background: T.callout,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}
            >
                <svg width="20" height="20" fill="none" stroke="#92400E" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
            <p style={{ margin: 0, fontFamily: F, fontSize: 14, color: T.muted, lineHeight: 1.6 }}>
                <strong style={{ color: T.ink, fontWeight: 500 }}>Got an invite link?</strong>{' '}
                Tap the link your provider sent you — you&apos;ll be connected instantly and they&apos;ll appear here.
            </p>
        </section>
    );
}

function ProvidersSection({ kliques, onSelect }) {
    const showGhost = kliques.length < 3;

    return (
        <section style={{ animation: 'fadeUp 0.4s ease 0.12s both' }}>
            {kliques.length > 0 && (
                <p
                    style={{
                        margin: '0 0 14px',
                        fontFamily: F,
                        fontSize: 11,
                        fontWeight: 500,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: T.muted,
                    }}
                >
                    {providerCountLabel(kliques.length)}
                </p>
            )}

            {kliques.map((provider) => (
                <ProviderCard
                    key={provider.provider_id}
                    provider={provider}
                    onClick={() => onSelect(provider.provider_id)}
                />
            ))}

            {showGhost && <GhostProviderCard />}
            {showGhost && <InviteHintCard />}
        </section>
    );
}

const AppDashboard = () => {
    const navigate = useNavigate();
    const { onMenu, isDesktop } = useOutletContext() || {};
    const { session, profile: sessionProfile } = useSession();
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
                setKliques(Array.isArray(data.kliques) ? data.kliques : []);
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
                setKliques(Array.isArray(data.kliques) ? data.kliques : []);
            } catch (_) {}
        };

        const channel = supabase
            .channel(`client-kliques:${session.user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'provider_clients',
                    filter: `client_id=eq.${session.user.id}`,
                },
                refresh,
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'bookings',
                    filter: `client_id=eq.${session.user.id}`,
                },
                refresh,
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [session?.user?.id]);

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
            <Header onMenu={onMenu} showAvatar={false} />
            <div style={{ padding: '0 20px 24px', flex: 1 }}>
                {content}
            </div>
            <Footer />
        </div>
    );
};

export default AppDashboard;
