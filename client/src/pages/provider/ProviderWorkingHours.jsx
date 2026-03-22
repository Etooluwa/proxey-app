import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const T = { ink: '#3D231E', muted: '#8C6A64', faded: '#B0948F', accent: '#C25E4A', line: 'rgba(140,106,100,0.18)', card: '#FFFFFF', avatarBg: '#F2EBE5', base: '#FBF7F2', hero: '#FDDCC6', success: '#5A8A5E', successBg: '#EBF2EC' };
const F = "'Sora',system-ui,sans-serif";

export default function ProviderWorkingHours() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/provider/calendar/availability', { replace: true });
  }, [navigate]);

  return (
    <div style={{ minHeight: '100vh', background: T.base, display: 'flex', flexDirection: 'column', fontFamily: F }}>
      {/* Nav bar */}
      <div style={{ padding: '20px 24px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <path d="M15 19l-7-7 7-7" stroke={T.ink} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span style={{ fontSize: 13, fontWeight: 500, color: T.muted }}>Working Hours</span>
        <div style={{ width: 28 }} />
      </div>

      {/* Content */}
      <div style={{ padding: '12px 24px 0', flex: 1, display: 'flex', flexDirection: 'column', maxWidth: 600, width: '100%', margin: '0 auto' }}>
        <p style={{ fontSize: 15, color: T.muted, margin: '0 0 24px', lineHeight: 1.6 }}>
          Redirecting to your availability settings…
        </p>
        <button
          onClick={() => navigate('/provider/calendar/availability')}
          style={{ width: '100%', padding: 16, borderRadius: 12, border: 'none', background: T.ink, color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
        >
          Edit Availability
        </button>
      </div>
    </div>
  );
}
