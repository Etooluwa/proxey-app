import { useEffect, useRef, useState } from 'react';
import { fetchProviderProfile, updateProviderProfile } from '../../data/provider';
import SettingsPageLayout from '../../components/ui/SettingsPageLayout';
import Toggle from '../../components/ui/Toggle';

const T = {
  ink: '#3D231E', muted: '#8C6A64', faded: '#B0948F', accent: '#C25E4A',
  line: 'rgba(140,106,100,0.18)', card: '#FFFFFF', avatarBg: '#F2EBE5',
  base: '#FBF7F2',
};
const F = "'Sora',system-ui,sans-serif";

const Divider = () => <div style={{ height: 1, background: T.line }} />;

// ── Preset hours for each field ─────────────────────────────────────────────
const CANCEL_PRESETS = [0, 1, 2, 6, 12, 24, 48];
const NOTICE_PRESETS = [0, 1, 2, 4, 12, 24, 48];

function labelCancel(h) {
  if (h === 0) return 'No cancellation window';
  return `Up to ${h} hour${h === 1 ? '' : 's'} before`;
}
function labelNotice(h) {
  if (h === 0) return 'No lead time required';
  return `At least ${h} hour${h === 1 ? '' : 's'} ahead`;
}

// Extract numeric hours from either a number or a legacy string value
function parseHours(value, fallback) {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const match = String(value).match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : fallback;
}

// ── Reusable time-picker row ─────────────────────────────────────────────────
function TimePickerRow({ label, hours, onChange, presets, labelFn }) {
  const isCustom = !presets.includes(hours);
  const [customInput, setCustomInput] = useState(isCustom ? String(hours) : '');
  const [showCustom, setShowCustom] = useState(isCustom);
  const inputRef = useRef(null);

  const handleSelect = (e) => {
    const val = e.target.value;
    if (val === '__custom__') {
      setShowCustom(true);
      setCustomInput('');
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setShowCustom(false);
      setCustomInput('');
      onChange(Number(val));
    }
  };

  const handleCustomBlur = () => {
    const parsed = parseFloat(customInput);
    if (!isNaN(parsed) && parsed >= 0) {
      onChange(parsed);
    } else {
      // Reset to nearest preset if input is invalid
      setShowCustom(false);
      setCustomInput('');
    }
  };

  const selectValue = showCustom ? '__custom__' : String(hours);

  return (
    <div style={{ padding: '18px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <p style={{ fontFamily: F, fontSize: 15, color: T.ink, margin: 0 }}>{label}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {showCustom && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                ref={inputRef}
                type="number"
                min="0"
                step="0.5"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onBlur={handleCustomBlur}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.target.blur(); } }}
                placeholder="hrs"
                style={{
                  width: 72,
                  padding: '10px 10px',
                  borderRadius: 10,
                  border: `1px solid ${T.accent}`,
                  background: T.avatarBg,
                  color: T.ink,
                  fontFamily: F,
                  fontSize: 14,
                  outline: 'none',
                  textAlign: 'center',
                }}
              />
              <span style={{ fontFamily: F, fontSize: 13, color: T.muted }}>hours</span>
            </div>
          )}
          <select
            value={selectValue}
            onChange={handleSelect}
            style={{
              padding: '10px 14px',
              borderRadius: 12,
              border: `1px solid ${T.line}`,
              background: T.avatarBg,
              color: T.ink,
              fontFamily: F,
              fontSize: 14,
              outline: 'none',
              minWidth: showCustom ? 120 : 220,
            }}
          >
            {presets.map((h) => (
              <option key={h} value={String(h)}>{labelFn(h)}</option>
            ))}
            <option value="__custom__">Custom…</option>
          </select>
        </div>
      </div>
      {showCustom && (
        <p style={{ fontFamily: F, fontSize: 12, color: T.faded, margin: '8px 0 0', textAlign: 'right' }}>
          Press Enter or click away to save
        </p>
      )}
    </div>
  );
}

export default function ProviderBookingSettings() {
  const [cancellationHours, setCancellationHours] = useState(24);
  const [noticeHours, setNoticeHours] = useState(2);
  const [autoAccept, setAutoAccept] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef(null);

  useEffect(() => {
    fetchProviderProfile()
      .then(profile => {
        const s = profile.booking_settings || {};
        setCancellationHours(parseHours(s.cancellation_policy ?? s.cancellation_hours, 24));
        setNoticeHours(parseHours(s.minimum_notice ?? s.notice_hours, 2));
        setAutoAccept(Boolean(s.auto_accept));
      })
      .catch(err => console.error('[ProviderBookingSettings] load error', err))
      .finally(() => setLoading(false));
  }, []);

  const persist = (patch) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      try {
        await updateProviderProfile({ booking_settings: patch });
      } catch (err) {
        console.error('[ProviderBookingSettings] save error', err);
      } finally {
        setSaving(false);
      }
    }, 400);
  };

  const handleCancellationChange = (h) => {
    setCancellationHours(h);
    persist({ cancellation_hours: h, cancellation_policy: h, minimum_notice: noticeHours, notice_hours: noticeHours, auto_accept: autoAccept });
  };

  const handleNoticeChange = (h) => {
    setNoticeHours(h);
    persist({ cancellation_hours: cancellationHours, cancellation_policy: cancellationHours, minimum_notice: h, notice_hours: h, auto_accept: autoAccept });
  };

  const handleAutoAcceptChange = (next) => {
    setAutoAccept(next);
    persist({ cancellation_hours: cancellationHours, cancellation_policy: cancellationHours, minimum_notice: noticeHours, notice_hours: noticeHours, auto_accept: next });
  };

  const content = (
    <>
      <TimePickerRow
        label="Cancellation window"
        hours={cancellationHours}
        onChange={handleCancellationChange}
        presets={CANCEL_PRESETS}
        labelFn={labelCancel}
      />
      <Divider />
      <TimePickerRow
        label="Booking lead time"
        hours={noticeHours}
        onChange={handleNoticeChange}
        presets={NOTICE_PRESETS}
        labelFn={labelNotice}
      />
      <Divider />
      <div style={{ padding: '18px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
          <div>
            <p style={{ fontFamily: F, fontSize: 15, color: T.ink, margin: 0 }}>Auto-accept bookings</p>
            <p style={{ fontFamily: F, fontSize: 12, color: T.muted, margin: '6px 0 0', lineHeight: 1.5 }}>
              When on, new bookings are confirmed automatically without your review.
            </p>
          </div>
          <Toggle on={autoAccept} onChange={handleAutoAcceptChange} />
        </div>
      </div>
      {saving && (
        <p style={{ fontFamily: F, color: T.muted, fontSize: 12, margin: '8px 0 0' }}>Saving…</p>
      )}
    </>
  );

  return (
    <SettingsPageLayout title="Booking Settings">
      {loading ? (
        <p style={{ fontFamily: F, color: T.muted, fontSize: 14, marginTop: 24 }}>Loading…</p>
      ) : content}
    </SettingsPageLayout>
  );
}
