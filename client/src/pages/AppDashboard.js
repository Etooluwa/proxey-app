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
                    <div className="flex-1 flex flex-col items-center justify-center pb-16 gap-3">
                        {/* Empty state illustration */}
                        <div className="w-16 h-16 rounded-full bg-accentLight flex items-center justify-center mb-2">
                            <svg width="32" height="32" fill="none" stroke="#FF751F" strokeWidth="1.5" viewBox="0 0 24 24">
                                <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <p className="font-manrope text-[17px] font-semibold text-foreground">No kliques yet</p>
                        <p className="font-manrope text-[14px] text-muted text-center px-10">
                            Book a service to start building your network of trusted professionals.
                        </p>
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
