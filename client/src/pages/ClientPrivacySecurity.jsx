import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { request } from '../data/apiClient';
import { useSession } from '../auth/authContext';

const T = {
  ink: '#3D231E', muted: '#8C6A64', faded: '#B0948F', accent: '#C25E4A',
  line: 'rgba(140,106,100,0.18)', card: '#FFFFFF', avatarBg: '#F2EBE5',
  base: '#FBF7F2', danger: '#B04040', dangerBg: '#FDEDEA',
};
const F = "'Sora',system-ui,sans-serif";

const Divider = () => <div style={{ height: 1, background: T.line }} />;

const Lbl = ({ children, style = {} }) => (
  <span style={{ display: 'block', fontSize: 11, fontWeight: 500, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em', ...style }}>
    {children}
  </span>
);

// Arrow icon (↗)
const ArrowIcon = () => (
  <svg width="16" height="16" fill="none" stroke={T.faded} strokeWidth="1.5" viewBox="0 0 24 24">
    <path d="M7 17L17 7M17 7H7M17 7v10" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function maskEmail(email) {
  if (!email) return '';
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  return local.slice(0, 2) + '***@' + domain;
}

function maskPhone(phone) {
  if (!phone) return '';
  return phone.slice(0, -4).replace(/\d/g, '*') + phone.slice(-4);
}

// ─── Delete Account confirmation screen ───────────────────────────────────────
function DeleteAccountScreen({ onBack }) {
  const navigate = useNavigate();
  const { logout } = useSession();
  const [confirmed, setConfirmed] = useState(false);
  const [typed, setTyped] = useState('');
  const [deleting, setDeleting] = useState(false);

  const canDelete = confirmed && typed === 'DELETE';

  const handleDelete = async () => {
    if (!canDelete) return;
    setDeleting(true);
    try {
      await request('/client/account', { method: 'DELETE' });
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('[ClientPrivacySecurity] delete error:', err);
      setDeleting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: T.base, display: 'flex', flexDirection: 'column', fontFamily: F }}>
      <div style={{ padding: '32px 24px 16px' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={T.ink} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <div style={{ padding: '0 24px', flex: 1, display: 'flex', flexDirection: 'column', maxWidth: 600, width: '100%', margin: '0 auto' }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: T.dangerBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <svg width="24" height="24" fill="none" stroke={T.danger} strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h1 style={{ fontFamily: F, fontSize: 28, fontWeight: 400, letterSpacing: '-0.03em', color: T.danger, margin: '0 0 8px' }}>Delete your account</h1>
        <p style={{ fontFamily: F, fontSize: 15, color: T.muted, margin: '0 0 24px', lineHeight: 1.6 }}>
          This action is permanent and cannot be undone. All your data will be deleted, including:
        </p>

        {[
          'Your profile and personal information',
          'All booking history and session records',
          'Messages and conversations',
          'Invoices and payment records',
          'Provider connections and relationships',
        ].map((item) => (
          <div key={item} style={{ display: 'flex', gap: 10, padding: '8px 0', alignItems: 'flex-start' }}>
            <svg width="16" height="16" fill="none" stroke={T.danger} strokeWidth="1.5" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 2 }}>
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
            <span style={{ fontFamily: F, fontSize: 14, color: T.ink, lineHeight: 1.5 }}>{item}</span>
          </div>
        ))}

        <Divider style={{ margin: '24px 0' }} />

        <div
          style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, cursor: 'pointer' }}
          onClick={() => setConfirmed(!confirmed)}
        >
          <div style={{
            width: 22, height: 22, borderRadius: 6, flexShrink: 0,
            border: confirmed ? 'none' : `1.5px solid ${T.line}`,
            background: confirmed ? T.danger : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {confirmed && (
              <svg width="12" height="12" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <span style={{ fontFamily: F, fontSize: 14, color: T.ink }}>I understand this action is permanent</span>
        </div>

        {confirmed && (
          <>
            <Lbl style={{ marginBottom: 8 }}>Type "DELETE" to confirm</Lbl>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="DELETE"
              style={{
                width: '100%', padding: '14px 16px', borderRadius: 12,
                border: `1px solid ${typed === 'DELETE' ? T.danger : T.line}`,
                fontFamily: F, fontSize: 14, color: T.ink,
                outline: 'none', background: T.avatarBg,
                boxSizing: 'border-box', marginBottom: 20,
              }}
            />
          </>
        )}

        <div style={{ marginTop: 'auto', paddingBottom: 40, display: 'flex', gap: 10 }}>
          <button onClick={onBack} style={{ flex: 1, padding: 16, borderRadius: 12, border: `1px solid ${T.line}`, background: 'transparent', fontFamily: F, fontSize: 14, fontWeight: 500, color: T.ink, cursor: 'pointer' }}>
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={!canDelete || deleting}
            style={{
              flex: 1, padding: 16, borderRadius: 12, border: 'none',
              background: canDelete ? T.danger : T.faded,
              color: '#fff', fontFamily: F, fontSize: 14, fontWeight: 500,
              cursor: canDelete ? 'pointer' : 'default',
            }}
          >
            {deleting ? 'Deleting…' : 'Delete Account'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ClientPrivacySecurity() {
  const navigate = useNavigate();
  const { session } = useSession();
  const [profile, setProfile] = useState(null);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    request('/client/me')
      .then((data) => setProfile(data?.profile || data || {}))
      .catch(() => setProfile({}));
  }, []);

  if (showDelete) {
    return <DeleteAccountScreen onBack={() => setShowDelete(false)} />;
  }

  const maskedEmail = maskEmail(profile?.email || session?.user?.email || '');
  const maskedPhone = maskPhone(profile?.phone || '');

  const identityRows = [
    { label: 'Change email', value: maskedEmail },
    { label: 'Change phone', value: maskedPhone || 'Not set' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: T.base, display: 'flex', flexDirection: 'column', fontFamily: F }}>
      {/* Nav */}
      <div style={{ padding: '20px 24px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }} aria-label="Go back">
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={T.ink} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span style={{ fontSize: 13, fontWeight: 500, color: T.muted }}>Privacy & Security</span>
        <div style={{ width: 28 }} />
      </div>

      {/* Content */}
      <div style={{ padding: '12px 24px 0', flex: 1, maxWidth: 600, width: '100%', margin: '0 auto' }}>
        {/* Identity rows */}
        {identityRows.map((row) => (
          <div key={row.label}>
            <button
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: F }}
            >
              <span style={{ fontSize: 15, color: T.ink }}>{row.label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, color: T.muted }}>{row.value}</span>
                <ArrowIcon />
              </div>
            </button>
            <Divider />
          </div>
        ))}

        {/* Data & Privacy */}
        <Lbl style={{ margin: '24px 0 12px' }}>Data & Privacy</Lbl>

        {[
          { label: 'Download my data', sub: 'Get a copy of your account data', danger: false },
          { label: 'Delete account', sub: 'Permanently remove your account', danger: true },
        ].map((item) => (
          <div key={item.label}>
            <button
              onClick={item.danger ? () => setShowDelete(true) : undefined}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: F }}
            >
              <div>
                <p style={{ fontSize: 15, color: item.danger ? T.danger : T.ink, margin: '0 0 3px' }}>{item.label}</p>
                <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>{item.sub}</p>
              </div>
              <ArrowIcon />
            </button>
            <Divider />
          </div>
        ))}
      </div>
    </div>
  );
}
