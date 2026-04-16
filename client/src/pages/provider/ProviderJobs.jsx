import { useEffect, useState } from 'react';
import { useToast } from '../../components/ui/ToastProvider';
import { fetchProviderJobs, updateProviderJobStatus } from '../../data/provider';

const T = {
    base: '#FBF7F2',
    ink: '#3D231E',
    muted: '#8C6A64',
    faded: '#B0948F',
    accent: '#C25E4A',
    hero: '#FDDCC6',
    avatarBg: '#F2EBE5',
    line: 'rgba(140,106,100,0.2)',
    successBg: '#EBF2EC',
    success: '#5A8A5E',
    dangerBg: '#FDEDEA',
    danger: '#A04030',
    callout: '#FFF5E6',
};
const F = "'Sora', system-ui, sans-serif";

const TABS = [
    { id: 'active', label: 'Active' },
    { id: 'pending', label: 'Pending' },
    { id: 'completed', label: 'Completed' },
];

const STATUS_CONFIG = {
    pending: { label: 'Pending', bg: T.hero, color: T.accent },
    active: { label: 'In Progress', bg: T.successBg, color: T.success },
    completed: { label: 'Completed', bg: T.avatarBg, color: T.muted },
};

function getInitials(name) {
    return (name || '?').split(/\s+/).filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase();
}

function formatDate(iso) {
    if (!iso) return 'TBD';
    return new Date(iso).toLocaleString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit',
    });
}

function formatPrice(price, currency) {
    const cents = typeof price === 'number' ? price : Number(price) || 0;
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: (currency || 'CAD').toUpperCase(),
    }).format(cents / 100);
}

function JobCard({ job, onAccept, onDecline, onComplete, isUpdating }) {
    const clientName = job.clientName || job.client_name || 'Client';
    const serviceName = job.serviceName || job.service_name || 'Service';
    const status = job.status || 'pending';
    const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

    return (
        <div style={{
            borderBottom: `1px solid ${T.line}`,
            padding: '20px 0',
            animation: 'fadeUp 0.35s ease both',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: T.avatarBg, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontFamily: F, fontSize: 15, fontWeight: 500, color: T.muted,
                    flexShrink: 0,
                }}>
                    {getInitials(clientName)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: '0 0 2px', fontFamily: F, fontSize: 15, fontWeight: 500, color: T.ink }}>{clientName}</p>
                    <p style={{ margin: 0, fontFamily: F, fontSize: 13, color: T.muted }}>{serviceName}</p>
                </div>
                <span style={{
                    padding: '4px 10px', borderRadius: 9999,
                    fontFamily: F, fontSize: 11, fontWeight: 500,
                    background: statusCfg.bg, color: statusCfg.color,
                    flexShrink: 0,
                }}>
                    {statusCfg.label}
                </span>
            </div>

            <div style={{ display: 'flex', gap: 20, marginBottom: job.notes ? 12 : 0 }}>
                <div>
                    <p style={{ margin: '0 0 2px', fontFamily: F, fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: T.faded }}>When</p>
                    <p style={{ margin: 0, fontFamily: F, fontSize: 13, color: T.ink }}>{formatDate(job.scheduled_at || job.scheduledAt)}</p>
                </div>
                <div>
                    <p style={{ margin: '0 0 2px', fontFamily: F, fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: T.faded }}>Amount</p>
                    <p style={{ margin: 0, fontFamily: F, fontSize: 13, color: T.ink }}>{formatPrice(job.price, job.currency)}</p>
                </div>
                {job.location && (
                    <div>
                        <p style={{ margin: '0 0 2px', fontFamily: F, fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: T.faded }}>Location</p>
                        <p style={{ margin: 0, fontFamily: F, fontSize: 13, color: T.ink }}>{job.location}</p>
                    </div>
                )}
            </div>

            {job.notes && (
                <div style={{ padding: '10px 14px', borderRadius: 12, background: T.callout, marginBottom: 12 }}>
                    <p style={{ margin: 0, fontFamily: F, fontSize: 13, color: T.ink, lineHeight: 1.6 }}>{job.notes}</p>
                </div>
            )}

            {status === 'pending' && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button
                        onClick={() => onDecline(job)}
                        disabled={isUpdating}
                        style={{
                            flex: 1, padding: '11px', borderRadius: 12,
                            border: `1px solid ${T.line}`, background: 'transparent',
                            fontFamily: F, fontSize: 14, fontWeight: 600,
                            color: T.muted, cursor: 'pointer',
                            opacity: isUpdating ? 0.5 : 1,
                        }}
                    >
                        Decline
                    </button>
                    <button
                        onClick={() => onAccept(job)}
                        disabled={isUpdating}
                        style={{
                            flex: 2, padding: '11px', borderRadius: 12,
                            border: 'none', background: T.ink,
                            fontFamily: F, fontSize: 14, fontWeight: 600,
                            color: '#fff', cursor: 'pointer',
                            opacity: isUpdating ? 0.5 : 1,
                        }}
                    >
                        Accept
                    </button>
                </div>
            )}

            {status === 'active' && (
                <div style={{ marginTop: 12 }}>
                    <button
                        onClick={() => onComplete(job)}
                        disabled={isUpdating}
                        style={{
                            width: '100%', padding: '11px', borderRadius: 12,
                            border: 'none', background: T.success,
                            fontFamily: F, fontSize: 14, fontWeight: 600,
                            color: '#fff', cursor: 'pointer',
                            opacity: isUpdating ? 0.5 : 1,
                        }}
                    >
                        Mark as Complete
                    </button>
                </div>
            )}
        </div>
    );
}

function ProviderJobs() {
    const toast = useToast();
    const [activeTab, setActiveTab] = useState('active');
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            try {
                const data = await fetchProviderJobs({ status: activeTab });
                if (!cancelled) setJobs(data);
            } catch (error) {
                if (!cancelled) toast.push({ title: 'Unable to load jobs', description: error.message, variant: 'error' });
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, [activeTab, toast]);

    const handleUpdate = async (job, nextStatus) => {
        setUpdating(true);
        try {
            await updateProviderJobStatus(job.id, nextStatus);
            toast.push({
                title: `Job ${nextStatus}`,
                description: `${job.clientName || job.client_name || 'Client'}'s session updated.`,
                variant: 'success',
            });
            const refreshed = await fetchProviderJobs({ status: activeTab });
            setJobs(refreshed);
        } catch (error) {
            toast.push({ title: 'Update failed', description: error.message, variant: 'error' });
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div style={{ fontFamily: F, maxWidth: 640, margin: '0 auto', padding: '0 20px 40px' }}>
            <style>{`
                @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>

            {/* Header */}
            <div style={{ padding: '20px 0 20px', animation: 'fadeUp 0.35s ease both' }}>
                <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: T.accent }}>
                    Jobs
                </p>
                <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: '-0.03em', color: T.ink }}>
                    My Jobs
                </h1>
            </div>

            {/* Tab bar */}
            <div style={{
                display: 'flex', gap: 4, marginBottom: 24,
                borderBottom: `1px solid ${T.line}`, paddingBottom: 0,
            }}>
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: '10px 16px',
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontFamily: F, fontSize: 14, fontWeight: 500,
                            color: activeTab === tab.id ? T.ink : T.muted,
                            borderBottom: activeTab === tab.id ? `2px solid ${T.ink}` : '2px solid transparent',
                            marginBottom: -1,
                            transition: 'color 0.15s ease',
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
                    <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        border: `2px solid ${T.accent}`, borderTopColor: 'transparent',
                        animation: 'spin 0.7s linear infinite',
                    }} />
                </div>
            ) : jobs.length === 0 ? (
                <div style={{
                    padding: '40px 24px', borderRadius: 20,
                    border: `1px dashed ${T.line}`, textAlign: 'center',
                }}>
                    <p style={{ margin: 0, fontFamily: F, fontSize: 14, color: T.muted }}>
                        No {activeTab} jobs right now.
                    </p>
                </div>
            ) : (
                jobs.map((job) => (
                    <JobCard
                        key={job.id}
                        job={job}
                        isUpdating={updating}
                        onAccept={(j) => handleUpdate(j, 'active')}
                        onDecline={(j) => handleUpdate(j, 'declined')}
                        onComplete={(j) => handleUpdate(j, 'completed')}
                    />
                ))
            )}
        </div>
    );
}

export default ProviderJobs;
