/**
 * ProviderProfile — v6 Warm Editorial
 * Route: /provider/profile
 *
 * API:
 *   GET /api/provider/me     → { profile: { first_name, last_name, business_name, city, ... } }
 *   GET /api/provider/stats  → { stats: { rating, reviews, clients } }
 */
import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useSession } from '../../auth/authContext';
import { fetchProviderProfile } from '../../data/provider';
import Header from '../../components/ui/Header';
import Divider from '../../components/ui/Divider';
import Footer from '../../components/ui/Footer';
import { ArrowUpRight } from '@phosphor-icons/react';

// ─── Desktop tokens ────────────────────────────────────────────────────────────
const DT = { ink: '#3D231E', muted: '#8C6A64', faded: '#B0948F', accent: '#C25E4A', line: 'rgba(140,106,100,0.18)', card: '#FFFFFF', hero: '#FDDCC6', avatarBg: '#F2EBE5' };
const F = "'Sora',system-ui,sans-serif";

// ─── Topo texture ─────────────────────────────────────────────────────────────

const TOPO_SVG = `url("data:image/svg+xml,%3Csvg width='400' height='400' viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 200 Q 100 100 200 200 T 400 200' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M-50 250 Q 50 150 150 250 T 350 250' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M50 150 Q 150 50 250 150 T 450 150' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M0 300 Q 100 200 200 300 T 400 300' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M100 50 Q 200 -50 300 50 T 500 50' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M200 350 Q 250 250 350 300' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3C/svg%3E")`;

// ─── Settings rows ────────────────────────────────────────────────────────────

const SETTINGS = [
    { label: 'Personal details',    sub: 'Name, email, phone',         route: '/provider/profile/personal' },
    { label: 'Business details',    sub: 'Studio name, address',       route: '/provider/profile/business' },
    { label: 'Photos & portfolio',  sub: 'Manage gallery images',      route: '/provider/profile/photos' },
    { label: 'Payouts & billing',   sub: 'Stripe Connect',             route: '/provider/profile/payouts' },
    { label: 'Working hours',       sub: 'Availability schedule',      route: '/provider/calendar/availability' },
    { label: 'Notifications',       sub: 'Email, push, SMS',           route: '/provider/profile/notifications' },
    { label: 'Booking settings',    sub: 'Cancellation, buffer times', route: '/provider/profile/booking-settings' },
    { label: 'Help & support',      sub: 'FAQ, contact Kliques',       route: '/provider/profile/help' },
    { label: 'Delete account',      sub: 'Permanently remove account', route: '/provider/profile/delete', danger: true },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(profile) {
    if (!profile) return '?';
    const f = profile.first_name?.[0] || '';
    const l = profile.last_name?.[0] || '';
    return (f + l).toUpperCase() || '?';
}

function buildSubtitle(profile) {
    const parts = [];
    if (profile?.business_name) parts.push(profile.business_name);
    if (profile?.city) parts.push(profile.city);
    return parts.join(' · ') || 'Provider';
}

function buildName(profile) {
    if (!profile) return '';
    const parts = [profile.first_name, profile.last_name].filter(Boolean);
    return parts.join(' ') || profile.name || 'Provider';
}

// ─── Settings row ─────────────────────────────────────────────────────────────

const SettingsRow = ({ label, sub, onClick, danger }) => (
    <>
        <button
            onClick={onClick}
            className="w-full flex items-center gap-4 py-5 px-1 text-left focus:outline-none"
            style={{ background: 'none', border: 'none' }}
        >
            <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold m-0" style={{ color: danger ? '#B04040' : undefined }}>{label}</p>
                <p className="text-[13px] text-muted m-0 mt-0.5">{sub}</p>
            </div>
            <ArrowUpRight size={18} color={danger ? '#B04040' : '#B0948F'} weight="regular" className="flex-shrink-0" />
        </button>
        <Divider />
    </>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const ProviderProfile = () => {
    const { onMenu, isDesktop } = useOutletContext() || {};
    const navigate = useNavigate();
    const { logout } = useSession();

    const [profile, setProfile] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(true);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            try {
                const profileData = await fetchProviderProfile();
                if (!cancelled) {
                    setProfile(profileData);
                }
            } catch (err) {
                console.error('[ProviderProfile] load error:', err);
            } finally {
                if (!cancelled) {
                    setLoadingProfile(false);
                }
            }
        }
        load();
        return () => { cancelled = true; };
    }, []);

    const initials = getInitials(profile);
    const name = buildName(profile);
    const subtitle = buildSubtitle(profile);
    const avatarSrc = profile?.photo || profile?.avatar || '';

    const handleRowTap = (row) => {
        if (row.route) navigate(row.route);
    };

    const handleSignOut = async () => {
        await logout();
        navigate('/login', { replace: true });
    };

    // ── Desktop layout ─────────────────────────────────────────────────────────
    if (isDesktop) {
        return (
            <div style={{ padding: '40px', fontFamily: F }}>
                <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24, alignItems: 'start' }}>
                    {/* Left: Profile card */}
                    <div style={{ background: DT.card, borderRadius: 20, border: `1px solid ${DT.line}`, padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        {/* Avatar */}
                        {loadingProfile ? (
                            <div style={{ width: 80, height: 80, borderRadius: '50%', background: DT.avatarBg, marginBottom: 16 }} />
                        ) : (
                            <div style={{ width: 80, height: 80, borderRadius: '50%', background: DT.avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 600, color: DT.muted, fontFamily: F, marginBottom: 16, flexShrink: 0, overflow: 'hidden' }}>
                                {avatarSrc ? (
                                    <img src={avatarSrc} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    initials
                                )}
                            </div>
                        )}
                        {/* Name */}
                        {loadingProfile ? (
                            <div style={{ height: 22, width: 140, background: DT.avatarBg, borderRadius: 6, marginBottom: 6 }} />
                        ) : (
                            <h2 style={{ fontFamily: F, fontSize: 20, fontWeight: 600, color: DT.ink, margin: '0 0 4px', letterSpacing: '-0.02em' }}>{name}</h2>
                        )}
                        <p style={{ fontFamily: F, fontSize: 13, color: DT.muted, margin: '0 0 20px' }}>{subtitle}</p>

                    </div>

                    {/* Right: Settings list */}
                    <div style={{ background: DT.card, borderRadius: 20, border: `1px solid ${DT.line}`, overflow: 'hidden' }}>
                        {SETTINGS.map((row, i) => (
                            <button
                                key={row.label}
                                onClick={() => handleRowTap(row)}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '20px 24px', background: 'none', border: 'none', borderBottom: `1px solid ${DT.line}`, cursor: 'pointer', textAlign: 'left' }}
                            >
                                <div>
                                    <p style={{ fontFamily: F, fontSize: 15, fontWeight: 500, color: row.danger ? '#B04040' : DT.ink, margin: '0 0 2px' }}>{row.label}</p>
                                    <p style={{ fontFamily: F, fontSize: 13, color: DT.muted, margin: 0 }}>{row.sub}</p>
                                </div>
                                <ArrowUpRight size={18} color={row.danger ? '#B04040' : DT.accent} weight="regular" />
                            </button>
                        ))}
                        <div style={{ padding: '20px 24px' }}>
                            <button
                                onClick={handleSignOut}
                                style={{ width: '100%', padding: '13px', borderRadius: 12, background: '#FDEDEA', border: 'none', fontFamily: F, fontSize: 14, fontWeight: 600, color: '#B04040', cursor: 'pointer' }}
                            >
                                Sign out
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-base">
            <Header onMenu={onMenu} showAvatar initials={initials} avatarSrc={avatarSrc} onNotif={() => navigate('/provider/notifications')} />

            {/* ── Hero card ── */}
            <div className="px-4 pt-2 pb-1">
                <div
                    className="relative overflow-hidden flex flex-col items-center justify-end px-6 pb-7 pt-10"
                    style={{ background: '#FDDCC6', borderRadius: 28 }}
                >
                    {/* Topo texture */}
                    <div
                        aria-hidden="true"
                        className="absolute inset-0 pointer-events-none"
                        style={{ backgroundImage: TOPO_SVG, backgroundSize: 'cover', opacity: 0.12 }}
                    />

                    {/* Avatar */}
                    <div className="relative z-10 mb-3">
                        {loadingProfile ? (
                            <div
                                className="rounded-full animate-pulse"
                                style={{ width: 80, height: 80, background: 'rgba(61,35,30,0.12)' }}
                            />
                        ) : (
                            <div
                                className="rounded-full flex items-center justify-center overflow-hidden"
                                style={{
                                    width: 80,
                                    height: 80,
                                    background: '#3D231E',
                                    fontSize: 28,
                                    fontWeight: 600,
                                    color: '#FDDCC6',
                                    fontFamily: "'Sora', system-ui, sans-serif",
                                }}
                            >
                                {avatarSrc ? (
                                    <img src={avatarSrc} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    initials
                                )}
                            </div>
                        )}
                    </div>

                    {/* Name + subtitle */}
                    <div className="relative z-10 text-center">
                        {loadingProfile ? (
                            <>
                                <div className="h-6 w-40 rounded-lg animate-pulse mx-auto mb-2"
                                    style={{ background: 'rgba(61,35,30,0.12)' }} />
                                <div className="h-4 w-28 rounded animate-pulse mx-auto"
                                    style={{ background: 'rgba(61,35,30,0.08)' }} />
                            </>
                        ) : (
                            <>
                                <h2
                                    className="font-semibold tracking-[-0.02em] text-center m-0 mb-1"
                                    style={{ fontSize: 22, color: '#3D231E' }}
                                >
                                    {name}
                                </h2>
                                <p className="text-[13px] text-center m-0" style={{ color: '#8C6A64' }}>
                                    {subtitle}
                                </p>
                            </>
                        )}
                    </div>

                </div>
            </div>

            {/* ── Settings rows ── */}
            <div className="px-5 flex-1 flex flex-col mt-4">
                <Divider />
                {SETTINGS.map((row) => (
                    <SettingsRow
                        key={row.label}
                        label={row.label}
                        sub={row.sub}
                        onClick={() => handleRowTap(row)}
                        danger={row.danger}
                    />
                ))}

                {/* Sign out */}
                <button
                    onClick={handleSignOut}
                    className="w-full mt-4 py-4 rounded-[12px] text-[15px] font-semibold focus:outline-none"
                    style={{ background: '#FDEDEA', color: '#B04040', border: 'none' }}
                >
                    Sign out
                </button>
            </div>

            <Footer />
        </div>
    );
};

export default ProviderProfile;
