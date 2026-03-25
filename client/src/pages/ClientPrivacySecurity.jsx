import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { request } from '../data/apiClient';
import { useSession } from '../auth/authContext';
import { useIsDesktop } from '../hooks/useIsDesktop';
import supabase from '../utils/supabase';
import SettingsPageLayout from '../components/ui/SettingsPageLayout';

const T = {
  ink: '#3D231E', muted: '#8C6A64', faded: '#B0948F', accent: '#C25E4A',
  line: 'rgba(140,106,100,0.18)', avatarBg: '#F2EBE5',
  base: '#FBF7F2', danger: '#B04040', dangerBg: '#FDEDEA',
  success: '#5A8A5E', successBg: '#EBF2EC',
};
const F = "'Sora',system-ui,sans-serif";

const Divider = () => <div style={{ height: 1, background: T.line }} />;

const Lbl = ({ children, style = {} }) => (
  <span style={{ display: 'block', fontSize: 11, fontWeight: 500, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em', ...style }}>
    {children}
  </span>
);

const ArrowIcon = () => (
  <svg width="16" height="16" fill="none" stroke={T.faded} strokeWidth="1.5" viewBox="0 0 24 24">
    <path d="M7 17L17 7M17 7H7M17 7v10" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const inputStyle = {
  width: '100%', padding: '13px 16px', borderRadius: 10,
  border: `1px solid ${T.line}`, fontFamily: F, fontSize: 14,
  color: T.ink, outline: 'none', background: T.avatarBg,
  boxSizing: 'border-box',
};

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

// ─── Change Password Panel ────────────────────────────────────────────────────

function ChangePasswordPanel({ onClose }) {
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const handleSave = async () => {
    setError(null);
    if (!newPass || newPass.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPass !== confirmPass) {
      setError('Passwords do not match.');
      return;
    }
    setSaving(true);
    try {
      const { error: authErr } = await supabase.auth.updateUser({ password: newPass });
      if (authErr) throw new Error(authErr.message);
      setDone(true);
    } catch (err) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <div style={{ padding: '16px 0 20px' }}>
        <div style={{ background: T.successBg, borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
          <p style={{ fontFamily: F, fontSize: 14, color: T.success, margin: '0 0 4px', fontWeight: 500 }}>Password updated.</p>
          <p style={{ fontFamily: F, fontSize: 13, color: T.muted, margin: 0, lineHeight: 1.5 }}>
            A confirmation email has been sent to your address. If you didn't make this change, secure your account immediately.
          </p>
        </div>
        <button onClick={onClose} style={{ fontFamily: F, fontSize: 13, color: T.muted, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          Close
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px 0 20px' }}>
      <div style={{ marginBottom: 14 }}>
        <Lbl style={{ marginBottom: 6 }}>New password</Lbl>
        <input
          type="password"
          value={newPass}
          onChange={(e) => setNewPass(e.target.value)}
          placeholder="At least 8 characters"
          style={inputStyle}
          autoComplete="new-password"
        />
      </div>
      <div style={{ marginBottom: 14 }}>
        <Lbl style={{ marginBottom: 6 }}>Confirm new password</Lbl>
        <input
          type="password"
          value={confirmPass}
          onChange={(e) => setConfirmPass(e.target.value)}
          placeholder="Repeat new password"
          style={inputStyle}
          autoComplete="new-password"
        />
      </div>

      {error && <p style={{ fontFamily: F, fontSize: 13, color: T.danger, margin: '0 0 12px' }}>{error}</p>}

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            flex: 1, padding: '12px 0', borderRadius: 10, border: 'none',
            background: saving ? T.faded : T.ink, color: '#fff',
            fontFamily: F, fontSize: 14, fontWeight: 500, cursor: saving ? 'default' : 'pointer',
          }}
        >
          {saving ? 'Saving…' : 'Update password'}
        </button>
        <button
          onClick={onClose}
          style={{
            padding: '12px 18px', borderRadius: 10, border: `1px solid ${T.line}`,
            background: 'transparent', fontFamily: F, fontSize: 14, color: T.muted, cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientPrivacySecurity() {
  const navigate = useNavigate();
  const { session } = useSession();
  const [profile, setProfile] = useState(null);
  const [showPasswordPanel, setShowPasswordPanel] = useState(false);
  const isDesktop = useIsDesktop();

  useEffect(() => {
    request('/client/profile')
      .then((data) => setProfile(data?.profile || data || {}))
      .catch(() => setProfile({}));
  }, []);

  const maskedEmail = maskEmail(profile?.email || session?.user?.email || '');
  const maskedPhone = maskPhone(profile?.phone || '');

  return (
    <SettingsPageLayout title="Privacy & Security">

      {/* ── Identity rows ── */}
      {[
        { label: 'Change email', value: maskedEmail, onClick: () => navigate('/app/profile/personal') },
        { label: 'Change phone', value: maskedPhone || 'Not set', onClick: () => navigate('/app/profile/personal') },
      ].map((row) => (
        <div key={row.label}>
          <button
            onClick={row.onClick}
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

      {/* ── Change password ── */}
      <div>
        <button
          onClick={() => setShowPasswordPanel((v) => !v)}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: F }}
        >
          <span style={{ fontSize: 15, color: T.ink }}>Change password</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, color: T.muted }}>••••••••</span>
            <svg width="16" height="16" fill="none" stroke={T.faded} strokeWidth="1.5" viewBox="0 0 24 24">
              <path d={showPasswordPanel ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </button>
        {showPasswordPanel && (
          <ChangePasswordPanel onClose={() => setShowPasswordPanel(false)} />
        )}
        <Divider />
      </div>

      {/* ── Data & Privacy ── */}
      <Lbl style={{ margin: '24px 0 12px' }}>Data & Privacy</Lbl>

      <div>
        <button
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: F }}
        >
          <div>
            <p style={{ fontSize: 15, color: T.ink, margin: '0 0 3px' }}>Download my data</p>
            <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>Get a copy of your account data</p>
          </div>
          <ArrowIcon />
        </button>
        <Divider />
      </div>

      {/* ── Delete account ── */}
      {isDesktop ? (
        <div style={{
          marginTop: 32, padding: '20px 24px', borderRadius: 16,
          border: '1.5px solid rgba(176,64,64,0.35)', background: T.dangerBg,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 500, color: T.danger, margin: '0 0 3px', fontFamily: F }}>Delete account</p>
            <p style={{ fontSize: 13, color: T.muted, margin: 0, fontFamily: F }}>Permanently remove your account and all data</p>
          </div>
          <button
            onClick={() => navigate('/app/profile/privacy/delete')}
            style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid rgba(176,64,64,0.4)', background: 'transparent', fontFamily: F, fontSize: 13, fontWeight: 500, color: T.danger, cursor: 'pointer', flexShrink: 0, marginLeft: 16 }}
          >
            Delete account
          </button>
        </div>
      ) : (
        <div>
          <button
            onClick={() => navigate('/app/profile/privacy/delete')}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: F }}
          >
            <div>
              <p style={{ fontSize: 15, color: T.danger, margin: '0 0 3px' }}>Delete account</p>
              <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>Permanently remove your account</p>
            </div>
            <ArrowIcon />
          </button>
          <Divider />
        </div>
      )}
    </SettingsPageLayout>
  );
}
