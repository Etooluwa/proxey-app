import { useEffect, useMemo, useState } from 'react';
import { request } from '../../data/apiClient';
import { useIsDesktop } from '../../hooks/useIsDesktop';
import SettingsPageLayout from '../../components/ui/SettingsPageLayout';
import { useSession } from '../../auth/authContext';
import { fetchProviderProfile, updateProviderProfile } from '../../data/provider';
import { uploadProfilePhoto, deleteProfilePhoto } from '../../utils/photoUpload';
import { uploadPortfolioImage, deletePortfolioImage } from '../../utils/portfolioUpload';

const T = { ink: '#3D231E', muted: '#8C6A64', faded: '#B0948F', accent: '#C25E4A', line: 'rgba(140,106,100,0.18)', card: '#FFFFFF', avatarBg: '#F2EBE5', base: '#FBF7F2', hero: '#FDDCC6', success: '#5A8A5E', successBg: '#EBF2EC' };
const F = "'Sora',system-ui,sans-serif";

const Lbl = ({ children }) => (
  <span style={{ display: 'block', fontSize: 11, fontWeight: 500, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
    {children}
  </span>
);

const Divider = ({ style }) => (
  <div style={{ height: 1, background: T.line, margin: '0', ...style }} />
);

export default function ProviderPhotosPortfolio() {
  const { session, profile, updateProfile: updateAuthProfile } = useSession();
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [providerPhoto, setProviderPhoto] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [error, setError] = useState('');
  const isDesktop = useIsDesktop();

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      request('/provider/portfolio').catch(() => ({ media: [] })),
      fetchProviderProfile().catch(() => null),
    ])
      .then(([portfolioData, providerData]) => {
        if (cancelled) return;
        setPortfolioItems(portfolioData.media || []);
        setProviderPhoto(providerData?.photo || providerData?.avatar || profile?.photo || '');
      })
      .catch(() => {
        if (!cancelled) setPortfolioItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [profile?.photo]);

  const initials = useMemo(() => {
    const name = profile?.name || session?.user?.email?.split('@')[0] || 'Provider';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [profile?.name, session?.user?.email]);

  const validateFile = (file) => {
    if (!file) return 'No file selected.';
    if (!file.type.startsWith('image/')) return 'Use a JPG, PNG, or WebP image.';
    if (file.size > 5 * 1024 * 1024) return 'Image must be 5MB or smaller.';
    return '';
  };

  const handleProfilePhotoChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setPhotoUploading(true);
    setError('');

    try {
      const nextUrl = await uploadProfilePhoto(file, session?.user?.id);
      await updateProviderProfile({ photo: nextUrl, avatar: nextUrl });
      await updateAuthProfile({ ...(profile || {}), photo: nextUrl, avatar: nextUrl });
      if (providerPhoto && providerPhoto !== nextUrl) {
        deleteProfilePhoto(providerPhoto).catch(() => {});
      }
      setProviderPhoto(nextUrl);
    } catch (err) {
      setError(err.message || 'Failed to update profile photo.');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handlePortfolioUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setUploading(true);
    setError('');

    try {
      const mediaUrl = await uploadPortfolioImage(file, session?.user?.id);
      const data = await request('/provider/portfolio', {
        method: 'POST',
        body: JSON.stringify({
          mediaUrl,
          mediaType: 'image',
          title: file.name.replace(/\.[^.]+$/, ''),
        }),
      });

      setPortfolioItems((prev) => [data.media, ...prev]);
    } catch (err) {
      setError(err.message || 'Failed to add portfolio image.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePortfolioItem = async (item) => {
    try {
      setError('');
      await request(`/provider/portfolio/${item.id}`, { method: 'DELETE' });
      deletePortfolioImage(item.url || item.media_url).catch(() => {});
      setPortfolioItems((prev) => prev.filter((entry) => entry.id !== item.id));
    } catch (err) {
      setError(err.message || 'Failed to delete portfolio image.');
    }
  };

  return (
    <SettingsPageLayout title="Photos & Portfolio">

        {/* Profile Photo */}
        <Lbl>PROFILE PHOTO</Lbl>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: T.avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
            {providerPhoto ? (
              <img src={providerPhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: 22, fontWeight: 600, color: T.muted }}>{initials || '?'}</span>
            )}
          </div>
          <div>
            <button
              type="button"
              style={{ padding: '10px 20px', borderRadius: 10, border: `1px solid ${T.line}`, fontSize: 12, fontWeight: 500, color: T.ink, cursor: 'pointer', marginBottom: 6, display: 'block', background: T.card }}
            >
              <label htmlFor="provider-profile-photo-input" style={{ cursor: 'pointer', display: 'block' }}>
                {photoUploading ? 'Updating…' : 'Change Photo'}
              </label>
            </button>
            <p style={{ fontSize: 11, color: T.faded, margin: 0 }}>JPG or PNG · Max 5MB</p>
          </div>
        </div>

        <input
          type="file"
          id="provider-profile-photo-input"
          accept="image/png,image/jpeg,image/webp"
          style={{ display: 'none' }}
          onChange={handleProfilePhotoChange}
        />

        <Divider style={{ margin: '16px 0 20px' }} />

        {/* Portfolio Gallery */}
        <Lbl>PORTFOLIO GALLERY</Lbl>
        <p style={{ fontSize: 13, color: T.muted, margin: '4px 0 16px', lineHeight: 1.5 }}>
          Showcase your work. Clients see this on your public booking page.
        </p>

        <input
          type="file"
          id="provider-portfolio-upload-input"
          accept="image/png,image/jpeg,image/webp"
          style={{ display: 'none' }}
          onChange={handlePortfolioUpload}
        />

        <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)', gap: isDesktop ? 12 : 8, marginBottom: 16 }}>
          {loading ? (
            [0, 1, 2, 3].map(i => (
              <div
                key={i}
                style={{ aspectRatio: '1', borderRadius: 12, background: T.avatarBg }}
              />
            ))
          ) : (
            <>
              {portfolioItems.map(item => (
                <div
                  key={item.id}
                  style={{ aspectRatio: '1', borderRadius: 12, overflow: 'hidden', position: 'relative', background: T.avatarBg }}
                >
                  <img
                    src={item.url || item.media_url}
                    alt="Portfolio"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <button
                    type="button"
                    onClick={() => handleDeletePortfolioItem(item)}
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      border: 'none',
                      background: 'rgba(61,35,30,0.78)',
                      color: '#fff',
                      fontSize: 16,
                      lineHeight: 1,
                      cursor: 'pointer',
                    }}
                    aria-label="Delete portfolio image"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                disabled={uploading}
                style={{ aspectRatio: '1', borderRadius: 12, border: `1px dashed ${T.line}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer', background: 'none' }}
              >
                <label
                  htmlFor="provider-portfolio-upload-input"
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: uploading ? 'default' : 'pointer', width: '100%', height: '100%' }}
                >
                  <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14M5 12h14" stroke={T.accent} strokeWidth={2} strokeLinecap="round" />
                  </svg>
                  <span style={{ fontSize: 10, color: T.accent }}>{uploading ? 'Adding…' : 'Add'}</span>
                </label>
              </button>
            </>
          )}
        </div>

        {error && (
          <p style={{ fontSize: 12, color: '#B04040', margin: '0 0 16px' }}>{error}</p>
        )}

        {portfolioItems.length === 0 && !loading && (
          <p style={{ fontSize: 12, color: T.faded, margin: '0 0 16px' }}>No portfolio photos yet.</p>
        )}

    </SettingsPageLayout>
  );
}
