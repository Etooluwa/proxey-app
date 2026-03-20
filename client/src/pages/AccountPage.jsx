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

// ─── Settings rows ────────────────────────────────────────────────────────────

const SETTINGS = [
    { label: 'Personal details',   sub: 'Name, email, phone' },
    { label: 'Payment methods',    sub: 'Manage your cards' },
    { label: 'Notifications',      sub: 'Email, push, SMS' },
    { label: 'Privacy & security', sub: 'Password, data' },
    { label: 'Help & support',     sub: 'FAQ, contact us' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function memberSince(ts) {
    if (!ts) return null;
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const AccountPage = () => {
    const { onMenu } = useOutletContext() || {};
    const { session, profile, logout } = useSession();
    const navigate = useNavigate();

    // Providers have a dedicated profile page
    useEffect(() => {
        if (session?.user?.role === 'provider') {
            navigate('/provider/profile', { replace: true });
        }
    }, [session?.user?.role, navigate]);

    const displayName = profile?.name || session?.user?.email?.split('@')[0] || 'You';
    const since = memberSince(profile?.created_at || session?.user?.created_at);

    return (
        <div className="flex flex-col min-h-screen bg-base">
            <Header onMenu={onMenu} showAvatar={false} />

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

                {SETTINGS.map(({ label, sub }) => (
                    <div key={label}>
                        <button className="w-full flex items-center justify-between py-5 text-left focus:outline-none active:bg-avatarBg/40 transition-colors">
                            <div>
                                <p className="text-[16px] text-ink m-0 mb-0.5">{label}</p>
                                <p className="text-[13px] text-muted m-0">{sub}</p>
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
