import React, { useEffect, useState } from 'react';
import { X, Check } from '@phosphor-icons/react';
import { fetchAdminDisputes, fetchDisputeStats, resolveDispute, fetchAdminDispute } from '../../data/admin';

const INK = '#3D231E';
const MUTED = '#8C6A64';
const FADED = '#B0948F';
const ACCENT = '#C25E4A';
const LINE = 'rgba(140,106,100,0.2)';
const AVATAR_BG = '#F2EBE5';

const STATUS_STYLE = {
  open: { background: '#FFF5E6', color: '#A07030' },
  under_review: { background: '#EBF0FA', color: '#4A6CA8' },
  resolved: { background: '#EBF2EC', color: '#5A8A5E' },
  dismissed: { background: AVATAR_BG, color: MUTED },
};

const RESOLUTION_OPTIONS = [
  { value: 'full_refund', label: 'Full Refund to Client' },
  { value: 'partial_refund', label: 'Partial Refund to Client' },
  { value: 'payment_released', label: 'Release Payment to Provider' },
  { value: 'dismissed', label: 'Dismiss Dispute' },
];

const formatCurrency = (cents) => {
  if (!cents) return '$0.00';
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
};

const AdminDisputes = () => {
  const [disputes, setDisputes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolutionForm, setResolutionForm] = useState({ resolution: '', resolution_amount: '', resolution_notes: '' });

  const loadDisputes = async () => {
    setLoading(true);
    try {
      const result = await fetchAdminDisputes({ status: statusFilter, page, limit: 20 });
      setDisputes(result.data || []);
      setTotalPages(result.totalPages || 1);
    } catch (err) {
      console.error('Failed to load disputes', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const result = await fetchDisputeStats();
      setStats(result);
    } catch (err) {
      console.error('Failed to load stats', err);
    }
  };

  useEffect(() => {
    loadDisputes();
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  const openDetail = async (id) => {
    setDetailLoading(true);
    try {
      const result = await fetchAdminDispute(id);
      setSelectedDispute(result);
      setResolutionForm({ resolution: '', resolution_amount: '', resolution_notes: '' });
    } catch (err) {
      console.error('Failed to load dispute', err);
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
          ? parseInt(resolutionForm.resolution_amount) * 100 : undefined,
        resolution_notes: resolutionForm.resolution_notes,
      });
      closeDetail();
      loadDisputes();
      loadStats();
    } catch (err) {
      console.error('Failed to resolve dispute', err);
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
    } catch (err) {
      console.error('Failed to update status', err);
    } finally {
      setResolving(false);
    }
  };

  const inputStyle = {
    border: `1px solid ${LINE}`,
    background: '#FBF7F2',
    color: INK,
    borderRadius: '10px',
    padding: '8px 12px',
    fontSize: '13px',
    outline: 'none',
    width: '100%',
    fontFamily: 'Sora, sans-serif',
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold" style={{ color: INK, letterSpacing: '-0.03em' }}>
          Disputes
        </h1>
        <p className="text-sm mt-1" style={{ color: MUTED }}>Review and resolve disputes between clients and providers</p>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: 'Open', value: stats?.open ?? 0 },
          { label: 'Under Review', value: stats?.under_review ?? 0 },
          { label: 'Resolved This Week', value: stats?.resolved_this_week ?? 0 },
          { label: 'Avg. Resolution', value: `${stats?.avg_resolution_hours ?? 0}h` },
        ].map(({ label, value }) => (
          <div key={label} style={{ borderBottom: `1px solid ${LINE}` }} className="pb-4">
            <p className="text-[11px] uppercase tracking-widest font-medium mb-1" style={{ color: FADED }}>{label}</p>
            <p className="text-2xl font-semibold" style={{ color: INK, letterSpacing: '-0.02em' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2">
        {['all', 'open', 'under_review', 'resolved', 'dismissed'].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className="px-4 py-1.5 rounded-full text-xs font-medium transition-colors"
            style={{
              background: statusFilter === s ? INK : AVATAR_BG,
              color: statusFilter === s ? '#fff' : MUTED,
            }}
          >
            {s === 'all' ? 'All' : s.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Table */}
      <div>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: LINE, borderTopColor: ACCENT }} />
          </div>
        ) : disputes.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-16 rounded-xl"
            style={{ border: `1px dashed ${LINE}` }}
          >
            <p className="text-sm" style={{ color: MUTED }}>No disputes found</p>
          </div>
        ) : (
          <div>
            <div
              className="grid gap-4 px-4 py-3 text-[11px] uppercase tracking-widest font-medium"
              style={{ gridTemplateColumns: '2fr 1.5fr 1.5fr 1.5fr 1fr 1fr 80px', borderBottom: `1px solid ${LINE}`, color: FADED }}
            >
              <span>Service</span>
              <span>Client</span>
              <span>Provider</span>
              <span>Reason</span>
              <span>Status</span>
              <span>Opened</span>
              <span></span>
            </div>
            {disputes.map((dispute) => (
              <div
                key={dispute.id}
                className="grid gap-4 px-4 py-4 items-center"
                style={{ gridTemplateColumns: '2fr 1.5fr 1.5fr 1.5fr 1fr 1fr 80px', borderBottom: `1px solid ${LINE}` }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: INK }}>
                    {dispute.bookings?.services?.name || 'Service'}
                  </p>
                  <p className="text-xs" style={{ color: MUTED }}>
                    {formatCurrency(dispute.bookings?.price)}
                  </p>
                </div>
                <span className="text-sm truncate" style={{ color: MUTED }}>{dispute.client_name}</span>
                <span className="text-sm truncate" style={{ color: MUTED }}>{dispute.provider_name}</span>
                <span
                  className="text-[11px] font-medium px-2 py-0.5 rounded-full inline-block"
                  style={{ background: AVATAR_BG, color: MUTED }}
                >
                  {dispute.reason_label}
                </span>
                <span
                  className="text-[11px] font-medium px-2 py-0.5 rounded-full inline-block"
                  style={STATUS_STYLE[dispute.status] || { background: AVATAR_BG, color: MUTED }}
                >
                  {dispute.status?.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </span>
                <span className="text-xs" style={{ color: FADED }}>
                  {formatDate(dispute.created_at)}
                </span>
                <button
                  onClick={() => openDetail(dispute.id)}
                  className="text-xs font-medium underline underline-offset-2"
                  style={{ color: ACCENT }}
                >
                  View
                </button>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-xs font-medium px-4 py-2 rounded-xl disabled:opacity-40"
              style={{ background: AVATAR_BG, color: INK }}
            >
              Previous
            </button>
            <span className="text-xs" style={{ color: MUTED }}>Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="text-xs font-medium px-4 py-2 rounded-xl disabled:opacity-40"
              style={{ background: AVATAR_BG, color: INK }}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Detail drawer / modal */}
      {selectedDispute && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div
            className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl"
            style={{ background: '#FBF7F2', fontFamily: 'Sora, sans-serif' }}
          >
            {detailLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: LINE, borderTopColor: ACCENT }} />
              </div>
            ) : (
              <>
                {/* Modal header */}
                <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: `1px solid ${LINE}` }}>
                  <div>
                    <h2 className="text-lg font-semibold" style={{ color: INK }}>Dispute Details</h2>
                    <span
                      className="text-[11px] font-medium px-2 py-0.5 rounded-full mt-1 inline-block"
                      style={STATUS_STYLE[selectedDispute.status] || { background: AVATAR_BG, color: MUTED }}
                    >
                      {selectedDispute.status?.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </span>
                  </div>
                  <button onClick={closeDetail} className="p-2 rounded-xl hover:bg-[#F2EBE5]">
                    <X size={18} style={{ color: MUTED }} />
                  </button>
                </div>

                <div className="px-6 py-5 space-y-6">
                  {/* Booking info */}
                  <div className="rounded-xl p-4 space-y-3" style={{ background: AVATAR_BG }}>
                    <p className="text-[11px] uppercase tracking-widest font-medium" style={{ color: FADED }}>Booking</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p style={{ color: FADED }} className="text-xs">Service</p>
                        <p style={{ color: INK }} className="font-medium">{selectedDispute.bookings?.services?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p style={{ color: FADED }} className="text-xs">Amount</p>
                        <p style={{ color: INK }} className="font-medium">{formatCurrency(selectedDispute.bookings?.price)}</p>
                      </div>
                      <div>
                        <p style={{ color: FADED }} className="text-xs">Client</p>
                        <p style={{ color: INK }} className="font-medium">{selectedDispute.client?.full_name || 'Unknown'}</p>
                      </div>
                      <div>
                        <p style={{ color: FADED }} className="text-xs">Provider</p>
                        <p style={{ color: INK }} className="font-medium">{selectedDispute.provider?.full_name || 'Unknown'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Claim */}
                  <div>
                    <p className="text-[11px] uppercase tracking-widest font-medium mb-2" style={{ color: FADED }}>
                      {selectedDispute.opened_by_role === 'client' ? 'Client' : 'Provider'}'s Claim
                    </p>
                    <span
                      className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                      style={{ background: '#FDEDEA', color: '#A04030' }}
                    >
                      {selectedDispute.reason_label}
                    </span>
                    <p className="text-sm mt-2" style={{ color: INK }}>{selectedDispute.description}</p>
                    {selectedDispute.evidence_urls?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedDispute.evidence_urls.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                            className="text-xs underline" style={{ color: ACCENT }}>
                            Evidence {i + 1}
                          </a>
                        ))}
                      </div>
                    )}
                    <p className="text-xs mt-1" style={{ color: FADED }}>Opened {formatDate(selectedDispute.created_at)}</p>
                  </div>

                  {/* Response */}
                  {selectedDispute.response_description ? (
                    <div>
                      <p className="text-[11px] uppercase tracking-widest font-medium mb-2" style={{ color: FADED }}>
                        {selectedDispute.opened_by_role === 'client' ? 'Provider' : 'Client'}'s Response
                      </p>
                      <p className="text-sm" style={{ color: INK }}>{selectedDispute.response_description}</p>
                      <p className="text-xs mt-1" style={{ color: FADED }}>
                        Responded {formatDate(selectedDispute.responded_at)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm" style={{ color: FADED }}>
                      No response from {selectedDispute.opened_by_role === 'client' ? 'provider' : 'client'} yet.
                    </p>
                  )}

                  {/* Resolution form */}
                  {(selectedDispute.status === 'open' || selectedDispute.status === 'under_review') && (
                    <div style={{ borderTop: `1px solid ${LINE}` }} className="pt-5 space-y-4">
                      <p className="text-base font-semibold" style={{ color: INK }}>Resolve</p>

                      {selectedDispute.status === 'open' && (
                        <button
                          onClick={handleMarkUnderReview}
                          disabled={resolving}
                          className="text-sm font-medium px-4 py-2 rounded-xl disabled:opacity-40"
                          style={{ background: '#EBF0FA', color: '#4A6CA8' }}
                        >
                          Mark as Under Review
                        </button>
                      )}

                      <div>
                        <p className="text-xs font-medium mb-1.5" style={{ color: MUTED }}>Resolution</p>
                        <select
                          value={resolutionForm.resolution}
                          onChange={(e) => setResolutionForm((f) => ({ ...f, resolution: e.target.value }))}
                          style={inputStyle}
                        >
                          <option value="">Select resolution...</option>
                          {RESOLUTION_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>

                      {resolutionForm.resolution === 'partial_refund' && (
                        <div>
                          <p className="text-xs font-medium mb-1.5" style={{ color: MUTED }}>Refund Amount ($)</p>
                          <input
                            type="number"
                            value={resolutionForm.resolution_amount}
                            onChange={(e) => setResolutionForm((f) => ({ ...f, resolution_amount: e.target.value }))}
                            placeholder="Enter amount"
                            style={inputStyle}
                          />
                          <p className="text-xs mt-1" style={{ color: FADED }}>
                            Max: {formatCurrency(selectedDispute.bookings?.price)}
                          </p>
                        </div>
                      )}

                      <div>
                        <p className="text-xs font-medium mb-1.5" style={{ color: MUTED }}>Admin Notes</p>
                        <textarea
                          value={resolutionForm.resolution_notes}
                          onChange={(e) => setResolutionForm((f) => ({ ...f, resolution_notes: e.target.value }))}
                          rows={3}
                          placeholder="Notes about this resolution..."
                          style={{ ...inputStyle, resize: 'none' }}
                        />
                      </div>

                      <button
                        onClick={handleResolve}
                        disabled={!resolutionForm.resolution || resolving}
                        className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
                        style={{ background: INK, color: '#fff' }}
                      >
                        {resolving ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <><Check size={16} weight="bold" /> Resolve Dispute</>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Resolved summary */}
                  {selectedDispute.status === 'resolved' && (
                    <div className="rounded-xl p-4" style={{ background: '#EBF2EC' }}>
                      <p className="text-sm font-semibold mb-2" style={{ color: '#5A8A5E' }}>Resolution</p>
                      <p className="text-sm" style={{ color: '#3D5C40' }}>
                        {RESOLUTION_OPTIONS.find((o) => o.value === selectedDispute.resolution)?.label || selectedDispute.resolution}
                      </p>
                      {selectedDispute.resolution_amount && (
                        <p className="text-sm" style={{ color: '#3D5C40' }}>
                          Refund: {formatCurrency(selectedDispute.resolution_amount)}
                        </p>
                      )}
                      {selectedDispute.resolution_notes && (
                        <p className="text-sm mt-1" style={{ color: '#3D5C40' }}>{selectedDispute.resolution_notes}</p>
                      )}
                      <p className="text-xs mt-2" style={{ color: '#5A8A5E' }}>
                        Resolved {formatDate(selectedDispute.resolved_at)}
                      </p>
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
