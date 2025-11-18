# Payment Data Flow - Complete Diagrams

## 1. Client Card Saving Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT CARD SAVING                          │
└─────────────────────────────────────────────────────────────────┘

CLIENT APP                          SERVER                      STRIPE
    │                                  │                           │
    │─── Onboarding Step 3 ────────────│                           │
    │                                  │                           │
    │     POST /api/client/            │                           │
    │     setup-intent                 │                           │
    │     (userId, email)──────────────────────────────────────────│
    │                                  │                           │
    │                                  │   Create Customer         │
    │                                  │───────────────────────────>│
    │                                  │                           │
    │                                  │   Create SetupIntent      │
    │                                  │───────────────────────────>│
    │                                  │                           │
    │<────── clientSecret ─────────────│<──────────────────────────│
    │     customerId                   │                           │
    │                                  │                           │
    │  Show CardElement Form           │                           │
    │  (4242 4242 4242 4242)           │                           │
    │                                  │                           │
    │─── confirmCardSetup() ───────────────────────────────────────>│
    │     clientSecret                 │                           │
    │     card token                   │                           │
    │                                  │                           │
    │                                  │<───── Card Verified ──────│
    │                                  │       PaymentMethod ID    │
    │<──── onSuccess() ────────────────│                           │
    │                                  │                           │
    │  Save to Profile:                │                           │
    │  - stripeCustomerId              │                           │
    │  - paymentMethodSetupComplete    │                           │
    │                                  │                           │
    └─────────────────────────────────────────────────────────────┘

RESULT: Card is saved in Stripe (NOT on your server)
        Client can use it for future bookings
```

---

## 2. Provider Bank Account Connection Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              PROVIDER BANK ACCOUNT CONNECTION                   │
└─────────────────────────────────────────────────────────────────┘

PROVIDER APP                       SERVER                      STRIPE
    │                                  │                           │
    │─── Onboarding Step 5 ────────────│                           │
    │                                  │                           │
    │     POST /api/provider/          │                           │
    │     connected-account            │                           │
    │     (userId, email)──────────────────────────────────────────│
    │                                  │                           │
    │                                  │  Create Express Account   │
    │                                  │───────────────────────────>│
    │                                  │                           │
    │                                  │<──── accountId ───────────│
    │                                  │                           │
    │<────── accountId ─────────────────│                           │
    │                                  │                           │
    │     Save to Profile:             │                           │
    │     - stripeAccountId            │                           │
    │                                  │                           │
    │     POST /api/provider/          │                           │
    │     onboarding-link              │                           │
    │     (accountId, URLs)────────────────────────────────────────│
    │                                  │                           │
    │                                  │  Create AccountLink       │
    │                                  │───────────────────────────>│
    │                                  │                           │
    │<──── onboardingLink ──────────────│<──────────────────────────│
    │     (Stripe hosted form)         │                           │
    │                                  │                           │
    │  Redirect to Stripe              │                           │
    │─────────────────────────────────────────────────────────────>│
    │                                  │                           │
    │                                  │   Provider enters:        │
    │                                  │   - Name                  │
    │                                  │   - SSN/ID                │
    │                                  │   - Bank account info     │
    │                                  │   - Address               │
    │                                  │                           │
    │                                  │   Stripe verifies all info│
    │                                  │                           │
    │<──────── Redirected back ────────────────────────────────────│
    │     (app/onboarding?completed=true)                          │
    │                                  │                           │
    │  GET /api/provider/account/      │                           │
    │  {accountId}                     │                           │
    │─────────────────────────────────>│                           │
    │                                  │   Retrieve account status │
    │                                  │───────────────────────────>│
    │                                  │                           │
    │<────── Status ────────────────────│<──────────────────────────│
    │  (chargesEnabled: true/false)    │                           │
    │  (payoutsEnabled: true/false)    │                           │
    │                                  │                           │
    └─────────────────────────────────────────────────────────────┘

RESULT: Bank account connected to Stripe account
        Provider is ready to receive payouts
        Stripe has verified all information
```

---

## 3. Booking Payment Flow (Using Saved Card)

```
┌──────────────────────────────────────────────────────────────────┐
│         BOOKING PAYMENT WITH SAVED CARD                          │
└──────────────────────────────────────────────────────────────────┘

CLIENT APP                 SERVER                         STRIPE
    │                        │                              │
    │─ Browse providers ─────│                              │
    │                        │                              │
    │─ Select service       │                              │
    │                        │                              │
    │─ BookingConfirmPage   │                              │
    │   Fetch saved cards────────────────────────────────────│
    │   (POST /api/client/  │                              │
    │    payment-methods)   │                              │
    │                        │   Query saved cards from API │
    │<────────────────────────────────────────────────────┬─────>│
    │    [Visa ••••4242]    │                            │       │
    │    [Amex ••••3005]    │<───────────────────────────┘       │
    │                        │                              │
    │ Select "Visa ••••4242"│                              │
    │                        │                              │
    │─ Click "Confirm      │                              │
    │   Booking"           │                              │
    │                        │                              │
    │   POST /api/charge    │                              │
    │   - amount: 9000      │                              │
    │   - paymentMethodId   │──────────────────────────────────>│
    │   - customerId        │   Create charge with       │
    │   - bookingId         │   payment method           │
    │   - providerId        │                              │
    │   - stripeAccountId   │                              │
    │                        │                              │
    │                        │<──────── Payment captured ──────│
    │                        │          chargeId: ch_xxx  │
    │<────────────────────────────────────────────────────────>│
    │  chargeId, status     │                              │
    │  amount               │                              │
    │                        │                              │
    │ Show success message  │                              │
    │                        │                              │
    └──────────────────────────────────────────────────────────────┘

RESULT: Payment charged to saved card
        Booking moves to "paid" status
```

---

## 4. Automatic Provider Payout Flow

```
┌──────────────────────────────────────────────────────────────────┐
│         AUTOMATIC PROVIDER PAYOUT (Via Webhook)                  │
└──────────────────────────────────────────────────────────────────┘

STRIPE                     SERVER                    YOUR DATABASE
    │                        │                              │
    │  charge.succeeded      │                              │
    │  webhook triggered     │                              │
    │──────────────────────>│                              │
    │  - chargeId            │                              │
    │  - amount: 9000        │                              │
    │  - metadata:           │                              │
    │    bookingId: bk_123   │                              │
    │    providerId: prov_5  │                              │
    │                        │                              │
    │                        │ Lookup provider account:     │
    │                        │ stripeAccountId ────────────>│
    │                        │                    prov_5    │
    │                        │<──── stripe_account_id ──────│
    │                        │ (e.g., acct_abc123)          │
    │                        │                              │
    │  Create transfer       │                              │
    │  - amount: 7200 (80%)  │                              │
    │  - currency: cad       │──────────────────────────────│
    │  - destination:        │   Create Transfer:           │
    │    acct_abc123         │   To provider's account      │
    │<──────────────────────|                              │
    │  transferId: tr_xyz    │                              │
    │                        │                              │
    │                        │ Update database:            │
    │                        │ - booking status: paid       │
    │                        │ - transfer id: tr_xyz ──────>│
    │                        │                              │
    │  LATER: 1-2 days       │                              │
    │                        │                              │
    │  Transfer deposited    │                              │
    │  to provider's bank    │                              │
    │  account               │                              │
    │  ($72.00 in this case) │                              │
    │                        │                              │
    └──────────────────────────────────────────────────────────────┘

RESULT: 20% goes to your platform
        80% automatically transferred to provider
        Provider receives payout in 1-2 business days
```

---

## 5. Complete End-to-End Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              COMPLETE BOOKING FLOW                              │
└─────────────────────────────────────────────────────────────────┘

DAY 1 - CLIENT SETUP
├─ Client signs up
├─ Client goes through onboarding
│  ├─ Step 1: Photo + name
│  ├─ Step 2: Email + phone
│  ├─ Step 3: Save card
│  │  ├─ Open payment form
│  │  ├─ Enter test card (4242...)
│  │  ├─ Card saved to Stripe
│  │  └─ stripeCustomerId saved to profile
│  └─ Complete onboarding
└─ Client goes to dashboard

DAY 1 - PROVIDER SETUP (Parallel)
├─ Provider signs up
├─ Provider goes through onboarding
│  ├─ Step 1: Business info
│  ├─ Step 2: Photo
│  ├─ Step 3: Add services (e.g., $90 hourly rate)
│  ├─ Step 4: Set availability
│  ├─ Step 5: Connect bank account
│  │  ├─ Stripe account created
│  │  ├─ Redirected to Stripe form
│  │  ├─ Enter bank details
│  │  ├─ Stripe verifies
│  │  └─ stripeAccountId saved to profile
│  └─ Complete onboarding
└─ Provider goes to dashboard

DAY 2 - CLIENT BOOKS SERVICE
├─ Client browses providers
├─ Finds "John's Cleaning" at $90
├─ Books 1 hour on Friday
├─ Goes to BookingConfirmPage
├─ Saved card appears: "Visa ••••4242"
├─ Clicks "Confirm Booking"
└─ Payment processed:
   ├─ Amount: $90 (9000 cents)
   ├─ Charged to saved card
   ├─ Booking status: "paid"
   └─ Notification sent to John

DAY 2 - IMMEDIATE PAYOUT
├─ Webhook triggered: charge.succeeded
├─ Server calculates split:
│  ├─ Stripe fee: ~$3 (2.9% + $0.30)
│  ├─ Your cut: $15.30 (20%)
│  └─ John's cut: $71.70 (80%)
├─ Transfer created to John's Stripe account
└─ Webhook response: 200 OK

DAY 3-4 - PAYMENT SETTLES
├─ Stripe settles payment with payment processor
├─ Stripe sends payout to your bank (default schedule)
└─ You receive your cut

DAY 4-5 - PROVIDER RECEIVES PAYOUT
├─ Stripe generates payout for John's account
├─ Payout deposited to John's bank account
├─ John receives notification from Stripe
└─ John can see transfer in Stripe dashboard

RESULT:
├─ Booking confirmed ✓
├─ Payment completed ✓
├─ Provider paid ✓
└─ Platform profits ✓
```

---

## 6. Data Stored in Each Place

```
YOUR SERVER (Database)
├─ User profiles
│  ├─ name
│  ├─ email
│  ├─ stripeCustomerId (NOT card details)
│  ├─ stripeAccountId (provider only)
│  └─ photo
├─ Bookings
│  ├─ clientId
│  ├─ providerId
│  ├─ stripeChargeId
│  ├─ stripeTransferId
│  ├─ amount
│  └─ status
└─ Transactions (for reporting)
   ├─ bookingId
   ├─ chargeAmount
   ├─ platformFee
   └─ providerPayout

STRIPE (Never touches cards on your server)
├─ Customers
│  └─ Payment Methods
│     ├─ Card number (encrypted)
│     ├─ Expiry date
│     ├─ CVC (never stored)
│     └─ Brand
├─ Connected Accounts (Providers)
│  ├─ Bank account (verified)
│  ├─ Identity info
│  ├─ Verification status
│  └─ Payout schedule
├─ Charges
│  ├─ Amount
│  ├─ Status
│  ├─ Card (reference only)
│  └─ Metadata (bookingId, providerId)
└─ Transfers
   ├─ Amount
   ├─ Destination account
   └─ Source charge

YOUR BANK ACCOUNT
├─ Net payments (after Stripe fees)
└─ Payout schedule (daily/weekly/monthly)

PROVIDER'S BANK ACCOUNT
├─ Payouts from Stripe
└─ Deposits (1-2 business days)
```

---

## 7. State Transitions

```
                    BOOKING LIFECYCLE

CLIENT SIDE:
  signup → onboarding (step 1-2) → save card (step 3) → dashboard
                                        │
                                        └─ stripeCustomerId saved

  dashboard → browse → select service → BookingConfirmPage
                                             │
                                             └─ show saved cards

  BookingConfirmPage → confirm booking → POST /api/charge
                                             │
                                             └─ payment charged

DATABASE (Booking):
  "pending" → "paid" (after charge succeeds)
           → "confirmed" (send to provider)

PROVIDER SIDE:
  signup → onboarding (step 1-4) → connect account (step 5) → dashboard
                                           │
                                           └─ stripeAccountId saved

  dashboard → view bookings → see "John booked you for 1 hour"
                                        │
                                        └─ status: pending payment

STRIPE WEBHOOK:
  charge.succeeded → create transfer → provider's account
                           │
                           └─ 80% of charge amount

  1-2 days later → payout to provider's bank

DATABASE (Transfer):
  pending → completed → settled
```

---

## 8. Amount Calculations

```
Example: $90 Service Booking

STRIPE FEES:
  Interchange Fee: 1.5% × $90 = $1.35
  Assessment Fee: 0.15% × $90 = $0.14
  Processing Fee: $0.30
  ────────────────────────────
  Total Stripe Fee: ~$1.79

  Amount after Stripe fee: $90 - $1.79 = $88.21

YOUR PLATFORM TAKES: 20%
  $88.21 × 0.20 = $17.64

PROVIDER GETS: 80%
  $88.21 × 0.80 = $70.57

YOUR NET PROFIT PER BOOKING:
  $17.64 (20% of net amount)

1000 BOOKINGS/MONTH AT $90:
  Total volume: $90,000
  Stripe fees: ~$1,790
  Your revenue: $17,640
  Provider payouts: $70,570
```

---

## Key Points

1. **Card data never touches your server** - Only Stripe has it
2. **Payments are instant** - Charge completes in seconds
3. **Payouts are automatic** - Webhook creates transfer immediately
4. **Verification is Stripe's job** - They verify providers
5. **Security is built-in** - Stripe handles PCI compliance
6. **Fees are transparent** - You know exactly what you keep
