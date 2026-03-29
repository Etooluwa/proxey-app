import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useSession } from '../../auth/authContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { acceptProviderBooking, declineProviderBooking, fetchProviderBookings } from '../../data/provider';
import { supabase } from '../../utils/supabase';
import { splitProviderBookings } from '../../utils/providerBookings';
import Header from '../../components/ui/Header';
import Footer from '../../components/ui/Footer';
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
} from '../../components/bookings/BookingsShared';

function getEmptyCopy(tab) {
    if (tab === 'pending') {
        return {
            icon: <EnvelopeIcon />,
            title: 'Inbox zero. Feels good.',
            description: "When clients request a booking, you'll review and accept them here.",
        };
    }

    if (tab === 'upcoming') {
        return {
            icon: <CalendarIcon />,
            title: 'Nothing upcoming',
            description: "Confirmed sessions will appear here as they're scheduled.",
        };
    }

    return {
        icon: <ClockIcon />,
        title: 'No past sessions',
        description: 'Your completed and cancelled sessions will be listed here.',
    };
}

const ProviderAppointments = () => {
    const { onMenu, isDesktop } = useOutletContext() || {};
    const { session, profile } = useSession();
    const { unreadCount } = useNotifications();
    const navigate = useNavigate();

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actioningId, setActioningId] = useState(null);
    const [decliningId, setDecliningId] = useState(null);
    const [declineReason, setDeclineReason] = useState('');
    const [activeTab, setActiveTab] = useState('pending');

    const providerId = session?.user?.id;
    const initials = (profile?.name || '')
        .split(' ')
        .map((word) => word[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'P';

    const loadBookings = useCallback(async () => {
        if (!providerId) {
            setBookings([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const data = await fetchProviderBookings(providerId);
            setBookings(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('[ProviderAppointments] load error:', error);
            setBookings([]);
        } finally {
            setLoading(false);
        }
    }, [providerId]);

    useEffect(() => {
        loadBookings();
    }, [loadBookings]);

    useEffect(() => {
        if (!supabase || !providerId) return undefined;

        const channel = supabase
            .channel(`provider-bookings:${providerId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'bookings',
                    filter: `provider_id=eq.${providerId}`,
                },
                () => {
                    loadBookings();
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [loadBookings, providerId]);

    const { pending, upcoming, past } = useMemo(
        () => splitProviderBookings(bookings),
        [bookings],
    );

    const tabs = [
        { id: 'pending', label: 'Pending', count: pending.length },
        { id: 'upcoming', label: 'Upcoming', count: upcoming.length },
        { id: 'past', label: 'Past', count: past.length },
    ];

    const rows = activeTab === 'pending' ? pending : activeTab === 'upcoming' ? upcoming : past;
    const emptyCopy = getEmptyCopy(activeTab);

    const handleAccept = async (booking) => {
        setActioningId(booking.id);
        try {
            const updatedBooking = await acceptProviderBooking(booking.id);
            if (updatedBooking) {
                setBookings((current) => current.map((item) => (
                    item.id === booking.id ? { ...item, ...updatedBooking } : item
                )));
            } else {
                await loadBookings();
            }
        } catch (error) {
            console.error('[ProviderAppointments] accept error:', error);
        } finally {
            setActioningId(null);
        }
    };

    const handleDeclineStart = (bookingId) => {
        setDecliningId(bookingId);
        setDeclineReason('');
    };

    const handleDeclineCancel = () => {
        setDecliningId(null);
        setDeclineReason('');
    };

    const handleConfirmDecline = async (booking) => {
        setActioningId(booking.id);
        try {
            const updatedBooking = await declineProviderBooking(booking.id, declineReason.trim() || undefined);
            setDecliningId(null);
            setDeclineReason('');
            if (updatedBooking) {
                setBookings((current) => current.map((item) => (
                    item.id === booking.id ? { ...item, ...updatedBooking } : item
                )));
            } else {
                await loadBookings();
            }
        } catch (error) {
            console.error('[ProviderAppointments] decline error:', error);
        } finally {
            setActioningId(null);
        }
    };

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

            <BookingsPageHeader label="Manage" />
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
                    <>
                        {activeTab === 'pending' && (
                            <p
                                style={{
                                    margin: '0 0 12px',
                                    fontFamily: BODY_FONT,
                                    fontSize: 11,
                                    fontWeight: 500,
                                    letterSpacing: '0.06em',
                                    textTransform: 'uppercase',
                                    color: BOOKING_TOKENS.faded,
                                }}
                            >
                                {rows.length} request{rows.length === 1 ? '' : 's'} awaiting your response
                            </p>
                        )}

                        {rows.map((booking) => (
                            <BookingCard
                                key={booking.id}
                                booking={booking}
                                personName={booking.client_name || 'Client'}
                                isDesktop={isDesktop}
                                onClick={() => navigate(`/provider/appointments/${booking.id}`)}
                                showPendingActions={activeTab === 'pending'}
                                onAccept={handleAccept}
                                onDeclineStart={handleDeclineStart}
                                onDeclineCancel={handleDeclineCancel}
                                onDeclineReasonChange={setDeclineReason}
                                onConfirmDecline={handleConfirmDecline}
                                decliningId={decliningId}
                                declineReason={declineReason}
                                actioningId={actioningId}
                            />
                        ))}
                    </>
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
            <Header
                onMenu={onMenu}
                showAvatar
                initials={initials}
                notifCount={unreadCount}
            />
            <div style={{ padding: '0 20px 24px', flex: 1 }}>
                {content}
            </div>
            <Footer />
        </div>
    );
};

export default ProviderAppointments;
