const T = {
  ink: '#3D231E',
  muted: '#8C6A64',
  faded: '#B0948F',
  accent: '#C25E4A',
  line: 'rgba(140,106,100,0.18)',
  card: '#FFFFFF',
  hero: '#FDDCC6',
  avatarBg: '#F2EBE5',
};

const F = "'Sora', system-ui, sans-serif";

function BrandBadge({ brand }) {
  const label = (brand || '').toUpperCase().slice(0, 4);
  return (
    <div style={{
      width: 40,
      height: 28,
      borderRadius: 6,
      background: T.avatarBg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 10,
      fontWeight: 600,
      color: T.muted,
      flexShrink: 0,
    }}>
      {label || '••'}
    </div>
  );
}

export default function SavedPaymentMethodList({
  paymentMethods = [],
  selectedPaymentMethodId,
  onSelect,
  title = 'Pay with',
  marginBottom = 12,
}) {
  if (!paymentMethods.length) return null;

  return (
    <div style={{ width: '100%', marginBottom }}>
      <p style={{
        fontFamily: F,
        fontSize: 11,
        fontWeight: 600,
        color: T.muted,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        margin: '0 0 10px',
      }}>
        {title}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {paymentMethods.map((method) => {
          const isSelected = selectedPaymentMethodId === method.id;
          return (
            <button
              key={method.id}
              type="button"
              onClick={() => onSelect?.(method.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px',
                borderRadius: 14,
                textAlign: 'left',
                background: isSelected ? '#FFF4EB' : T.card,
                border: isSelected ? `1.5px solid ${T.accent}` : `1px solid ${T.line}`,
                boxShadow: isSelected ? '0 6px 18px rgba(194,94,74,0.10)' : 'none',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: isSelected ? T.accent : 'transparent',
                  border: isSelected ? 'none' : '2px solid #D5C5BE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {isSelected && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
              </div>

              <BrandBadge brand={method.brand} />

              <div style={{ minWidth: 0 }}>
                <p style={{
                  margin: 0,
                  fontFamily: F,
                  fontSize: 14,
                  fontWeight: 600,
                  color: T.ink,
                }}>
                  {(method.brand ? method.brand.charAt(0).toUpperCase() + method.brand.slice(1) : 'Card')} ••••{method.last4}
                </p>
                <p style={{
                  margin: '3px 0 0',
                  fontFamily: F,
                  fontSize: 12,
                  color: T.faded,
                }}>
                  Expires {String(method.expMonth).padStart(2, '0')}/{String(method.expYear).slice(-2)}
                </p>
              </div>

              {method.isDefault && (
                <div style={{
                  marginLeft: 'auto',
                  padding: '5px 9px',
                  borderRadius: 9999,
                  background: T.hero,
                  color: T.accent,
                  fontFamily: F,
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  Default
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
