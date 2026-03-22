import React, { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useSession } from '../auth/authContext';
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

const FEATURES = [
    {
        icon: (
            <svg width="18" height="18" fill="none" stroke="#C25E4A" strokeWidth="1.75" viewBox="0 0 24 24">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        label: 'Full history in one place',
    },
    {
        icon: (
            <svg width="18" height="18" fill="none" stroke="#C25E4A" strokeWidth="1.75" viewBox="0 0 24 24">
                <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        label: 'Rebook in seconds',
    },
    {
        icon: (
            <svg width="18" height="18" fill="none" stroke="#C25E4A" strokeWidth="1.75" viewBox="0 0 24 24">
                <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        label: 'Message directly',
    },
];

const ClientEmptyKliques = ({ onBrowse }) => (
    <div className="flex-1 flex flex-col gap-5 pb-4">
        {/* Hero card with ghost avatars */}
        <HeroCard>
            {/* Ghost avatar circles */}
            <div className="flex justify-center items-center gap-[-8px] mb-6">
                {[0, 1, 2].map((i) => (
                    <div
                        key={i}
                        className="w-14 h-14 rounded-full border-2 border-white/60 -mx-1.5"
                        style={{ background: 'rgba(194,94,74,0.12)' }}
                    />
                ))}
            </div>

            <p className="text-[24px] font-semibold text-ink text-center leading-tight tracking-[-0.02em] mb-2">
                Your circle<br />starts here.
            </p>
            <p className="text-[14px] text-muted text-center leading-relaxed mb-6">
                Book with a provider or accept an invite to start building your history together.
            </p>

            <button
                onClick={onBrowse}
                className="w-full py-3 rounded-pill bg-ink text-white text-[14px] font-semibold"
            >
                Find a Provider
            </button>
        </HeroCard>

        {/* Feature rows */}
        <div className="flex flex-col">
            {FEATURES.map((f, i) => (
                <React.Fragment key={f.label}>
                    <div className="flex items-center gap-3 py-3.5 px-1">
                        <div className="w-8 h-8 rounded-full bg-avatarBg flex items-center justify-center flex-shrink-0">
                            {f.icon}
                        </div>
                        <span className="text-[14px] font-medium text-ink">{f.label}</span>
                    </div>
                    {i < FEATURES.length - 1 && <Divider />}
                </React.Fragment>
            ))}
        </div>

        {/* Invite link callout */}
        <div className="flex items-start gap-3 px-4 py-4 rounded-[14px] bg-callout">
            <div className="w-8 h-8 rounded-full bg-white/60 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg width="16" height="16" fill="none" stroke="#C25E4A" strokeWidth="1.75" viewBox="0 0 24 24">
                    <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
            <div>
                <p className="text-[14px] font-semibold text-ink mb-0.5">Got an invite link?</p>
                <p className="text-[13px] text-muted leading-relaxed">
                    If a provider sent you a link, tap it to connect and start building your history together.
                </p>
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
            <Avatar initials={getInitials(provider.name)} size={44} />

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

    const [kliques, setKliques] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!session?.access_token) return;

        const fetchKliques = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch('/api/client/kliques', {
                    headers: { Authorization: `Bearer ${session.access_token}` },
                });
                if (!res.ok) throw new Error('Failed to load');
                const data = await res.json();
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
                        <div style={{ textAlign: 'center', padding: '48px 0' }}>
                            <p style={{ fontFamily: F, fontSize: 18, fontWeight: 600, color: T.ink, margin: '0 0 8px' }}>Your circle starts here.</p>
                            <p style={{ fontFamily: F, fontSize: 14, color: T.muted, margin: '0 0 24px' }}>Book with a provider or accept an invite to start building your history.</p>
                            <button onClick={() => navigate('/app/browse')} style={{ padding: '10px 24px', borderRadius: 12, background: T.ink, border: 'none', fontFamily: F, fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>Find a Provider</button>
                        </div>
                    )}

                    {/* Provider list */}
                    {!loading && !error && kliques.length > 0 && (
                        <>
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
                                            <Avatar initials={getInitials(provider.name)} size={36} />
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
                {!loading && !error && kliques.length === 0 && (
                    <ClientEmptyKliques onBrowse={() => navigate('/app/browse')} />
                )}

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

                        {/* Hairline-separated rows */}
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
