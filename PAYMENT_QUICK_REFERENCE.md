# Payment System Quick Reference

## Key Files Overview

### Payment Core (Backend)
- `server/server.js` (1100+ lines) - All payment endpoints and webhook logic
  - Lines 263-332: Checkout session creation
  - Lines 527-577: Payment creation for bookings
  - Lines 891-928: Webhook handler
  - Lines 930-1018: Booking status updates

### Payment Integration (Frontend)
- `client/src/utils/stripe.js` - Stripe checkout initiation
- `client/src/pages/BookingCheckoutPage.js` - Demo payment page
- `client/src/pages/BookingConfirmPage.jsx` - Checkout trigger (MAIN ENTRY POINT)
- `client/src/pages/SuccessPage.js` - Payment confirmation

### Booking Management
- `client/src/data/bookings.js` - Booking CRUD operations
- `client/src/pages/BookingFlowPage.jsx` - 5-step booking creation
- `client/src/pages/BookingsPage.jsx` - Booking list view

## Payment Flow Diagram

```
Client creates booking
    ↓
POST /api/bookings
    ↓
BookingConfirmPage displays details
    ↓
"Proceed to checkout" button clicked
    ↓
POST /api/payments/create-checkout
    ↓
Redirect to Stripe Checkout
    ↓
User enters payment info
    ↓
✓ Payment success OR ✗ Payment cancel
    ↓
Stripe webhook: checkout.session.completed
    ↓
Backend webhook handler
    ↓
markBookingPaid(session)
    ↓
Supabase: UPDATE bookings SET status='paid'
    ↓
Success page shown to client
```

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/create-checkout-session` | POST | Start checkout (generic) |
| `/api/payments/create-checkout` | POST | Create checkout for booking |
| `/webhook` | POST | Stripe webhook (bookings table update) |
| `/api/bookings` | POST | Create new booking |
| `/api/bookings/me` | GET | Get user's bookings |
| `/api/bookings/:id` | GET | Get single booking |
| `/api/bookings/:id/cancel` | PATCH | Cancel booking |

## Required Environment Variables

### Server
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
FRONTEND_URL=http://localhost:3000
```

### Client
```
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
REACT_APP_SUPABASE_URL=https://...
REACT_APP_SUPABASE_ANON_KEY=...
```

## Onboarding Status

### Client Onboarding (3 Steps)
- Step 1: Profile photo + name ✓
- Step 2: Email + phone ✓
- Step 3: Payment method (PLACEHOLDER)

### Provider Onboarding (5 Steps)
- Step 1: Name + category + city ✓
- Step 2: Profile photo ✓
- Step 3: Services ✓
- Step 4: Availability schedule ✓
- Step 5: Stripe Connect (PLACEHOLDER)

## Data Stored Per User Type

### Client Profile
- `name` (string)
- `email` (string)
- `phone` (string)
- `defaultLocation` (string)
- `photo` (URL)
- `isComplete` (boolean)

### Provider Profile
- `name` (string)
- `phone` (string)
- `category` (string)
- `city` (string)
- `avatar` (URL)
- `bio` (text)
- `hourly_rate` (integer cents)
- `categories` (array)
- `services` (array: {name, price, duration})
- `availability` (weekly schedule)

## Important Notes

1. **Amounts in Cents**: All prices stored as integer cents (e.g., 12000 = $120.00)

2. **User ID Tracking**: 
   - Sent via `x-user-id` header from client
   - Stored in localStorage
   - Used to filter user-specific bookings

3. **Supabase Fallback**: 
   - All endpoints have in-memory fallback
   - Good for development without DB

4. **Payment State**:
   - Stored in `sessionStorage.latestBookingSummary`
   - Lost on page refresh

5. **Not Yet Implemented**:
   - Stripe Connect (provider payouts)
   - Client payment method storage
   - Refunds/disputes
   - Platform fees

## Testing Stripe Locally

Use test card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits

## How to Enable Provider Payouts

Uncomment in server.js lines 311-315:
```javascript
// transfer_data: {
//   destination: providerStripeAccountId,
// },
// application_fee_amount: Math.round(amount * 0.2),
```

Then implement:
1. OAuth flow to Stripe Connect (ProviderOnboardingPage step 5)
2. Store provider's Stripe account ID
3. Fetch account ID when creating checkout session
