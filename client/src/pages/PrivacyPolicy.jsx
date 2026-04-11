import { Link } from 'react-router-dom';
import SettingsPageLayout from '../components/ui/SettingsPageLayout';

const T = {
  ink: '#3D231E', muted: '#8C6A64', faded: '#B0948F', accent: '#C25E4A',
  line: 'rgba(140,106,100,0.18)', card: '#FFFFFF', avatarBg: '#F2EBE5',
  base: '#FBF7F2', hero: '#FDDCC6',
};
const F = "'Sora',system-ui,sans-serif";

const SECTIONS = [
  {
    title: 'What We Collect',
    body: 'We collect information you provide directly (such as your name, email address, phone number, and city) as well as usage data (pages visited, features used, session timestamps). Payment data is processed by Stripe; we do not store card numbers or full payment details on Kliques servers. We also collect data related to your bookings, messages, and interactions within the platform.',
  },
  {
    title: 'How We Use Your Data',
    body: 'We use your data to provide and improve the Kliques service, send booking confirmations and account notifications, process payments and payouts, resolve disputes between clients and providers, and communicate important service updates. We do not use your data for advertising.',
  },
  {
    title: 'Data Sharing',
    body: 'We share data with the following trusted partners: Stripe (payment processing), Supabase (database hosting), and your connected providers (who can see your name, booking history, and messages relevant to your relationship). We do not sell your personal data to third parties under any circumstances.',
  },
  {
    title: 'Cookies & Tracking',
    body: 'We use essential cookies to keep you logged in and maintain your session. We do not use third-party advertising or tracking cookies. You can disable cookies in your browser settings, but some features of Kliques may not function correctly without them.',
  },
  {
    title: 'Data Retention',
    body: 'We retain your personal data for as long as your account remains active. When you delete your account, your personal data is removed from our systems within 30 days. Anonymised and aggregated transaction data may be retained for financial record-keeping and compliance purposes.',
  },
  {
    title: 'Your Rights',
    body: 'Depending on your location, you may have the right to access, correct, export, or delete your personal data. To exercise any of these rights, contact us at info@mykliques.com. Canadian users have rights under PIPEDA (Personal Information Protection and Electronic Documents Act). EU and UK users have rights under GDPR and UK GDPR respectively. We will respond to all requests within 30 days.',
  },
  {
    title: 'Security',
    body: 'We use industry-standard security measures including TLS encryption in transit and AES-256 encryption at rest. Our infrastructure providers (Supabase and Stripe) are SOC 2 Type II compliant. While we take reasonable precautions to protect your data, no system is 100% secure. We encourage you to use a strong, unique password and to log out of shared devices.',
  },
  {
    title: 'Children',
    body: 'Kliques is not intended for users under the age of 18. We do not knowingly collect personal data from minors. If you believe a minor has provided us with personal information, please contact us at info@mykliques.com and we will promptly remove it.',
  },
  {
    title: 'Changes to This Policy',
    body: 'We may update this Privacy Policy from time to time. We will notify you of material changes via email or an in-app notice before the changes take effect. Continued use of Kliques after such notice constitutes acceptance of the updated policy. Last updated: March 2026.',
  },
  {
    title: 'Contact',
    body: 'Privacy questions? Email us at info@mykliques.com or write to: Kliques Inc., Ontario, Canada.',
  },
];

const Divider = () => <div style={{ height: 1, background: T.line }} />;

function PrivacyContent() {
  return (
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        {SECTIONS.map((section, i) => (
          <div key={i}>
            <h3 style={{
              fontFamily: F, fontSize: 15, fontWeight: 600, color: T.ink,
              margin: i === 0 ? '0 0 8px 0' : '24px 0 8px 0',
            }}>
              {section.title}
            </h3>
            <p style={{
              fontFamily: F, fontSize: 14, color: T.muted,
              lineHeight: 1.7, margin: 0,
            }}>
              {section.body}
            </p>
            {i < SECTIONS.length - 1 && (
              <div style={{ marginTop: 20 }}>
                <Divider />
              </div>
            )}
          </div>
        ))}
      </div>
  );
}

function PublicLegalShell({ title, children }) {
  return (
    <div style={{ minHeight: '100vh', background: T.base, fontFamily: F, padding: '32px 20px 56px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          <Link to="/login" style={{ textDecoration: 'none', color: T.muted, fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 19l-7-7 7-7" />
            </svg>
            Back to Kliques
          </Link>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Link to="/terms" style={{ color: T.muted, textDecoration: 'none', fontSize: 13, fontWeight: 500 }}>Terms</Link>
            <Link to="/policy" style={{ color: T.accent, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>Privacy Policy</Link>
          </div>
        </div>
        <div style={{ background: T.card, borderRadius: 24, border: `1px solid ${T.line}`, padding: '28px 24px 32px' }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.accent, margin: '0 0 8px' }}>
            Legal
          </p>
          <h1 style={{ fontSize: 34, fontWeight: 400, letterSpacing: '-0.03em', color: T.ink, margin: '0 0 24px' }}>
            {title}
          </h1>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function PrivacyPolicy({ publicView = false }) {
  if (publicView) {
    return (
      <PublicLegalShell title="Privacy Policy">
        <PrivacyContent />
      </PublicLegalShell>
    );
  }

  return (
    <SettingsPageLayout title="Privacy Policy">
      <PrivacyContent />
    </SettingsPageLayout>
  );
}
