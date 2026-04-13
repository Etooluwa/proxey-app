import React, { useEffect, useState } from 'react';
import { fetchAdminBookings } from '../../data/admin';

const INK = '#3D231E';
const MUTED = '#8C6A64';
const FADED = '#B0948F';
const ACCENT = '#C25E4A';
const LINE = 'rgba(140,106,100,0.2)';
const AVATAR_BG = '#F2EBE5';

const statusStyle = (s) => {
  switch (s?.toLowerCase()) {
    case 'completed': return { background: '#EBF2EC', color: '#5A8A5E' };
    case 'confirmed': return { background: '#EBF0FA', color: '#4A6CA8' };
    case 'pending': return { background: '#FFF5E6', color: '#A07030' };
    case 'cancelled': return { background: '#FDEDEA', color: '#A04030' };
    default: return { background: AVATAR_BG, color: MUTED };
  }
};

const formatCurrency = (cents) => {
  if (!cents) return '—';
  return `$${(cents / 100).toFixed(2)}`;
};

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminBookings({
        status: status || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        page,
        limit: 20,
      });
      setBookings(data.bookings || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Failed to load bookings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleFilter = () => {
    setPage(1);
    loadBookings();
  };

  const inputStyle = {
    border: `1px solid ${LINE}`,
    background: '#FBF7F2',
    color: INK,
    borderRadius: '12px',
    padding: '8px 14px',
    fontSize: '13px',
    outline: 'none',
    fontFamily: 'Sora, sans-serif',
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold" style={{ color: INK, letterSpacing: '-0.03em' }}>
          Bookings
        </h1>
        <p className="text-sm mt-1" style={{ color: MUTED }}>View all platform bookings</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <p className="text-[11px] uppercase tracking-widest font-medium mb-1.5" style={{ color: FADED }}>Status</p>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={inputStyle}
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-widest font-medium mb-1.5" style={{ color: FADED }}>From</p>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-widest font-medium mb-1.5" style={{ color: FADED }}>To</p>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} style={inputStyle} />
        </div>
        <button
          onClick={handleFilter}
          className="text-sm font-medium px-5 py-2 rounded-xl"
          style={{ background: INK, color: '#fff' }}
        >
          Apply
        </button>
      </div>

      {/* Table */}
      <div>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: LINE, borderTopColor: ACCENT }} />
          </div>
        ) : bookings.length > 0 ? (
          <div>
            <div
              className="grid gap-4 px-4 py-3 text-[11px] uppercase tracking-widest font-medium"
              style={{
                gridTemplateColumns: '2fr 2fr 2fr 1.5fr 1fr 1fr',
                borderBottom: `1px solid ${LINE}`,
                color: FADED,
              }}
            >
              <span>Client</span>
              <span>Provider</span>
              <span>Service</span>
              <span>Date</span>
              <span>Price</span>
              <span>Status</span>
            </div>
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="grid gap-4 px-4 py-4 items-center"
                style={{
                  gridTemplateColumns: '2fr 2fr 2fr 1.5fr 1fr 1fr',
                  borderBottom: `1px solid ${LINE}`,
                }}
              >
                <span className="text-sm font-medium truncate" style={{ color: INK }}>
                  {booking.client_name || 'Unknown'}
                </span>
                <span className="text-sm truncate" style={{ color: MUTED }}>
                  {booking.provider_name || 'Unknown'}
                </span>
                <span className="text-sm truncate" style={{ color: MUTED }}>
                  {booking.service_name || '—'}
                </span>
                <span className="text-xs" style={{ color: MUTED }}>
                  {booking.scheduled_at ? new Date(booking.scheduled_at).toLocaleString() : '—'}
                </span>
                <span className="text-sm font-medium" style={{ color: INK }}>
                  {formatCurrency(booking.price)}
                </span>
                <span>
                  <span
                    className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                    style={statusStyle(booking.status)}
                  >
                    {booking.status || 'unknown'}
                  </span>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center py-16 rounded-xl"
            style={{ border: `1px dashed ${LINE}` }}
          >
            <p className="text-sm" style={{ color: MUTED }}>No bookings found</p>
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
    </div>
  );
};

export default AdminBookings;
