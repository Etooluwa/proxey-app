import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchProviderProfile, invalidateProviderProfileCache } from '../../data/provider';
import { useIsDesktop } from '../../hooks/useIsDesktop';
import { request } from '../../data/apiClient';
import { useToast } from '../../components/ui/ToastProvider';
import SettingsPageLayout from '../../components/ui/SettingsPageLayout';

const T = { ink: '#3D231E', muted: '#8C6A64', faded: '#B0948F', accent: '#C25E4A', line: 'rgba(140,106,100,0.18)', card: '#FFFFFF', avatarBg: '#F2EBE5', base: '#FBF7F2', hero: '#FDDCC6', success: '#5A8A5E', successBg: '#EBF2EC', warningBg: '#F4ECE4' };

const Divider = () => (
  <div style={{ height: 1, background: T.line, margin: '0' }} />
);

function fmtMoney(value) {
  if (value === null || value === undefined || value === '') return '—';
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return '—';
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numeric);
}

export default function ProviderPayoutsBilling() {
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const stripeReturnComplete = searchParams.get('stripe') === 'done';
  const [hasStripeAccount, setHasStripeAccount] = useState(false);
  const [last4, setLast4] = useState('');
  const [nextPayout, setNextPayout] = useState('');
  const [accountStatus, setAccountStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stripeLoading, setStripeLoading] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadPayoutState() {
      setLoading(true);
      try {
        if (stripeReturnComplete) {
          invalidateProviderProfileCache();
        }
        const profile = await fetchProviderProfile();
        if (!active || !profile) return;

        const hasConnectedStripeAccount = !!profile.stripe_account_id;
        setHasStripeAccount(hasConnectedStripeAccount);
        setLast4(profile.stripe_last4 || '');
        setNextPayout('—');
        setAccountStatus(null);

        try {
          const earningsData = await request('/provider/earnings');
          if (!active) return;
          const earnings = earningsData?.earnings || null;
          setNextPayout(
            earnings?.nextPayoutDate
              ? `${fmtMoney(earnings.availableBalance)} · ${earnings.nextPayoutDate}`
              : fmtMoney(earnings?.availableBalance)
          );
        } catch (_) {
          if (!active) return;
          setNextPayout('—');
        }

        if (hasConnectedStripeAccount) {
          try {
            const status = await request(`/provider/account/${profile.stripe_account_id}`);
            if (!active) return;
            setAccountStatus(status);
          } catch (err) {
            if (!active) return;
            setAccountStatus(null);
          }
        }
      } catch (_) {
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPayoutState();

    return () => {
      active = false;
    };
  }, [searchParams, stripeReturnComplete]);

  const isDesktop = useIsDesktop();

  useEffect(() => {
    if (stripeReturnComplete) {
      toast.push({
        title: 'Stripe setup updated',
        description: 'Your payout account status has been refreshed.',
        variant: 'success',
      });
    }
  }, [stripeReturnComplete, toast]);

  const handleStripeConnect = async () => {
    setStripeLoading(true);
    try {
      const data = await request('/provider/stripe/connect', {
        method: 'POST',
        body: JSON.stringify({
          refreshUrl: `${window.location.origin}/provider/profile/payouts`,
          returnUrl: `${window.location.origin}/provider/profile/payouts?stripe=done`,
        }),
      });
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error('Stripe onboarding link not available.');
    } catch (err) {
      toast.push({
        title: 'Stripe setup failed',
        description: err.message || 'Unable to open Stripe Connect.',
        variant: 'error',
      });
      setStripeLoading(false);
    }
  };

  const stripeStatus = !accountStatus && hasStripeAccount
    ? {
        tone: 'neutral',
        title: 'Stripe account added',
        description: 'Your Stripe account exists. Open Stripe to finish payout setup and review status.',
      }
    : accountStatus?.chargesEnabled && accountStatus?.payoutsEnabled
      ? {
          tone: 'ready',
          title: 'Ready for payouts',
          description: last4
            ? `Stripe has payouts enabled for ••••${last4}.`
            : 'Stripe has charges and payouts enabled for this provider account.',
        }
      : accountStatus?.detailsSubmitted
        ? {
            tone: 'review',
            title: 'Verification in progress',
            description: 'Your details were submitted to Stripe. Payouts are not enabled yet.',
          }
        : hasStripeAccount
          ? {
              tone: 'action',
              title: 'Finish Stripe onboarding',
              description: 'Your Stripe account was created, but onboarding is not complete yet.',
            }
          : {
              tone: 'action',
              title: 'Stripe not connected',
              description: 'Set up Stripe to start payout onboarding for your earnings.',
            };

  const statusBackground = stripeStatus.tone === 'ready' ? T.successBg : T.warningBg;
  const statusForeground = stripeStatus.tone === 'ready' ? T.success : T.ink;

  const INFO_ROWS = [
    { label: 'Payout schedule', value: 'Weekly (every Monday)' },
    { label: 'Default currency', value: 'CAD' },
    { label: 'Platform fee', value: '10% per transaction' },
    { label: 'Next payout', value: nextPayout || '—' },
  ];

  return (
    <SettingsPageLayout title="Payouts & Billing">
      <div style={{ display: 'flex', flexDirection: 'column' }}>

        {/* Stripe status card */}
        <div style={{ padding: 20, background: statusBackground, borderRadius: 16, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
          {stripeStatus.tone === 'ready' ? (
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke={T.success} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke={T.muted} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          <div>
            <p style={{ fontSize: 14, fontWeight: 500, color: statusForeground, margin: 0 }}>
              {stripeStatus.title}
            </p>
            <p style={{ fontSize: 12, color: T.muted, margin: '2px 0 0' }}>
              {stripeStatus.description}
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
          type="button"
          onClick={handleStripeConnect}
          disabled={loading || stripeLoading}
          style={{ marginTop: 24, width: isDesktop ? 'auto' : '100%', alignSelf: isDesktop ? 'flex-end' : undefined, padding: '14px 24px', borderRadius: 12, border: `1px solid ${T.line}`, background: T.card, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 14, fontWeight: 500, color: T.ink, cursor: 'pointer' }}
        >
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" fill="#635BFF" />
          </svg>
          {stripeLoading ? 'Opening Stripe…' : hasStripeAccount ? 'Manage Stripe Account' : 'Connect with Stripe'}
        </button>
      </div>
    </SettingsPageLayout>
  );
}
