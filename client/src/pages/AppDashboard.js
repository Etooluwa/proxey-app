import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useSession } from '../auth/authContext';
import { useNotifications } from '../contexts/NotificationContext';
import { request } from '../data/apiClient';
import { supabase } from '../utils/supabase';
import Header from '../components/ui/Header';
import Avatar from '../components/ui/Avatar';
import Lbl from '../components/ui/Lbl';
import ArrowIcon from '../components/ui/ArrowIcon';
import Footer from '../components/ui/Footer';

const T = {
    ink: '#3D231E',
    muted: '#8C6A64',
    faded: '#B0948F',
    accent: '#C25E4A',
    line: 'rgba(140,106,100,0.18)',
    card: '#FFFFFF',
    hero: '#FDDCC6',
    avatarBg: '#F2EBE5',
    success: '#5A8A5E',
    successBg: '#EEF3ED',
    warmCard: '#F2E9E2',
};

const F = "'Sora',system-ui,sans-serif";
const DISPLAY_F = "'Cormorant Garamond', Georgia, serif";

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

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
}

function getRelationshipStatus(provider) {
    return (provider?.visits || 0) === 0 ? 'New' : 'Active';
}

function statusPillStyles(provider) {
    return getRelationshipStatus(provider) === 'New'
        ? { background: '#FDE2D3', color: T.accent }
        : { background: T.successBg, color: T.success };
}

function statusDotColor(provider) {
    return getRelationshipStatus(provider) === 'New' ? T.success : T.accent;
}

function SummaryIntro({ firstName, kliquesCount }) {
    const greeting = getGreeting();

    return (
        <div style={{ marginBottom: 28 }}>
            <p style={{ fontFamily: F, fontSize: 13, fontWeight: 500, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>
                Your Relationships
            </p>
            <h1
                style={{
                    fontFamily: F,
                    fontSize: 'clamp(2.35rem,4vw,3.4rem)',
                    fontWeight: 600,
                    color: T.ink,
                    margin: '0 0 10px',
                    letterSpacing: '-0.055em',
                    lineHeight: 0.98,
                }}
            >
                {greeting},{' '}
                <span style={{ fontFamily: DISPLAY_F, fontStyle: 'italic', color: T.accent, fontWeight: 600 }}>
                    {firstName || 'there'}
                </span>
                .
            </h1>
            <p style={{ fontFamily: F, fontSize: 14, color: T.muted, margin: 0, lineHeight: 1.6 }}>
                {kliquesCount > 0
                    ? `You have ${kliquesCount} provider${kliquesCount !== 1 ? 's' : ''} in your klique.`
                    : 'Your providers will appear here.'}
            </p>
        </div>
    );
}

function InviteHintCard({ compact = false }) {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 16,
                padding: compact ? '16px 18px' : '18px 22px',
                borderRadius: 18,
                background: T.warmCard,
                border: `1px solid ${T.line}`,
            }}
        >
            <div
                style={{
                    width: compact ? 40 : 42,
                    height: compact ? 40 : 42,
                    borderRadius: 14,
                    background: '#FFF8F1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}
            >
                <svg width="18" height="18" fill="none" stroke={T.accent} strokeWidth="1.6" viewBox="0 0 24 24">
                    <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
            <p style={{ fontFamily: F, fontSize: compact ? 13 : 14, color: T.muted, margin: 0, lineHeight: 1.55 }}>
                <span style={{ color: T.ink, fontWeight: 600 }}>Got an invite link?</span>{' '}
                Tap the link your provider sent you and you&apos;ll be connected instantly.
            </p>
        </div>
    );
}

function NextConnectionCard({ isDesktop = false }) {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: isDesktop ? '18px 22px' : '16px 18px',
                borderRadius: 20,
                border: '1px solid rgba(140,106,100,0.14)',
                background: 'rgba(255,255,255,0.46)',
                opacity: 0.72,
            }}
        >
            <div
                style={{
                    width: isDesktop ? 48 : 44,
                    height: isDesktop ? 48 : 44,
                    borderRadius: '50%',
                    background: '#F6F0EA',
                    color: '#D4C2BA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: F,
                    fontSize: 18,
                    fontWeight: 500,
                    flexShrink: 0,
                }}
            >
                +
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ fontFamily: F, fontSize: isDesktop ? 15 : 14, fontWeight: 600, color: '#D4C2BA', margin: '0 0 4px' }}>
                    Your next connection
                </p>
                <p style={{ fontFamily: F, fontSize: isDesktop ? 14 : 13, color: '#C9B5AD', margin: 0 }}>
                    Accept an invite or book a session
                </p>
            </div>
            <svg width="16" height="16" fill="none" stroke="#D4C2BA" strokeWidth="1.6" viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
        </div>
    );
}

function ReviewBanner({ notification, onReview }) {
    if (!notification) return null;

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                padding: '14px 18px',
                background: '#FFF5E6',
                borderRadius: 14,
                border: '1px solid rgba(194,94,74,0.15)',
                marginBottom: 18,
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <svg width="18" height="18" fill="none" stroke={T.accent} strokeWidth="1.5" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div style={{ minWidth: 0 }}>
                    <p style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: '#92400E', margin: '0 0 2px' }}>
                        How was your last session?
                    </p>
                    <p style={{ fontFamily: F, fontSize: 12, color: '#B45309', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {notification.body || notification.message}
                    </p>
                </div>
            </div>
            <button
                onClick={onReview}
                style={{
                    flexShrink: 0,
                    padding: '8px 16px',
                    borderRadius: 999,
                    background: '#FDDCC6',
                    border: 'none',
                    fontFamily: F,
                    fontSize: 12,
                    fontWeight: 600,
                    color: T.accent,
                    cursor: 'pointer',
                }}
            >
                Leave a review
            </button>
        </div>
    );
}

function ProviderRow({ provider, onClick, isDesktop = false }) {
    const statusStyles = statusPillStyles(provider);

    return (
        <button
            onClick={onClick}
            className="w-full text-left focus:outline-none transition-transform"
            style={{
                padding: isDesktop ? '18px 22px' : '16px 18px',
                borderRadius: 20,
                background: '#FFFFFF',
                border: `1px solid ${T.line}`,
                display: 'grid',
                gridTemplateColumns: isDesktop ? 'minmax(0,1.3fr) auto 36px' : 'minmax(0,1fr) auto',
                alignItems: 'center',
                gap: isDesktop ? 18 : 14,
                boxShadow: '0 1px 0 rgba(140,106,100,0.04)',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                    <Avatar initials={getInitials(provider.name)} size={isDesktop ? 48 : 44} src={provider.avatar || ''} />
                    <span
                        style={{
                            position: 'absolute',
                            right: 1,
                            bottom: 1,
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background: statusDotColor(provider),
                            border: '2px solid #FFFFFF',
                        }}
                    />
                </div>

                <div style={{ minWidth: 0 }}>
                    <p className="text-[15px] font-semibold text-ink m-0 mb-0.5 truncate">
                        {provider.name}
                    </p>
                    <p className="text-[13px] m-0 truncate" style={{ color: T.muted }}>
                        {provider.role || 'Provider'}
                    </p>
                </div>
            </div>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, auto)',
                    alignItems: 'center',
                    gap: isDesktop ? 22 : 14,
                }}
            >
                <div style={{ textAlign: 'center', minWidth: 40 }}>
                    <p style={{ fontFamily: F, fontSize: isDesktop ? 17 : 16, fontWeight: 600, color: T.ink, margin: '0 0 3px' }}>
                        {provider.visits || 0}
                    </p>
                    <span style={{ fontFamily: F, fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: T.faded }}>
                        Visits
                    </span>
                </div>

                <div style={{ textAlign: 'center', minWidth: isDesktop ? 72 : 60 }}>
                    <p style={{ fontFamily: F, fontSize: isDesktop ? 17 : 16, fontWeight: 600, color: T.ink, margin: '0 0 3px' }}>
                        {provider.last_visit ? formatDate(provider.last_visit) : '—'}
                    </p>
                    <span style={{ fontFamily: F, fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: T.faded }}>
                        Last visit
                    </span>
                </div>

                <div
                    style={{
                        padding: '6px 12px',
                        borderRadius: 999,
                        background: statusStyles.background,
                        color: statusStyles.color,
                        fontFamily: F,
                        fontSize: 11,
                        fontWeight: 600,
                        justifySelf: 'start',
                    }}
                >
                    {getRelationshipStatus(provider)}
                </div>
            </div>

            {isDesktop && (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <ArrowIcon size={18} />
                </div>
            )}
        </button>
    );
}

function EmptyState({ firstName }) {
    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingBottom: 16 }}>
            <SummaryIntro firstName={firstName} kliquesCount={0} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <NextConnectionCard />
                <InviteHintCard compact />
            </div>
        </div>
    );
}

const AppDashboard = () => {
    const navigate = useNavigate();
    const { onMenu, isDesktop } = useOutletContext() || {};
    const { session, profile: sessionProfile } = useSession();
    const { notifications } = useNotifications();

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

    const firstName = useMemo(() => (
        (sessionProfile?.name || session?.user?.user_metadata?.full_name || '').split(' ')[0]
    ), [sessionProfile?.name, session?.user?.user_metadata?.full_name]);

    const reviewBookingId = firstReviewNotif?.booking_id || firstReviewNotif?.data?.booking_id;

    if (isDesktop) {
        return (
            <div style={{ padding: '40px', fontFamily: F }}>
                <div style={{ maxWidth: 980, margin: '0 auto' }}>
                    <SummaryIntro firstName={firstName} kliquesCount={kliques.length} />

                    {loading && (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', border: `2px solid ${T.accent}`, borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
                        </div>
                    )}

                    {!loading && error && (
                        <p style={{ fontFamily: F, fontSize: 14, color: T.muted, textAlign: 'center' }}>{error}</p>
                    )}

                    {!loading && !error && kliques.length === 0 && (
                        <div style={{ maxWidth: 760 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <NextConnectionCard isDesktop />
                                <InviteHintCard />
                            </div>
                        </div>
                    )}

                    {!loading && !error && kliques.length > 0 && (
                        <>
                            <ReviewBanner
                                notification={firstReviewNotif}
                                onReview={() => navigate(`/app/review/${reviewBookingId}`)}
                            />

                            <Lbl className="block mb-3">
                                {kliques.length} provider{kliques.length !== 1 ? 's' : ''}
                            </Lbl>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {kliques.map((provider) => (
                                    <ProviderRow
                                        key={provider.provider_id}
                                        provider={provider}
                                        isDesktop
                                        onClick={() => navigate(`/app/relationship/${provider.provider_id}`)}
                                    />
                                ))}
                                <NextConnectionCard isDesktop />
                                <InviteHintCard />
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
                {loading && (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="w-7 h-7 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                    </div>
                )}

                {!loading && error && (
                    <div className="flex-1 flex items-center justify-center">
                        <p className="text-[14px] text-muted text-center px-8">{error}</p>
                    </div>
                )}

                {!loading && !error && kliques.length === 0 && <EmptyState firstName={firstName} />}

                {!loading && !error && kliques.length > 0 && (
                    <div className="flex-1 flex flex-col">
                        <SummaryIntro firstName={firstName} kliquesCount={kliques.length} />

                        <ReviewBanner
                            notification={firstReviewNotif}
                            onReview={() => navigate(`/app/review/${reviewBookingId}`)}
                        />

                        <Lbl className="block mb-3">
                            {kliques.length} provider{kliques.length !== 1 ? 's' : ''}
                        </Lbl>

                        <div className="flex flex-col gap-3">
                            {kliques.map((provider) => (
                                <ProviderRow
                                    key={provider.provider_id}
                                    provider={provider}
                                    onClick={() => navigate(`/app/relationship/${provider.provider_id}`)}
                                />
                            ))}
                            <NextConnectionCard />
                            <InviteHintCard compact />
                        </div>
                    </div>
                )}

                <Footer />
            </div>
        </div>
    );
};

export default AppDashboard;
