/**
 * BlockTimePage — v6 Warm Editorial
 * Route: /provider/block-time
 *
 * API:
 *   GET    /api/provider/blocked-dates   → { blocks: [...] }
 *   POST   /api/provider/blocked-dates   → { block }
 *   DELETE /api/provider/blocked-dates/:id
 */
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { request } from '../../data/apiClient';
import BackBtn from '../../components/ui/BackBtn';
import Lbl from '../../components/ui/Lbl';
import Divider from '../../components/ui/Divider';
import Footer from '../../components/ui/Footer';
import { useToast } from '../../components/ui/ToastProvider';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDisplayDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtTime12(val) {
    if (!val) return '';
    const [h, m] = val.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hr = h % 12 || 12;
    return `${hr}:${String(m).padStart(2, '0')} ${ampm}`;
}

// Color palette for upcoming blocks
const BAR_COLORS = ['#C25E4A', '#5A8A5E', '#8C6A64', '#B0948F', '#92400E'];

// ─── Time selector ────────────────────────────────────────────────────────────

const TIME_OPTIONS = (() => {
    const opts = [];
    for (let h = 0; h <= 23; h++) {
        for (const m of [0, 30]) {
            const ampm = h >= 12 ? 'PM' : 'AM';
            const hr = h % 12 || 12;
            opts.push({
                label: `${hr}:${String(m).padStart(2, '0')} ${ampm}`,
                value: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
            });
        }
    }
    return opts;
})();

const TimeSelect = ({ value, onChange, placeholder }) => (
    <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2.5 rounded-[12px] text-[14px] text-ink focus:outline-none appearance-none"
        style={{ background: '#F2EBE5', border: '1px solid rgba(140,106,100,0.2)', fontFamily: 'inherit', minWidth: 110 }}
    >
        <option value="">{placeholder}</option>
        {TIME_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
        ))}
    </select>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const BlockTimePage = () => {
    const navigate = useNavigate();
    const toast = useToast();

    const [blockType, setBlockType] = useState('full_day'); // 'full_day' | 'hours'
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [reason, setReason] = useState('');

    const [blocks, setBlocks] = useState([]);
    const [loadingBlocks, setLoadingBlocks] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(null);

    // ── Load upcoming blocks ─────────────────────────────────────────────────
    const loadBlocks = useCallback(async () => {
        setLoadingBlocks(true);
        try {
            const data = await request('/provider/blocked-dates');
            setBlocks(data.blocks || []);
        } catch (err) {
            console.error('[BlockTimePage] load error:', err);
        } finally {
            setLoadingBlocks(false);
        }
    }, []);

    useEffect(() => { loadBlocks(); }, [loadBlocks]);

    // ── Block this time ──────────────────────────────────────────────────────
    const handleBlock = async () => {
        if (!date) {
            toast.push({ title: 'Pick a date first', variant: 'error' });
            return;
        }
        if (blockType === 'hours' && (!startTime || !endTime)) {
            toast.push({ title: 'Pick start and end time', variant: 'error' });
            return;
        }
        setSaving(true);
        try {
            await request('/provider/blocked-dates', {
                method: 'POST',
                body: JSON.stringify({
                    date,
                    blockType,
                    startTime: blockType === 'hours' ? startTime : null,
                    endTime: blockType === 'hours' ? endTime : null,
                    reason: reason.trim() || null,
                }),
            });
            // Reset form
            setDate('');
            setStartTime('');
            setEndTime('');
            setReason('');
            toast.push({ title: 'Time blocked', variant: 'success' });
            await loadBlocks();
        } catch (err) {
            console.error('[BlockTimePage] save error:', err);
            toast.push({ title: 'Failed to block time', variant: 'error' });
        } finally {
            setSaving(false);
        }
    };

    // ── Delete block ─────────────────────────────────────────────────────────
    const handleDelete = async (id) => {
        setDeleting(id);
        try {
            await request(`/provider/blocked-dates/${id}`, { method: 'DELETE' });
            setBlocks((prev) => prev.filter((b) => b.id !== id));
        } catch (err) {
            console.error('[BlockTimePage] delete error:', err);
            toast.push({ title: 'Failed to delete', variant: 'error' });
        } finally {
            setDeleting(null);
        }
    };

    return (
        <div className="flex flex-col bg-base" style={{ minHeight: '100dvh' }}>

            {/* ── Back nav ── */}
            <div className="flex items-center px-5 pt-10 pb-2">
                <BackBtn onClick={() => navigate('/provider/schedule')} />
            </div>

            {/* ── Title ── */}
            <div className="px-5 pb-5">
                <Lbl className="block mb-1.5">Manage time off</Lbl>
                <h1 className="text-[32px] font-semibold text-ink tracking-[-0.03em] leading-tight m-0">
                    Block Time
                </h1>
            </div>

            <div className="flex-1 px-5 pb-10">

                {/* ─ Block type segment ─ */}
                <div className="flex gap-2 mb-5">
                    {[
                        { id: 'full_day', label: 'Full Day' },
                        { id: 'hours',    label: 'Specific Hours' },
                    ].map((opt) => {
                        const active = blockType === opt.id;
                        return (
                            <button
                                key={opt.id}
                                onClick={() => setBlockType(opt.id)}
                                className="flex-1 py-3 rounded-[12px] text-[13px] font-semibold focus:outline-none"
                                style={{
                                    border: active ? '2px solid #C25E4A' : '1px solid rgba(140,106,100,0.2)',
                                    background: active ? '#FDDCC6' : 'transparent',
                                    color: active ? '#C25E4A' : '#8C6A64',
                                }}
                            >
                                {opt.label}
                            </button>
                        );
                    })}
                </div>

                {/* ─ Date picker ─ */}
                <div className="mb-4">
                    <Lbl className="block mb-2">Date</Lbl>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        min={new Date().toISOString().slice(0, 10)}
                        className="w-full px-4 py-3 rounded-[12px] text-[15px] text-ink focus:outline-none"
                        style={{
                            background: '#F2EBE5',
                            border: '1px solid rgba(140,106,100,0.2)',
                            fontFamily: 'inherit',
                            boxSizing: 'border-box',
                        }}
                    />
                </div>

                {/* ─ Time range (specific hours only) ─ */}
                {blockType === 'hours' && (
                    <div className="mb-4">
                        <Lbl className="block mb-2">Time range</Lbl>
                        <div className="flex items-center gap-3">
                            <TimeSelect value={startTime} onChange={setStartTime} placeholder="Start" />
                            <span className="text-[14px] text-muted">–</span>
                            <TimeSelect value={endTime} onChange={setEndTime} placeholder="End" />
                        </div>
                    </div>
                )}

                {/* ─ Reason ─ */}
                <div className="mb-5">
                    <Lbl className="block mb-2">Reason <span className="text-faded normal-case tracking-normal font-normal">(optional)</span></Lbl>
                    <input
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g. Vacation, personal day…"
                        className="w-full px-4 py-3 rounded-[12px] text-[15px] text-ink focus:outline-none"
                        style={{
                            background: '#F2EBE5',
                            border: '1px solid rgba(140,106,100,0.2)',
                            fontFamily: 'inherit',
                            boxSizing: 'border-box',
                        }}
                    />
                </div>

                {/* ─ Block button ─ */}
                <button
                    onClick={handleBlock}
                    disabled={saving}
                    className="w-full py-4 rounded-[14px] text-[14px] font-semibold text-white focus:outline-none flex items-center justify-center gap-2 mb-8"
                    style={{ background: '#3D231E', border: 'none', opacity: saving ? 0.7 : 1 }}
                >
                    {saving && (
                        <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                    )}
                    {saving ? 'Blocking…' : 'Block This Time'}
                </button>

                {/* ─ Upcoming blocks ─ */}
                <Lbl className="block mb-3">Upcoming Blocks</Lbl>
                <Divider />

                {loadingBlocks && (
                    <div className="py-8 flex flex-col gap-3">
                        {[1, 2].map((i) => (
                            <div key={i} className="flex items-center gap-3 py-2">
                                <div className="w-1 h-10 rounded-full bg-line/60 animate-pulse flex-shrink-0" />
                                <div className="flex-1">
                                    <div className="h-4 w-32 bg-line/60 rounded animate-pulse mb-1.5" />
                                    <div className="h-3 w-20 bg-line/60 rounded animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!loadingBlocks && blocks.length === 0 && (
                    <p className="text-[14px] text-muted py-8 text-center m-0">No upcoming blocks.</p>
                )}

                {!loadingBlocks && blocks.map((block, i) => {
                    const barColor = BAR_COLORS[i % BAR_COLORS.length];
                    const timeLabel = block.block_type === 'hours' && block.start_time
                        ? `${fmtTime12(block.start_time)} – ${fmtTime12(block.end_time)}`
                        : 'All day';
                    return (
                        <div key={block.id}>
                            <div className="flex items-start gap-3 py-4">
                                {/* Colored left bar */}
                                <div
                                    className="flex-shrink-0 rounded-full mt-0.5"
                                    style={{ width: 4, height: 40, background: barColor }}
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-[15px] font-semibold text-ink m-0 mb-0.5">
                                        {fmtDisplayDate(block.date)}
                                    </p>
                                    <p className="text-[13px] text-muted m-0">
                                        {timeLabel}
                                        {block.reason ? ` · ${block.reason}` : ''}
                                    </p>
                                </div>
                                {/* Delete button */}
                                <button
                                    onClick={() => handleDelete(block.id)}
                                    disabled={deleting === block.id}
                                    className="focus:outline-none flex-shrink-0 active:opacity-60"
                                    style={{ opacity: deleting === block.id ? 0.4 : 1 }}
                                >
                                    {deleting === block.id ? (
                                        <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(140,106,100,0.3)', borderTop: '2px solid #B0948F', animation: 'spin 0.8s linear infinite' }} />
                                    ) : (
                                        <svg width="18" height="18" fill="none" stroke="#B0948F" strokeWidth="1.5" viewBox="0 0 24 24">
                                            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            <Divider />
                        </div>
                    );
                })}

                <Footer />
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default BlockTimePage;
