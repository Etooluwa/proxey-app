import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchProviderProfile } from '../../data/provider';
import { request } from '../../data/apiClient';

const T = {
  ink: '#3D231E',
  muted: '#8C6A64',
  faded: '#B0948F',
  accent: '#C25E4A',
  line: 'rgba(140,106,100,0.18)',
  card: '#FFFFFF',
  avatarBg: '#F2EBE5',
  base: '#FBF7F2',
  hero: '#FDDCC6',
  success: '#5A8A5E',
  successBg: '#EBF2EC',
};
const F = "'Sora',system-ui,sans-serif";

const Lbl = ({ children }) => (
  <span style={{
    display: 'block',
    fontSize: 11,
    fontWeight: 500,
    color: T.muted,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: 8,
  }}>
    {children}
  </span>
);

const inputStyle = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: 12,
  border: `1px solid ${T.line}`,
  fontFamily: F,
  fontSize: 14,
  color: T.ink,
  outline: 'none',
  background: T.avatarBg,
  boxSizing: 'border-box',
  marginBottom: 20,
};

export default function ProviderPersonalDetails() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProviderProfile()
      .then((profile) => {
        if (profile) {
          setName(
            profile.name ||
              [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
              ''
          );
          setEmail(profile.email || '');
          setPhone(profile.phone || '');
        }
      })
      .catch((err) => setError(err.message || 'Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await request('/provider/me', {
        method: 'PATCH',
        body: JSON.stringify({ name, email, phone }),
      });
      navigate(-1);
    } catch (err) {
      setError(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: T.base, display: 'flex', flexDirection: 'column', fontFamily: F }}>
      {/* Nav bar */}
      <div style={{ padding: '20px 24px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          aria-label="Go back"
        >
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={T.ink} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span style={{ fontSize: 13, fontWeight: 500, color: T.muted }}>Personal Details</span>
        <div style={{ width: 28 }} />
      </div>

      {/* Content */}
      <div style={{ padding: '12px 24px 0', flex: 1, display: 'flex', flexDirection: 'column', maxWidth: 600, width: '100%', margin: '0 auto' }}>
        {loading ? (
          <>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  height: 48,
                  borderRadius: 12,
                  background: 'rgba(140,106,100,0.08)',
                  marginBottom: 20,
                  animation: 'pulse 1.5s infinite',
                }}
              />
            ))}
          </>
        ) : (
          <>
            <div>
              <Lbl>Full Name</Lbl>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                style={inputStyle}
              />
            </div>

            <div>
              <Lbl>Email</Lbl>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                style={inputStyle}
              />
            </div>

            <div>
              <Lbl>Phone</Lbl>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                style={inputStyle}
              />
            </div>

            {error && (
              <p style={{ color: '#B04040', fontSize: 13, margin: '8px 0' }}>{error}</p>
            )}

            <div style={{ marginTop: 'auto', paddingBottom: 40 }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  width: '100%',
                  padding: 16,
                  borderRadius: 12,
                  border: 'none',
                  background: saving ? T.faded : T.ink,
                  color: '#fff',
                  fontFamily: F,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: saving ? 'default' : 'pointer',
                }}
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
