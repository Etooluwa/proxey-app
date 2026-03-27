/**
 * ProviderSchedule — v6 Warm Editorial
 * Route: /provider/schedule
 *
 * API: GET /api/provider/calendar?year=YYYY&month=M(0-based)
 *   → { byDate: { "YYYY-MM-DD": [...bookings] }, blockedDates: { "YYYY-MM-DD": [...] } }
 */
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { CalendarBlank, Clock, MinusCircle, SlidersHorizontal, Trash } from '@phosphor-icons/react';
import { useSession } from '../../auth/authContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { request } from '../../data/apiClient';
import Header from '../../components/ui/Header';
import Avatar from '../../components/ui/Avatar';
import Lbl from '../../components/ui/Lbl';
import Divider from '../../components/ui/Divider';
import Footer from '../../components/ui/Footer';
import { useToast } from '../../components/ui/ToastProvider';

const T = {
    ink: '#3D231E',
    muted: '#8C6A64',
    accent: '#C25E4A',
    line: 'rgba(140,106,100,0.18)',
    avatarBg: '#F2EBE5',
    faded: '#B0948F',
    base: '#FBF7F2',
    success: '#5A8A5E',
    danger: '#B04040',
};
const F = "'Sora',system-ui,sans-serif";

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_NAMES_LONG = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIME_OPTIONS = (() => {
    const opts = [];
    for (let h = 6; h <= 23; h += 1) {
        for (const m of [0, 30]) {
            const ampm = h >= 12 ? 'PM' : 'AM';
            const hr = h % 12 || 12;
            opts.push({
                value: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
                label: `${hr}:${String(m).padStart(2, '0')} ${ampm}`,
            });
        }
    }
    return opts;
})();

function monFirstDow(date) {
    return (date.getDay() + 6) % 7;
}

function fmtTime(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function fmtDuration(mins) {
    if (!mins) return null;
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
}

function fmtBlockTime(t) {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hr = h % 12 || 12;
    return `${hr}:${String(m).padStart(2, '0')} ${ampm}`;
}

function getTimeOptionLabel(value) {
    return TIME_OPTIONS.find((option) => option.value === value)?.label || value;
}

function getTimeOptionPeriod(value) {
    const hour = Number(String(value || '').slice(0, 2));
    if (Number.isNaN(hour)) return '';
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    return 'Evening';
}

function getInitials(name) {
    return (name || 'C').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function getDayBlocks(blockedDates, dateKey) {
    return Array.isArray(blockedDates?.[dateKey]) ? blockedDates[dateKey] : [];
}

function getFullDayBlock(blocks) {
    return (blocks || []).find((row) => row.block_type === 'full_day') || null;
}

function getAvailabilityOverride(blocks) {
    return (blocks || []).find((row) => row.block_type === 'availability_override') || null;
}

function getPartialBlocks(blocks) {
    return (blocks || []).filter((row) => row.block_type !== 'full_day' && row.block_type !== 'availability_override');
}

function upsertBlockedDate(blockedDates, block) {
    if (!block?.date) return blockedDates;
    const dayRows = Array.isArray(blockedDates?.[block.date]) ? blockedDates[block.date] : [];
    const replaceByType = block.block_type === 'availability_override' || block.block_type === 'full_day';
    const nextDayRows = dayRows.filter((row) => {
        if (row.id && block.id && row.id === block.id) return false;
        if (replaceByType && row.block_type === block.block_type) return false;
        return true;
    });

    return {
        ...blockedDates,
        [block.date]: [...nextDayRows, block],
    };
}

function removeBlockedDate(blockedDates, dateKey, blockId) {
    const dayRows = Array.isArray(blockedDates?.[dateKey]) ? blockedDates[dateKey] : [];
    const nextDayRows = dayRows.filter((row) => row.id !== blockId);
    if (nextDayRows.length === 0) {
        const nextState = { ...blockedDates };
        delete nextState[dateKey];
        return nextState;
    }
    return {
        ...blockedDates,
        [dateKey]: nextDayRows,
    };
}

function TimePickerSheet({ label, value, onSelect, onClose }) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-end"
            style={{ background: 'rgba(61,35,30,0.32)' }}
            onClick={onClose}
        >
            <div
                className="w-full rounded-t-[28px] pb-8"
                style={{
                    background: T.base,
                    maxHeight: '68vh',
                    overflowY: 'auto',
                    boxShadow: '0 -16px 40px rgba(61,35,30,0.12)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    className="px-5 pt-3 pb-4"
                    style={{ borderBottom: `1px solid ${T.line}` }}
                >
                    <div
                        className="mx-auto mb-4 rounded-full"
                        style={{ width: 48, height: 5, background: 'rgba(140,106,100,0.24)' }}
                    />
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] m-0" style={{ color: T.muted }}>
                                {label}
                            </p>
                            <p className="text-[22px] font-semibold m-0 mt-1" style={{ color: T.ink, letterSpacing: '-0.03em' }}>
                                {value ? getTimeOptionLabel(value) : 'Choose a time'}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="px-3 py-2 rounded-[12px] text-[12px] font-semibold focus:outline-none"
                            style={{ border: `1px solid ${T.line}`, background: 'transparent', color: T.muted }}
                        >
                            Done
                        </button>
                    </div>
                </div>

                <div className="px-3 py-3">
                    {TIME_OPTIONS.map((option) => {
                        const active = option.value === value;
                        return (
                            <button
                                key={option.value}
                                onClick={() => {
                                    onSelect(option.value);
                                    onClose();
                                }}
                                className="w-full flex items-center justify-between px-4 py-3 rounded-[16px] text-left focus:outline-none"
                                style={{
                                    background: active ? '#F7D9CB' : 'transparent',
                                    color: active ? T.accent : T.ink,
                                    border: active ? '1px solid rgba(194,94,74,0.3)' : '1px solid transparent',
                                }}
                            >
                                <span className="text-[15px] font-semibold">{option.label}</span>
                                <span
                                    className="text-[11px] font-semibold uppercase tracking-[0.05em]"
                                    style={{ color: active ? T.accent : T.muted }}
                                >
                                    {getTimeOptionPeriod(option.value)}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function TimeInput({ value, onChange, label }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <label className="flex-1 min-w-0">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-muted mb-2">
                {label}
            </span>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="w-full px-3.5 py-3 rounded-[14px] text-[15px] focus:outline-none flex items-center justify-between gap-3"
                style={{
                    background: T.avatarBg,
                    border: `1px solid ${T.line}`,
                    boxShadow: 'none',
                    fontFamily: F,
                    minHeight: 54,
                }}
            >
                <span
                    className="truncate"
                    style={{
                        color: value ? T.ink : T.faded,
                        fontWeight: value ? 600 : 500,
                        letterSpacing: value ? '-0.01em' : '0.02em',
                    }}
                >
                    {value ? getTimeOptionLabel(value) : '--:-- --'}
                </span>
                <span
                    className="flex items-center justify-center rounded-full flex-shrink-0"
                    style={{ width: 28, height: 28, background: 'rgba(61,35,30,0.06)' }}
                >
                    <Clock size={16} color={T.ink} />
                </span>
            </button>
            {isOpen && (
                <TimePickerSheet
                    label={label}
                    value={value}
                    onSelect={onChange}
                    onClose={() => setIsOpen(false)}
                />
            )}
        </label>
    );
}

function ActionButton({ active, icon, label, onClick }) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-2 px-3.5 py-3 rounded-[12px] text-[13px] font-semibold focus:outline-none"
            style={{
                background: active ? '#FDDCC6' : 'transparent',
                color: active ? T.accent : T.ink,
                border: active ? `1px solid rgba(194,94,74,0.35)` : `1px solid ${T.line}`,
            }}
        >
            {icon}
            {label}
        </button>
    );
}

function DayStatusBlock({ fullDayBlock, availabilityOverride, partialBlocks, deletingId, onDelete }) {
    return (
        <div className="flex flex-col gap-3 mb-5">
            {fullDayBlock && (
                <div className="flex items-start gap-3 py-3">
                    <div className="w-1 rounded-full flex-shrink-0 mt-1" style={{ height: 40, background: T.faded }} />
                    <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-ink m-0 mb-1">Full-day block</p>
                        <p className="text-[13px] text-muted m-0">
                            This day is fully blocked.
                            {fullDayBlock.reason ? ` ${fullDayBlock.reason}` : ''}
                        </p>
                    </div>
                    <button
                        onClick={() => onDelete(fullDayBlock.id)}
                        disabled={deletingId === fullDayBlock.id}
                        className="p-2 rounded-[10px] focus:outline-none"
                        style={{ border: `1px solid ${T.line}`, color: T.danger, background: 'transparent' }}
                    >
                        <Trash size={16} />
                    </button>
                </div>
            )}

            {availabilityOverride && (
                <div className="flex items-start gap-3 py-3">
                    <div
                        className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5"
                        style={{ border: `2px solid ${T.accent}`, background: 'transparent' }}
                    />
                    <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-ink m-0 mb-1">Availability override</p>
                        <p className="text-[13px] text-muted m-0">
                            Available {fmtBlockTime(availabilityOverride.start_time)} to {fmtBlockTime(availabilityOverride.end_time)}
                            {availabilityOverride.reason ? ` · ${availabilityOverride.reason}` : ''}
                        </p>
                        {fullDayBlock && (
                            <p className="text-[12px] m-0 mt-1" style={{ color: T.faded }}>
                                Full-day block still takes precedence on this date.
                            </p>
                        )}
                    </div>
                    <button
                        onClick={() => onDelete(availabilityOverride.id)}
                        disabled={deletingId === availabilityOverride.id}
                        className="p-2 rounded-[10px] focus:outline-none"
                        style={{ border: `1px solid ${T.line}`, color: T.danger, background: 'transparent' }}
                    >
                        <Trash size={16} />
                    </button>
                </div>
            )}

            {partialBlocks.map((block) => (
                <div key={block.id} className="flex items-start gap-3 py-3">
                    <div className="w-1 rounded-full flex-shrink-0 mt-1" style={{ height: 40, background: T.accent }} />
                    <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-ink m-0 mb-1">
                            Blocked hours · {fmtBlockTime(block.start_time)} to {fmtBlockTime(block.end_time)}
                        </p>
                        {block.reason && <p className="text-[13px] text-muted m-0">{block.reason}</p>}
                    </div>
                    <button
                        onClick={() => onDelete(block.id)}
                        disabled={deletingId === block.id}
                        className="p-2 rounded-[10px] focus:outline-none"
                        style={{ border: `1px solid ${T.line}`, color: T.danger, background: 'transparent' }}
                    >
                        <Trash size={16} />
                    </button>
                </div>
            ))}
        </div>
    );
}

function DayAvailabilitySummary({ fullDayBlock, availabilityOverride, partialBlocks }) {
    const availabilityText = fullDayBlock
        ? 'Blocked all day'
        : availabilityOverride
            ? `${fmtBlockTime(availabilityOverride.start_time)} to ${fmtBlockTime(availabilityOverride.end_time)}`
            : 'Using your regular weekly hours';

    const availabilityTone = fullDayBlock ? T.faded : T.accent;

    return (
        <div className="py-4">
            <Lbl className="block mb-2">Day Availability</Lbl>
            <p className="text-[15px] font-semibold m-0" style={{ color: fullDayBlock ? T.ink : T.ink }}>
                {availabilityText}
            </p>
            {partialBlocks.length > 0 && (
                <p className="text-[13px] text-muted m-0 mt-1">
                    {partialBlocks.length} blocked {partialBlocks.length === 1 ? 'range' : 'ranges'} within the day.
                </p>
            )}
            {!fullDayBlock && availabilityOverride && (
                <p className="text-[12px] m-0 mt-1" style={{ color: availabilityTone }}>
                    This custom window overrides your recurring schedule for this date.
                </p>
            )}
        </div>
    );
}

function DayActions({
    actionMode,
    setActionMode,
    selectedDateKey,
    fullDayBlock,
    availabilityOverride,
    blockStartTime,
    setBlockStartTime,
    blockEndTime,
    setBlockEndTime,
    blockReason,
    setBlockReason,
    overrideStartTime,
    setOverrideStartTime,
    overrideEndTime,
    setOverrideEndTime,
    savingAction,
    onSaveFullDay,
    onSavePartial,
    onSaveOverride,
}) {
    return (
        <div className="pt-3">
            <Lbl className="block mb-3">Adjust This Day</Lbl>
            <div className="flex flex-wrap gap-2 mb-4">
                <ActionButton
                    active={actionMode === 'full_day'}
                    icon={<MinusCircle size={16} />}
                    label={fullDayBlock ? 'Edit full-day block' : 'Block this day'}
                    onClick={() => setActionMode(actionMode === 'full_day' ? null : 'full_day')}
                />
                <ActionButton
                    active={actionMode === 'hours'}
                    icon={<Clock size={16} />}
                    label="Block hours"
                    onClick={() => setActionMode(actionMode === 'hours' ? null : 'hours')}
                />
                <ActionButton
                    active={actionMode === 'override'}
                    icon={<SlidersHorizontal size={16} />}
                    label="Adjust availability"
                    onClick={() => setActionMode(actionMode === 'override' ? null : 'override')}
                />
            </div>

            {actionMode === 'full_day' && (
                <div className="pb-2">
                    <p className="text-[13px] text-muted m-0 mb-3">
                        Block all availability on {selectedDateKey}.
                    </p>
                    <label className="block mb-3">
                        <span className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-muted mb-2">
                            Reason
                        </span>
                        <input
                            type="text"
                            value={blockReason}
                            onChange={(e) => setBlockReason(e.target.value)}
                            placeholder="Optional note"
                            className="w-full px-3.5 py-3 rounded-[12px] text-[14px] text-ink focus:outline-none"
                            style={{ background: T.avatarBg, border: `1px solid ${T.line}`, fontFamily: F, boxSizing: 'border-box' }}
                        />
                    </label>
                    <button
                        onClick={onSaveFullDay}
                        disabled={savingAction}
                        className="px-4 py-3 rounded-[12px] text-[13px] font-semibold text-white focus:outline-none"
                        style={{ background: T.ink, border: 'none' }}
                    >
                        {savingAction ? 'Saving…' : fullDayBlock ? 'Update full-day block' : 'Save full-day block'}
                    </button>
                </div>
            )}

            {actionMode === 'hours' && (
                <div className="pb-2">
                    <p className="text-[13px] text-muted m-0 mb-3">
                        Block part of the day while keeping the rest of your schedule intact.
                    </p>
                    <div className="flex gap-3 mb-3">
                        <TimeInput value={blockStartTime} onChange={setBlockStartTime} label="Block from" />
                        <TimeInput value={blockEndTime} onChange={setBlockEndTime} label="Block until" />
                    </div>
                    <label className="block mb-3">
                        <span className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-muted mb-2">
                            Reason
                        </span>
                        <input
                            type="text"
                            value={blockReason}
                            onChange={(e) => setBlockReason(e.target.value)}
                            placeholder="Optional note"
                            className="w-full px-3.5 py-3 rounded-[12px] text-[14px] text-ink focus:outline-none"
                            style={{ background: T.avatarBg, border: `1px solid ${T.line}`, fontFamily: F, boxSizing: 'border-box' }}
                        />
                    </label>
                    <button
                        onClick={onSavePartial}
                        disabled={savingAction}
                        className="px-4 py-3 rounded-[12px] text-[13px] font-semibold text-white focus:outline-none"
                        style={{ background: T.ink, border: 'none' }}
                    >
                        {savingAction ? 'Saving…' : 'Save blocked hours'}
                    </button>
                </div>
            )}

            {actionMode === 'override' && (
                <div className="pb-2">
                    <p className="text-[13px] text-muted m-0 mb-3">
                        Set the only hours you want to be available on this date.
                    </p>
                    <div className="flex gap-3 mb-3">
                        <TimeInput value={overrideStartTime} onChange={setOverrideStartTime} label="Available from" />
                        <TimeInput value={overrideEndTime} onChange={setOverrideEndTime} label="Available until" />
                    </div>
                    <button
                        onClick={onSaveOverride}
                        disabled={savingAction}
                        className="px-4 py-3 rounded-[12px] text-[13px] font-semibold text-white focus:outline-none"
                        style={{ background: T.ink, border: 'none' }}
                    >
                        {savingAction ? 'Saving…' : availabilityOverride ? 'Update availability override' : 'Save availability override'}
                    </button>
                </div>
            )}
        </div>
    );
}

function DayPanel({
    loading,
    selectedLabel,
    selectedDateKey,
    daySchedule,
    dayBlocks,
    actionMode,
    setActionMode,
    blockStartTime,
    setBlockStartTime,
    blockEndTime,
    setBlockEndTime,
    blockReason,
    setBlockReason,
    overrideStartTime,
    setOverrideStartTime,
    overrideEndTime,
    setOverrideEndTime,
    savingAction,
    deletingId,
    onSaveFullDay,
    onSavePartial,
    onSaveOverride,
    onDeleteBlock,
    navigate,
}) {
    const fullDayBlock = getFullDayBlock(dayBlocks);
    const availabilityOverride = getAvailabilityOverride(dayBlocks);
    const partialBlocks = getPartialBlocks(dayBlocks);

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <p className="text-[17px] font-semibold text-ink m-0">{selectedLabel}</p>
                {loading && <span className="text-[12px] text-muted">Loading…</span>}
            </div>

            <Divider />

            <DayAvailabilitySummary
                fullDayBlock={fullDayBlock}
                availabilityOverride={availabilityOverride}
                partialBlocks={partialBlocks}
            />

            <Divider />

            {dayBlocks.length > 0 && (
                <DayStatusBlock
                    fullDayBlock={fullDayBlock}
                    availabilityOverride={availabilityOverride}
                    partialBlocks={partialBlocks}
                    deletingId={deletingId}
                    onDelete={onDeleteBlock}
                />
            )}

            <div className="pt-4">
                <Lbl className="block mb-2">Schedule</Lbl>
            </div>

            {!loading && daySchedule.length === 0 && (
                <div className="py-6">
                    <p className="text-[15px] text-muted m-0">No appointments scheduled for this day.</p>
                </div>
            )}

            {!loading && daySchedule.length > 0 && (
                <div className="mb-3">
                    {daySchedule.map((booking, i) => {
                        const duration = fmtDuration(booking.duration);
                        return (
                            <div key={booking.id}>
                                <button
                                    onClick={() => navigate(`/provider/appointments/${booking.id}`)}
                                    className="w-full flex items-center gap-3 py-4 text-left focus:outline-none active:opacity-70"
                                >
                                    <div className="flex-shrink-0 rounded-full" style={{ width: 4, height: 40, background: T.accent }} />
                                    <Avatar initials={getInitials(booking.client_name)} size={40} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[15px] font-semibold text-ink m-0 truncate">
                                            {booking.client_name || 'Client'}
                                        </p>
                                        <p className="text-[13px] text-muted m-0 mt-0.5 truncate">
                                            {booking.service_name || 'Session'}
                                            {duration ? ` · ${duration}` : ''}
                                        </p>
                                    </div>
                                    <span className="text-[14px] font-semibold text-ink flex-shrink-0">
                                        {fmtTime(booking.scheduled_at)}
                                    </span>
                                </button>
                                {i < daySchedule.length - 1 && <Divider />}
                            </div>
                        );
                    })}
                </div>
            )}

            <Divider />

            <DayActions
                actionMode={actionMode}
                setActionMode={setActionMode}
                selectedDateKey={selectedDateKey}
                fullDayBlock={fullDayBlock}
                availabilityOverride={availabilityOverride}
                blockStartTime={blockStartTime}
                setBlockStartTime={setBlockStartTime}
                blockEndTime={blockEndTime}
                setBlockEndTime={setBlockEndTime}
                blockReason={blockReason}
                setBlockReason={setBlockReason}
                overrideStartTime={overrideStartTime}
                setOverrideStartTime={setOverrideStartTime}
                overrideEndTime={overrideEndTime}
                setOverrideEndTime={setOverrideEndTime}
                savingAction={savingAction}
                onSaveFullDay={onSaveFullDay}
                onSavePartial={onSavePartial}
                onSaveOverride={onSaveOverride}
            />
        </div>
    );
}

const ProviderSchedule = () => {
    const navigate = useNavigate();
    const { onMenu, isDesktop } = useOutletContext() || {};
    const { profile } = useSession();
    const { unreadCount } = useNotifications();
    const toast = useToast();

    const today = useMemo(() => new Date(), []);
    const [monthOffset, setMonthOffset] = useState(0);
    const [selectedDay, setSelectedDay] = useState(today.getDate());
    const [byDate, setByDate] = useState({});
    const [blockedDates, setBlockedDates] = useState({});
    const [loading, setLoading] = useState(false);
    const [actionMode, setActionMode] = useState(null);
    const [blockStartTime, setBlockStartTime] = useState('');
    const [blockEndTime, setBlockEndTime] = useState('');
    const [blockReason, setBlockReason] = useState('');
    const [overrideStartTime, setOverrideStartTime] = useState('');
    const [overrideEndTime, setOverrideEndTime] = useState('');
    const [savingAction, setSavingAction] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const initials = (profile?.name || '').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || 'P';

    const { displayYear, displayMonth } = useMemo(() => {
        let m = today.getMonth() + monthOffset;
        let y = today.getFullYear();
        while (m > 11) { m -= 12; y++; }
        while (m < 0) { m += 12; y--; }
        return { displayMonth: m, displayYear: y };
    }, [today, monthOffset]);

    const isCurrentCalendarMonth =
        displayYear === today.getFullYear() && displayMonth === today.getMonth();

    const loadMonth = useCallback(async () => {
        setLoading(true);
        try {
            const data = await request(`/provider/calendar?year=${displayYear}&month=${displayMonth}`);
            setByDate(data.byDate || {});
            setBlockedDates(data.blockedDates || {});
        } catch (err) {
            console.error('[ProviderSchedule] load error:', err);
            setByDate({});
            setBlockedDates({});
        } finally {
            setLoading(false);
        }
    }, [displayYear, displayMonth]);

    useEffect(() => { loadMonth(); }, [loadMonth]);

    const handlePrevMonth = () => { setMonthOffset((o) => o - 1); setSelectedDay(1); };
    const handleNextMonth = () => { setMonthOffset((o) => o + 1); setSelectedDay(1); };

    const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();
    const firstDow = monFirstDow(new Date(displayYear, displayMonth, 1));

    const daysWithBookings = useMemo(() => {
        const days = new Set();
        Object.keys(byDate).forEach((key) => {
            const d = new Date(key + 'T00:00:00');
            if (d.getFullYear() === displayYear && d.getMonth() === displayMonth && byDate[key]?.length > 0) {
                days.add(d.getDate());
            }
        });
        return days;
    }, [byDate, displayYear, displayMonth]);

    const daysBlocked = useMemo(() => {
        const days = new Set();
        Object.entries(blockedDates).forEach(([key, rows]) => {
            const d = new Date(key + 'T00:00:00');
            if (d.getFullYear() !== displayYear || d.getMonth() !== displayMonth) return;
            if ((rows || []).some((row) => row.block_type !== 'availability_override')) {
                days.add(d.getDate());
            }
        });
        return days;
    }, [blockedDates, displayYear, displayMonth]);

    const daysWithOverrides = useMemo(() => {
        const days = new Set();
        Object.entries(blockedDates).forEach(([key, rows]) => {
            const d = new Date(key + 'T00:00:00');
            if (d.getFullYear() !== displayYear || d.getMonth() !== displayMonth) return;
            if ((rows || []).some((row) => row.block_type === 'availability_override')) {
                days.add(d.getDate());
            }
        });
        return days;
    }, [blockedDates, displayYear, displayMonth]);

    const selectedDateKey = useMemo(() => {
        const mm = String(displayMonth + 1).padStart(2, '0');
        const dd = String(selectedDay).padStart(2, '0');
        return `${displayYear}-${mm}-${dd}`;
    }, [displayYear, displayMonth, selectedDay]);

    const daySchedule = byDate[selectedDateKey] || [];
    const dayBlocks = useMemo(
        () => getDayBlocks(blockedDates, selectedDateKey),
        [blockedDates, selectedDateKey]
    );

    useEffect(() => {
        const override = getAvailabilityOverride(dayBlocks);
        setOverrideStartTime(override?.start_time || '');
        setOverrideEndTime(override?.end_time || '');
        setBlockReason('');
        setBlockStartTime('');
        setBlockEndTime('');
        setActionMode(null);
    }, [selectedDateKey, dayBlocks]); // eslint-disable-line react-hooks/exhaustive-deps

    const selectedDow = new Date(displayYear, displayMonth, selectedDay).getDay();
    const selectedLabel = `${DAY_NAMES_LONG[selectedDow]}, ${MONTH_NAMES[displayMonth].slice(0, 3)} ${selectedDay}`;

    const saveBlock = async (payload, successTitle) => {
        setSavingAction(true);
        try {
            const data = await request('/provider/blocked-dates', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            if (data?.block) {
                setBlockedDates((prev) => upsertBlockedDate(prev, data.block));
            }
            toast.push({ title: successTitle, variant: 'success' });
            setActionMode(null);
        } catch (err) {
            console.error('[ProviderSchedule] save error:', err);
            toast.push({ title: err.message || 'Failed to save changes', variant: 'error' });
        } finally {
            setSavingAction(false);
        }
    };

    const handleSaveFullDay = () => saveBlock({
        date: selectedDateKey,
        blockType: 'full_day',
        reason: blockReason.trim() || null,
    }, 'Full-day block saved');

    const handleSavePartial = () => {
        if (!blockStartTime || !blockEndTime) {
            toast.push({ title: 'Choose a start and end time', variant: 'error' });
            return;
        }
        return saveBlock({
            date: selectedDateKey,
            blockType: 'partial',
            startTime: blockStartTime,
            endTime: blockEndTime,
            reason: blockReason.trim() || null,
        }, 'Blocked hours saved');
    };

    const handleSaveOverride = () => {
        if (!overrideStartTime || !overrideEndTime) {
            toast.push({ title: 'Choose an available start and end time', variant: 'error' });
            return;
        }
        return saveBlock({
            date: selectedDateKey,
            blockType: 'availability_override',
            startTime: overrideStartTime,
            endTime: overrideEndTime,
        }, 'Availability override saved');
    };

    const handleDeleteBlock = async (id) => {
        setDeletingId(id);
        try {
            await request(`/provider/blocked-dates/${id}`, { method: 'DELETE' });
            setBlockedDates((prev) => removeBlockedDate(prev, selectedDateKey, id));
            toast.push({ title: 'Removed day adjustment', variant: 'success' });
        } catch (err) {
            console.error('[ProviderSchedule] delete error:', err);
            toast.push({ title: err.message || 'Failed to delete adjustment', variant: 'error' });
        } finally {
            setDeletingId(null);
        }
    };

    const renderCalendarButton = (day) => {
        const isSelected = day === selectedDay;
        const isToday = isCurrentCalendarMonth && day === today.getDate();
        const hasBooking = daysWithBookings.has(day);
        const isBlocked = daysBlocked.has(day);
        const hasOverride = daysWithOverrides.has(day);

        return (
            <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className="flex flex-col items-center justify-center focus:outline-none relative"
                style={{
                    aspectRatio: '1',
                    borderRadius: '50%',
                    border: 'none',
                    background: isSelected ? T.accent : 'transparent',
                    outline: isToday && !isSelected ? `2px solid ${T.accent}` : 'none',
                    outlineOffset: '-2px',
                    padding: 0,
                }}
            >
                <span
                    className="text-[14px]"
                    style={{
                        fontWeight: isSelected || isToday ? 700 : 400,
                        color: isSelected ? '#FFFFFF' : T.ink,
                    }}
                >
                    {day}
                </span>

                <div className="absolute bottom-[3px] flex items-center gap-1">
                    {hasBooking && (
                        <div
                            style={{
                                width: 4,
                                height: 4,
                                borderRadius: '50%',
                                background: isSelected ? '#FFFFFF' : T.accent,
                            }}
                        />
                    )}
                    {isBlocked && (
                        <div
                            style={{
                                width: 4,
                                height: 4,
                                borderRadius: '50%',
                                background: isSelected ? '#FFFFFF' : T.faded,
                            }}
                        />
                    )}
                    {hasOverride && (
                        <div
                            style={{
                                width: 7,
                                height: 7,
                                borderRadius: '50%',
                                border: `1.5px solid ${isSelected ? '#FFFFFF' : T.accent}`,
                                background: 'transparent',
                                boxSizing: 'border-box',
                            }}
                        />
                    )}
                </div>
            </button>
        );
    };

    const dayPanel = (
        <DayPanel
            loading={loading}
            selectedLabel={selectedLabel}
            selectedDateKey={selectedDateKey}
            daySchedule={daySchedule}
            dayBlocks={dayBlocks}
            actionMode={actionMode}
            setActionMode={setActionMode}
            blockStartTime={blockStartTime}
            setBlockStartTime={setBlockStartTime}
            blockEndTime={blockEndTime}
            setBlockEndTime={setBlockEndTime}
            blockReason={blockReason}
            setBlockReason={setBlockReason}
            overrideStartTime={overrideStartTime}
            setOverrideStartTime={setOverrideStartTime}
            overrideEndTime={overrideEndTime}
            setOverrideEndTime={setOverrideEndTime}
            savingAction={savingAction}
            deletingId={deletingId}
            onSaveFullDay={handleSaveFullDay}
            onSavePartial={handleSavePartial}
            onSaveOverride={handleSaveOverride}
            onDeleteBlock={handleDeleteBlock}
            navigate={navigate}
        />
    );

    if (isDesktop) {
        return (
            <div style={{ padding: '40px', fontFamily: F, background: T.base }}>
                <div style={{ maxWidth: 1040, margin: '0 auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
                        <div>
                            <Lbl className="block mb-1.5">{MONTH_NAMES[displayMonth]} {displayYear}</Lbl>
                            <h1 style={{ fontFamily: F, fontSize: 36, fontWeight: 600, color: T.ink, margin: 0, letterSpacing: '-0.03em' }}>Calendar</h1>
                        </div>
                        <button
                            onClick={() => navigate('/provider/availability')}
                            style={{ padding: '10px 16px', borderRadius: 12, border: `1px solid ${T.line}`, background: 'transparent', fontFamily: F, fontSize: 13, fontWeight: 600, color: T.muted, cursor: 'pointer' }}
                        >
                            Hours
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: 32, alignItems: 'start' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                                <button onClick={handlePrevMonth} style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid ${T.line}`, background: T.avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                    <CalendarBlank size={18} color={T.ink} weight="light" style={{ transform: 'rotate(180deg)' }} />
                                </button>
                                <span style={{ fontFamily: F, fontSize: 18, fontWeight: 600, color: T.ink }}>{MONTH_NAMES[displayMonth]} {displayYear}</span>
                                <button onClick={handleNextMonth} style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid ${T.line}`, background: T.avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                    <CalendarBlank size={18} color={T.ink} weight="light" />
                                </button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 8 }}>
                                {DAY_LABELS.map((d) => (
                                    <div key={d} style={{ textAlign: 'center', fontFamily: F, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: T.muted, padding: '6px 0' }}>{d}</div>
                                ))}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px 0' }}>
                                {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
                                {Array.from({ length: daysInMonth }).map((_, i) => renderCalendarButton(i + 1))}
                            </div>

                            <div style={{ display: 'flex', gap: 16, marginTop: 18, paddingTop: 18, borderTop: `1px solid ${T.line}` }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.accent }} />
                                    <span style={{ fontFamily: F, fontSize: 11, color: T.muted }}>Booked</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.faded }} />
                                    <span style={{ fontFamily: F, fontSize: 11, color: T.muted }}>Blocked</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div style={{ width: 10, height: 10, borderRadius: '50%', border: `1.5px solid ${T.accent}` }} />
                                    <span style={{ fontFamily: F, fontSize: 11, color: T.muted }}>Adjusted availability</span>
                                </div>
                            </div>
                        </div>

                        <div>{dayPanel}</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-base">
            <Header
                onMenu={onMenu}
                showAvatar
                initials={initials}
                notifCount={unreadCount}
                onNotif={() => navigate('/provider/notifications')}
            />

            <div className="px-5 pb-4 flex items-end justify-between">
                <div>
                    <Lbl className="block mb-1.5">{loading ? '…' : `${MONTH_NAMES[displayMonth]} ${displayYear}`}</Lbl>
                    <h1 className="text-[32px] font-semibold text-ink tracking-[-0.03em] leading-tight m-0">
                        Calendar
                    </h1>
                </div>
                <button
                    onClick={() => navigate('/provider/availability')}
                    className="px-3.5 py-2.5 rounded-[12px] text-[12px] font-semibold focus:outline-none active:opacity-70"
                    style={{ border: `1px solid ${T.line}`, background: 'transparent', color: T.muted }}
                >
                    Hours
                </button>
            </div>

            <div className="px-5 flex-1 flex flex-col">
                <div className="mb-2">
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={handlePrevMonth}
                            className="flex items-center justify-center focus:outline-none active:opacity-60"
                            style={{ width: 32, height: 32, borderRadius: '50%', border: `1px solid ${T.line}`, background: T.avatarBg }}
                        >
                            <CalendarBlank size={16} color={T.ink} weight="light" style={{ transform: 'rotate(180deg)' }} />
                        </button>
                        <span className="text-[16px] font-semibold text-ink">{MONTH_NAMES[displayMonth]} {displayYear}</span>
                        <button
                            onClick={handleNextMonth}
                            className="flex items-center justify-center focus:outline-none active:opacity-60"
                            style={{ width: 32, height: 32, borderRadius: '50%', border: `1px solid ${T.line}`, background: T.avatarBg }}
                        >
                            <CalendarBlank size={16} color={T.ink} weight="light" />
                        </button>
                    </div>

                    <div className="grid grid-cols-7 mb-1">
                        {DAY_LABELS.map((d) => (
                            <div key={d} className="text-center text-[11px] font-semibold uppercase tracking-[0.04em] text-muted py-1">
                                {d}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-y-0.5">
                        {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
                        {Array.from({ length: daysInMonth }).map((_, i) => renderCalendarButton(i + 1))}
                    </div>

                    <div className="flex gap-4 mt-3 pt-3 flex-wrap" style={{ borderTop: `1px solid ${T.line}` }}>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ background: T.accent }} />
                            <span className="text-[11px] text-muted">Booked</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ background: T.faded }} />
                            <span className="text-[11px] text-muted">Blocked</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-[10px] h-[10px] rounded-full" style={{ border: `1.5px solid ${T.accent}` }} />
                            <span className="text-[11px] text-muted">Adjusted</span>
                        </div>
                    </div>
                </div>

                {dayPanel}

                <Footer />
            </div>
        </div>
    );
};

export default ProviderSchedule;
