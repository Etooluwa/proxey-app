import SettingsPageLayout from '../components/ui/SettingsPageLayout';

const T = {
  ink: '#3D231E', muted: '#8C6A64', faded: '#B0948F', accent: '#C25E4A',
  line: 'rgba(140,106,100,0.18)', card: '#FFFFFF', avatarBg: '#F2EBE5',
  base: '#FBF7F2', hero: '#FDDCC6',
};
const F = "'Sora',system-ui,sans-serif";

const SECTIONS = [
  {
    title: 'Acceptance of Terms',
    body: 'By accessing Kliques (mykliques.com), you agree to these Terms. If you disagree with any part of these Terms, do not use the service.',
  },
  {
    title: 'Description of Service',
    body: 'Kliques is a relationship management platform connecting clients with independent service providers. We provide tools to manage bookings, messaging, and payment processing. Kliques is not a party to any service agreements between clients and providers — all such agreements are solely between the client and the provider.',
  },
  {
    title: 'User Accounts',
    body: 'You must provide accurate, current, and complete information when creating an account. You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account. Notify us immediately at info@mykliques.com if you suspect any unauthorised use of your account.',
  },
  {
    title: 'Acceptable Use',
    body: 'You agree not to: misuse the platform in any way that could damage, disable, or impair it; harass, threaten, or abuse other users; submit false, misleading, or fraudulent information; attempt to gain unauthorised access to any part of the platform or its infrastructure; or use the platform for any unlawful purpose or in violation of any applicable laws.',
  },
  {
    title: 'Payments & Fees',
    body: 'Payments between clients and providers are processed via Stripe. Kliques charges a platform fee on completed transactions, which is disclosed at the time of booking. Refund eligibility is determined by the individual provider\'s stated cancellation policy. Kliques is not responsible for disputed transactions between clients and providers.',
  },
  {
    title: 'Cancellations & Refunds',
    body: 'Cancellation policies are set by individual providers and displayed at the time of booking. Kliques does not guarantee refunds. If a dispute arises, it can be raised through the platform and will be reviewed within 5 business days. Kliques\' decision on disputes is final.',
  },
  {
    title: 'Privacy',
    body: 'Your use of Kliques is also governed by our Privacy Policy, which is incorporated into these Terms by reference. By using Kliques, you consent to the collection and use of your information as described in the Privacy Policy.',
  },
  {
    title: 'Intellectual Property',
    body: 'All content, branding, design, and software on the Kliques platform is owned by Kliques Inc. or its licensors. You may not copy, modify, distribute, sell, or lease any part of the platform, nor may you reverse engineer or extract the source code of any software, without express written permission from Kliques Inc.',
  },
  {
    title: 'Limitation of Liability',
    body: 'Kliques is provided "as is" and "as available" without warranties of any kind. To the fullest extent permitted by applicable law, Kliques Inc. is not liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of — or inability to use — the service, even if we have been advised of the possibility of such damages.',
  },
  {
    title: 'Governing Law',
    body: 'These Terms are governed by and construed in accordance with the laws of the Province of Ontario, Canada, without regard to conflict of law principles. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts located in Ontario, Canada.',
  },
  {
    title: 'Changes to Terms',
    body: 'We may update these Terms at any time. We will notify you of material changes via email or an in-app notice. Continued use of Kliques after any changes constitutes your acceptance of the updated Terms. Last updated: March 2026.',
  },
  {
    title: 'Contact',
    body: 'Questions about these Terms? Email us at info@mykliques.com or write to: Kliques Inc., Ontario, Canada.',
  },
];

const Divider = () => <div style={{ height: 1, background: T.line }} />;

export default function TermsOfService() {
  return (
    <SettingsPageLayout title="Terms of Service">
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
    </SettingsPageLayout>
  );
}
