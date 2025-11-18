# Payment Setup Quick Start

## What You Need to Do (High-Level)

### For Clients (Save Cards)
1. ✅ Client enters card during onboarding Step 3
2. ✅ Card saved to Stripe (not stored on your server)
3. ✅ Use saved card for future bookings (no re-entry)

### For Providers (Bank Account)
1. ✅ Provider connects bank account during onboarding Step 5
2. ✅ After booking is paid, you transfer 80% to provider
3. ✅ Provider receives payout (1-2 business days)

---

## Implementation Order

### Phase 1: Setup (1-2 hours)
1. Get Stripe API keys
2. Set up Stripe webhook endpoint
3. Add environment variables

### Phase 2: Client Payments (2-3 hours)
1. Add server endpoint: `POST /api/client/setup-intent`
2. Add server endpoint: `POST /api/client/payment-methods`
3. Add server endpoint: `DELETE /api/client/payment-methods/:id`
4. Create `PaymentMethodForm.jsx` component
5. Update `OnboardingPage.jsx` Step 3 to show form
6. Test saving a card

### Phase 3: Provider Payouts (2-3 hours)
1. Add server endpoint: `POST /api/provider/connected-account`
2. Add server endpoint: `POST /api/provider/onboarding-link`
3. Add server endpoint: `GET /api/provider/account/:accountId`
4. Update checkout endpoint to include provider's Stripe account
5. Add `POST /api/charge` endpoint for existing payment methods
6. Update `ProviderOnboardingPage.jsx` Step 5 to link account
7. Test provider bank connection

### Phase 4: Connect It Together (1-2 hours)
1. Update `BookingConfirmPage.jsx` to show saved cards
2. Test paying with saved card
3. Verify transfers to provider account
4. Test payout timing

---

## Key Files to Modify

| File | What to Add |
|------|-----------|
| `server/server.js` | 8 new endpoints for payment handling |
| `client/src/pages/OnboardingPage.jsx` | Payment method form in Step 3 |
| `client/src/pages/ProviderOnboardingPage.jsx` | Stripe Connect link in Step 5 |
| `client/src/pages/BookingConfirmPage.jsx` | Show saved cards + charge endpoint |
| `client/src/components/PaymentMethodForm.jsx` | **NEW** - Card input form |
| `server/.env` | STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET |
| `client/.env` | REACT_APP_STRIPE_PUBLISHABLE_KEY |

---

## Stripe Setup Steps

1. **Get API Keys**
   - Go to stripe.com/dashboard
   - Navigate to Developers > API keys
   - Copy `pk_test_*` (publishable) and `sk_test_*` (secret)

2. **Set Up Webhook**
   - Go to Developers > Webhooks
   - Click "Add endpoint"
   - URL: `https://yourdomain.com/webhook` (or `http://localhost:3001/webhook` for local)
   - Events: `charge.succeeded` (for transfers)
   - Copy webhook secret (`whsec_*`)

3. **Add Environment Variables**
   - `server/.env`: Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`
   - `client/.env`: Add `REACT_APP_STRIPE_PUBLISHABLE_KEY`

---

## Testing with Stripe Sandbox

### Card Numbers
- **Success**: `4242 4242 4242 4242`
- **Declined**: `4000 0000 0000 0002`
- **Requires 3D Secure**: `4000 0025 0000 3155`

### Expiry/CVV
- Any future date (e.g., 12/25)
- Any 3-digit CVC

---

## API Endpoints Summary

### Client Endpoints
- `POST /api/client/setup-intent` - Create payment method
- `POST /api/client/payment-methods` - List saved cards
- `DELETE /api/client/payment-methods/:id` - Remove card

### Provider Endpoints
- `POST /api/provider/connected-account` - Create Stripe account
- `POST /api/provider/onboarding-link` - Get bank link
- `GET /api/provider/account/:id` - Check account status

### Payment Processing
- `POST /api/checkout-session` - Create Stripe Checkout (new card)
- `POST /api/charge` - Charge existing payment method
- `POST /webhook` - Handle payment confirmations & transfers

---

## Data Flow Diagrams

### Client Booking Flow
```
Client fills profile (Step 3)
    ↓
POST /api/client/setup-intent
    ↓
Client enters card in PaymentMethodForm
    ↓
SetupIntent confirmed
    ↓
Card saved to Stripe (not your server)
    ↓
Later: Client books service
    ↓
POST /api/charge (with saved card)
    ↓
Payment confirmed
```

### Provider Payout Flow
```
Provider completes profile (Step 5)
    ↓
POST /api/provider/connected-account
    ↓
POST /api/provider/onboarding-link
    ↓
Opens Stripe Connect form
    ↓
Provider enters bank info
    ↓
Stripe verifies bank account
    ↓
Client books service & pays
    ↓
POST /webhook (charge.succeeded)
    ↓
POST /api/transfers (80% to provider)
    ↓
Payout to provider bank (1-2 days)
```

---

## Common Issues & Solutions

| Issue | Cause | Fix |
|-------|-------|-----|
| "publishable key not set" | Missing client .env | Add `REACT_APP_STRIPE_PUBLISHABLE_KEY` |
| Card form not rendering | Stripe script not loaded | Ensure `@stripe/react-stripe-js` is installed |
| Payment fails | Wrong customer ID | Verify `stripeCustomerId` saved in profile |
| No payout | Wrong account ID | Check `stripeAccountId` in metadata |
| Webhook not triggering | Wrong URL or secret | Test with `stripe listen --forward-to` |

---

## Next Steps After Implementation

1. **Refunds**: Add `DELETE /api/refunds/:chargeId`
2. **Payouts Schedule**: Configure in Stripe Dashboard (automatic)
3. **Dispute Handling**: Monitor Stripe Dashboard
4. **Invoice Generation**: Create PDF invoices after payment
5. **Payment History**: Show clients their past charges
6. **Provider Earnings**: Show providers their transfer history
7. **Taxes**: Track fees for tax reporting

---

## Cost Breakdown

- Stripe processing: 2.9% + $0.30 per transaction
- You get: 20% (configurable)
- Provider gets: 80% (configurable)
- Example: $100 booking
  - Stripe takes: $3.19
  - You keep: $19.36
  - Provider gets: $77.45
