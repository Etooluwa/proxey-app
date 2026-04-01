import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useSession } from '../auth/authContext';
import { request } from '../data/apiClient';
import { supabase } from '../utils/supabase';
import Header from '../components/ui/Header';
import Footer from '../components/ui/Footer';
import {
    BOOKING_TOKENS,
    BODY_FONT,
    BookingsEmptyState,
    BookingsPageHeader,
    BookingsTabBar,
    BookingCard,
    CalendarIcon,
    ClockIcon,
    EnvelopeIcon,
} from '../components/bookings/BookingsShared';

function getLocalDateKey(value = new Date()) {
    const raw = value instanceof Date ? value : new Date(String(value).replace('Z', '').replace(/[+-]\d{2}:\d{2}$/, ''));
    const date = isNaN(raw.getTime()) ? new Date(value) : raw;
    if (Number.isNaN(date.getTime())) return null;
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getClientBookingTab(booking, todayKey = getLocalDateKey()) {
    const status = String(booking?.status || '').toLowerCase();
    const bookingDateKey = getLocalDateKey(booking?.scheduled_at);

    if (status === 'pending') return 'pending';
    if (status === 'completed' || status === 'cancelled') return 'past';
    if (status === 'confirmed') {
        if (!bookingDateKey || !todayKey) return 'upcoming';
        return bookingDateKey < todayKey ? 'past' : 'upcoming';
    }

    return null;
}

function getEmptyCopy(tab) {
    if (tab === 'pending') {
        return {
            icon: <EnvelopeIcon />,
            title: 'No pending bookings',
            description: "When you request a booking, it'll show here until your provider confirms.",
        };
    }

    if (tab === 'upcoming') {
        return {
            icon: <CalendarIcon />,
            title: 'Nothing upcoming',
            description: "Once a provider confirms your booking, it'll show up here.",
        };
    }

    return {
        icon: <ClockIcon />,
        title: 'No past sessions',
        description: 'Your completed and cancelled sessions will be listed here.',
    };
}

export default function ClientBookings() {
    const { onMenu, isDesktop } = useOutletContext() || {};
    const navigate = useNavigate();
    const { session } = useSession();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending');

    useEffect(() => {
        const loadBookings = async () => {
            setLoading(true);
            try {
                const data = await request('/bookings/me');
                setBookings(Array.isArray(data?.bookings) ? data.bookings : []);
            } catch (error) {
                console.error('[ClientBookings] load error:', error);
                setBookings([]);
            } finally {
                setLoading(false);
            }
        };

        loadBookings();
    }, []);

    useEffect(() => {
        if (!supabase || !session?.user?.id) return undefined;

        const refresh = async () => {
            try {
                const data = await request('/bookings/me');
                setBookings(Array.isArray(data?.bookings) ? data.bookings : []);
            } catch (_) {}
        };

        const channel = supabase
            .channel(`client-bookings:${session.user.id}`)
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

    const todayKey = getLocalDateKey();

    const pending = useMemo(
        () => bookings
            .filter((booking) => getClientBookingTab(booking, todayKey) === 'pending')
            .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)),
        [bookings, todayKey],
    );

    const upcoming = useMemo(
        () => bookings
            .filter((booking) => getClientBookingTab(booking, todayKey) === 'upcoming')
            .sort((a, b) => new Date(a.scheduled_at || 0) - new Date(b.scheduled_at || 0)),
        [bookings, todayKey],
    );

    const past = useMemo(
        () => bookings
            .filter((booking) => getClientBookingTab(booking, todayKey) === 'past')
            .sort((a, b) => new Date(b.scheduled_at || 0) - new Date(a.scheduled_at || 0)),
        [bookings, todayKey],
    );

    const tabs = [
        { id: 'pending', label: 'Pending', count: pending.length },
        { id: 'upcoming', label: 'Upcoming', count: upcoming.length },
        { id: 'past', label: 'Past', count: past.length },
    ];

    const rows = activeTab === 'pending' ? pending : activeTab === 'upcoming' ? upcoming : past;
    const emptyCopy = getEmptyCopy(activeTab);

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

            <BookingsPageHeader label="Your Sessions" />
            <BookingsTabBar tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

            <div style={{ animation: 'fadeUp 0.4s ease 0.19s both' }}>
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
                        <div
                            style={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                border: `2px solid ${BOOKING_TOKENS.accent}`,
                                borderTopColor: 'transparent',
                                animation: 'spin 0.7s linear infinite',
                            }}
                        />
                    </div>
                ) : rows.length === 0 ? (
                    <BookingsEmptyState
                        icon={emptyCopy.icon}
                        title={emptyCopy.title}
                        description={emptyCopy.description}
                    />
                ) : (
                    rows.map((booking) => (
                        <BookingCard
                            key={booking.id}
                            booking={booking}
                            personName={booking.provider_name || 'Provider'}
                            isDesktop={isDesktop}
                            onClick={() => navigate(`/app/bookings/${booking.id}`)}
                        />
                    ))
                )}
            </div>
        </>
    );

    if (isDesktop) {
        return (
            <div style={{ padding: '0 40px 60px', fontFamily: BODY_FONT }}>
                <div style={{ maxWidth: 900, margin: '0 auto' }}>
                    {content}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen" style={{ background: BOOKING_TOKENS.base }}>
            <Header onMenu={onMenu} onNotif={() => navigate('/app/notifications')} showAvatar={false} />
            <div style={{ padding: '0 20px 24px', flex: 1 }}>
                {content}
            </div>
            <Footer />
        </div>
    );
}
