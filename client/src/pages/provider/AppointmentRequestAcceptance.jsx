import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchProviderJobs, updateProviderJobStatus } from '../../data/provider';
import { useToast } from '../../components/ui/ToastProvider';

const T = {
    base: '#FBF7F2',
    ink: '#3D231E',
    muted: '#8C6A64',
    faded: '#B0948F',
    accent: '#C25E4A',
    hero: '#FDDCC6',
    avatarBg: '#F2EBE5',
    line: 'rgba(140,106,100,0.2)',
    card: '#FFFFFF',
    successBg: '#EBF2EC',
    success: '#5A8A5E',
    dangerBg: '#FDEDEA',
    danger: '#A04030',
    callout: '#FFF5E6',
};
const F = "'Sora', system-ui, sans-serif";

function getInitials(name) {
    return (name || '?')
        .split(/\s+/)
        .filter(Boolean)
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

function formatDate(iso) {
    if (!iso) return 'TBD';
    return new Date(iso).toLocaleString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit',
    });
}

const AppointmentRequestAcceptance = () => {
    const navigate = useNavigate();
    const { requestId } = useParams();
    const toast = useToast();
    const [isProcessing, setIsProcessing] = useState(false);
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const pending = await fetchProviderJobs({ status: 'pending' });
            setRequest(pending.find((j) => j.id === requestId) || null);
        } catch (error) {
            console.error('Failed to load request', error);
            toast.push({ title: 'Error loading request', description: error.message, variant: 'error' });
        } finally {
            setLoading(false);
        }
    }, [requestId, toast]);

    useEffect(() => { load(); }, [load]);

    const handleUpdate = async (nextStatus, successMessage, variant = 'success') => {
        setIsProcessing(true);
        try {
            await updateProviderJobStatus(request.id, nextStatus);
            toast.push({
                title: successMessage,
                description: `${request.client_name || request.clientName || 'Client'} will be notified.`,
                variant,
            });
            navigate('/provider/appointments');
        } catch (error) {
            console.error('Error updating request:', error);
            toast.push({ title: 'Error', description: error.message || 'Failed to update appointment.', variant: 'error' });
            setIsProcessing(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    border: `2px solid ${T.accent}`, borderTopColor: 'transparent',
                    animation: 'spin 0.7s linear infinite',
                }} />
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (!request) {
        return (
            <div style={{ padding: '0 20px', fontFamily: F }}>
                <div style={{
                    padding: '40px 24px', borderRadius: 20,
                    border: `1px solid ${T.line}`, textAlign: 'center',
                    background: T.dangerBg, marginTop: 24,
                }}>
                    <p style={{ fontFamily: F, fontSize: 16, fontWeight: 500, color: T.ink, margin: '0 0 8px' }}>
                        Request not found
                    </p>
                    <p style={{ fontFamily: F, fontSize: 14, color: T.muted, margin: '0 0 20px' }}>
                        This request could not be found or has already been processed.
                    </p>
                    <button
                        onClick={() => navigate('/provider/appointments')}
                        style={{
                            padding: '10px 24px', borderRadius: 12,
                            background: T.ink, color: '#fff',
                            border: 'none', fontFamily: F, fontSize: 14,
                            fontWeight: 600, cursor: 'pointer',
                        }}
                    >
                        Back to appointments
                    </button>
                </div>
            </div>
        );
    }

    const clientName = request.client_name || request.clientName || 'Client';
    const serviceName = request.service_name || request.service || 'Service';
    const requestedDate = request.scheduled_at || request.scheduledAt;

    return (
        <div style={{ padding: '0 20px 40px', fontFamily: F, maxWidth: 600, margin: '0 auto' }}>
            <style>{`@keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }`}</style>

            {/* Back */}
            <button
                onClick={() => navigate('/provider/appointments')}
                style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: F, fontSize: 13, color: T.muted,
                    padding: '20px 0 16px', marginLeft: -4,
                }}
            >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Back
            </button>

            {/* Header */}
            <div style={{ marginBottom: 24, animation: 'fadeUp 0.4s ease 0.05s both' }}>
                <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: T.accent }}>
                    New Request
                </p>
                <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: '-0.03em', color: T.ink }}>
                    Appointment Request
                </h1>
            </div>

            {/* Client card */}
            <div style={{
                background: T.hero, borderRadius: 20, padding: '24px 20px',
                marginBottom: 16, animation: 'fadeUp 0.4s ease 0.1s both',
                display: 'flex', alignItems: 'center', gap: 16,
            }}>
                <div style={{
                    width: 52, height: 52, borderRadius: '50%',
                    background: T.avatarBg, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontFamily: F, fontSize: 18, fontWeight: 500, color: T.muted,
                    flexShrink: 0,
                }}>
                    {getInitials(clientName)}
                </div>
                <div>
                    <p style={{ margin: '0 0 2px', fontSize: 17, fontWeight: 600, color: T.ink }}>{clientName}</p>
                    <p style={{ margin: 0, fontSize: 13, color: T.muted }}>{serviceName}</p>
                </div>
            </div>

            {/* Details */}
            <div style={{ animation: 'fadeUp 0.4s ease 0.15s both' }}>
                <div style={{ borderTop: `1px solid ${T.line}` }}>
                    {[
                        { label: 'Date & Time', value: formatDate(requestedDate) },
                        { label: 'Service', value: serviceName },
                        { label: 'Status', value: request.status || 'pending' },
                    ].map(({ label, value }) => (
                        <div key={label} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '14px 0', borderBottom: `1px solid ${T.line}`,
                        }}>
                            <span style={{ fontSize: 13, color: T.muted, fontFamily: F }}>{label}</span>
                            <span style={{ fontSize: 14, fontWeight: 500, color: T.ink, fontFamily: F }}>{value}</span>
                        </div>
                    ))}
                    {request.notes && (
                        <div style={{ padding: '14px 0', borderBottom: `1px solid ${T.line}` }}>
                            <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: T.faded }}>
                                Client note
                            </p>
                            <div style={{ padding: '12px 14px', borderRadius: 12, background: T.callout }}>
                                <p style={{ margin: 0, fontSize: 14, color: T.ink, lineHeight: 1.6 }}>{request.notes}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div style={{
                display: 'flex', gap: 10, marginTop: 28,
                animation: 'fadeUp 0.4s ease 0.2s both',
            }}>
                <button
                    onClick={() => handleUpdate('declined', 'Request declined', 'info')}
                    disabled={isProcessing}
                    style={{
                        flex: 1, padding: '14px', borderRadius: 14,
                        border: `1px solid ${T.line}`, background: 'transparent',
                        fontFamily: F, fontSize: 15, fontWeight: 600,
                        color: T.muted, cursor: 'pointer',
                        opacity: isProcessing ? 0.5 : 1,
                    }}
                >
                    Decline
                </button>
                <button
                    onClick={() => handleUpdate('confirmed', 'Request accepted')}
                    disabled={isProcessing}
                    style={{
                        flex: 2, padding: '14px', borderRadius: 14,
                        border: 'none', background: T.ink,
                        fontFamily: F, fontSize: 15, fontWeight: 600,
                        color: '#fff', cursor: 'pointer',
                        opacity: isProcessing ? 0.5 : 1,
                    }}
                >
                    {isProcessing ? 'Processing…' : 'Accept Request'}
                </button>
            </div>
        </div>
    );
};

export default AppointmentRequestAcceptance;
