import { useEffect, useState } from 'react';
import { fetchProviderProfile, updateProviderProfile } from '../../data/provider';
import { useIsDesktop } from '../../hooks/useIsDesktop';
import SettingsPageLayout from '../../components/ui/SettingsPageLayout';
import Toggle from '../../components/ui/Toggle';

const T = {
  ink: '#3D231E', muted: '#8C6A64', faded: '#B0948F', accent: '#C25E4A',
  line: 'rgba(140,106,100,0.18)', card: '#FFFFFF', avatarBg: '#F2EBE5',
  base: '#FBF7F2', hero: '#FDDCC6', success: '#5A8A5E', successBg: '#EBF2EC',
};
const F = "'Sora',system-ui,sans-serif";

const Divider = () => <div style={{ height: 1, background: T.line }} />;

const DEFAULT_SETTINGS = {
  cancellation_policy: 'Clients can cancel up to 24 hours before',
  minimum_notice: 'Clients must book at least 2 hours ahead',
  auto_accept: false,
};
const CANCELLATION_OPTIONS = [
  'Clients can cancel up to 1 hour before',
  'Clients can cancel up to 2 hours before',
  'Clients can cancel up to 6 hours before',
  'Clients can cancel up to 12 hours before',
  'Clients can cancel up to 24 hours before',
  'Clients can cancel up to 48 hours before',
];
const NOTICE_OPTIONS = [
  'Clients must book at least 1 hour ahead',
  'Clients must book at least 2 hours ahead',
  'Clients must book at least 4 hours ahead',
  'Clients must book at least 12 hours ahead',
  'Clients must book at least 24 hours ahead',
  'Clients must book at least 48 hours ahead',
];

export default function ProviderBookingSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const isDesktop = useIsDesktop();

  useEffect(() => {
    fetchProviderProfile()
      .then(profile => {
        setSettings({ ...DEFAULT_SETTINGS, ...(profile.booking_settings || {}) });
      })
      .catch(err => console.error('[ProviderBookingSettings] load error', err))
      .finally(() => setLoading(false));
  }, []);

  const saveSettings = async (nextSettings) => {
    setSettings(nextSettings);
    setSaving(true);
    try {
      await updateProviderProfile({ booking_settings: nextSettings });
    } catch (err) {
      console.error('[ProviderBookingSettings] save error', err);
    } finally {
      setSaving(false);
    }
  };

  const SelectRow = ({ label, value, options, onChange }) => (
    <div style={{ padding: '18px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
        <p style={{ fontSize: 15, color: T.ink, margin: 0 }}>{label}</p>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            minWidth: 260,
            padding: '10px 14px',
            borderRadius: 12,
            border: `1px solid ${T.line}`,
            background: T.avatarBg,
            color: T.ink,
            fontFamily: F,
            fontSize: 14,
            outline: 'none',
          }}
        >
          {options.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>
    </div>
  );

  const ToggleRow = ({ label, value, onChange, helper }) => (
    <div style={{ padding: '18px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: 15, color: T.ink, margin: 0 }}>{label}</p>
          {helper && <p style={{ fontSize: 12, color: T.muted, margin: '6px 0 0' }}>{helper}</p>}
        </div>
        <Toggle on={Boolean(value)} onChange={(next) => onChange(next)} />
      </div>
    </div>
  );

  const content = (
    <>
      <SelectRow
        label="Cancellation window"
        value={settings.cancellation_policy}
        options={CANCELLATION_OPTIONS}
        onChange={(next) => saveSettings({ ...settings, cancellation_policy: next })}
      />
      <Divider />
      <SelectRow
        label="Booking lead time"
        value={settings.minimum_notice}
        options={NOTICE_OPTIONS}
        onChange={(next) => saveSettings({ ...settings, minimum_notice: next })}
      />
      <Divider />
      <ToggleRow
        label="Auto-accept bookings"
        value={settings.auto_accept}
        helper="When this is on, new bookings that meet your rules are confirmed automatically."
        onChange={(next) => saveSettings({ ...settings, auto_accept: next })}
      />
      {saving && (
        <p style={{ color: T.muted, fontSize: 12, margin: '12px 0 0' }}>Saving…</p>
      )}
    </>
  );

  return (
    <SettingsPageLayout title="Booking Settings">
      {loading ? (
        <p style={{ color: T.muted, fontSize: 14, marginTop: 24 }}>Loading…</p>
      ) : isDesktop ? content : content}
    </SettingsPageLayout>
  );
}
