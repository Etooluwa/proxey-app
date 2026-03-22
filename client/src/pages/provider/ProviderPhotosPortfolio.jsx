import { useEffect, useState, useRef } from 'react';
import { request } from '../../data/apiClient';
import { useIsDesktop } from '../../hooks/useIsDesktop';
import SettingsPageLayout from '../../components/ui/SettingsPageLayout';

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
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const isDesktop = useIsDesktop();

  useEffect(() => {
    request('/provider/portfolio')
      .then(data => setPortfolioItems(data.media || []))
      .catch(() => setPortfolioItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <SettingsPageLayout title="Photos & Portfolio">

        {/* Profile Photo */}
        <Lbl>PROFILE PHOTO</Lbl>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: T.avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 22, fontWeight: 600, color: T.muted }}>?</span>
          </div>
          <div>
            <button
              style={{ padding: '10px 20px', borderRadius: 10, border: `1px solid ${T.line}`, fontSize: 12, fontWeight: 500, color: T.ink, cursor: 'pointer', marginBottom: 6, display: 'block', background: T.card }}
            >
              Change Photo
            </button>
            <p style={{ fontSize: 11, color: T.faded, margin: 0 }}>JPG or PNG · Max 5MB</p>
          </div>
        </div>

        <Divider style={{ margin: '16px 0 20px' }} />

        {/* Portfolio Gallery */}
        <Lbl>PORTFOLIO GALLERY</Lbl>
        <p style={{ fontSize: 13, color: T.muted, margin: '4px 0 16px', lineHeight: 1.5 }}>
          Showcase your work. Clients see this on your public booking page.
        </p>

        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          style={{ display: 'none' }}
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
                  style={{ aspectRatio: '1', borderRadius: 12, overflow: 'hidden', position: 'relative' }}
                >
                  <img
                    src={item.url}
                    alt="Portfolio"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              ))}
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{ aspectRatio: '1', borderRadius: 12, border: `1px dashed ${T.line}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer', background: 'none' }}
              >
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke={T.accent} strokeWidth={2} strokeLinecap="round" />
                </svg>
                <span style={{ fontSize: 10, color: T.accent }}>Add</span>
              </button>
            </>
          )}
        </div>

        {portfolioItems.length === 0 && !loading && (
          <p style={{ fontSize: 12, color: T.faded, margin: '0 0 16px' }}>No portfolio photos yet.</p>
        )}

    </SettingsPageLayout>
  );
}
