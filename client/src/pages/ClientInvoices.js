import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useSession } from '../auth/authContext';
import { request, API_BASE } from '../data/apiClient';
import { supabase } from '../utils/supabase';
import Header from '../components/ui/Header';
import Footer from '../components/ui/Footer';
import { useNotifications } from '../contexts/NotificationContext';

const T = {
    ink: '#3D231E', muted: '#8C6A64', faded: '#B0948F', accent: '#C25E4A',
    line: 'rgba(140,106,100,0.18)', card: '#FFFFFF', avatarBg: '#F2EBE5',
    success: '#5A8A5E', successBg: '#EBF2EC', dangerBg: '#FDEDEA', base: '#FBF7F2',
};
const F = "'Sora',system-ui,sans-serif";

function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtMoney(amount) {
    if (!amount && amount !== 0) return '$0.00';
    const dollars = typeof amount === 'number' ? amount / 100 : parseFloat(amount) / 100;
    return `$${dollars.toFixed(2)}`;
}

function statusStyle(status) {
    const s = status?.toLowerCase();
    if (s === 'paid' || s === 'succeeded') return { bg: '#EBF2EC', color: '#5A8A5E' };
    if (s === 'pending') return { bg: '#FFF5E6', color: '#92400E' };
    if (s === 'overdue') return { bg: '#FDEDEA', color: '#B04040' };
    return { bg: T.avatarBg, color: T.muted };
}

const StatusPill = ({ status }) => {
    const { bg, color } = statusStyle(status);
    return (
        <span style={{ fontFamily: F, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '3px 10px', borderRadius: 9999, background: bg, color }}>
            {status || 'Unknown'}
        </span>
    );
};

const ClientInvoices = () => {
    const navigate = useNavigate();
    const { session } = useSession();
    const { unreadCount } = useNotifications();
    const { isDesktop, onMenu } = useOutletContext() || {};
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [downloadingId, setDownloadingId] = useState(null);

    useEffect(() => { loadInvoices(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const loadInvoices = async () => {
        setLoading(true);
        try {
            const data = await request('/client/invoices');
            setInvoices(Array.isArray(data.invoices) ? data.invoices : []);
        } catch (e) {
            console.error(e);
            setInvoices([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (invoice) => {
        setDownloadingId(invoice.id);
        try {
            const { data: { session: liveSession } } = await supabase.auth.getSession();
            const token = liveSession?.access_token;
            const res = await fetch(`${API_BASE}/invoices/${invoice.id}/pdf`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            });
            if (!res.ok) throw new Error('Failed');
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice-${invoice.invoice_number || invoice.id}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (e) {
            console.error(e);
            alert('Failed to download invoice.');
        } finally {
            setDownloadingId(null);
        }
    };

    const filtered = invoices
        .filter(inv => {
            const s = inv.payment_status?.toLowerCase() || inv.status?.toLowerCase();
            if (statusFilter !== 'all') {
                if (statusFilter === 'paid' && !['paid', 'succeeded'].includes(s)) return false;
                if (statusFilter === 'pending' && s !== 'pending') return false;
                if (statusFilter === 'overdue' && s !== 'overdue') return false;
            }
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                return (inv.invoice_number || '').toLowerCase().includes(q) ||
                    (inv.provider_name || '').toLowerCase().includes(q) ||
                    (inv.service_name || '').toLowerCase().includes(q);
            }
            return true;
        })
        .sort((a, b) => {
            if (sortBy === 'newest') return new Date(b.created_at || b.issued_at) - new Date(a.created_at || a.issued_at);
            if (sortBy === 'oldest') return new Date(a.created_at || a.issued_at) - new Date(b.created_at || b.issued_at);
            if (sortBy === 'highest') return (b.price || b.total_amount || 0) - (a.price || a.total_amount || 0);
            if (sortBy === 'lowest') return (a.price || a.total_amount || 0) - (b.price || b.total_amount || 0);
            return 0;
        });

    const totalPaid = invoices.filter(inv => ['paid', 'succeeded'].includes(inv.payment_status?.toLowerCase() || inv.status?.toLowerCase())).reduce((s, inv) => s + (inv.price || inv.total_amount || 0), 0);
    const totalPending = invoices.filter(inv => (inv.payment_status?.toLowerCase() || inv.status?.toLowerCase()) === 'pending').reduce((s, inv) => s + (inv.price || inv.total_amount || 0), 0);

    // ── Shared: filter bar ───────────────────────────────────────────────────
    const FilterBar = () => (
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search invoices…"
                style={{ flex: 1, minWidth: 180, padding: '9px 14px', borderRadius: 10, border: `1px solid ${T.line}`, background: T.avatarBg, fontFamily: F, fontSize: 13, color: T.ink, outline: 'none' }}
            />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '9px 14px', borderRadius: 10, border: `1px solid ${T.line}`, background: T.avatarBg, fontFamily: F, fontSize: 13, color: T.ink, outline: 'none', cursor: 'pointer' }}>
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: '9px 14px', borderRadius: 10, border: `1px solid ${T.line}`, background: T.avatarBg, fontFamily: F, fontSize: 13, color: T.ink, outline: 'none', cursor: 'pointer' }}>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Amount</option>
                <option value="lowest">Lowest Amount</option>
            </select>
        </div>
    );

    // ── Detail modal (shared) ───────────────────────────────────────────────
    const DetailModal = () => (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(61,35,30,0.35)' }} onClick={() => setSelectedInvoice(null)}>
            <div style={{ background: T.card, borderRadius: 20, width: '100%', maxWidth: 480, overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${T.line}` }}>
                    <span style={{ fontFamily: F, fontSize: 15, fontWeight: 600, color: T.ink }}>Invoice Details</span>
                    <button onClick={() => setSelectedInvoice(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                        <svg width="18" height="18" fill="none" stroke={T.muted} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" /></svg>
                    </button>
                </div>
                <div style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                        <div>
                            <span style={{ fontFamily: F, fontSize: 11, color: T.muted, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Invoice</span>
                            <span style={{ fontFamily: F, fontSize: 16, fontWeight: 600, color: T.ink }}>{selectedInvoice?.invoice_number || `INV-${selectedInvoice?.id?.substring(0, 8).toUpperCase()}`}</span>
                        </div>
                        <StatusPill status={selectedInvoice?.payment_status || selectedInvoice?.status} />
                    </div>
                    <div style={{ background: T.avatarBg, borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
                        {[['Provider', selectedInvoice?.provider_name || '—'], ['Service', selectedInvoice?.service_name || '—'], ['Date', fmtDate(selectedInvoice?.scheduled_at || selectedInvoice?.created_at)]].map(([label, value]) => (
                            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ fontFamily: F, fontSize: 13, color: T.muted }}>{label}</span>
                                <span style={{ fontFamily: F, fontSize: 13, fontWeight: 500, color: T.ink }}>{value}</span>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: `1px solid ${T.line}`, marginBottom: 20 }}>
                        <span style={{ fontFamily: F, fontSize: 14, color: T.muted }}>Total Amount</span>
                        <span style={{ fontFamily: F, fontSize: 20, fontWeight: 600, color: T.ink }}>{fmtMoney(selectedInvoice?.price || selectedInvoice?.total_amount)}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => setSelectedInvoice(null)} style={{ flex: 1, padding: '12px', borderRadius: 12, border: `1px solid ${T.line}`, background: 'transparent', fontFamily: F, fontSize: 13, fontWeight: 500, color: T.ink, cursor: 'pointer' }}>Close</button>
                        <button onClick={() => handleDownload(selectedInvoice)} disabled={downloadingId === selectedInvoice?.id} style={{ flex: 2, padding: '12px', borderRadius: 12, background: T.ink, border: 'none', fontFamily: F, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', opacity: downloadingId === selectedInvoice?.id ? 0.6 : 1 }}>
                            {downloadingId === selectedInvoice?.id ? 'Downloading…' : 'Download PDF'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    // ── Desktop layout ───────────────────────────────────────────────────────
    if (isDesktop) {
        return (
            <div style={{ padding: '40px', fontFamily: F }}>
                <div style={{ maxWidth: 900, margin: '0 auto' }}>
                    {/* Summary stat cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
                        {[
                            { label: 'Total Invoices', value: invoices.length, mono: false },
                            { label: 'Total Paid', value: fmtMoney(totalPaid), mono: true },
                            { label: 'Pending', value: fmtMoney(totalPending), mono: true },
                        ].map(({ label, value }) => (
                            <div key={label} style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.line}`, padding: '18px 20px' }}>
                                <span style={{ fontFamily: F, fontSize: 11, fontWeight: 500, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>{label}</span>
                                <span style={{ fontFamily: F, fontSize: 24, fontWeight: 600, color: T.ink, letterSpacing: '-0.02em' }}>{value}</span>
                            </div>
                        ))}
                    </div>

                    <FilterBar />

                    {/* Loading */}
                    {loading && <div style={{ textAlign: 'center', padding: '48px 0' }}><div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid #C25E4A', borderTopColor: 'transparent', display: 'inline-block' }} /></div>}

                    {/* Empty */}
                    {!loading && filtered.length === 0 && !searchQuery && statusFilter === 'all' && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 24px', textAlign: 'center' }}>
                            <div style={{ width: 72, height: 72, borderRadius: 20, background: T.avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                                <svg width="32" height="32" fill="none" stroke={T.faded} strokeWidth="1.5" viewBox="0 0 24 24">
                                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <p style={{ fontFamily: F, fontSize: 20, fontWeight: 400, color: T.ink, margin: '0 0 8px', letterSpacing: '-0.02em' }}>No invoices yet.</p>
                            <p style={{ fontFamily: F, fontSize: 14, color: T.muted, margin: 0, lineHeight: 1.6, maxWidth: 320 }}>
                                After a provider completes your session, an invoice will be generated automatically from their business.
                            </p>
                        </div>
                    )}
                    {!loading && filtered.length === 0 && (searchQuery || statusFilter !== 'all') && (
                        <div style={{ textAlign: 'center', padding: '48px 0' }}>
                            <p style={{ fontFamily: F, fontSize: 14, color: T.muted, margin: 0 }}>No invoices match your search.</p>
                        </div>
                    )}

                    {/* Data table */}
                    {!loading && filtered.length > 0 && (
                        <div style={{ background: T.card, borderRadius: 16, border: `1px solid ${T.line}`, overflow: 'hidden' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 130px 100px 120px 80px', padding: '10px 20px', borderBottom: `1px solid ${T.line}` }}>
                                {['Invoice', 'Provider / Service', 'Date', 'Amount', 'Status', ''].map((h) => (
                                    <span key={h} style={{ fontFamily: F, fontSize: 11, fontWeight: 500, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
                                ))}
                            </div>
                            {filtered.map((inv, i) => (
                                <div key={inv.id} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 130px 100px 120px 80px', alignItems: 'center', padding: '13px 20px', borderBottom: i < filtered.length - 1 ? `1px solid ${T.line}` : 'none' }}>
                                    <span style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: T.ink }}>{inv.invoice_number || `INV-${inv.id?.substring(0, 8).toUpperCase()}`}</span>
                                    <div>
                                        <p style={{ fontFamily: F, fontSize: 13, fontWeight: 500, color: T.ink, margin: '0 0 2px' }}>{inv.provider_name || 'Provider'}</p>
                                        <p style={{ fontFamily: F, fontSize: 12, color: T.muted, margin: 0 }}>{inv.service_name || 'Service'}</p>
                                    </div>
                                    <span style={{ fontFamily: F, fontSize: 13, color: T.muted }}>{fmtDate(inv.created_at || inv.issued_at || inv.scheduled_at)}</span>
                                    <span style={{ fontFamily: F, fontSize: 14, fontWeight: 600, color: T.ink }}>{fmtMoney(inv.price || inv.total_amount)}</span>
                                    <StatusPill status={inv.payment_status || inv.status} />
                                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                                        <button onClick={() => setSelectedInvoice(inv)} style={{ padding: '6px 10px', borderRadius: 8, background: T.avatarBg, border: 'none', cursor: 'pointer', fontFamily: F, fontSize: 11, fontWeight: 500, color: T.muted }}>View</button>
                                        <button onClick={() => handleDownload(inv)} disabled={downloadingId === inv.id} style={{ padding: '6px 10px', borderRadius: 8, background: T.ink, border: 'none', cursor: 'pointer', fontFamily: F, fontSize: 11, fontWeight: 500, color: '#fff', opacity: downloadingId === inv.id ? 0.5 : 1 }}>PDF</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {selectedInvoice && <DetailModal />}
            </div>
        );
    }

    // ── Mobile layout ────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col min-h-screen" style={{ background: T.base }}>
            <Header onMenu={onMenu} onNotif={() => navigate('/app/notifications')} notifCount={unreadCount} showAvatar={false} />

            <div style={{ padding: '0 20px 24px', flex: 1 }}>
                <div style={{ paddingTop: 8 }}>
                <h1 style={{ fontFamily: F, fontSize: 28, fontWeight: 600, color: T.ink, letterSpacing: '-0.02em', margin: '0 0 20px' }}>My Invoices</h1>

                <FilterBar />

                {loading && <div style={{ textAlign: 'center', padding: '48px 0' }}><div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid #C25E4A', borderTopColor: 'transparent', display: 'inline-block' }} /></div>}

                {!loading && filtered.length === 0 && !searchQuery && statusFilter === 'all' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 24px', textAlign: 'center' }}>
                        <div style={{ width: 72, height: 72, borderRadius: 20, background: T.avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                            <svg width="32" height="32" fill="none" stroke={T.faded} strokeWidth="1.5" viewBox="0 0 24 24">
                                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <p style={{ fontFamily: F, fontSize: 20, fontWeight: 400, color: T.ink, margin: '0 0 8px', letterSpacing: '-0.02em' }}>No invoices yet.</p>
                        <p style={{ fontFamily: F, fontSize: 14, color: T.muted, margin: 0, lineHeight: 1.6, maxWidth: 280 }}>
                            After a provider completes your session, an invoice will be generated automatically from their business.
                        </p>
                    </div>
                )}
                {!loading && filtered.length === 0 && (searchQuery || statusFilter !== 'all') && (
                    <div style={{ textAlign: 'center', padding: '48px 0' }}>
                        <p style={{ fontFamily: F, fontSize: 14, color: T.muted, margin: 0 }}>No invoices match your search.</p>
                    </div>
                )}

                {!loading && filtered.map((inv) => (
                    <div key={inv.id} style={{ background: T.card, borderRadius: 16, border: `1px solid ${T.line}`, padding: '16px', marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                            <div>
                                <p style={{ fontFamily: F, fontSize: 14, fontWeight: 600, color: T.ink, margin: '0 0 2px' }}>{inv.invoice_number || `INV-${inv.id?.substring(0, 8).toUpperCase()}`}</p>
                                <p style={{ fontFamily: F, fontSize: 13, color: T.muted, margin: 0 }}>{inv.provider_name || 'Provider'}</p>
                            </div>
                            <StatusPill status={inv.payment_status || inv.status} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <p style={{ fontFamily: F, fontSize: 12, color: T.muted, margin: '0 0 2px' }}>{fmtDate(inv.created_at || inv.issued_at)}</p>
                                <p style={{ fontFamily: F, fontSize: 18, fontWeight: 600, color: T.ink, margin: 0 }}>{fmtMoney(inv.price || inv.total_amount)}</p>
                            </div>
                            <button onClick={() => handleDownload(inv)} disabled={downloadingId === inv.id} style={{ padding: '8px 16px', borderRadius: 10, background: T.avatarBg, border: 'none', fontFamily: F, fontSize: 12, fontWeight: 600, color: T.ink, cursor: 'pointer', opacity: downloadingId === inv.id ? 0.5 : 1 }}>
                                {downloadingId === inv.id ? 'Downloading…' : 'Download'}
                            </button>
                        </div>
                    </div>
                ))}
                </div>
            </div>

            {selectedInvoice && <DetailModal />}
            <Footer />
        </div>
    );
};

export default ClientInvoices;
