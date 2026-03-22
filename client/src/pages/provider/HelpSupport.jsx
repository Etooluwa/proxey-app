import { useNavigate } from 'react-router-dom';

const T = {
  ink: '#3D231E', muted: '#8C6A64', faded: '#B0948F', accent: '#C25E4A',
  line: 'rgba(140,106,100,0.18)', card: '#FFFFFF', avatarBg: '#F2EBE5',
  base: '#FBF7F2', hero: '#FDDCC6', success: '#5A8A5E', successBg: '#EBF2EC',
};
const F = "'Sora',system-ui,sans-serif";

const Divider = () => <div style={{ height: 1, background: T.line }} />;

const HELP_ITEMS = [
  { label: 'FAQ', sub: 'Common questions answered', href: null },
  { label: 'Contact Support', sub: 'Email us at help@mykliques.com', href: 'mailto:help@mykliques.com' },
  { label: 'Report a Bug', sub: "Let us know what's broken", href: 'mailto:bugs@mykliques.com' },
  { label: 'Feature Request', sub: "Tell us what you'd like to see", href: 'mailto:feedback@mykliques.com' },
  { label: 'Terms of Service', sub: 'Legal stuff', href: 'https://mykliques.com/terms' },
  { label: 'Privacy Policy', sub: 'How we handle your data', href: 'https://mykliques.com/privacy' },
];

export default function HelpSupport() {
  const navigate = useNavigate();

  const handleItemClick = (item) => {
    if (item.href) {
      window.open(item.href, '_blank');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: T.base, display: 'flex', flexDirection: 'column', fontFamily: F }}>
      {/* Nav */}
      <div style={{ padding: '20px 24px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={T.ink} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span style={{ fontSize: 13, fontWeight: 500, color: T.muted }}>Help & Support</span>
        <div style={{ width: 28 }} />
      </div>

      {/* Content */}
      <div style={{ padding: '12px 24px 0', flex: 1, display: 'flex', flexDirection: 'column', maxWidth: 600, width: '100%', margin: '0 auto' }}>
        {HELP_ITEMS.map((item, i) => (
          <div key={item.label}>
            <button
              onClick={() => handleItemClick(item)}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '18px 0', width: '100%', background: 'none', border: 'none',
                cursor: 'pointer', textAlign: 'left', fontFamily: F,
              }}
            >
              <div>
                <p style={{ fontSize: 15, color: T.ink, margin: '0 0 3px' }}>{item.label}</p>
                <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>{item.sub}</p>
              </div>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={T.faded} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17L17 7M17 7H7M17 7v10" />
              </svg>
            </button>
            {i < HELP_ITEMS.length - 1 && <Divider />}
          </div>
        ))}
      </div>
    </div>
  );
}
