import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { request } from '../data/apiClient';
import { useSession } from '../auth/authContext';
import { useIsDesktop } from '../hooks/useIsDesktop';
import SettingsPageLayout from '../components/ui/SettingsPageLayout';

const T = {
  ink: '#3D231E', muted: '#8C6A64', faded: '#B0948F',
  line: 'rgba(140,106,100,0.18)', avatarBg: '#F2EBE5',
  base: '#FBF7F2', danger: '#B04040', dangerBg: '#FDEDEA',
};
const F = "'Sora',system-ui,sans-serif";

const Divider = () => <div style={{ height: 1, background: T.line }} />;

const Lbl = ({ children, style = {} }) => (
  <span style={{ display: 'block', fontSize: 11, fontWeight: 500, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em', ...style }}>
    {children}
  </span>
);

const ArrowIcon = () => (
  <svg width="16" height="16" fill="none" stroke={T.faded} strokeWidth="1.5" viewBox="0 0 24 24">
    <path d="M7 17L17 7M17 7H7M17 7v10" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function maskEmail(email) {
  if (!email) return '';
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  return local.slice(0, 2) + '***@' + domain;
}

function maskPhone(phone) {
  if (!phone) return '';
  return phone.slice(0, -4).replace(/\d/g, '*') + phone.slice(-4);
}

export default function ClientPrivacySecurity() {
  const navigate = useNavigate();
  const { session } = useSession();
  const [profile, setProfile] = useState(null);
  const isDesktop = useIsDesktop();

  useEffect(() => {
    request('/client/me')
      .then((data) => setProfile(data?.profile || data || {}))
      .catch(() => setProfile({}));
  }, []);

  const maskedEmail = maskEmail(profile?.email || session?.user?.email || '');
  const maskedPhone = maskPhone(profile?.phone || '');

  const identityRows = [
    { label: 'Change email', value: maskedEmail },
    { label: 'Change phone', value: maskedPhone || 'Not set' },
  ];

  const settingsRows = identityRows;
  const dataRows = [
    { label: 'Download my data', sub: 'Get a copy of your account data', danger: false, onClick: undefined },
  ];

  return (
    <SettingsPageLayout title="Privacy & Security">
        {settingsRows.map((row) => (
          <div key={row.label}>
            <button style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: F }}>
              <span style={{ fontSize: 15, color: T.ink }}>{row.label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, color: T.muted }}>{row.value}</span>
                <ArrowIcon />
              </div>
            </button>
            <Divider />
          </div>
        ))}

        <Lbl style={{ margin: '24px 0 12px' }}>Data & Privacy</Lbl>

        {dataRows.map((item) => (
          <div key={item.label}>
            <button
              onClick={item.onClick}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: F }}
            >
              <div>
                <p style={{ fontSize: 15, color: T.ink, margin: '0 0 3px' }}>{item.label}</p>
                <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>{item.sub}</p>
              </div>
              <ArrowIcon />
            </button>
            <Divider />
          </div>
        ))}

        {/* Delete account — separate red-bordered card on desktop, inline row on mobile */}
        {isDesktop ? (
          <div style={{
            marginTop: 32, padding: '20px 24px', borderRadius: 16,
            border: `1.5px solid rgba(176,64,64,0.35)`, background: T.dangerBg,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 500, color: T.danger, margin: '0 0 3px', fontFamily: F }}>Delete account</p>
              <p style={{ fontSize: 13, color: T.muted, margin: 0, fontFamily: F }}>Permanently remove your account and all data</p>
            </div>
            <button
              onClick={() => navigate('/app/profile/privacy/delete')}
              style={{ padding: '10px 20px', borderRadius: 10, border: `1px solid rgba(176,64,64,0.4)`, background: 'transparent', fontFamily: F, fontSize: 13, fontWeight: 500, color: T.danger, cursor: 'pointer', flexShrink: 0, marginLeft: 16 }}
            >
              Delete account
            </button>
          </div>
        ) : (
          <div>
            <button
              onClick={() => navigate('/app/profile/privacy/delete')}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: F }}
            >
              <div>
                <p style={{ fontSize: 15, color: T.danger, margin: '0 0 3px' }}>Delete account</p>
                <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>Permanently remove your account</p>
              </div>
              <ArrowIcon />
            </button>
            <Divider />
          </div>
        )}
    </SettingsPageLayout>
  );
}
