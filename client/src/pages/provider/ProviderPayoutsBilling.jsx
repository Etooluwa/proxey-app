import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchProviderProfile } from '../../data/provider';

const T = { ink: '#3D231E', muted: '#8C6A64', faded: '#B0948F', accent: '#C25E4A', line: 'rgba(140,106,100,0.18)', card: '#FFFFFF', avatarBg: '#F2EBE5', base: '#FBF7F2', hero: '#FDDCC6', success: '#5A8A5E', successBg: '#EBF2EC' };
const F = "'Sora',system-ui,sans-serif";

const Divider = () => (
  <div style={{ height: 1, background: T.line, margin: '0' }} />
);

export default function ProviderPayoutsBilling() {
  const navigate = useNavigate();
  const [stripeConnected, setStripeConnected] = useState(false);
  const [last4, setLast4] = useState('');
  const [nextPayout, setNextPayout] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProviderProfile()
      .then(profile => {
        if (profile) {
          setStripeConnected(!!(profile.stripe_account_id));
          setLast4(profile.stripe_last4 || '');
          setNextPayout(profile.next_payout_amount ? `$${profile.next_payout_amount}` : '—');
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const INFO_ROWS = [
    { label: 'Payout schedule', value: 'Weekly (every Monday)' },
    { label: 'Default currency', value: 'CAD' },
    { label: 'Platform fee', value: '10% per transaction' },
    { label: 'Next payout', value: nextPayout || '—' },
  ];

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
        <span style={{ fontSize: 13, fontWeight: 500, color: T.muted }}>Payouts & Billing</span>
        <div style={{ width: 28 }} />
      </div>

      {/* Content */}
      <div style={{ padding: '12px 24px 0', flex: 1, display: 'flex', flexDirection: 'column', maxWidth: 600, width: '100%', margin: '0 auto' }}>

        {/* Stripe status card */}
        <div style={{ padding: 20, background: stripeConnected ? T.successBg : T.avatarBg, borderRadius: 16, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
          {stripeConnected ? (
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke={T.success} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke={T.muted} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          <div>
            <p style={{ fontSize: 14, fontWeight: 500, color: stripeConnected ? T.success : T.ink, margin: 0 }}>
              {stripeConnected ? 'Stripe Connected' : 'Stripe Not Connected'}
            </p>
            <p style={{ fontSize: 12, color: T.muted, margin: '2px 0 0' }}>
              {stripeConnected ? `Payouts go to ••••${last4}` : 'Set up payouts to receive earnings'}
            </p>
          </div>
        </div>

        <Divider />

        {/* Info rows */}
        {INFO_ROWS.map((row, i) => (
          <div key={i} style={{ borderBottom: `1px solid ${T.line}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0' }}>
              <span style={{ fontSize: 15, color: T.ink }}>{row.label}</span>
              <span style={{ fontSize: 14, color: T.muted }}>{row.value}</span>
            </div>
          </div>
        ))}

        {/* Manage / Connect Stripe button */}
        <button
          style={{ marginTop: 24, width: '100%', padding: 16, borderRadius: 12, border: `1px solid ${T.line}`, background: T.card, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14, fontWeight: 500, color: T.ink, cursor: 'pointer' }}
        >
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" fill="#635BFF" />
          </svg>
          {stripeConnected ? 'Manage Stripe Account' : 'Connect with Stripe'}
        </button>

      </div>
    </div>
  );
}
