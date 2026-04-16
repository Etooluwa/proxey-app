/**
 * ProviderInsights — v6 Warm Editorial
 * Route: /provider/insights
 *
 * Gives providers a high-level view of client behaviour:
 *   - Stat cards (total, active, new this month, avg visits, retention)
 *   - Filterable + sortable client table
 *   - Excel export via /api/provider/clients/insights/export
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useSession } from '../../auth/authContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { request } from '../../data/apiClient';
import { formatMoney } from '../../utils/formatMoney';
import Header from '../../components/ui/Header';
import Lbl from '../../components/ui/Lbl';
import Footer from '../../components/ui/Footer';

// ─── Design tokens ─────────────────────────────────────────────────────────────
const T = {
    ink: '#3D231E',
    muted: '#8C6A64',
    faded: '#B0948F',
    accent: '#C25E4A',
    line: 'rgba(140,106,100,0.18)',
    card: '#FFFFFF',
    base: '#FBF7F2',
    avatarBg: '#F2EBE5',
    hero: '#FDDCC6',
    success: '#5A8A5E',
    successBg: '#EBF2EC',
    callout: '#FFF5E6',
    amber: '#C27A1A',
    amberBg: '#FEF3E2',
    dangerBg: '#FDEDEA',
    danger: '#B04040',
};
const F = "'Sora',system-ui,sans-serif";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name) {
    return (name || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const fmtMoney = (cents, currency = 'cad') => formatMoney(cents ?? 0, currency);

// ─── Status pill ──────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    active:   { label: 'Active',   bg: T.successBg, color: T.success },
    new:      { label: 'New',      bg: T.hero,      color: T.accent },
    'at-risk':{ label: 'At Risk',  bg: T.amberBg,   color: T.amber },
    inactive: { label: 'Inactive', bg: T.avatarBg,  color: T.faded },
};

function StatusPill({ status }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.inactive;
    return (
        <span style={{
            padding: '3px 10px',
            borderRadius: 9999,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
            background: cfg.bg,
            color: cfg.color,
            display: 'inline-block',
            fontFamily: F,
        }}>
            {cfg.label}
        </span>
    );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, subUp }) {
    return (
        <div style={{
            padding: '20px',
            background: T.card,
            border: `1px solid ${T.line}`,
            borderRadius: 16,
            fontFamily: F,
        }}>
            <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', color: T.faded, marginBottom: 8 }}>
                {label}
            </div>
            <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1, color: T.ink }}>
                {value}
            </div>
            {sub && (
                <div style={{ fontSize: 11, fontWeight: 500, marginTop: 6, color: subUp === true ? T.success : subUp === false ? T.danger : T.faded, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {subUp === true && (
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M5 15l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    )}
                    {subUp === false && (
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    )}
                    {sub}
                </div>
            )}
        </div>
    );
}

// ─── Sort icon ────────────────────────────────────────────────────────────────
function SortIcon({ active, dir }) {
    if (!active) return (
        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ marginLeft: 4, verticalAlign: 'middle', opacity: 0.4 }}>
            <path d="M7 11l5-5 5 5M7 17l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
    return dir === 'asc' ? (
        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ marginLeft: 4, verticalAlign: 'middle', color: T.accent }}>
            <path d="M5 15l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ) : (
        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ marginLeft: 4, verticalAlign: 'middle', color: T.accent }}>
            <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

// ─── Filter pills ─────────────────────────────────────────────────────────────
const STATUS_FILTERS = [
    { value: 'all',      label: 'All',      desc: 'Everyone' },
    { value: 'new',      label: 'New',      desc: 'Within 14 days' },
    { value: 'active',   label: 'Active',   desc: 'Booked in 30 days' },
    { value: 'at-risk',  label: 'At Risk',  desc: 'No booking 30–90 days' },
    { value: 'inactive', label: 'Inactive', desc: 'No booking 90+ days' },
];

const PERIOD_OPTIONS = [
    { value: '30d', label: 'Last 30 days' },
    { value: '7d',  label: 'Last 7 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '',    label: 'All time' },
];

const SORT_COLS = [
    { key: 'name',         label: 'Client' },
    { key: 'visits',       label: 'Visits' },
    { key: 'last_visit',   label: 'Last Visit' },
    { key: 'total_spent',  label: 'Total Spent' },
    { key: 'connected_at', label: 'Connected' },
];

const PAGE_SIZE = 20;

// ─── Avatar cell ──────────────────────────────────────────────────────────────
function TableAvatar({ name }) {
    const initials = getInitials(name);
    return (
        <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: T.avatarBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 500, color: T.muted, flexShrink: 0,
            fontFamily: F,
        }}>
            {initials}
        </div>
    );
}

// ─── Mobile card (shown instead of table on small screens) ────────────────────
function MobileClientCard({ client, onClick, currency }) {
    const cfg = STATUS_CONFIG[client.status] || STATUS_CONFIG.inactive;
    return (
        <button
            onClick={onClick}
            style={{
                width: '100%', textAlign: 'left', background: 'none', border: 'none',
                padding: '16px 0', display: 'flex', alignItems: 'center', gap: 12,
                cursor: 'pointer', fontFamily: F,
            }}
        >
            <TableAvatar name={client.name} />
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 15, fontWeight: 500, color: T.ink }}>{client.name}</span>
                    <StatusPill status={client.status} />
                </div>
                <div style={{ fontSize: 12, color: T.muted }}>
                    {client.visits} {client.visits === 1 ? 'visit' : 'visits'}
                    {client.last_visit ? ` · Last ${fmtDate(client.last_visit)}` : ''}
                    {' · '}<span style={{ color: T.accent, fontWeight: 500 }}>{fmtMoney(client.total_spent, currency)}</span>
                </div>
                {client.top_service && (
                    <div style={{ fontSize: 11, color: T.faded, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {client.top_service}
                    </div>
                )}
            </div>
            <svg width="16" height="16" fill="none" stroke={T.faded} strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </button>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
const ProviderInsights = () => {
    const navigate = useNavigate();
    const { onMenu, isDesktop } = useOutletContext() || {};
    const { session, profile } = useSession();
    const { unreadCount } = useNotifications();

    // Data state
    const [data, setData] = useState(null);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);

    // Filter/sort state
    const [status, setStatus] = useState('all');
    const [serviceId, setServiceId] = useState('');
    const [period, setPeriod] = useState('30d');
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('visits');
    const [order, setOrder] = useState('desc');
    const [page, setPage] = useState(1);

    const searchRef = useRef(null);
    const debounceRef = useRef(null);

    const providerId = session?.user?.id;
    const displayName = profile?.name || session?.user?.email?.split('@')[0] || 'You';
    const initials = displayName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
    const avatarSrc = profile?.photo || profile?.avatar || '';

    // Fetch services for the filter dropdown
    useEffect(() => {
        request('/provider/services')
            .then((d) => setServices(d?.services || []))
            .catch(() => {});
    }, []);

    // Main data fetch
    const fetchData = useCallback((params) => {
        setLoading(true);
        const qs = new URLSearchParams();
        if (params.status && params.status !== 'all') qs.set('status', params.status);
        if (params.serviceId) qs.set('service', params.serviceId);
        if (params.period) qs.set('period', params.period);
        if (params.search) qs.set('search', params.search);
        if (params.sort) qs.set('sort', params.sort);
        if (params.order) qs.set('order', params.order);
        qs.set('page', params.page || 1);
        qs.set('limit', PAGE_SIZE);

        request(`/provider/clients/insights?${qs.toString()}`)
            .then((d) => setData(d))
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, []);

    // Re-fetch when filters/sort/page change
    useEffect(() => {
        fetchData({ status, serviceId, period, search, sort, order, page });
    }, [status, serviceId, period, search, sort, order, page, fetchData]);

    // Reset page when filters change
    function applyStatus(v) { setStatus(v); setPage(1); }
    function applyServiceId(v) { setServiceId(v); setPage(1); }
    function applyPeriod(v) { setPeriod(v); setPage(1); }
    function applySearch(v) {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => { setSearch(v); setPage(1); }, 300);
    }

    function handleSort(key) {
        if (sort === key) {
            setOrder((o) => (o === 'desc' ? 'asc' : 'desc'));
        } else {
            setSort(key);
            setOrder('desc');
        }
        setPage(1);
    }

    async function handleExport() {
        setExporting(true);
        try {
            const qs = new URLSearchParams();
            if (status && status !== 'all') qs.set('status', status);
            if (serviceId) qs.set('service', serviceId);
            if (period) qs.set('period', period);
            if (search) qs.set('search', search);
            if (sort) qs.set('sort', sort);
            if (order) qs.set('order', order);

            const token = session?.access_token;
            const baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://proxeybooking-app.onrender.com/api';
            const res = await fetch(`${baseUrl}/provider/clients/insights/export?${qs.toString()}`, {
                headers: { Authorization: token ? `Bearer ${token}` : '' },
            });
            if (!res.ok) throw new Error('Export failed');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'client-insights.xlsx';
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            // silent — could show a toast
        } finally {
            setExporting(false);
        }
    }

    const stats = data?.stats || {};
    const clients = data?.clients || [];
    const total = data?.total || 0;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    // ── Shared content ────────────────────────────────────────────────────────
    const pageContent = (
        <div style={{ padding: isDesktop ? '0 40px 60px' : '0 0 60px', maxWidth: isDesktop ? 1100 : undefined, fontFamily: F }}>

            {/* Page header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, padding: isDesktop ? 0 : '24px 20px 0' }}>
                <div>
                    <Lbl style={{ display: 'block', marginBottom: 6, color: T.accent }}>Analytics</Lbl>
                    <h1 style={{ fontSize: isDesktop ? 30 : 26, fontWeight: 600, letterSpacing: '-0.03em', margin: 0, color: T.ink }}>
                        Client Insights
                    </h1>
                </div>
                <button
                    onClick={handleExport}
                    disabled={exporting}
                    style={{
                        padding: '12px 20px', borderRadius: 12, background: T.ink, color: '#fff',
                        fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8,
                        border: 'none', cursor: exporting ? 'wait' : 'pointer',
                        opacity: exporting ? 0.7 : 1, fontFamily: F, flexShrink: 0,
                    }}
                >
                    {exporting ? (
                        <svg width="15" height="15" fill="none" stroke="#fff" strokeWidth="1.5" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}>
                            <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" strokeLinecap="round" />
                        </svg>
                    ) : (
                        <svg width="15" height="15" fill="none" stroke="#fff" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    )}
                    {isDesktop ? 'Export' : ''}
                </button>
            </div>

            {/* Stat cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: isDesktop ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)',
                gap: 12,
                marginBottom: 24,
                padding: isDesktop ? 0 : '0 20px',
            }}>
                <StatCard label="Active Clients" value={loading ? '—' : stats.active_clients ?? 0} sub="Booked in last 30 days" subUp={true} />
                <StatCard label="New This Month" value={loading ? '—' : stats.new_this_month ?? 0} sub="Joined in last 30 days" />
                <StatCard label="Avg. Visits / Client" value={loading ? '—' : (stats.avg_visits ?? 0).toFixed(1)} sub="Across all clients" />
                <StatCard label="Retention Rate" value={loading ? '—' : `${stats.retention_rate ?? 0}%`} sub="Clients who rebooked" subUp={(stats.retention_rate ?? 0) >= 70} />
            </div>

            {/* Filters */}
            <div style={{ padding: isDesktop ? 0 : '0 20px', marginBottom: 16 }}>
                {/* Search */}
                <div style={{ position: 'relative', marginBottom: 12 }}>
                    <svg width="14" height="14" fill="none" stroke={T.faded} strokeWidth="1.5" viewBox="0 0 24 24"
                        style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <input
                        ref={searchRef}
                        type="text"
                        placeholder="Search clients..."
                        onChange={(e) => applySearch(e.target.value)}
                        style={{
                            width: '100%', padding: '10px 14px 10px 36px',
                            borderRadius: 9999, border: `1px solid ${T.line}`,
                            fontSize: 13, color: T.ink, background: T.card,
                            fontFamily: F, outline: 'none',
                        }}
                    />
                </div>

                {/* Status pills */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                    {STATUS_FILTERS.map((f) => (
                        <button
                            key={f.value}
                            onClick={() => applyStatus(f.value)}
                            style={{
                                padding: '8px 14px', borderRadius: 14,
                                border: `1px solid ${status === f.value ? T.accent : T.line}`,
                                background: status === f.value ? T.hero : T.card,
                                color: status === f.value ? T.accent : T.muted,
                                fontSize: 12, fontWeight: status === f.value ? 500 : 400,
                                cursor: 'pointer', fontFamily: F,
                                display: 'flex', flexDirection: 'column', gap: 1, textAlign: 'left',
                            }}
                        >
                            <span style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.2 }}>{f.label}</span>
                            <span style={{ fontSize: 10, opacity: 0.7, lineHeight: 1.2 }}>{f.desc}</span>
                        </button>
                    ))}
                </div>

                {/* Service + period selects */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {services.length > 0 && (
                        <select
                            value={serviceId}
                            onChange={(e) => applyServiceId(e.target.value)}
                            style={{
                                padding: '8px 32px 8px 14px', borderRadius: 9999,
                                border: `1px solid ${T.line}`, fontSize: 12, color: T.muted,
                                background: T.card, fontFamily: F, outline: 'none', cursor: 'pointer',
                                appearance: 'none',
                            }}
                        >
                            <option value="">All Services</option>
                            {services.map((s) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    )}
                    <select
                        value={period}
                        onChange={(e) => applyPeriod(e.target.value)}
                        style={{
                            padding: '8px 32px 8px 14px', borderRadius: 9999,
                            border: `1px solid ${T.line}`, fontSize: 12, color: T.muted,
                            background: T.card, fontFamily: F, outline: 'none', cursor: 'pointer',
                            appearance: 'none',
                        }}
                    >
                        {PERIOD_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table (desktop) / Cards (mobile) */}
            <div style={{ padding: isDesktop ? 0 : '0 20px' }}>
                {isDesktop ? (
                    /* ── Desktop table ── */
                    <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 16, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: F }}>
                            <thead>
                                <tr>
                                    {SORT_COLS.map((col) => (
                                        <th
                                            key={col.key}
                                            onClick={() => handleSort(col.key)}
                                            style={{
                                                padding: '14px 18px', fontSize: 11, fontWeight: 600,
                                                letterSpacing: '0.04em', textTransform: 'uppercase',
                                                color: sort === col.key ? T.accent : T.faded,
                                                textAlign: 'left', borderBottom: `1px solid ${T.line}`,
                                                background: T.card, cursor: 'pointer', whiteSpace: 'nowrap',
                                                userSelect: 'none',
                                            }}
                                        >
                                            {col.label}
                                            <SortIcon active={sort === col.key} dir={order} />
                                        </th>
                                    ))}
                                    <th style={{
                                        padding: '14px 18px', fontSize: 11, fontWeight: 600,
                                        letterSpacing: '0.04em', textTransform: 'uppercase',
                                        color: T.faded, textAlign: 'left', borderBottom: `1px solid ${T.line}`,
                                        background: T.card, whiteSpace: 'nowrap',
                                    }}>
                                        Status
                                    </th>
                                    <th style={{
                                        padding: '14px 18px', fontSize: 11, fontWeight: 600,
                                        letterSpacing: '0.04em', textTransform: 'uppercase',
                                        color: T.faded, textAlign: 'left', borderBottom: `1px solid ${T.line}`,
                                        background: T.card, whiteSpace: 'nowrap',
                                    }}>
                                        Top Service
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && (
                                    <tr>
                                        <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: T.faded, fontSize: 14 }}>
                                            Loading...
                                        </td>
                                    </tr>
                                )}
                                {!loading && clients.length === 0 && (
                                    <tr>
                                        <td colSpan={7} style={{ padding: 60, textAlign: 'center', color: T.faded, fontSize: 14 }}>
                                            No clients match your filters.
                                        </td>
                                    </tr>
                                )}
                                {!loading && clients.map((c) => (
                                    <tr
                                        key={c.client_id}
                                        onClick={() => navigate(`/provider/clients/${c.client_id}`)}
                                        style={{ cursor: 'pointer', transition: 'background .1s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(194,94,74,0.02)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        {/* Name */}
                                        <td style={{ padding: '14px 18px', borderBottom: `1px solid ${T.line}`, verticalAlign: 'middle' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <TableAvatar name={c.name} />
                                                <span style={{ fontSize: 13, fontWeight: 500, color: T.ink }}>{c.name}</span>
                                            </div>
                                        </td>
                                        {/* Visits */}
                                        <td style={{ padding: '14px 18px', fontSize: 13, color: T.ink, borderBottom: `1px solid ${T.line}`, verticalAlign: 'middle' }}>
                                            {c.visits}
                                        </td>
                                        {/* Last visit */}
                                        <td style={{ padding: '14px 18px', fontSize: 13, color: T.muted, borderBottom: `1px solid ${T.line}`, verticalAlign: 'middle' }}>
                                            {fmtDate(c.last_visit)}
                                        </td>
                                        {/* Total spent */}
                                        <td style={{ padding: '14px 18px', fontSize: 13, fontWeight: 500, color: T.accent, borderBottom: `1px solid ${T.line}`, verticalAlign: 'middle' }}>
                                            {fmtMoney(c.total_spent, profile?.currency)}
                                        </td>
                                        {/* Connected */}
                                        <td style={{ padding: '14px 18px', fontSize: 13, color: T.faded, borderBottom: `1px solid ${T.line}`, verticalAlign: 'middle' }}>
                                            {fmtDate(c.connected_at)}
                                        </td>
                                        {/* Status */}
                                        <td style={{ padding: '14px 18px', borderBottom: `1px solid ${T.line}`, verticalAlign: 'middle' }}>
                                            <StatusPill status={c.status} />
                                        </td>
                                        {/* Top service */}
                                        <td style={{ padding: '14px 18px', fontSize: 12, color: T.muted, borderBottom: `1px solid ${T.line}`, verticalAlign: 'middle', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {c.top_service || '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        {total > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 18px', fontFamily: F }}>
                                <span style={{ fontSize: 12, color: T.faded }}>
                                    Showing {Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)} of {total} clients
                                </span>
                                <div style={{ display: 'flex', gap: 4 }}>
                                    <button
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        style={{
                                            width: 32, height: 32, borderRadius: 8, border: `1px solid ${T.line}`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 12, color: T.muted, background: T.card, cursor: page === 1 ? 'default' : 'pointer',
                                            opacity: page === 1 ? 0.4 : 1,
                                        }}
                                    >
                                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                                        const pg = start + i;
                                        if (pg > totalPages) return null;
                                        return (
                                            <button
                                                key={pg}
                                                onClick={() => setPage(pg)}
                                                style={{
                                                    width: 32, height: 32, borderRadius: 8,
                                                    border: `1px solid ${pg === page ? T.ink : T.line}`,
                                                    background: pg === page ? T.ink : T.card,
                                                    color: pg === page ? '#fff' : T.muted,
                                                    fontSize: 12, cursor: 'pointer',
                                                }}
                                            >
                                                {pg}
                                            </button>
                                        );
                                    })}
                                    <button
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        style={{
                                            width: 32, height: 32, borderRadius: 8, border: `1px solid ${T.line}`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 12, color: T.muted, background: T.card,
                                            cursor: page === totalPages ? 'default' : 'pointer',
                                            opacity: page === totalPages ? 0.4 : 1,
                                        }}
                                    >
                                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* ── Mobile cards ── */
                    <div>
                        {loading && (
                            <div style={{ padding: '40px 0', textAlign: 'center', color: T.faded, fontSize: 14, fontFamily: F }}>
                                Loading...
                            </div>
                        )}
                        {!loading && clients.length === 0 && (
                            <div style={{ padding: '60px 0', textAlign: 'center', color: T.faded, fontSize: 14, fontFamily: F }}>
                                No clients match your filters.
                            </div>
                        )}
                        {!loading && clients.map((c, i) => (
                            <div key={c.client_id}>
                                <MobileClientCard
                                    client={c}
                                    onClick={() => navigate(`/provider/clients/${c.client_id}`)}
                                    currency={profile?.currency}
                                />
                                {i < clients.length - 1 && (
                                    <div style={{ height: 1, background: T.line }} />
                                )}
                            </div>
                        ))}
                        {/* Mobile pagination */}
                        {total > PAGE_SIZE && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, fontFamily: F }}>
                                <span style={{ fontSize: 12, color: T.faded }}>
                                    {Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)} of {total}
                                </span>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        style={{ fontSize: 13, color: page === 1 ? T.faded : T.accent, background: 'none', border: 'none', cursor: page === 1 ? 'default' : 'pointer', fontFamily: F }}
                                    >
                                        ← Prev
                                    </button>
                                    <button
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        style={{ fontSize: 13, color: page === totalPages ? T.faded : T.accent, background: 'none', border: 'none', cursor: page === totalPages ? 'default' : 'pointer', fontFamily: F }}
                                    >
                                        Next →
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    // ── Mobile layout ─────────────────────────────────────────────────────────
    if (!isDesktop) {
        return (
            <div style={{ minHeight: '100vh', background: T.base, fontFamily: F }}>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <Header
                    title="Client Insights"
                    onMenu={onMenu}
                    showBack={false}
                    notifCount={unreadCount}
                    initials={initials}
                    avatarSrc={avatarSrc}
                />
                <div style={{ paddingTop: 8 }}>
                    {pageContent}
                </div>
                <Footer />
            </div>
        );
    }

    // ── Desktop layout ─────────────────────────────────────────────────────────
    return (
        <div style={{ minHeight: '100vh', background: T.base, fontFamily: F }}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <div style={{ paddingTop: 24 }}>
                {pageContent}
            </div>
        </div>
    );
};

export default ProviderInsights;
