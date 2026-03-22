import { useEffect, useState } from 'react';
import { request } from '../data/apiClient';
import SettingsPageLayout from '../components/ui/SettingsPageLayout';

const T = {
  ink: '#3D231E', muted: '#8C6A64', faded: '#B0948F', accent: '#C25E4A',
  line: 'rgba(140,106,100,0.18)', card: '#FFFFFF', avatarBg: '#F2EBE5',
  base: '#FBF7F2', hero: '#FDDCC6',
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

export default function ClientPaymentMethods() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    request('/client/payment-methods')
      .then((data) => setCards(data?.payment_methods || []))
      .catch(() => setCards([]))
      .finally(() => setLoading(false));
  }, []);

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

  return (
    <SettingsPageLayout title="Payment Methods">
        <Lbl>Saved Cards</Lbl>

        {loading ? (
          <>
            {[0, 1].map((i) => (
              <div key={i} style={{ height: 72, borderRadius: 14, background: 'rgba(140,106,100,0.08)', marginBottom: 12, animation: 'pulse 1.5s infinite' }} />
            ))}
          </>
        ) : cards.length === 0 ? (
          <p style={{ fontSize: 14, color: T.muted, marginBottom: 20 }}>No saved cards yet.</p>
        ) : (
          cards.map((card, i) => (
            <div
              key={card.id}
              style={{
                padding: 18, background: T.card, borderRadius: 14,
                border: `1px solid ${T.line}`, display: 'flex',
                justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <BrandBadge brand={card.brand} />
                <div>
                  <p style={{ fontFamily: F, fontSize: 14, color: T.ink, margin: 0 }}>
                    {card.brand ? card.brand.charAt(0).toUpperCase() + card.brand.slice(1) : 'Card'} ••••{card.last4}
                  </p>
                  <p style={{ fontFamily: F, fontSize: 12, color: T.faded, margin: '2px 0 0' }}>
                    Expires {card.exp_month?.toString().padStart(2, '0')}/{card.exp_year?.toString().slice(-2)}
                  </p>
                </div>
              </div>

              {card.is_default ? (
                <div style={{ padding: '4px 10px', borderRadius: 9999, background: T.hero }}>
                  <span style={{ fontSize: 9, fontWeight: 600, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Default</span>
                </div>
              ) : (
                <button
                  onClick={() => handleRemove(card.id)}
                  disabled={removing === card.id}
                  style={{ fontFamily: F, fontSize: 12, color: removing === card.id ? T.faded : T.faded, background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {removing === card.id ? 'Removing…' : 'Remove'}
                </button>
              )}
            </div>
          ))
        )}

        {/* Add new card */}
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

        {showAdd && (
          <div style={{ marginTop: 24, padding: 20, background: T.card, borderRadius: 14, border: `1px solid ${T.line}` }}>
            <p style={{ fontFamily: F, fontSize: 14, color: T.muted, textAlign: 'center', margin: 0 }}>
              Stripe card form will render here once Stripe Elements is initialised.
            </p>
            <button
              onClick={() => setShowAdd(false)}
              style={{ marginTop: 16, width: '100%', padding: '12px', borderRadius: 12, border: `1px solid ${T.line}`, background: 'transparent', fontFamily: F, fontSize: 14, color: T.ink, cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        )}
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </SettingsPageLayout>
  );
}
