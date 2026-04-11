import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchProviderProfile } from '../../data/provider';
import { request } from '../../data/apiClient';
import { useSession } from '../../auth/authContext';
import SettingsPageLayout from '../../components/ui/SettingsPageLayout';

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
  const { session } = useSession();
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
            profile.business_name ||
            [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
            ''
          );
          // Fall back to auth session email if profile email is blank
          setEmail(profile.email || session?.user?.email || '');
          setPhone(profile.phone || '');
        }
      })
      .catch((err) => setError(err.message || 'Failed to load profile'))
      .finally(() => setLoading(false));
  }, [session?.user?.email]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await request('/provider/me', {
        method: 'PATCH',
        body: JSON.stringify({ name, business_name: name, email, phone }),
      });
      navigate(-1);
    } catch (err) {
      setError(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsPageLayout title="Account Details">
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
          <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
        </>
      ) : (
        <>
          <div>
            <Lbl>Business Name</Lbl>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your business name"
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

          <div style={{ marginTop: 24 }}>
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
    </SettingsPageLayout>
  );
}
