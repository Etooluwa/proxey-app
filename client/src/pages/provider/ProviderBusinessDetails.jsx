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

export default function ProviderBusinessDetails() {
  const navigate = useNavigate();
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [bio, setBio] = useState('');
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showAddLang, setShowAddLang] = useState(false);
  const [newLang, setNewLang] = useState('');

  useEffect(() => {
    fetchProviderProfile()
      .then((profile) => {
        if (profile) {
          setBusinessName(profile.business_name || '');
          setCategory((profile.categories || [])[0] || '');
          setAddress1(profile.address_line1 || '');
          setAddress2(profile.address_line2 || '');
          setBio(profile.bio || '');
          setLanguages(profile.languages || []);
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
        body: JSON.stringify({
          business_name: businessName,
          categories: category ? [category] : [],
          address_line1: address1,
          address_line2: address2,
          bio,
          languages,
        }),
      });
      navigate(-1);
    } catch (err) {
      setError(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleAddLang = () => {
    const trimmed = newLang.trim();
    if (trimmed && !languages.includes(trimmed)) {
      setLanguages([...languages, trimmed]);
    }
    setShowAddLang(false);
    setNewLang('');
  };

  const handleRemoveLang = (lang) => {
    setLanguages(languages.filter((l) => l !== lang));
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
        <span style={{ fontSize: 13, fontWeight: 500, color: T.muted }}>Business Details</span>
        <div style={{ width: 28 }} />
      </div>

      {/* Content */}
      <div style={{ padding: '12px 24px 0', flex: 1, display: 'flex', flexDirection: 'column', maxWidth: 600, width: '100%', margin: '0 auto' }}>
        {loading ? (
          <>
            {[0, 1, 2, 3, 4].map((i) => (
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
            {/* Business Name */}
            <div>
              <Lbl>Business Name</Lbl>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Your business name"
                style={inputStyle}
              />
            </div>

            {/* Category */}
            <div>
              <Lbl>Category</Lbl>
              <div
                style={{
                  ...inputStyle,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'default',
                }}
              >
                <span style={{ color: category ? T.ink : T.faded }}>
                  {category || 'Select category'}
                </span>
                <svg
                  width={18}
                  height={18}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={T.faded}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M7 17L17 7M17 7H7M17 7v10" />
                </svg>
              </div>
            </div>

            {/* Address Line 1 */}
            <div>
              <Lbl>Address Line 1</Lbl>
              <input
                type="text"
                value={address1}
                onChange={(e) => setAddress1(e.target.value)}
                placeholder="123 Main Street"
                style={inputStyle}
              />
            </div>

            {/* Address Line 2 */}
            <div>
              <Lbl>Address Line 2</Lbl>
              <input
                type="text"
                value={address2}
                onChange={(e) => setAddress2(e.target.value)}
                placeholder="City, Province, Postal Code"
                style={inputStyle}
              />
            </div>

            {/* Bio */}
            <div>
              <Lbl>Bio</Lbl>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Tell clients a bit about yourself…"
                style={{
                  ...inputStyle,
                  marginBottom: 20,
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Languages */}
            <div style={{ marginBottom: 20 }}>
              <Lbl>Languages</Lbl>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                {languages.map((lang) => (
                  <div
                    key={lang}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 9999,
                      background: T.hero,
                      border: '2px solid #C25E4A',
                      fontSize: 12,
                      fontWeight: 500,
                      color: T.accent,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {lang}
                    <button
                      onClick={() => handleRemoveLang(lang)}
                      style={{
                        fontSize: 14,
                        color: T.accent,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        lineHeight: 1,
                        padding: 0,
                      }}
                      aria-label={`Remove ${lang}`}
                    >
                      ×
                    </button>
                  </div>
                ))}

                {!showAddLang && (
                  <button
                    onClick={() => setShowAddLang(true)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 9999,
                      border: '1px dashed rgba(140,106,100,0.4)',
                      fontSize: 12,
                      color: T.accent,
                      cursor: 'pointer',
                      background: 'none',
                      fontFamily: F,
                    }}
                  >
                    + Add
                  </button>
                )}
              </div>

              {showAddLang && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="text"
                    value={newLang}
                    onChange={(e) => setNewLang(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddLang(); }}
                    placeholder="e.g. Spanish"
                    autoFocus
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: `1px solid ${T.line}`,
                      fontFamily: F,
                      fontSize: 13,
                      color: T.ink,
                      outline: 'none',
                      background: T.avatarBg,
                    }}
                  />
                  <button
                    onClick={handleAddLang}
                    style={{
                      padding: '10px 16px',
                      borderRadius: 10,
                      border: 'none',
                      background: T.ink,
                      color: '#fff',
                      fontFamily: F,
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Add
                  </button>
                  <button
                    onClick={() => { setShowAddLang(false); setNewLang(''); }}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: `1px solid ${T.line}`,
                      background: 'none',
                      color: T.muted,
                      fontFamily: F,
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
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
