import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { request } from '../data/apiClient';
import { useSession } from '../auth/authContext';
import supabase from '../utils/supabase';
import { filterCities } from '../utils/categories';
import SettingsPageLayout from '../components/ui/SettingsPageLayout';

const T = {
  ink: '#3D231E', muted: '#8C6A64', faded: '#B0948F', accent: '#C25E4A',
  line: 'rgba(140,106,100,0.18)', card: '#FFFFFF', avatarBg: '#F2EBE5',
  base: '#FBF7F2', successBg: '#EBF2EC', success: '#5A8A5E',
};
const F = "'Sora',system-ui,sans-serif";

const Lbl = ({ children }) => (
  <span style={{ display: 'block', fontSize: 11, fontWeight: 500, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
    {children}
  </span>
);

const inputStyle = {
  width: '100%', padding: '14px 16px', borderRadius: 12,
  border: `1px solid ${T.line}`, fontFamily: F, fontSize: 14,
  color: T.ink, outline: 'none', background: T.avatarBg,
  boxSizing: 'border-box',
};

export default function ClientPersonalDetails() {
  const navigate = useNavigate();
  const { session, profile, updateProfile } = useSession();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const cityRef = useRef(null);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e) => { if (cityRef.current && !cityRef.current.contains(e.target)) setShowSuggestions(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    request('/client/profile')
      .then((data) => {
        const p = data?.profile || data || profile || {};
        setName(p.name || '');
        const em = p.email || session?.user?.email || '';
        setEmail(em);
        setOriginalEmail(em);
        setPhone(p.phone || '');
        setCity(p.city || '');
      })
      .catch((err) => setError(err.message || 'Failed to load profile'))
      .finally(() => setLoading(false));
  }, [profile, session?.user?.email]);

  const citySuggestions = city.trim().length > 0 ? filterCities(city) : [];
  const emailChanged = email.trim().toLowerCase() !== originalEmail.trim().toLowerCase();

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      // 1. Save name, phone, city to profile table
      const response = await request('/client/profile', {
        method: 'PUT',
        body: JSON.stringify({ name, phone, city, email }),
      });
      const savedProfile = response?.profile || {};

      await updateProfile({
        name: savedProfile.name ?? name,
        email: savedProfile.email ?? email,
        phone: savedProfile.phone ?? phone,
        city: savedProfile.city ?? city,
      });

      // 2. If email changed, trigger Supabase confirmation email
      if (emailChanged && supabase) {
        const { error: authErr } = await supabase.auth.updateUser({ email: email.trim() });
        if (authErr) throw new Error(authErr.message);
        setOriginalEmail(email.trim());
        setSuccess('Profile saved. Check your new email address to confirm the change.');
      } else {
        setOriginalEmail(savedProfile.email ?? email.trim());
        setSuccess('Changes saved.');
        setTimeout(() => navigate(-1), 800);
      }
    } catch (err) {
      setError(err.message || 'Request failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsPageLayout title="Personal Details">
      {loading ? (
        <>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ height: 48, borderRadius: 12, background: 'rgba(140,106,100,0.08)', marginBottom: 20, animation: 'pulse 1.5s infinite' }} />
          ))}
        </>
      ) : (
        <>
          {/* Full Name */}
          <div style={{ marginBottom: 20 }}>
            <Lbl>Full Name</Lbl>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              style={inputStyle}
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom: 20 }}>
            <Lbl>Email</Lbl>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={inputStyle}
            />
            {emailChanged && (
              <p style={{ fontFamily: F, fontSize: 12, color: T.muted, margin: '6px 0 0', lineHeight: 1.5 }}>
                You'll receive a confirmation email at the new address before the change takes effect.
              </p>
            )}
          </div>

          {/* Phone */}
          <div style={{ marginBottom: 20 }}>
            <Lbl>Phone</Lbl>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              style={inputStyle}
            />
          </div>

          {/* City with autocomplete */}
          <div style={{ marginBottom: 20, position: 'relative' }} ref={cityRef}>
            <Lbl>City</Lbl>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={city}
                onChange={(e) => { setCity(e.target.value); setShowSuggestions(true); }}
                onFocus={() => city.length > 0 && setShowSuggestions(true)}
                placeholder="Start typing your city…"
                style={{ ...inputStyle, border: `1px solid ${showSuggestions && citySuggestions.length > 0 ? T.accent : T.line}`, borderRadius: showSuggestions && citySuggestions.length > 0 ? '12px 12px 0 0' : 12 }}
              />
              {city.length > 0 && (
                <button
                  onClick={() => { setCity(''); setShowSuggestions(false); }}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T.faded, fontSize: 18, lineHeight: 1, padding: 4 }}
                >×</button>
              )}
            </div>
            {showSuggestions && citySuggestions.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: T.card, border: `1px solid ${T.accent}`, borderTop: 'none', borderRadius: '0 0 12px 12px', zIndex: 50, maxHeight: 200, overflowY: 'auto' }}>
                {citySuggestions.map((c) => (
                  <button
                    key={c}
                    onMouseDown={() => { setCity(c); setShowSuggestions(false); }}
                    style={{ display: 'block', width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', fontFamily: F, fontSize: 14, color: T.ink, cursor: 'pointer', borderBottom: `1px solid ${T.line}` }}
                  >{c}</button>
                ))}
              </div>
            )}
          </div>

          {error && <p style={{ fontFamily: F, color: '#B04040', fontSize: 13, margin: '0 0 12px' }}>{error}</p>}
          {success && (
            <p style={{ fontFamily: F, color: T.success, fontSize: 13, margin: '0 0 12px', background: T.successBg, padding: '10px 14px', borderRadius: 10 }}>{success}</p>
          )}

          <div style={{ marginTop: 8, paddingBottom: 40 }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                width: '100%', padding: 16, borderRadius: 12, border: 'none',
                background: saving ? T.faded : T.ink, color: '#fff',
                fontFamily: F, fontSize: 14, fontWeight: 500,
                cursor: saving ? 'default' : 'pointer',
              }}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </>
      )}
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </SettingsPageLayout>
  );
}
