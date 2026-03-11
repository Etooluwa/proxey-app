import React, { useEffect, useState } from 'react';
import { Icons } from '../../components/Icons';
import { StatCard } from '../../components/StatCard';
import { fetchAdminDisputes, fetchDisputeStats, resolveDispute, fetchAdminDispute } from '../../data/admin';

const STATUS_COLORS = {
    open: 'bg-yellow-100 text-yellow-700',
    under_review: 'bg-blue-100 text-blue-700',
    resolved: 'bg-green-100 text-green-700',
    dismissed: 'bg-gray-100 text-gray-600',
};

const RESOLUTION_OPTIONS = [
    { value: 'full_refund', label: 'Full Refund to Client' },
    { value: 'partial_refund', label: 'Partial Refund to Client' },
    { value: 'payment_released', label: 'Release Payment to Provider' },
    { value: 'dismissed', label: 'Dismiss Dispute' },
];

const AdminDisputes = () => {
    const [disputes, setDisputes] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Detail modal state
    const [selectedDispute, setSelectedDispute] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [resolving, setResolving] = useState(false);
    const [resolutionForm, setResolutionForm] = useState({
        resolution: '',
        resolution_amount: '',
        resolution_notes: ''
    });

    const loadDisputes = async () => {
        setLoading(true);
        try {
            const result = await fetchAdminDisputes({ status: statusFilter, page, limit: 20 });
            setDisputes(result.data || []);
            setTotalPages(result.totalPages || 1);
        } catch (error) {
            console.error("Failed to load disputes", error);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const result = await fetchDisputeStats();
            setStats(result);
        } catch (error) {
            console.error("Failed to load stats", error);
        }
    };

    useEffect(() => {
        loadDisputes();
        loadStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, statusFilter]);

    const handleFilterChange = (newStatus) => {
        setStatusFilter(newStatus);
        setPage(1);
    };

    const openDetail = async (disputeId) => {
        setDetailLoading(true);
        try {
            const result = await fetchAdminDispute(disputeId);
            setSelectedDispute(result);
            setResolutionForm({
                resolution: '',
                resolution_amount: '',
                resolution_notes: ''
            });
        } catch (error) {
            console.error("Failed to load dispute detail", error);
        } finally {
            setDetailLoading(false);
        }
    };

    const closeDetail = () => {
        setSelectedDispute(null);
        setResolutionForm({ resolution: '', resolution_amount: '', resolution_notes: '' });
    };

    const handleResolve = async () => {
        if (!resolutionForm.resolution) return;

        setResolving(true);
        try {
            await resolveDispute(selectedDispute.id, {
                status: 'resolved',
                resolution: resolutionForm.resolution,
                resolution_amount: resolutionForm.resolution === 'partial_refund'
                    ? parseInt(resolutionForm.resolution_amount) * 100  // Convert to cents
                    : undefined,
                resolution_notes: resolutionForm.resolution_notes
            });
            closeDetail();
            loadDisputes();
            loadStats();
        } catch (error) {
            console.error("Failed to resolve dispute", error);
            alert(error.message || "Failed to resolve dispute");
        } finally {
            setResolving(false);
        }
    };

    const handleMarkUnderReview = async () => {
        setResolving(true);
        try {
            await resolveDispute(selectedDispute.id, { status: 'under_review' });
            const updated = await fetchAdminDispute(selectedDispute.id);
            setSelectedDispute(updated);
            loadDisputes();
            loadStats();
        } catch (error) {
            console.error("Failed to update status", error);
        } finally {
            setResolving(false);
        }
    };

    const formatCurrency = (cents) => {
        if (!cents) return '$0.00';
        return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    };

    if (loading && disputes.length === 0) {
        return (
            <div className="max-w-7xl mx-auto flex items-center justify-center h-64">
                <Icons.Loader className="w-8 h-8 animate-spin text-brand-500" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dispute Resolution</h1>
                <p className="text-gray-500 mt-1">Review and resolve disputes between clients and providers</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Open Disputes"
                    value={stats?.open || 0}
                    icon={Icons.AlertCircle}
                    colorClass="bg-yellow-500 text-yellow-500"
                />
                <StatCard
                    label="Under Review"
                    value={stats?.under_review || 0}
                    icon={Icons.Eye}
                    colorClass="bg-blue-500 text-blue-500"
                />
                <StatCard
                    label="Resolved This Week"
                    value={stats?.resolved_this_week || 0}
                    icon={Icons.CheckCircle}
                    colorClass="bg-green-500 text-green-500"
                />
                <StatCard
                    label="Avg. Resolution Time"
                    value={`${stats?.avg_resolution_hours || 0}h`}
                    icon={Icons.Clock}
                    colorClass="bg-purple-500 text-purple-500"
                />
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Icons.Filter size={18} className="text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">Status:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {['all', 'open', 'under_review', 'resolved', 'dismissed'].map((status) => (
                            <button
                                key={status}
                                onClick={() => handleFilterChange(status)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === status
                                    ? 'bg-brand-500 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {status === 'all' ? 'All' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Disputes Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {disputes.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <Icons.AlertTriangle size={32} className="mx-auto mb-2 text-gray-300" />
                        <p>No disputes found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Dispute</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Provider</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reason</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Opened</th>
                                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {disputes.map((dispute) => (
                                    <tr key={dispute.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">
                                                {dispute.bookings?.services?.name || 'Service'}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {formatCurrency(dispute.bookings?.price)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">{dispute.client_name}</div>
                                            {dispute.opened_by_role === 'client' && (
                                                <span className="text-xs text-brand-600">Opener</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">{dispute.provider_name}</div>
                                            {dispute.opened_by_role === 'provider' && (
                                                <span className="text-xs text-brand-600">Opener</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                                                {dispute.reason_label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[dispute.status]}`}>
                                                {dispute.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {formatDate(dispute.created_at)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => openDetail(dispute.id)}
                                                className="text-brand-600 hover:text-brand-700 text-sm font-medium"
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-gray-500">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedDispute && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        {detailLoading ? (
                            <div className="flex items-center justify-center py-16">
                                <Icons.Loader className="w-8 h-8 animate-spin text-brand-500" />
                            </div>
                        ) : (
                            <>
                                {/* Modal Header */}
                                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">Dispute Details</h2>
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${STATUS_COLORS[selectedDispute.status]}`}>
                                            {selectedDispute.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </span>
                                    </div>
                                    <button onClick={closeDetail} className="p-2 hover:bg-gray-100 rounded-lg">
                                        <Icons.X size={20} className="text-gray-500" />
                                    </button>
                                </div>

                                {/* Modal Body */}
                                <div className="p-6 space-y-6">
                                    {/* Booking Info */}
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Booking Information</h3>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-gray-500">Service</p>
                                                <p className="font-medium">{selectedDispute.bookings?.services?.name || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Amount</p>
                                                <p className="font-medium">{formatCurrency(selectedDispute.bookings?.price)}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Client</p>
                                                <p className="font-medium">{selectedDispute.client?.full_name || selectedDispute.client?.name || 'Unknown'}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Provider</p>
                                                <p className="font-medium">{selectedDispute.provider?.full_name || selectedDispute.provider?.name || 'Unknown'}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Scheduled</p>
                                                <p className="font-medium">{formatDate(selectedDispute.bookings?.scheduled_at)}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Booking Status</p>
                                                <p className="font-medium capitalize">{selectedDispute.bookings?.status}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Opener's Claim */}
                                    <div className="border border-gray-200 rounded-xl p-4">
                                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                            <Icons.User size={16} />
                                            {selectedDispute.opened_by_role === 'client' ? 'Client' : 'Provider'}'s Claim
                                        </h3>
                                        <div className="space-y-3">
                                            <div>
                                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-700">
                                                    {selectedDispute.reason_label}
                                                </span>
                                            </div>
                                            <p className="text-gray-700">{selectedDispute.description}</p>
                                            {selectedDispute.evidence_urls?.length > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedDispute.evidence_urls.map((url, i) => (
                                                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-brand-600 text-sm hover:underline">
                                                            Evidence {i + 1}
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                            <p className="text-xs text-gray-400">Opened {formatDate(selectedDispute.created_at)}</p>
                                        </div>
                                    </div>

                                    {/* Response */}
                                    {selectedDispute.response_description ? (
                                        <div className="border border-gray-200 rounded-xl p-4">
                                            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                                <Icons.User size={16} />
                                                {selectedDispute.opened_by_role === 'client' ? 'Provider' : 'Client'}'s Response
                                            </h3>
                                            <div className="space-y-3">
                                                <p className="text-gray-700">{selectedDispute.response_description}</p>
                                                {selectedDispute.response_evidence_urls?.length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {selectedDispute.response_evidence_urls.map((url, i) => (
                                                            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-brand-600 text-sm hover:underline">
                                                                Evidence {i + 1}
                                                            </a>
                                                        ))}
                                                    </div>
                                                )}
                                                <p className="text-xs text-gray-400">Responded {formatDate(selectedDispute.responded_at)}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="border border-dashed border-gray-300 rounded-xl p-4 text-center text-gray-400">
                                            <p className="text-sm">No response from {selectedDispute.opened_by_role === 'client' ? 'provider' : 'client'} yet</p>
                                        </div>
                                    )}

                                    {/* Resolution Form (only for open/under_review) */}
                                    {(selectedDispute.status === 'open' || selectedDispute.status === 'under_review') && (
                                        <div className="border-t border-gray-200 pt-6">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resolve Dispute</h3>

                                            {selectedDispute.status === 'open' && (
                                                <button
                                                    onClick={handleMarkUnderReview}
                                                    disabled={resolving}
                                                    className="mb-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                                                >
                                                    Mark as Under Review
                                                </button>
                                            )}

                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Resolution</label>
                                                    <select
                                                        value={resolutionForm.resolution}
                                                        onChange={(e) => setResolutionForm(f => ({ ...f, resolution: e.target.value }))}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                                                    >
                                                        <option value="">Select resolution...</option>
                                                        {RESOLUTION_OPTIONS.map((opt) => (
                                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {resolutionForm.resolution === 'partial_refund' && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Refund Amount ($)
                                                        </label>
                                                        <input
                                                            type="number"
                                                            value={resolutionForm.resolution_amount}
                                                            onChange={(e) => setResolutionForm(f => ({ ...f, resolution_amount: e.target.value }))}
                                                            placeholder="Enter amount"
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                                                        />
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Maximum: {formatCurrency(selectedDispute.bookings?.price)}
                                                        </p>
                                                    </div>
                                                )}

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes</label>
                                                    <textarea
                                                        value={resolutionForm.resolution_notes}
                                                        onChange={(e) => setResolutionForm(f => ({ ...f, resolution_notes: e.target.value }))}
                                                        rows={3}
                                                        placeholder="Add notes about this resolution..."
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                                                    />
                                                </div>

                                                <button
                                                    onClick={handleResolve}
                                                    disabled={!resolutionForm.resolution || resolving}
                                                    className="w-full py-3 bg-brand-500 text-white rounded-xl font-semibold hover:bg-brand-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                                >
                                                    {resolving ? (
                                                        <>
                                                            <Icons.Loader className="w-4 h-4 animate-spin" />
                                                            Processing...
                                                        </>
                                                    ) : (
                                                        'Resolve Dispute'
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Show resolution details if resolved */}
                                    {selectedDispute.status === 'resolved' && (
                                        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                            <h3 className="text-sm font-semibold text-green-800 mb-3 flex items-center gap-2">
                                                <Icons.CheckCircle size={16} />
                                                Resolution
                                            </h3>
                                            <div className="space-y-2 text-sm">
                                                <p className="text-green-800">
                                                    <span className="font-medium">Decision:</span>{' '}
                                                    {RESOLUTION_OPTIONS.find(o => o.value === selectedDispute.resolution)?.label || selectedDispute.resolution}
                                                </p>
                                                {selectedDispute.resolution_amount && (
                                                    <p className="text-green-800">
                                                        <span className="font-medium">Refund Amount:</span>{' '}
                                                        {formatCurrency(selectedDispute.resolution_amount)}
                                                    </p>
                                                )}
                                                {selectedDispute.refund_id && (
                                                    <p className="text-green-800">
                                                        <span className="font-medium">Refund ID:</span> {selectedDispute.refund_id}
                                                    </p>
                                                )}
                                                {selectedDispute.resolution_notes && (
                                                    <p className="text-green-700 mt-2">{selectedDispute.resolution_notes}</p>
                                                )}
                                                <p className="text-xs text-green-600 mt-2">Resolved {formatDate(selectedDispute.resolved_at)}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDisputes;
