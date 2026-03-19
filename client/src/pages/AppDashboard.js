import React, { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useSession } from '../auth/authContext';
import GradientHeader from '../components/ui/GradientHeader';
import Card from '../components/ui/Card';
import Avatar from '../components/ui/Avatar';
import Footer from '../components/ui/Footer';

// Format ISO date → "Mar 12" or "Feb 28"
function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const AppDashboard = () => {
    const navigate = useNavigate();
    const { onMenu } = useOutletContext() || {};
    const { session } = useSession();

    const [kliques, setKliques] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchKliques = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch('/api/client/kliques', {
                    headers: { Authorization: `Bearer ${session?.access_token}` },
                });
                if (!res.ok) throw new Error('Failed to load');
                const data = await res.json();
                setKliques(data.kliques || []);
            } catch (err) {
                console.error('Failed to load kliques:', err);
                setError('Could not load your kliques. Pull to refresh.');
            } finally {
                setLoading(false);
            }
        };

        if (session?.access_token) fetchKliques();
    }, [session]);

    return (
        <div className="flex flex-col min-h-screen bg-background font-manrope">
            <GradientHeader
                onMenu={onMenu}
                title="My kliques"
                subtitle="Your relationships"
            />

            <div className="px-4 pt-8 flex-1 flex flex-col">
                {loading && (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                    </div>
                )}

                {!loading && error && (
                    <div className="flex-1 flex items-center justify-center">
                        <p className="font-manrope text-[14px] text-muted text-center px-8">{error}</p>
                    </div>
                )}

                {!loading && !error && kliques.length === 0 && (
                    <div className="flex-1 flex flex-col pb-4">
                        {/* Main empty card */}
                        <Card style={{ textAlign: "center", padding: "40px 24px" }}>
                            <div
                                style={{
                                    width: 72,
                                    height: 72,
                                    borderRadius: "50%",
                                    background: "#FFF0E6",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    margin: "0 auto 16px",
                                }}
                            >
                                <svg width="32" height="32" fill="none" stroke="#FF751F" strokeWidth="1.5" viewBox="0 0 24 24">
                                    <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <p style={{ fontFamily: "Manrope, sans-serif", fontSize: "20px", fontWeight: 700, color: "#0D1619", margin: "0 0 8px" }}>
                                No connections yet
                            </p>
                            <p style={{ fontFamily: "Manrope, sans-serif", fontSize: "15px", color: "#6B7280", margin: "0 0 24px", lineHeight: 1.6 }}>
                                When you book with a provider or accept an invite, they'll show up here. Your history, notes, and bookings — all in one place.
                            </p>
                            <button
                                onClick={() => navigate('/app/browse')}
                                style={{
                                    padding: "14px 28px",
                                    borderRadius: "12px",
                                    border: "none",
                                    background: "#0D1619",
                                    color: "#FFFFFF",
                                    fontFamily: "Manrope, sans-serif",
                                    fontSize: "15px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "8px",
                                }}
                            >
                                <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Find a provider
                            </button>
                        </Card>

                        {/* Invite link callout */}
                        <Card style={{ background: "#FFF9E6", display: "flex", gap: "14px", alignItems: "flex-start" }}>
                            <div
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: "10px",
                                    background: "#FDE68A",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                }}
                            >
                                <svg width="18" height="18" fill="none" stroke="#92400E" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <div>
                                <p style={{ fontFamily: "Manrope, sans-serif", fontSize: "15px", fontWeight: 600, color: "#0D1619", margin: "0 0 4px" }}>
                                    Got an invite link?
                                </p>
                                <p style={{ fontFamily: "Manrope, sans-serif", fontSize: "14px", color: "#6B7280", margin: 0, lineHeight: 1.5 }}>
                                    If a provider sent you a link, tap it to connect and start building your history together.
                                </p>
                            </div>
                        </Card>
                    </div>
                )}

                {!loading && !error && kliques.length > 0 && (
                    <div>
                        {kliques.map((provider) => {
                            const initials = (provider.name || '?')
                                .split(' ')
                                .map((w) => w[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase();

                            return (
                                <Card
                                    key={provider.provider_id}
                                    onClick={() => navigate(`/app/relationship/${provider.provider_id}`)}
                                >
                                    <div className="flex items-center gap-3.5">
                                        <Avatar
                                            initials={initials}
                                            src={provider.avatar || undefined}
                                            size={52}
                                            variant="accent"
                                        />

                                        <div className="flex-1 min-w-0">
                                            <p className="font-manrope text-[16px] font-semibold text-foreground m-0 mb-0.5 truncate">
                                                {provider.name}
                                            </p>
                                            {provider.role && (
                                                <p className="font-manrope text-[14px] text-muted m-0 mb-1 truncate">
                                                    {provider.role}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-3">
                                                {provider.rating && (
                                                    <span className="font-manrope text-[12px] text-muted">
                                                        ★ {provider.rating}
                                                    </span>
                                                )}
                                                <span className="font-manrope text-[12px] text-muted">
                                                    {provider.visits} {provider.visits === 1 ? 'visit' : 'visits'}
                                                </span>
                                                <span className="font-manrope text-[12px] text-muted">
                                                    Last: {formatDate(provider.last_visit)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Chevron */}
                                        <svg width="20" height="20" fill="none" stroke="#6B7280" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
                                            <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}

                <Footer />
            </div>
        </div>
    );
};

export default AppDashboard;
