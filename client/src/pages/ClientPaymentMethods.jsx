import { useEffect, useState, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { request } from '../data/apiClient';
import { useIsDesktop } from '../hooks/useIsDesktop';
import SettingsPageLayout from '../components/ui/SettingsPageLayout';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const T = {
  ink: '#3D231E', muted: '#8C6A64', faded: '#B0948F', accent: '#C25E4A',
  line: 'rgba(140,106,100,0.18)', card: '#FFFFFF', avatarBg: '#F2EBE5',
  base: '#FBF7F2', hero: '#FDDCC6', danger: '#B04040',
};
const F = "'Sora',system-ui,sans-serif";

const Lbl = ({ children, style = {} }) => (
  <span style={{ display: 'block', fontSize: 11, fontWeight: 500, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, ...style }}>
    {children}
  </span>
);

function BrandBadge({ brand }) {
  const label = (brand || '').toUpperCase().slice(0, 4);
  return (
    <div style={{ width: 40, height: 28, borderRadius: 6, background: T.avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: T.muted, flexShrink: 0 }}>
      {label || '••'}
    </div>
  );
}

// ─── Add Card Form (inside Elements context) ──────────────────────────────────

function AddCardForm({ onSuccess, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!stripe || !elements) return;
    setError(null);
    setSaving(true);

    try {
      // 1. Create SetupIntent on server
      const { clientSecret } = await request('/payments/setup-intent', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      // 2. Confirm card setup with Stripe
      const cardElement = elements.getElement(CardElement);
      const { error: stripeErr, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: { card: cardElement },
      });

      if (stripeErr) {
        setError(stripeErr.message);
        return;
      }

      if (setupIntent.status === 'succeeded') {
        onSuccess();
      }
    } catch (err) {
      setError(err.message || 'Failed to save card.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ marginTop: 24, padding: 20, background: T.card, borderRadius: 14, border: `1px solid ${T.line}` }}>
      <Lbl style={{ marginBottom: 14 }}>Card details</Lbl>

      <div style={{
        padding: '14px 16px', borderRadius: 10,
        border: `1px solid ${T.line}`, background: T.avatarBg,
        marginBottom: 14,
      }}>
        <CardElement
          options={{
            style: {
              base: {
                fontFamily: "'Sora', system-ui, sans-serif",
                fontSize: '14px',
                color: T.ink,
                '::placeholder': { color: T.faded },
              },
              invalid: { color: T.danger },
            },
            hidePostalCode: false,
          }}
        />
      </div>

      {error && (
        <p style={{ fontFamily: F, fontSize: 13, color: T.danger, margin: '0 0 12px' }}>{error}</p>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={handleSubmit}
          disabled={saving || !stripe}
          style={{
            flex: 1, padding: '12px 0', borderRadius: 10, border: 'none',
            background: saving ? T.faded : T.ink, color: '#fff',
            fontFamily: F, fontSize: 14, fontWeight: 500,
            cursor: saving ? 'default' : 'pointer',
          }}
        >
          {saving ? 'Saving…' : 'Save Card'}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          style={{
            padding: '12px 18px', borderRadius: 10,
            border: `1px solid ${T.line}`, background: 'transparent',
            fontFamily: F, fontSize: 14, color: T.muted, cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>

      <p style={{ fontFamily: F, fontSize: 11, color: T.faded, margin: '12px 0 0', textAlign: 'center', lineHeight: 1.5 }}>
        Your card is securely stored by Stripe. Kliques never sees your full card number.
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientPaymentMethods() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const isDesktop = useIsDesktop();

  const loadCards = useCallback(() => {
    setLoading(true);
    request('/payments/methods')
      .then((data) => setCards(data?.paymentMethods || []))
      .catch(() => setCards([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadCards(); }, [loadCards]);

  const handleRemove = async (pmId) => {
    setRemoving(pmId);
    try {
      await request(`/client/payment-methods/${pmId}`, { method: 'DELETE' });
      setCards((prev) => prev.filter((c) => c.id !== pmId));
    } catch (err) {
      console.error('[ClientPaymentMethods] remove error:', err);
    } finally {
      setRemoving(null);
    }
  };

  const handleCardAdded = () => {
    setShowAdd(false);
    loadCards();
  };

  return (
    <SettingsPageLayout title="Payment Methods">
      <Lbl>Saved Cards</Lbl>

      {loading ? (
        <div style={{ display: 'flex', flexWrap: isDesktop ? 'wrap' : undefined, gap: 12 }}>
          {[0, 1].map((i) => (
            <div key={i} style={{ height: 72, borderRadius: 14, background: 'rgba(140,106,100,0.08)', flex: isDesktop ? '1 1 200px' : undefined, animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <p style={{ fontSize: 14, color: T.muted, marginBottom: 20 }}>No saved cards yet.</p>
      ) : (
        <div style={{ display: isDesktop ? 'flex' : 'block', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
          {cards.map((card) => (
            <div
              key={card.id}
              style={{
                padding: 18, background: T.card, borderRadius: 14,
                border: `1px solid ${T.line}`, display: 'flex',
                justifyContent: 'space-between', alignItems: 'center',
                flex: isDesktop ? '1 1 220px' : undefined,
                marginBottom: isDesktop ? 0 : 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <BrandBadge brand={card.brand} />
                <div>
                  <p style={{ fontFamily: F, fontSize: 14, color: T.ink, margin: 0 }}>
                    {card.brand ? card.brand.charAt(0).toUpperCase() + card.brand.slice(1) : 'Card'} ••••{card.last4}
                  </p>
                  <p style={{ fontFamily: F, fontSize: 12, color: T.faded, margin: '2px 0 0' }}>
                    Expires {card.expMonth?.toString().padStart(2, '0')}/{card.expYear?.toString().slice(-2)}
                  </p>
                </div>
              </div>

              {card.isDefault ? (
                <div style={{ padding: '4px 10px', borderRadius: 9999, background: T.hero }}>
                  <span style={{ fontSize: 9, fontWeight: 600, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Default</span>
                </div>
              ) : (
                <button
                  onClick={() => handleRemove(card.id)}
                  disabled={removing === card.id}
                  style={{ fontFamily: F, fontSize: 12, color: T.faded, background: 'none', border: 'none', cursor: removing === card.id ? 'default' : 'pointer' }}
                >
                  {removing === card.id ? 'Removing…' : 'Remove'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add new card */}
      {!showAdd && (
        <button
          onClick={() => setShowAdd(true)}
          style={{
            width: '100%', padding: 16, borderRadius: 14,
            border: `1px dashed ${T.line}`, fontFamily: F,
            fontSize: 13, fontWeight: 500, color: T.accent,
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 6, background: 'transparent',
            marginTop: 4,
          }}
        >
          <svg width="14" height="14" fill="none" stroke={T.accent} strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Add New Card
        </button>
      )}

      {showAdd && (
        <Elements stripe={stripePromise}>
          <AddCardForm onSuccess={handleCardAdded} onCancel={() => setShowAdd(false)} />
        </Elements>
      )}

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </SettingsPageLayout>
  );
}
