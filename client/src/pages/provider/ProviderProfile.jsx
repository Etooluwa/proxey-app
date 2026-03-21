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
import { request } from '../../data/apiClient';
import Header from '../../components/ui/Header';
import Avatar from '../../components/ui/Avatar';
import Divider from '../../components/ui/Divider';
import Footer from '../../components/ui/Footer';
import { ArrowUpRight } from '@phosphor-icons/react';

// ─── Settings rows ────────────────────────────────────────────────────────────

const SETTINGS = [
    { label: 'Personal details',    sub: 'Name, email, phone' },
    { label: 'Business details',    sub: 'Studio name, address' },
    { label: 'Photos & portfolio',  sub: 'Manage gallery images' },
    { label: 'Payouts & billing',   sub: 'Stripe Connect' },
    { label: 'Working hours',       sub: 'Availability schedule',  route: '/provider/availability' },
    { label: 'Notifications',       sub: 'Email, push, SMS' },
    { label: 'Booking settings',    sub: 'Cancellation, buffer times' },
    { label: 'Help & support',      sub: 'FAQ, contact Kliques' },
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

// ─── Stat pill ────────────────────────────────────────────────────────────────

const StatPill = ({ label, value, loading }) => (
    <div
        className="flex-1 flex flex-col items-center py-3 px-2 rounded-[12px]"
        style={{ background: '#F2EBE5' }}
    >
        {loading ? (
            <div className="h-5 w-10 bg-line/60 rounded animate-pulse mb-1" />
        ) : (
            <span
                className="text-[18px] font-semibold tracking-[-0.02em] mb-0.5"
                style={{ color: '#C25E4A' }}
            >
                {value}
            </span>
        )}
        <span className="text-[11px] uppercase tracking-[0.05em] font-medium text-muted">
            {label}
        </span>
    </div>
);

// ─── Settings row ─────────────────────────────────────────────────────────────

const SettingsRow = ({ label, sub, onClick }) => (
    <>
        <button
            onClick={onClick}
            className="w-full flex items-center gap-4 py-5 px-1 text-left focus:outline-none active:bg-avatarBg/40 transition-colors"
        >
            <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-ink m-0">{label}</p>
                <p className="text-[13px] text-muted m-0 mt-0.5">{sub}</p>
            </div>
            <ArrowUpRight size={18} color="#B0948F" weight="regular" className="flex-shrink-0" />
        </button>
        <Divider />
    </>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const ProviderProfile = () => {
    const { onMenu } = useOutletContext() || {};
    const navigate = useNavigate();
    const { logout } = useSession();

    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [loadingStats, setLoadingStats] = useState(true);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            try {
                const [profileData, statsData] = await Promise.all([
                    fetchProviderProfile(),
                    request('/provider/stats').catch(() => null),
                ]);
                if (!cancelled) {
                    setProfile(profileData);
                    setStats(statsData?.stats || null);
                }
            } catch (err) {
                console.error('[ProviderProfile] load error:', err);
            } finally {
                if (!cancelled) {
                    setLoadingProfile(false);
                    setLoadingStats(false);
                }
            }
        }
        load();
        return () => { cancelled = true; };
    }, []);

    const initials = getInitials(profile);
    const name = buildName(profile);
    const subtitle = buildSubtitle(profile);

    const rating = stats?.rating ? `${stats.rating} ★` : '—';
    const reviews = stats?.reviews ?? '—';
    const clients = stats?.clients ?? '—';

    const handleRowTap = (row) => {
        if (row.route) navigate(row.route);
        // Other rows are placeholders for now — future modals/sub-pages
    };

    const handleSignOut = async () => {
        await logout();
        navigate('/auth/sign-in', { replace: true });
    };

    return (
        <div className="flex flex-col min-h-screen bg-base">
            <Header onMenu={onMenu} showAvatar initials={initials} />

            <div className="px-5 pb-10 flex-1 flex flex-col">

                {/* ── Avatar + name + subtitle ── */}
                <div className="flex flex-col items-center pt-4 pb-6">
                    {loadingProfile ? (
                        <>
                            <div className="w-[72px] h-[72px] rounded-full bg-line/60 animate-pulse mb-3" />
                            <div className="h-5 w-32 bg-line/60 rounded animate-pulse mb-2" />
                            <div className="h-3.5 w-48 bg-line/60 rounded animate-pulse" />
                        </>
                    ) : (
                        <>
                            <Avatar initials={initials} size={72} />
                            <h2 className="text-[22px] font-semibold text-ink tracking-[-0.02em] mt-3 mb-0.5 text-center">
                                {name}
                            </h2>
                            <p className="text-[14px] text-muted text-center m-0">{subtitle}</p>
                        </>
                    )}
                </div>

                {/* ── Stats row ── */}
                <div className="flex gap-2.5 mb-7">
                    <StatPill label="Rating"  value={rating}  loading={loadingStats} />
                    <StatPill label="Reviews" value={reviews} loading={loadingStats} />
                    <StatPill label="Clients" value={clients} loading={loadingStats} />
                </div>

                {/* ── Settings rows ── */}
                <Divider />
                {SETTINGS.map((row) => (
                    <SettingsRow
                        key={row.label}
                        label={row.label}
                        sub={row.sub}
                        onClick={() => handleRowTap(row)}
                    />
                ))}

                {/* ── Sign out ── */}
                <button
                    onClick={handleSignOut}
                    className="w-full mt-4 py-4 rounded-[12px] text-[15px] font-semibold focus:outline-none"
                    style={{
                        background: '#FDEDEA',
                        color: '#B04040',
                        border: 'none',
                    }}
                >
                    Sign out
                </button>

            </div>

            <Footer />
        </div>
    );
};

export default ProviderProfile;
