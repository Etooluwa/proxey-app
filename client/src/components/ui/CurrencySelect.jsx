/**
 * CurrencySelect — dropdown for selecting provider currency
 *
 * Props:
 *   value     — currency code, e.g. "cad"
 *   onChange  — called with lowercase currency code string
 *   style     — optional container style override
 */

const T = {
    ink: '#3D231E',
    muted: '#8C6A64',
    faded: '#B0948F',
    line: 'rgba(140,106,100,0.18)',
    avatarBg: '#F2EBE5',
    accent: '#C25E4A',
};
const F = "'Sora',system-ui,sans-serif";

// Only currencies with full Stripe Connect payout support.
// Removed: NGN, GHS, KES (no Connect payout support), TTD, JMD (not in Stripe Connect).
export const CURRENCIES = [
    { code: 'cad', label: 'CAD', name: 'Canadian Dollar',    symbol: '$' },
    { code: 'usd', label: 'USD', name: 'US Dollar',          symbol: '$' },
    { code: 'gbp', label: 'GBP', name: 'British Pound',      symbol: '£' },
    { code: 'eur', label: 'EUR', name: 'Euro',               symbol: '€' },
    { code: 'aud', label: 'AUD', name: 'Australian Dollar',  symbol: '$' },
    { code: 'nzd', label: 'NZD', name: 'New Zealand Dollar', symbol: '$' },
    { code: 'sgd', label: 'SGD', name: 'Singapore Dollar',   symbol: '$' },
    { code: 'inr', label: 'INR', name: 'Indian Rupee',       symbol: '₹' },
    { code: 'zar', label: 'ZAR', name: 'South African Rand', symbol: 'R' },
    { code: 'aed', label: 'AED', name: 'UAE Dirham',         symbol: 'د.إ' },
    { code: 'jpy', label: 'JPY', name: 'Japanese Yen',       symbol: '¥' },
    { code: 'brl', label: 'BRL', name: 'Brazilian Real',     symbol: 'R$' },
    { code: 'mxn', label: 'MXN', name: 'Mexican Peso',       symbol: '$' },
];

export default function CurrencySelect({ value = 'cad', onChange, style = {} }) {
    const selected = CURRENCIES.find(c => c.code === value) || CURRENCIES[0];

    return (
        <div style={{ position: 'relative', ...style }}>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                style={{
                    width: '100%',
                    padding: '14px 40px 14px 16px',
                    borderRadius: 12,
                    border: `1px solid ${T.line}`,
                    fontFamily: F,
                    fontSize: 14,
                    color: T.ink,
                    background: T.avatarBg,
                    outline: 'none',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    cursor: 'pointer',
                    boxSizing: 'border-box',
                }}
            >
                {CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>
                        {c.label} — {c.name} ({c.symbol})
                    </option>
                ))}
            </select>
            {/* Chevron icon */}
            <svg
                width="12" height="12" viewBox="0 0 24 24"
                fill="none" stroke={T.faded} strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            >
                <path d="M6 9l6 6 6-6" />
            </svg>
        </div>
    );
}
