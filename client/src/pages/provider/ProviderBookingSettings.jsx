import { useEffect, useState } from 'react';
import { fetchProviderProfile } from '../../data/provider';
import { request } from '../../data/apiClient';
import { useIsDesktop } from '../../hooks/useIsDesktop';
import SettingsPageLayout from '../../components/ui/SettingsPageLayout';

const T = {
  ink: '#3D231E', muted: '#8C6A64', faded: '#B0948F', accent: '#C25E4A',
  line: 'rgba(140,106,100,0.18)', card: '#FFFFFF', avatarBg: '#F2EBE5',
  base: '#FBF7F2', hero: '#FDDCC6', success: '#5A8A5E', successBg: '#EBF2EC',
};
const F = "'Sora',system-ui,sans-serif";

const Divider = () => <div style={{ height: 1, background: T.line }} />;

const DEFAULT_SETTINGS = {
  cancellation_policy: 'Free up to 24 hrs',
  minimum_notice: '2 hours',
  auto_accept: false,
  require_deposit: '30% default',
  booking_confirmation: 'Manual review',
};

const ROWS = [
  { key: 'cancellation_policy', label: 'Cancellation policy' },
  { key: 'minimum_notice', label: 'Minimum notice' },
  { key: 'auto_accept', label: 'Auto-accept bookings' },
  { key: 'require_deposit', label: 'Require deposit' },
  { key: 'booking_confirmation', label: 'Booking confirmation' },
];

export default function ProviderBookingSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const isDesktop = useIsDesktop();

  useEffect(() => {
    fetchProviderProfile()
      .then(profile => {
        setSettings({ ...DEFAULT_SETTINGS, ...(profile.booking_settings || {}) });
      })
      .catch(err => console.error('[ProviderBookingSettings] load error', err))
      .finally(() => setLoading(false));
  }, []);

  const displayValue = (val) => {
    if (val === true) return 'On';
    if (val === false) return 'Off';
    return val;
  };

  return (
    <SettingsPageLayout title="Booking Settings">
      {loading ? (
        <p style={{ color: T.muted, fontSize: 14, marginTop: 24 }}>Loading…</p>
      ) : isDesktop ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: F }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', fontSize: 11, fontWeight: 500, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 0 12px', borderBottom: `1px solid ${T.line}` }}>Setting</th>
              <th style={{ textAlign: 'right', fontSize: 11, fontWeight: 500, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 0 12px', borderBottom: `1px solid ${T.line}` }}>Value</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.key} style={{ cursor: 'pointer' }}>
                <td style={{ fontSize: 15, color: T.ink, padding: '18px 0', borderBottom: `1px solid ${T.line}` }}>{row.label}</td>
                <td style={{ textAlign: 'right', padding: '18px 0', borderBottom: `1px solid ${T.line}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                    <span style={{ fontSize: 14, color: T.muted }}>{displayValue(settings[row.key])}</span>
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={T.faded} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7 17L17 7M17 7H7M17 7v10" />
                    </svg>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <>
          {ROWS.map((row, i) => (
            <div key={row.key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0', cursor: 'pointer' }}>
                <p style={{ fontSize: 15, color: T.ink, margin: 0 }}>{row.label}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, color: T.muted }}>{displayValue(settings[row.key])}</span>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={T.faded} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 17L17 7M17 7H7M17 7v10" />
                  </svg>
                </div>
              </div>
              {i < ROWS.length - 1 && <Divider />}
            </div>
          ))}
        </>
      )}
    </SettingsPageLayout>
  );
}
