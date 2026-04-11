import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchProviderProfile, updateProviderProfile } from '../../data/provider';
import { request } from '../../data/apiClient';
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

const FALLBACK_CATEGORIES = [
  'Vocal Coaching',
  'Music Lessons',
  'Dance Instruction',
  'Fitness Training',
  'Yoga & Pilates',
  'Massage Therapy',
  'Mental Wellness',
  'Nutrition Coaching',
  'Hair Styling',
  'Barbering',
  'Braiding & Locs',
  'Makeup',
  'Nails',
  'Lashes & Brows',
  'Skincare & Esthetics',
  'Spa & Body Treatments',
  'Tattoo & Piercing',
  'Photography',
  'Videography',
  'Event Planning',
  'DJ & Music Entertainment',
  'Catering & Private Chef',
  'Decor & Event Design',
  'Home Cleaning',
  'Deep Cleaning',
  'Home Organization',
  'Moving & Hauling',
  'Handyman',
  'Electrical',
  'Plumbing',
  'Painting',
  'Landscaping',
  'Auto Detailing',
  'Auto Repair',
  'Pet Grooming',
  'Pet Care',
  'Childcare',
  'Tutoring',
  'Language Coaching',
  'Business Consulting',
  'Marketing & Branding',
  'Design & Creative',
  'Tech Support',
  'Delivery & Errands',
];

export default function ProviderBusinessDetails() {
  const navigate = useNavigate();
  const [category, setCategory] = useState('');
  const [categoryOptions, setCategoryOptions] = useState(FALLBACK_CATEGORIES);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [useCustomCategory, setUseCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetchProviderProfile(),
      request('/categories').catch(() => ({ categories: FALLBACK_CATEGORIES.map((label) => ({ label })) })),
    ])
      .then(([profile, categoryData]) => {
        if (cancelled) return;

        const remoteOptions = (categoryData?.categories || [])
          .map((item) => item?.label || item?.name || String(item || '').trim())
          .filter(Boolean);
        const uniqueOptions = Array.from(new Set([...(remoteOptions.length ? remoteOptions : FALLBACK_CATEGORIES), ...FALLBACK_CATEGORIES]));
        setCategoryOptions(uniqueOptions);

        if (profile) {
          const existingCategory = profile.category || (profile.categories || [])[0] || '';
          setAddress1(profile.address_line1 || '');
          setAddress2(profile.address_line2 || '');
          setBio(profile.bio || '');

          if (existingCategory && !uniqueOptions.includes(existingCategory)) {
            setUseCustomCategory(true);
            setCustomCategory(existingCategory);
            setCategory('Other');
          } else {
            setUseCustomCategory(false);
            setCustomCategory('');
            setCategory(existingCategory);
          }
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load profile');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedCategory = useCustomCategory ? customCategory.trim() : category;
  const filteredCategories = useMemo(() => {
    const needle = categorySearch.trim().toLowerCase();
    if (!needle) return categoryOptions;
    return categoryOptions.filter((option) => option.toLowerCase().includes(needle));
  }, [categoryOptions, categorySearch]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      if (useCustomCategory && !selectedCategory) {
        throw new Error('Enter your category before saving changes.');
      }

      await updateProviderProfile({
        category: selectedCategory || null,
        categories: selectedCategory ? [selectedCategory] : [],
        address_line1: address1,
        address_line2: address2,
        bio,
      });
      navigate(-1);
    } catch (err) {
      setError(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleCategorySelect = (nextCategory) => {
    if (nextCategory === 'Other') {
      setUseCustomCategory(true);
      setCategory('Other');
      setCustomCategory('');
      // Keep dropdown open so user can type their category inline
      return;
    }
    setUseCustomCategory(false);
    setCustomCategory('');
    setCategory(nextCategory);
    setCategoryOpen(false);
  };

  return (
    <SettingsPageLayout title="Business Details">
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
            {/* Category */}
            <div>
              <Lbl>Category</Lbl>
              <div
                onClick={() => setCategoryOpen((open) => !open)}
                style={{
                  ...inputStyle,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  marginBottom: categoryOpen ? 12 : 20,
                }}
              >
                <span style={{ color: selectedCategory ? T.ink : T.faded }}>
                  {selectedCategory || 'Select category'}
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
                  style={{ transform: categoryOpen ? 'rotate(135deg)' : 'none', transition: 'transform 0.2s ease' }}
                >
                  <path d="M7 17L17 7M17 7H7M17 7v10" />
                </svg>
              </div>

              {categoryOpen && (
                <div
                  style={{
                    background: T.avatarBg,
                    border: `1px solid ${T.line}`,
                    borderRadius: 16,
                    padding: 12,
                    marginBottom: 20,
                  }}
                >
                  {useCustomCategory ? (
                    /* "Other" selected — type your category inline */
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <button
                          type="button"
                          onClick={() => { setUseCustomCategory(false); setCustomCategory(''); setCategory(''); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                        >
                          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <span style={{ fontFamily: F, fontSize: 13, color: T.muted }}>Type your category</span>
                      </div>
                      <input
                        type="text"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        placeholder="e.g. Interior Design"
                        autoFocus
                        style={{ ...inputStyle, background: '#FBF7F2', marginBottom: 8 }}
                      />
                      <button
                        type="button"
                        onClick={() => { if (customCategory.trim()) setCategoryOpen(false); }}
                        disabled={!customCategory.trim()}
                        style={{
                          width: '100%', padding: '12px 14px', borderRadius: 12, border: 'none',
                          background: customCategory.trim() ? T.ink : 'rgba(140,106,100,0.15)',
                          color: customCategory.trim() ? '#fff' : T.faded,
                          fontFamily: F, fontSize: 14, fontWeight: 500, cursor: customCategory.trim() ? 'pointer' : 'default',
                        }}
                      >
                        Use "{customCategory.trim() || '…'}"
                      </button>
                    </div>
                  ) : (
                    /* Normal category list */
                    <>
                      <input
                        type="text"
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        placeholder="Search categories"
                        style={{ ...inputStyle, background: '#FBF7F2', marginBottom: 12 }}
                      />
                      <div style={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {filteredCategories.map((option) => {
                          const active = !useCustomCategory && category === option;
                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() => handleCategorySelect(option)}
                              style={{
                                width: '100%', textAlign: 'left', padding: '12px 14px', borderRadius: 12,
                                border: active ? '1px solid #C25E4A' : `1px solid ${T.line}`,
                                background: active ? 'rgba(194,94,74,0.10)' : '#FBF7F2',
                                color: T.ink, fontFamily: F, fontSize: 14, cursor: 'pointer',
                              }}
                            >
                              {option}
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => handleCategorySelect('Other')}
                          style={{
                            width: '100%', textAlign: 'left', padding: '12px 14px', borderRadius: 12,
                            border: `1px dashed ${T.line}`,
                            background: '#FBF7F2', color: T.ink, fontFamily: F, fontSize: 14, cursor: 'pointer',
                          }}
                        >
                          Other — type my own
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
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
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </SettingsPageLayout>
  );
}
