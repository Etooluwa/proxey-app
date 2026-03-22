import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchProviderProfile } from '../../data/provider';
import { request } from '../../data/apiClient';

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
  const navigate = useNavigate();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

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
    <div style={{ minHeight: '100vh', background: T.base, display: 'flex', flexDirection: 'column', fontFamily: F }}>
      {/* Nav */}
      <div style={{ padding: '20px 24px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={T.ink} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span style={{ fontSize: 13, fontWeight: 500, color: T.muted }}>Booking Settings</span>
        <div style={{ width: 28 }} />
      </div>

      {/* Content */}
      <div style={{ padding: '12px 24px 0', flex: 1, display: 'flex', flexDirection: 'column', maxWidth: 600, width: '100%', margin: '0 auto' }}>
        {loading ? (
          <p style={{ color: T.muted, fontSize: 14, marginTop: 24 }}>Loading…</p>
        ) : (
          <>
            {ROWS.map((row, i) => (
              <div key={row.key}>
                <div
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '18px 0', cursor: 'pointer',
                  }}
                >
                  <div>
                    <p style={{ fontSize: 15, color: T.ink, margin: 0 }}>{row.label}</p>
                  </div>
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
      </div>
    </div>
  );
}
