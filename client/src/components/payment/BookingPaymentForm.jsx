/**
 * BookingPaymentForm — shared Stripe payment form used by both
 * PublicBookingPage (/book/:handle) and BookingFlowPage (/app/book).
 *
 * Handles all 3 provider payment types:
 *   save_card — SetupIntent (new card) or return saved pm_id (saved card)
 *   deposit   — PaymentIntent for deposit amount, card saved for later
 *   full      — PaymentIntent for full amount
 *
 * If the client is logged in and has saved cards, shows a saved-card picker
 * above the card entry fields. Selecting a saved card:
 *   - save_card service → returns the pm_id directly (no charge)
 *   - full/deposit service → charges via POST /charge (off-session)
 *
 * Props:
 *   service        — service object with payment_type, deposit_type, deposit_value, base_price
 *   provider       — provider object with user_id / id
 *   session        — Supabase session
 *   onSuccess(data)— called with payment metadata once Stripe confirms
 *   onError(msg)   — called with error string
 *   submitLabel    — override the button label (optional)
 *   renderFooter   — render prop for the submit button area (optional)
 */
import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
    Elements,
    CardNumberElement,
    CardExpiryElement,
    CardCvcElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';
import { request } from '../../data/apiClient';
import { formatMoney } from '../../utils/formatMoney';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const T = {
    ink: '#3D231E', muted: '#8C6A64', faded: '#B0948F',
    accent: '#C25E4A', line: 'rgba(140,106,100,0.18)',
    abg: '#F2EBE5', base: '#FBF7F2',
    danger: '#B04040', dangerBg: '#FDEDEA',
    success: '#5A8A5E', successBg: '#EBF2EC',
    callout: '#FFF5E6', calloutText: '#92400E',
};
const F = "'Sora',system-ui,sans-serif";
const PLATFORM_FEE_RATE = 0.10;

const BRAND_LABELS = { visa: 'Visa', mastercard: 'Mastercard', amex: 'Amex', discover: 'Discover' };

const elementStyle = {
    style: {
        base: {
            fontSize: '15px',
            color: T.ink,
            fontFamily: F,
            '::placeholder': { color: T.faded },
        },
        invalid: { color: T.danger },
    },
};

function fieldStyle(extra = {}) {
    return {
        padding: '13px 16px',
        borderRadius: 12,
        border: `1px solid ${T.line}`,
        background: T.abg,
        ...extra,
    };
}

function labelStyle() {
    return {
        fontFamily: F, fontSize: 11, fontWeight: 500,
        letterSpacing: '0.05em', textTransform: 'uppercase',
        color: T.muted, display: 'block', marginBottom: 6,
    };
}

/** Compute deposit amount in cents from service */
export function computeDepositCents(service) {
    const priceCents = Math.round(Number(service?.base_price) || 0);
    const dt = service?.deposit_type;
    const dv = Number(service?.deposit_value) || 0;
    if (dt === 'percent') return Math.round(priceCents * dv / 100);
    if (dt === 'fixed') return Math.round(dv * 100);
    return Math.round(priceCents * 0.3); // fallback 30%
}

/** Format cents as dollar string */
export function fmtCents(cents, currency = 'cad') {
    return formatMoney(cents ?? 0, currency);
}

function CardBrandIcon({ brand }) {
    // Simple text brand badge — good enough without pulling in card brand images
    const label = BRAND_LABELS[brand?.toLowerCase()] || (brand ? brand.charAt(0).toUpperCase() + brand.slice(1) : '••');
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: T.abg, borderRadius: 6, padding: '2px 7px',
            fontSize: 11, fontWeight: 600, color: T.muted, letterSpacing: '0.03em',
            border: `1px solid ${T.line}`, flexShrink: 0,
        }}>
            {label}
        </span>
    );
}

function SavedCardPicker({ savedCards, selectedId, onSelect, onUseNew }) {
    return (
        <div style={{ marginBottom: 20 }}>
            <span style={labelStyle()}>Saved cards</span>
            {savedCards.map(card => {
                const isSelected = selectedId === card.id;
                return (
                    <button
                        key={card.id}
                        type="button"
                        onClick={() => onSelect(card.id)}
                        style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                            padding: '12px 14px', borderRadius: 12, marginBottom: 8,
                            border: `1.5px solid ${isSelected ? T.accent : T.line}`,
                            background: isSelected ? '#FFF5EE' : T.abg,
                            cursor: 'pointer', textAlign: 'left',
                        }}
                    >
                        {/* Selection dot */}
                        <span style={{
                            width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                            border: `2px solid ${isSelected ? T.accent : T.faded}`,
                            background: isSelected ? T.accent : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            {isSelected && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                        </span>
                        <CardBrandIcon brand={card.brand} />
                        <span style={{ fontFamily: F, fontSize: 14, color: T.ink, flex: 1 }}>
                            •••• {card.last4}
                        </span>
                        <span style={{ fontFamily: F, fontSize: 12, color: T.faded }}>
                            {card.expMonth}/{String(card.expYear).slice(-2)}
                        </span>
                        {card.isDefault && (
                            <span style={{
                                fontSize: 10, fontWeight: 600, color: T.success,
                                background: T.successBg, padding: '2px 7px', borderRadius: 9999,
                                letterSpacing: '0.04em', textTransform: 'uppercase',
                            }}>Default</span>
                        )}
                    </button>
                );
            })}
            <button
                type="button"
                onClick={onUseNew}
                style={{
                    width: '100%', padding: '10px 14px', borderRadius: 12,
                    border: `1px dashed ${T.line}`, background: 'transparent',
                    fontFamily: F, fontSize: 13, color: T.muted, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
            >
                <svg width="14" height="14" fill="none" stroke={T.muted} strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
                Use a different card
            </button>
        </div>
    );
}

function InnerForm({ service, provider, session, onSuccess, onError, submitLabel, renderFooter, onProcessingChange }) {
    const stripe = useStripe();
    const elements = useElements();
    const [processing, setProcessing] = useState(false);

    useEffect(() => { onProcessingChange?.(processing); }, [processing, onProcessingChange]);
    const [cardError, setCardError] = useState(null);
    const [cardholderName, setCardholderName] = useState(
        session?.user?.user_metadata?.full_name || ''
    );

    // Saved cards
    const [savedCards, setSavedCards] = useState([]);
    const [cardsLoading, setCardsLoading] = useState(false);
    const [selectedSavedId, setSelectedSavedId] = useState(null); // null = use new card entry
    const [showNewCard, setShowNewCard] = useState(false); // user explicitly chose "use different card"

    const paymentType = service?.payment_type || 'full';
    const priceCents = Math.round(Number(service?.base_price) || 0);
    const depositCents = paymentType === 'deposit' ? computeDepositCents(service) : 0;
    const amountCents = paymentType === 'full' ? priceCents : depositCents;
    const platformFeeCents = Math.round(amountCents * PLATFORM_FEE_RATE);
    const totalChargeCents = amountCents + platformFeeCents;
    const remainingCents = priceCents - depositCents;

    // Load saved cards if logged in
    useEffect(() => {
        if (!session) return;
        setCardsLoading(true);
        request('/payments/methods')
            .then(data => {
                const cards = data?.paymentMethods || [];
                setSavedCards(cards);
                // Auto-select the default card, or the first one
                if (cards.length > 0) {
                    const def = cards.find(c => c.isDefault) || cards[0];
                    setSelectedSavedId(def.id);
                }
            })
            .catch(() => {}) // silently ignore — fall through to new card entry
            .finally(() => setCardsLoading(false));
    }, [session]);

    const usingNewCard = savedCards.length === 0 || showNewCard || selectedSavedId === null;

    const btnLabel = submitLabel || {
        save_card: 'Save Card & Continue',
        deposit: `Pay ${fmtCents(totalChargeCents, service?.currency)} deposit`,
        full: `Pay ${fmtCents(totalChargeCents, service?.currency)}`,
    }[paymentType] || 'Continue';

    const handleSubmit = async () => {
        if (processing) return;
        if (!usingNewCard && !stripe) return; // stripe still initialising
        if (usingNewCard && (!stripe || !elements)) return;
        setProcessing(true);
        setCardError(null);
        let succeeded = false;
        try {
            // ── Path A: client has a saved card selected ──────────────────────
            if (!usingNewCard && selectedSavedId) {
                const providerId = provider?.user_id || provider?.id;
                console.log('[PaymentForm] Path A: saved card', { paymentType, providerId, totalChargeCents, selectedSavedId });

                if (paymentType === 'save_card') {
                    // No charge — just return the saved pm so the booking records it
                    succeeded = true;
                    onSuccess({
                        payment_type: 'save_card',
                        stripe_payment_method_id: selectedSavedId,
                    });
                    return;
                }

                // full or deposit — charge via /api/charge (off-session)
                console.log('[PaymentForm] Calling /charge...');
                const data = await request('/charge', {
                    method: 'POST',
                    body: JSON.stringify({
                        amount: totalChargeCents,
                        paymentMethodId: selectedSavedId,
                        providerId,
                    }),
                });
                console.log('[PaymentForm] /charge response:', data);
                succeeded = true;
                onSuccess({
                    payment_type: paymentType,
                    stripe_payment_intent_id: data.chargeId,
                    stripe_payment_method_id: selectedSavedId,
                    deposit_paid_cents: paymentType === 'deposit' ? amountCents : 0,
                });
                return;
            }

            // ── Path B: new card entry via Stripe Elements ─────────────────────
            const email = session?.user?.email || '';
            const name = cardholderName || email;

            if (paymentType === 'save_card') {
                const { clientSecret } = await request('/payments/setup-intent', {
                    method: 'POST',
                    body: JSON.stringify({ email, name }),
                });
                const { error, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
                    payment_method: {
                        card: elements.getElement(CardNumberElement),
                        billing_details: { name, email },
                    },
                });
                if (error) { setCardError(error.message); return; }
                succeeded = true;
                onSuccess({
                    payment_type: 'save_card',
                    stripe_setup_intent_id: setupIntent.id,
                    stripe_payment_method_id: setupIntent.payment_method,
                });
            } else {
                const providerId = provider?.user_id || provider?.id;
                const { clientSecret } = await request('/payments/payment-intent', {
                    method: 'POST',
                    body: JSON.stringify({
                        serviceId: service?.id,
                        providerId,
                        amountCents,
                        email,
                        name,
                        isDeposit: paymentType === 'deposit',
                    }),
                });
                const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
                    payment_method: {
                        card: elements.getElement(CardNumberElement),
                        billing_details: { name, email },
                    },
                });
                if (error) { setCardError(error.message); return; }
                succeeded = true;
                onSuccess({
                    payment_type: paymentType,
                    stripe_payment_intent_id: paymentIntent.id,
                    stripe_payment_method_id: typeof paymentIntent.payment_method === 'string'
                        ? paymentIntent.payment_method
                        : paymentIntent.payment_method?.id,
                    deposit_paid_cents: paymentType === 'deposit' ? amountCents : 0,
                });
            }
        } catch (err) {
            console.error('[PaymentForm] handleSubmit error:', err);
            const msg = err.message || 'Payment failed. Please try again.';
            setCardError(msg);
            onError?.(msg);
        } finally {
            // Only reset processing on failure — on success the parent takes over
            // and resetting here would cause the pay button to briefly re-appear
            if (!succeeded) setProcessing(false);
        }
    };

    return (
        <div style={{ fontFamily: F }}>
            {/* Fee breakdown for deposit/full */}
            {paymentType !== 'save_card' && (
                <div style={{ background: T.abg, borderRadius: 14, padding: '16px 20px', marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                        <span style={{ fontSize: 14, color: T.muted }}>
                            {paymentType === 'deposit' ? 'Deposit' : service?.name || 'Service'}
                        </span>
                        <span style={{ fontSize: 14, color: T.ink }}>{fmtCents(amountCents, service?.currency)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span style={{ fontSize: 14, color: T.muted }}>Booking fee (10%)</span>
                        <span style={{ fontSize: 14, color: T.muted }}>{fmtCents(platformFeeCents, service?.currency)}</span>
                    </div>
                    <div style={{ height: 1, background: T.line, marginBottom: 12 }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 15, fontWeight: 600, color: T.ink }}>Total charged</span>
                        <span style={{ fontSize: 15, fontWeight: 600, color: T.accent }}>{fmtCents(totalChargeCents, service?.currency)}</span>
                    </div>
                    {paymentType === 'deposit' && remainingCents > 0 && (
                        <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.line}`, display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 13, color: T.faded }}>Remaining after session</span>
                            <span style={{ fontSize: 13, color: T.faded }}>{fmtCents(remainingCents, service?.currency)}</span>
                        </div>
                    )}
                </div>
            )}

            {/* save_card callout */}
            {paymentType === 'save_card' && (
                <div style={{ background: T.callout, borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 10 }}>
                    <svg width="16" height="16" fill="none" stroke={T.calloutText} strokeWidth="1.5" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 2 }}>
                        <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" strokeLinecap="round" />
                    </svg>
                    <p style={{ fontSize: 13, color: T.calloutText, margin: 0, lineHeight: 1.6 }}>
                        Your card is saved securely. <strong>No charge is made now.</strong> Your provider will charge it after your session.
                    </p>
                </div>
            )}

            {/* Saved card picker (logged-in clients only) */}
            {!cardsLoading && savedCards.length > 0 && (
                <>
                    <SavedCardPicker
                        savedCards={savedCards}
                        selectedId={showNewCard ? null : selectedSavedId}
                        onSelect={(id) => { setSelectedSavedId(id); setShowNewCard(false); setCardError(null); }}
                        onUseNew={() => { setShowNewCard(true); setSelectedSavedId(null); setCardError(null); }}
                    />
                    {/* Divider + label when showing new card entry below */}
                    {showNewCard && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                            <div style={{ flex: 1, height: 1, background: T.line }} />
                            <span style={{ fontSize: 11, color: T.faded, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>New card</span>
                            <div style={{ flex: 1, height: 1, background: T.line }} />
                        </div>
                    )}
                </>
            )}

            {/* New card entry fields — shown when no saved cards, or user chose "use different card" */}
            {usingNewCard && (
                <>
                    {/* Cardholder name */}
                    <div style={{ marginBottom: 14 }}>
                        <span style={labelStyle()}>Name on card</span>
                        <input
                            value={cardholderName}
                            onChange={e => setCardholderName(e.target.value)}
                            placeholder="Full name"
                            style={{
                                width: '100%', padding: '13px 16px', borderRadius: 12,
                                border: `1px solid ${T.line}`, fontFamily: F, fontSize: 14,
                                color: T.ink, outline: 'none', background: T.abg,
                                boxSizing: 'border-box',
                            }}
                        />
                    </div>

                    {/* Card number */}
                    <div style={{ marginBottom: 14 }}>
                        <span style={labelStyle()}>Card number</span>
                        <div style={fieldStyle()}>
                            <CardNumberElement options={elementStyle} />
                        </div>
                    </div>

                    {/* Expiry + CVC */}
                    <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                        <div style={{ flex: 1 }}>
                            <span style={labelStyle()}>Expiry</span>
                            <div style={fieldStyle()}>
                                <CardExpiryElement options={elementStyle} />
                            </div>
                        </div>
                        <div style={{ flex: 1 }}>
                            <span style={labelStyle()}>CVC</span>
                            <div style={fieldStyle()}>
                                <CardCvcElement options={elementStyle} />
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Card error */}
            {cardError && (
                <div style={{ background: T.dangerBg, borderRadius: 12, padding: '12px 16px', marginBottom: 14 }}>
                    <p style={{ fontSize: 13, color: T.danger, margin: 0 }}>{cardError}</p>
                </div>
            )}

            {/* Security note */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <svg width="13" height="13" fill="none" stroke={T.faded} strokeWidth="1.5" viewBox="0 0 24 24">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" />
                </svg>
                <span style={{ fontSize: 12, color: T.faded }}>Secured by Stripe. We never store your card details.</span>
            </div>

            {/* Submit — use renderFooter if provided, otherwise inline */}
            {renderFooter ? renderFooter({ handleSubmit, processing, btnLabel, stripe }) : (
                <button
                    onClick={handleSubmit}
                    disabled={processing || !stripe}
                    style={{
                        width: '100%', padding: '15px 24px', borderRadius: 12, border: 'none',
                        background: (processing || !stripe) ? T.faded : T.ink,
                        color: '#fff', fontFamily: F, fontSize: 15, fontWeight: 500,
                        cursor: (processing || !stripe) ? 'default' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        marginTop: 16,
                    }}
                >
                    {processing && (
                        <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', animation: 'spin 0.8s linear infinite', display: 'inline-block', flexShrink: 0 }} />
                    )}
                    {processing ? 'Processing…' : btnLabel}
                </button>
            )}
        </div>
    );
}

export default function BookingPaymentForm(props) {
    return (
        <Elements stripe={stripePromise}>
            <InnerForm {...props} />
        </Elements>
    );
}
