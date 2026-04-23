import { Link, useNavigate } from 'react-router-dom';

const T = {
  ink: '#3D231E', muted: '#8C6A64', faded: '#B0948F', accent: '#C25E4A',
  line: 'rgba(140,106,100,0.2)', base: '#FBF7F2', hero: '#FDDCC6',
};
const F = "'Sora',system-ui,sans-serif";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #FCD4C4 0%, #FDE8DC 30%, #FDF5F0 65%, #FDFDFD 100%)',
      fontFamily: F,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px' }}>
        <span style={{ fontSize: 22, fontWeight: 600, color: T.ink, letterSpacing: '-0.03em' }}>kliques</span>
        <button
          onClick={() => navigate('/login')}
          style={{
            fontFamily: F, fontSize: 14, fontWeight: 600, color: T.ink,
            background: 'rgba(255,255,255,0.7)', border: `1px solid ${T.line}`,
            borderRadius: 24, padding: '8px 20px', cursor: 'pointer',
          }}
        >
          Sign in
        </button>
      </nav>

      {/* Hero */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 28px 64px', textAlign: 'center' }}>
        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.accent, margin: '0 0 16px' }}>
          Relationship OS
        </p>
        <h1 style={{ fontSize: 'clamp(36px, 8vw, 64px)', fontWeight: 600, color: T.ink, letterSpacing: '-0.03em', lineHeight: 1.1, margin: '0 0 20px', maxWidth: 640 }}>
          Built for independent practitioners.
        </h1>
        <p style={{ fontSize: 16, color: T.muted, lineHeight: 1.7, margin: '0 0 40px', maxWidth: 480 }}>
          Manage your clients, bookings, and payments — all in one place. No marketplace. Just your relationships.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              fontFamily: F, fontSize: 15, fontWeight: 600, color: '#fff',
              background: T.ink, border: 'none', borderRadius: 14,
              padding: '14px 32px', cursor: 'pointer',
            }}
          >
            Get started
          </button>
          <button
            onClick={() => navigate('/login')}
            style={{
              fontFamily: F, fontSize: 15, fontWeight: 500, color: T.ink,
              background: 'rgba(255,255,255,0.7)', border: `1px solid ${T.line}`,
              borderRadius: 14, padding: '14px 32px', cursor: 'pointer',
            }}
          >
            Sign in
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ padding: '24px 28px 32px', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: T.faded, margin: '0 0 10px' }}>
          © 2026 Kliques. Built for independent practitioners.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
          <Link to="/policy" style={{ fontSize: 13, color: T.muted, textDecoration: 'none', fontWeight: 500 }}>Privacy</Link>
          <span style={{ color: T.faded, fontSize: 13 }}>·</span>
          <Link to="/terms" style={{ fontSize: 13, color: T.muted, textDecoration: 'none', fontWeight: 500 }}>Terms</Link>
          <span style={{ color: T.faded, fontSize: 13 }}>·</span>
          <a href="mailto:info@mykliques.com" style={{ fontSize: 13, color: T.muted, textDecoration: 'none', fontWeight: 500 }}>Contact</a>
        </div>
      </footer>
    </div>
  );
}
