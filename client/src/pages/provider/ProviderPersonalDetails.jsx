import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchProviderProfile, updateProviderProfile, fetchCurrencyLock } from '../../data/provider';
import { useSession } from '../../auth/authContext';
import supabase from '../../utils/supabase';
import SettingsPageLayout from '../../components/ui/SettingsPageLayout';
import PhoneInput from '../../components/ui/PhoneInput';
import CurrencySelect from '../../components/ui/CurrencySelect';

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
  const { session, updateProfile } = useSession();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [currency, setCurrency] = useState('cad');
  const [currencyLocked, setCurrencyLocked] = useState(false); // Default unlocked; lock only after confirmed paid bookings
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [emailConfirmSent, setEmailConfirmSent] = useState(false);
  const currentEmail = session?.user?.email || '';

  // Detect if signed in via Google OAuth — email cannot be changed for OAuth accounts
  const isGoogleUser = Boolean(
    session?.user?.metadata?.iss?.includes('google') ||
    session?.user?.metadata?.provider_id ||
    session?.user?.metadata?.sub
  );
  // More reliable: check Supabase raw identities via the supabase client
  const [authProvider, setAuthProvider] = useState('email');
  useEffect(() => {
    supabase?.auth.getUser().then(({ data }) => {
      const identities = data?.user?.identities || [];
      const hasGoogle = identities.some((id) => id.provider === 'google');
      if (hasGoogle) setAuthProvider('google');
    }).catch(() => {});
  }, []);

  useEffect(() => {
    Promise.all([fetchProviderProfile(), fetchCurrencyLock()])
      .then(([profile, locked]) => {
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
          setCurrency(profile.currency || 'cad');
        }
        setCurrencyLocked(locked);
      })
      .catch((err) => setError(err.message || 'Failed to load profile'))
      .finally(() => setLoading(false));
  }, [session?.user?.email]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setEmailConfirmSent(false);
    try {
      const emailChanged = email.trim().toLowerCase() !== currentEmail.trim().toLowerCase();

      if (emailChanged) {
        // Trigger Supabase's email-change confirmation flow — user gets a
        // verification link at the new address before anything updates.
        const { error: emailErr } = await supabase.auth.updateUser({ email: email.trim() });
        if (emailErr) throw new Error(emailErr.message);
        // Save name + phone but NOT the new email yet (it isn't confirmed).
        await updateProviderProfile({ name, business_name: name, phone, currency });
        await updateProfile({ name, business_name: name, businessName: name });
        setEmailConfirmSent(true);
        return; // Stay on page to show the confirmation message
      }

      await updateProviderProfile({ name, business_name: name, email, phone, currency });
      await updateProfile({ name, business_name: name, businessName: name });
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
            {authProvider === 'google' ? (
              <>
                <input
                  type="email"
                  value={email}
                  readOnly
                  style={{ ...inputStyle, color: T.faded, cursor: 'not-allowed' }}
                />
                <p style={{ fontFamily: F, fontSize: 12, color: T.faded, margin: '-14px 0 20px', lineHeight: 1.5 }}>
                  You signed in with Google. Email cannot be changed here.
                </p>
              </>
            ) : (
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                style={inputStyle}
              />
            )}
          </div>

          <div>
            <Lbl>Phone</Lbl>
            <PhoneInput
              value={phone}
              onChange={(v) => setPhone(v)}
            />
          </div>

          <div style={{ marginTop: 20 }}>
            <Lbl>Currency</Lbl>
            {currencyLocked ? (
              <>
                <div style={{
                  ...inputStyle,
                  color: T.faded,
                  cursor: 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 0,
                }}>
                  <span>{currency.toUpperCase()}</span>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke={T.faded} strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" />
                  </svg>
                </div>
                <p style={{ fontFamily: F, fontSize: 12, color: T.faded, margin: '6px 0 0', lineHeight: 1.5 }}>
                  Currency is locked once you have completed paid bookings.
                </p>
              </>
            ) : (
              <>
                <CurrencySelect
                  value={currency}
                  onChange={(v) => setCurrency(v)}
                />
                <p style={{ fontFamily: F, fontSize: 12, color: '#A07030', margin: '6px 0 0', lineHeight: 1.5 }}>
                  Changing currency will update all your services. Cannot be changed after you have completed paid bookings.
                </p>
              </>
            )}
          </div>

          {error && (
            <p style={{ color: '#B04040', fontSize: 13, margin: '8px 0' }}>{error}</p>
          )}

          {emailConfirmSent && (
            <div style={{ background: '#EBF2EC', border: '1px solid #5A8A5E', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
              <p style={{ fontFamily: F, fontSize: 14, color: '#3A5E3D', fontWeight: 500, margin: '0 0 4px' }}>Confirmation email sent</p>
              <p style={{ fontFamily: F, fontSize: 13, color: '#5A8A5E', margin: 0 }}>
                Check <strong>{email}</strong> and click the link to confirm your new email address.
              </p>
            </div>
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
