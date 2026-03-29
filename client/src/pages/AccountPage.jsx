/**
 * AccountPage — v6 Warm Editorial
 * Route: /app/account
 */
import { useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useSession } from '../auth/authContext';
import Header from '../components/ui/Header';
import Lbl from '../components/ui/Lbl';
import Divider from '../components/ui/Divider';
import ArrowIcon from '../components/ui/ArrowIcon';
import Footer from '../components/ui/Footer';

const T = { ink: '#3D231E', muted: '#8C6A64', faded: '#B0948F', accent: '#C25E4A', line: 'rgba(140,106,100,0.18)', card: '#FFFFFF', hero: '#FDDCC6', avatarBg: '#F2EBE5', success: '#5A8A5E', successBg: '#EBF2EC', dangerBg: '#FDEDEA' };
const F = "'Sora',system-ui,sans-serif";

// ─── Settings rows ────────────────────────────────────────────────────────────

const SETTINGS = [
    { label: 'Personal details',   sub: 'Name, email, phone',  route: '/app/profile/personal' },
    { label: 'Payment methods',    sub: 'Manage your cards',   route: '/app/profile/payment-methods' },
    { label: 'Notifications',      sub: 'Email, push, SMS',    route: '/app/profile/notifications' },
    { label: 'Privacy & security', sub: 'Password, data',      route: '/app/profile/privacy' },
    { label: 'Help & support',     sub: 'FAQ, contact us',     route: '/app/profile/help' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function memberSince(ts) {
    if (!ts) return null;
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const AccountPage = () => {
    const { onMenu, isDesktop } = useOutletContext() || {};
    const { session, profile, logout } = useSession();
    const navigate = useNavigate();

    const handleRowTap = (row) => { if (row.route) navigate(row.route); };

    // Providers have a dedicated profile page
    useEffect(() => {
        if (session?.user?.role === 'provider') {
            navigate('/provider/profile', { replace: true });
        }
    }, [session?.user?.role, navigate]);

    const displayName = profile?.name || session?.user?.email?.split('@')[0] || 'You';
    const since = memberSince(profile?.created_at || session?.user?.created_at);


    if (isDesktop) {
        return (
            <div style={{ padding: '40px', fontFamily: F }}>
                <div style={{ maxWidth: 640, margin: '0 auto' }}>
                    {/* Identity */}
                    <div style={{ marginBottom: 32 }}>
                        <h1 style={{ fontFamily: F, fontSize: 28, fontWeight: 600, color: T.ink, letterSpacing: '-0.02em', margin: '0 0 4px' }}>{displayName}</h1>
                        {since && <span style={{ fontFamily: F, fontSize: 11, fontWeight: 500, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Member since {since}</span>}
                    </div>

                    {/* Settings list */}
                    <div style={{ background: T.card, borderRadius: 16, border: `1px solid ${T.line}`, overflow: 'hidden', marginBottom: 16 }}>
                        {SETTINGS.map((row, i) => (
                            <button key={row.label} onClick={() => handleRowTap(row)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '16px 20px', background: 'none', border: 'none', borderBottom: i < SETTINGS.length - 1 ? `1px solid ${T.line}` : 'none', cursor: 'pointer', textAlign: 'left' }}>
                                <div>
                                    <p style={{ fontFamily: F, fontSize: 14, fontWeight: 500, color: T.ink, margin: '0 0 2px' }}>{row.label}</p>
                                    <p style={{ fontFamily: F, fontSize: 12, color: T.muted, margin: 0 }}>{row.sub}</p>
                                </div>
                                <svg width="16" height="16" fill="none" stroke={T.faded} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M7 17L17 7M17 7H7M17 7v10" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </button>
                        ))}
                    </div>

                    <button onClick={logout} style={{ width: '100%', padding: '13px', borderRadius: 12, background: T.dangerBg, border: 'none', fontFamily: F, fontSize: 14, fontWeight: 600, color: '#B04040', cursor: 'pointer' }}>
                        Sign Out
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-base">
            <Header onMenu={onMenu} onNotif={() => navigate('/app/notifications')} showAvatar={false} />

            {/* ── Identity ── */}
            <div className="px-5 pb-5">
                <h1 className="text-[24px] font-semibold text-ink tracking-[-0.02em] m-0 mb-0.5 leading-tight">
                    {displayName}
                </h1>
                {since && <Lbl>Member since {since}</Lbl>}
            </div>

            {/* ── Settings rows ── */}
            <div className="px-5 flex-1 flex flex-col">
                <Divider />

                {SETTINGS.map((row) => (
                    <div key={row.label}>
                        <button onClick={() => handleRowTap(row)} className="w-full flex items-center justify-between py-5 text-left focus:outline-none active:bg-avatarBg/40 transition-colors">
                            <div>
                                <p className="text-[16px] text-ink m-0 mb-0.5">{row.label}</p>
                                <p className="text-[13px] text-muted m-0">{row.sub}</p>
                            </div>
                            <ArrowIcon size={18} />
                        </button>
                        <Divider />
                    </div>
                ))}

                {/* ── Sign out ── */}
                <button
                    onClick={logout}
                    className="w-full mt-6 py-3.5 rounded-[12px] text-[14px] font-semibold focus:outline-none"
                    style={{ background: '#FDEDEA', color: '#B04040', border: 'none' }}
                >
                    Sign Out
                </button>

                <Footer />
            </div>
        </div>
    );
};

export default AccountPage;
