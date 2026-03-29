import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { request } from '../../data/apiClient';
import { fetchProviderProfile } from '../../data/provider';

const T = {
  ink: '#3D231E',
  muted: '#8C6A64',
  line: 'rgba(140,106,100,0.18)',
  card: '#FFF7F1',
  warningBg: '#F4ECE4',
  warningBorder: 'rgba(194,94,74,0.18)',
  accent: '#C25E4A',
};

const F = "'Sora',system-ui,sans-serif";

function resolveBannerState(profile, accountStatus) {
  if (!profile?.stripe_account_id) {
    return {
      title: 'Connect Stripe before collecting payments',
      description:
        'You can finish your profile now, but paid bookings stay blocked until you connect Stripe in Payouts & Billing.',
    };
  }

  if (accountStatus?.chargesEnabled && accountStatus?.payoutsEnabled) {
    return null;
  }

  if (accountStatus?.detailsSubmitted) {
    return {
      title: 'Stripe verification still in progress',
      description:
        'Your payout account has been submitted to Stripe, but charges or payouts are not enabled yet. Paid bookings stay blocked until Stripe finishes review.',
    };
  }

  return {
    title: 'Finish Stripe payout onboarding',
    description:
      'Your Stripe account exists, but it is not ready to receive paid booking payouts yet. Open Payouts & Billing to finish setup.',
  };
}

export default function ProviderStripeReadinessBanner({ compact = false }) {
  const navigate = useNavigate();
  const [bannerState, setBannerState] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadStripeStatus() {
      try {
        const profile = await fetchProviderProfile();
        if (!active || !profile?.stripe_account_id) {
          if (active) setBannerState(null);
          return;
        }

        try {
          const accountStatus = await request(`/provider/account/${profile.stripe_account_id}`);
          if (!active) return;
          setBannerState(resolveBannerState(profile, accountStatus));
        } catch (_) {
          if (!active) return;
          setBannerState(resolveBannerState(profile, null));
        }
      } catch (_) {
        if (active) setBannerState(null);
      }
    }

    loadStripeStatus();

    return () => {
      active = false;
    };
  }, []);

  if (!bannerState) return null;

  return (
    <div
      style={{
        background: compact ? T.warningBg : T.card,
        border: `1px solid ${T.warningBorder}`,
        borderRadius: compact ? 18 : 20,
        padding: compact ? '16px 18px' : '18px 20px',
        display: 'flex',
        alignItems: compact ? 'flex-start' : 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'rgba(194,94,74,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg width={15} height={15} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke={T.accent} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div style={{ minWidth: 0 }}>
          <p
            style={{
              fontFamily: F,
              fontSize: compact ? 14 : 15,
              fontWeight: 600,
              color: T.ink,
              margin: 0,
            }}
          >
            {bannerState.title}
          </p>
          <p
            style={{
              fontFamily: F,
              fontSize: compact ? 12 : 13,
              lineHeight: 1.55,
              color: T.muted,
              margin: '4px 0 0',
            }}
          >
            {bannerState.description}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => navigate('/provider/profile/payouts')}
        style={{
          border: `1px solid ${T.line}`,
          background: '#FFFFFF',
          color: T.ink,
          borderRadius: 999,
          padding: compact ? '10px 14px' : '11px 16px',
          fontFamily: F,
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        Open Payouts
      </button>
    </div>
  );
}
