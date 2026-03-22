import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { request } from '../data/apiClient';

const T = {
  ink: '#3D231E', muted: '#8C6A64', faded: '#B0948F', accent: '#C25E4A',
  line: 'rgba(140,106,100,0.18)', avatarBg: '#F2EBE5', base: '#FBF7F2',
};
const F = "'Sora',system-ui,sans-serif";

const Toggle = ({ on, onChange }) => (
  <button
    onClick={() => onChange(!on)}
    style={{
      width: 44, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
      background: on ? T.accent : 'rgba(140,106,100,0.2)',
      position: 'relative', transition: 'background 0.2s', flexShrink: 0,
    }}
    aria-checked={on} role="switch"
  >
    <div style={{
      position: 'absolute', top: 3, left: on ? 21 : 3,
      width: 20, height: 20, borderRadius: '50%', background: '#fff',
      transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    }} />
  </button>
);

const Lbl = ({ children, style = {} }) => (
  <span style={{ display: 'block', fontSize: 11, fontWeight: 500, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, ...style }}>
    {children}
  </span>
);

const Divider = () => <div style={{ height: 1, background: T.line }} />;

const DEFAULT_PREFS = {
  push_booking_confirmations: true,
  push_messages: true,
  push_reminders: true,
  push_review_requests: true,
  email_receipts: true,
  email_monthly_summary: false,
};

const PUSH_ITEMS = [
  { key: 'push_booking_confirmations', label: 'Booking confirmations' },
  { key: 'push_messages',              label: 'Provider messages' },
  { key: 'push_reminders',             label: 'Session reminders' },
  { key: 'push_review_requests',       label: 'Review requests' },
];

const EMAIL_ITEMS = [
  { key: 'email_receipts',        label: 'Booking receipts' },
  { key: 'email_monthly_summary', label: 'Monthly summary' },
];

export default function ClientNotifSettings() {
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    request('/client/me')
      .then((data) => {
        const p = data?.profile || data || {};
        setPrefs({ ...DEFAULT_PREFS, ...(p.notification_preferences || {}) });
      })
      .catch((err) => console.error('[ClientNotifSettings] load error:', err))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (key) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await request('/client/me', {
        method: 'PATCH',
        body: JSON.stringify({ notification_preferences: prefs }),
      });
    } catch (err) {
      console.error('[ClientNotifSettings] save error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: T.base, display: 'flex', flexDirection: 'column', fontFamily: F }}>
      {/* Nav */}
      <div style={{ padding: '20px 24px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }} aria-label="Go back">
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={T.ink} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span style={{ fontSize: 13, fontWeight: 500, color: T.muted }}>Notifications</span>
        <div style={{ width: 28 }} />
      </div>

      {/* Content */}
      <div style={{ padding: '12px 24px 0', flex: 1, display: 'flex', flexDirection: 'column', maxWidth: 600, width: '100%', margin: '0 auto' }}>
        {loading ? (
          <p style={{ color: T.muted, fontSize: 14, marginTop: 24 }}>Loading…</p>
        ) : (
          <>
            <Lbl>Push Notifications</Lbl>
            {PUSH_ITEMS.map((item, i) => (
              <div key={item.key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0' }}>
                  <span style={{ fontSize: 15, color: T.ink }}>{item.label}</span>
                  <Toggle on={prefs[item.key]} onChange={() => toggle(item.key)} />
                </div>
                {i < PUSH_ITEMS.length - 1 && <Divider />}
              </div>
            ))}

            <Lbl style={{ marginTop: 24, marginBottom: 12 }}>Email Notifications</Lbl>
            {EMAIL_ITEMS.map((item, i) => (
              <div key={item.key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0' }}>
                  <span style={{ fontSize: 15, color: T.ink }}>{item.label}</span>
                  <Toggle on={prefs[item.key]} onChange={() => toggle(item.key)} />
                </div>
                {i < EMAIL_ITEMS.length - 1 && <Divider />}
              </div>
            ))}

            <div style={{ marginTop: 'auto', paddingBottom: 40, paddingTop: 32 }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
                  background: T.ink, color: '#fff', fontSize: 15, fontWeight: 600,
                  fontFamily: F, cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1, transition: 'opacity 0.2s',
                }}
              >
                {saving ? 'Saving…' : 'Save Preferences'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
