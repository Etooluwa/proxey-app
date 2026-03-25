import { useState } from 'react';
import SettingsPageLayout from '../components/ui/SettingsPageLayout';

const T = {
  ink: '#3D231E', muted: '#8C6A64', faded: '#B0948F', accent: '#C25E4A',
  line: 'rgba(140,106,100,0.18)', card: '#FFFFFF', avatarBg: '#F2EBE5',
  base: '#FBF7F2', hero: '#FDDCC6',
};
const F = "'Sora',system-ui,sans-serif";

const FAQ_ITEMS = [
  {
    q: 'What is Kliques?',
    a: "Kliques is a relationship OS for clients and their service providers. Instead of treating every booking as a one-off transaction, Kliques keeps your full history, notes, and messages with each provider in one place — so the relationship only gets better over time.",
  },
  {
    q: 'How do I connect with a provider?',
    a: "Two ways: tap a booking link your provider shares (mykliques.com/book/their-handle) to book directly, or tap an invite link (mykliques.com/join/their-handle) to connect without booking right away. Once connected, they appear in your My Kliques list.",
  },
  {
    q: 'How do I book a session?',
    a: "Open your provider's booking link, pick a service, choose a time slot, and confirm. You'll get an email confirmation once the provider accepts your request.",
  },
  {
    q: 'How do payments work?',
    a: "Payments are processed securely via Stripe. Depending on the provider's settings, you may pay a deposit upfront or the full amount at booking. Your card details are never stored on Kliques servers — they're held securely by Stripe.",
  },
  {
    q: 'Can I cancel or reschedule a booking?',
    a: "Contact your provider directly through Messages to request a change. Cancellation and rescheduling policies vary by provider and are shown at the time of booking.",
  },
  {
    q: 'How do I message my provider?',
    a: "Go to Messages in the sidebar and open the conversation with your provider. If you haven't connected yet, you'll see the messaging thread appear automatically after your first booking or invite connection.",
  },
  {
    q: 'How do I find my invoices?',
    a: "Go to Bookings → a completed session → Invoice, or check the Invoices section in your profile. Invoices are generated automatically when your provider marks a session as complete.",
  },
  {
    q: 'Is my data safe?',
    a: "Yes. All data is encrypted in transit and at rest. We use Supabase (PostgreSQL) for storage and Stripe for payments — both are industry-standard, SOC 2 compliant platforms. We never sell your data.",
  },
  {
    q: 'How do I delete my account?',
    a: "Go to Profile → Privacy & Security → Delete account. This permanently removes your account and all associated data. This action cannot be undone.",
  },
];

const Divider = () => <div style={{ height: 1, background: T.line }} />;

function FAQItem({ item, isOpen, onToggle }) {
  return (
    <div>
      <button
        onClick={onToggle}
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          width: '100%', padding: '18px 0', background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'left', fontFamily: F,
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 500, color: T.ink, lineHeight: 1.4, paddingRight: 16 }}>
          {item.q}
        </span>
        <span style={{ color: T.faded, fontSize: 18, flexShrink: 0, lineHeight: 1 }}>
          {isOpen ? '↑' : '↓'}
        </span>
      </button>
      {isOpen && (
        <p style={{
          fontFamily: F, fontSize: 14, color: T.muted, lineHeight: 1.7,
          margin: '0 0 18px 0', padding: 0,
        }}>
          {item.a}
        </p>
      )}
    </div>
  );
}

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState(null);

  const handleToggle = (i) => setOpenIndex(openIndex === i ? null : i);

  return (
    <SettingsPageLayout title="FAQ">
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        {FAQ_ITEMS.map((item, i) => (
          <div key={i}>
            <FAQItem item={item} isOpen={openIndex === i} onToggle={() => handleToggle(i)} />
            {i < FAQ_ITEMS.length - 1 && <Divider />}
          </div>
        ))}
      </div>
    </SettingsPageLayout>
  );
}
