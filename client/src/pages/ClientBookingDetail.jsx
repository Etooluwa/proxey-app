/**
 * ClientBookingDetail — /app/bookings/:id
 * Client's read-only view of a booking: session info, payment, intake responses,
 * provider notes/recommendations, and session photos.
 */
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { request } from '../data/apiClient';
import BackBtn from '../components/ui/BackBtn';
import Avatar from '../components/ui/Avatar';
import Lbl from '../components/ui/Lbl';
import Divider from '../components/ui/Divider';
import Footer from '../components/ui/Footer';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name) {
    return (name || 'P').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtTime(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function fmtDuration(mins) {
    if (!mins) return null;
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
}

function fmtPrice(cents) {
    if (!cents && cents !== 0) return null;
    return `$${Math.round(cents / 100)}`;
}

const Shimmer = ({ className }) => (
    <div className={`bg-line/60 rounded animate-pulse ${className}`} />
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const ClientBookingDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await request(`/bookings/${id}`);
            setBooking(data.booking || null);
        } catch (err) {
            console.error('[ClientBookingDetail] load error:', err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { load(); }, [load]);

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-base">
                <div className="flex items-center px-5 pt-10 pb-2">
                    <BackBtn onClick={() => navigate(-1)} />
                </div>
                <div className="px-5 flex flex-col gap-5 pt-4">
                    <div className="flex items-center gap-4">
                        <Shimmer className="w-14 h-14 rounded-full" />
                        <div className="flex-1">
                            <Shimmer className="h-5 w-40 mb-2" />
                            <Shimmer className="h-3.5 w-28" />
                        </div>
                    </div>
                    <Shimmer className="h-4 w-56 mt-2" />
                    <Shimmer className="h-20 w-full mt-2" />
                </div>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="flex flex-col min-h-screen bg-base items-center justify-center">
                <p className="text-[15px] text-muted">Booking not found</p>
                <button
                    onClick={() => navigate(-1)}
                    className="mt-3 text-[13px] font-semibold focus:outline-none"
                    style={{ color: '#C25E4A', background: 'none', border: 'none' }}
                >
                    Go back
                </button>
            </div>
        );
    }

    const price = fmtPrice(booking.price);
    const duration = fmtDuration(booking.duration || booking.duration_minutes);
    const dateLabel = fmtDate(booking.scheduled_at);
    const timeLabel = fmtTime(booking.scheduled_at);

    const statusColors = {
        completed: { bg: '#EBF2EC', text: '#5A8A5E' },
        confirmed: { bg: '#FDDCC6', text: '#C25E4A' },
        pending: { bg: '#FDDCC6', text: '#C25E4A' },
        cancelled: { bg: '#FDEDEA', text: '#B04040' },
    };
    const sc = statusColors[booking.status?.toLowerCase()] || { bg: '#F2EBE5', text: '#8C6A64' };

    return (
        <div className="flex flex-col bg-base" style={{ minHeight: '100dvh' }}>

            {/* Back nav */}
            <div className="flex items-center px-5 pt-10 pb-2">
                <BackBtn onClick={() => navigate(-1)} />
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-24">

                {/* Provider info */}
                <div className="flex items-center gap-4 mb-4 pt-2">
                    <Avatar initials={getInitials(booking.provider_name)} size={56} />
                    <div className="flex-1 min-w-0">
                        <p className="text-[22px] font-semibold text-ink tracking-[-0.02em] m-0 mb-0.5 truncate">
                            {booking.provider_name || 'Provider'}
                        </p>
                        <p className="text-[13px] text-muted m-0">{booking.service_name || 'Session'}</p>
                    </div>
                </div>

                {/* Status pill */}
                <div className="mb-5">
                    <span
                        className="inline-flex px-3 py-1.5 rounded-pill text-[11px] font-semibold uppercase tracking-[0.05em]"
                        style={{ background: sc.bg, color: sc.text }}
                    >
                        {booking.status || 'Pending'}
                    </span>
                </div>

                <Divider />

                {/* Session info */}
                <div className="py-5">
                    <Lbl className="block mb-3">Session Info</Lbl>
                    <p className="text-[20px] font-semibold text-ink tracking-[-0.02em] m-0 mb-1">
                        {dateLabel}{timeLabel ? ` at ${timeLabel}` : ''}
                    </p>
                    <p className="text-[14px] text-muted m-0">
                        {[duration, price].filter(Boolean).join(' · ')}
                    </p>
                    {booking.service_description && (
                        <p className="text-[13px] text-muted leading-relaxed m-0 mt-2">{booking.service_description}</p>
                    )}
                </div>

                {/* Client intake & notes */}
                {(booking.client_message || (booking.intake_responses?.length > 0)) && (
                    <>
                        <Divider />
                        <div className="py-5">
                            <Lbl className="block mb-3">Your Booking Details</Lbl>

                            {booking.client_message && (
                                <div className="px-4 py-3 rounded-[12px] mb-4" style={{ background: '#FFF5E6' }}>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted m-0 mb-1">Your note</p>
                                    <p className="text-[14px] text-ink m-0 leading-relaxed">{booking.client_message}</p>
                                </div>
                            )}

                            {booking.intake_responses?.length > 0 && (
                                <div className="flex flex-col gap-3">
                                    {booking.intake_responses.map((item, i) => (
                                        <div key={i}>
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted m-0 mb-1">{item.question}</p>
                                            <p className="text-[14px] text-ink m-0 leading-relaxed">{item.answer || '—'}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Provider session notes & recommendations */}
                {(booking.session_notes || booking.session_recommendation) && (
                    <>
                        <Divider />
                        <div className="py-5">
                            <Lbl className="block mb-3">From Your Provider</Lbl>

                            {booking.session_notes && (
                                <div className="mb-4">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted m-0 mb-1">Session Notes</p>
                                    <p className="text-[14px] text-ink leading-relaxed m-0">{booking.session_notes}</p>
                                </div>
                            )}

                            {booking.session_recommendation && (
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted m-0 mb-1">Recommendations</p>
                                    <p className="text-[14px] text-ink leading-relaxed m-0">{booking.session_recommendation}</p>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Session photos */}
                {booking.session_photos?.length > 0 && (
                    <>
                        <Divider />
                        <div className="py-5">
                            <Lbl className="block mb-3">Session Photos</Lbl>
                            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                                {booking.session_photos.map((p) => (
                                    <div key={p.id} className="rounded-[10px] overflow-hidden" style={{ aspectRatio: '1/1' }}>
                                        <img
                                            src={p.photo_url}
                                            alt={p.caption || 'Session photo'}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                <Footer />
            </div>
        </div>
    );
};

export default ClientBookingDetail;
