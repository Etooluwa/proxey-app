# Payment System - Visual Guide

Complete visual reference for the payment implementation.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                        PROXEY PAYMENT SYSTEM                         │
└──────────────────────────────────────────────────────────────────────┘

                           YOUR PLATFORM
                    ┌──────────────────────────┐
                    │    Your Web App          │
                    │                          │
                    │  ┌────────────────────┐  │
                    │  │  Client Side       │  │
                    │  │  - OnboardingPage  │  │
                    │  │  - BookingConfirm  │  │
                    │  └────────────────────┘  │
                    │                          │
                    │  ┌────────────────────┐  │
                    │  │  Server Side       │  │
                    │  │  - Payment endpoints  │
                    │  │  - Webhook handler    │
                    │  └────────────────────┘  │
                    │                          │
                    │  ┌────────────────────┐  │
                    │  │  Database          │  │
                    │  │  - Bookings        │  │
                    │  │  - User profiles   │  │
                    │  │  - Transactions    │  │
                    │  └────────────────────┘  │
                    └────────┬─────────────────┘
                             │
                 ┌───────────┴───────────┐
                 │                       │
                 ▼                       ▼
           ┌──────────┐           ┌──────────┐
           │  STRIPE  │           │SUPABASE  │
           │          │           │          │
           │ Payments │           │ Auth     │
           │ Connect  │           │ Storage  │
           │ Webhooks │           │          │
           └──────────┘           └──────────┘
```

---

## Client Payment Flow (Step 3)

```
CLIENT SIGNS UP
        ↓
    ONBOARDING
        ↓
┌─────────────────────────┐
│  STEP 1: Photo + Name   │
│  [Upload photo]         │
│  [Enter name]           │
│  [Next >]               │
└────────────┬────────────┘
             ↓
┌─────────────────────────┐
│ STEP 2: Contact Info    │
│ [Enter email]           │
│ [Enter phone]           │
│ [Select location]       │
│ [Next >]                │
└────────────┬────────────┘
             ↓
┌─────────────────────────────────┐
│  STEP 3: PAYMENT METHOD ★★★     │
│                                 │
│  "Save a payment method         │
│   for faster checkout"          │
│                                 │
│  [Card element form]            │
│  ▌▌▌▌ ▌▌▌▌ ▌▌▌▌ 4242          │
│  [MM/YY] [CVC]                  │
│                                 │
│  ☑ Save this card               │
│                                 │
│  [Save Payment Method]          │
│                                 │
│  ↓ (in background)              │
│  - POST /api/client/            │
│    setup-intent                 │
│  - stripe.confirmCardSetup()    │
│  - Card saved to Stripe         │
│  - customerId saved to DB       │
│                                 │
│  ✓ Card saved!                  │
│  [Complete >]                   │
└────────────┬────────────────────┘
             ↓
    ONBOARDING COMPLETE
        ↓
    DASHBOARD
```

---

## Provider Payment Flow (Step 5)

```
PROVIDER SIGNS UP
        ↓
    ONBOARDING
        ↓
┌──────────────────────────┐
│ STEP 1: Business Info    │
│ [Business name]          │
│ [Service category]       │
│ [City/Location]          │
│ [Next >]                 │
└────────────┬─────────────┘
             ↓
┌──────────────────────────┐
│ STEP 2: Profile Photo    │
│ [Upload photo]           │
│ [Next >]                 │
└────────────┬─────────────┘
             ↓
┌──────────────────────────┐
│ STEP 3: Services         │
│ [Add service modal]      │
│ - Service name           │
│ - Price                  │
│ - Duration               │
│ [Add more services]      │
│ [Next >]                 │
└────────────┬─────────────┘
             ↓
┌──────────────────────────┐
│ STEP 4: Availability     │
│ [Weekly schedule grid]   │
│ Mon □□□□□□□□□□□□□        │
│ Tue □□□□□□□□□□□□□        │
│ ...                      │
│ [Next >]                 │
└────────────┬──────────────┘
             ↓
┌──────────────────────────────────┐
│  STEP 5: BANK ACCOUNT ★★★        │
│                                  │
│  "Connect your bank account      │
│   We'll deposit your earnings"   │
│                                  │
│  [Connect Bank Account]          │
│           ↓                       │
│  ┌─────────────────────────┐    │
│  │ STRIPE FORM (NEW WINDOW)│    │
│  │                         │    │
│  │ Personal Info:          │    │
│  │ - Full name             │    │
│  │ - DOB                   │    │
│  │ - SSN/ID                │    │
│  │                         │    │
│  │ Address:                │    │
│  │ - Street                │    │
│  │ - City                  │    │
│  │ - Province              │    │
│  │                         │    │
│  │ Bank Account:           │    │
│  │ - Routing number        │    │
│  │ - Account number        │    │
│  │                         │    │
│  │ [Submit]                │    │
│  │       ↓                 │    │
│  │ Stripe verifies:        │    │
│  │ ✓ Identity              │    │
│  │ ✓ Bank account          │    │
│  │ ✓ Address               │    │
│  │       ↓                 │    │
│  │ Redirected back         │    │
│  └─────────────────────────┘    │
│           ↓                       │
│  (in background)                 │
│  - stripeAccountId saved to DB   │
│  - Account ready for transfers   │
│                                  │
│  ✓ Bank account connected!       │
│  [Complete >]                    │
└────────────┬─────────────────────┘
             ↓
    ONBOARDING COMPLETE
        ↓
    DASHBOARD
```

---

## Booking Payment Flow

```
CLIENT DASHBOARD
        ↓
    Browse Providers
    [Scroll through providers]
        ↓
    Select Provider
    [Click on "John's Cleaning"]
        ↓
┌────────────────────────────┐
│  Provider Profile          │
│  Name: John Smith          │
│  ★★★★★ (4.8 rating)        │
│  Services:                 │
│  - Home Cleaning $90/visit │
│  - Commercial $150/visit   │
│  [Book Now]                │
└────────────┬───────────────┘
             ↓
┌────────────────────────────┐
│  Booking Flow              │
│  [Select date]             │
│  [Select time]             │
│  [Confirm details]         │
└────────────┬───────────────┘
             ↓
┌──────────────────────────────────┐
│ BOOKING CONFIRM PAGE ★★★         │
│                                  │
│ Service: Home Cleaning           │
│ Provider: John Smith             │
│ Date: Friday, Nov 22, 2024       │
│ Time: 2:00 PM - 4:00 PM          │
│ Amount: $90.00                   │
│                                  │
│ PAYMENT METHOD:                  │
│                                  │
│ ⦿ Visa ending in 4242           │
│   Exp: 12/25                     │
│                                  │
│ ○ Amex ending in 3005            │
│   Exp: 08/26                     │
│                                  │
│ ○ + Add new card                 │
│                                  │
│ [Confirm Booking]                │
│            ↓                      │
│ POST /api/charge                 │
│ - amount: 9000 (cents)           │
│ - paymentMethodId: pm_123        │
│ - customerId: cus_456            │
│ - bookingId: bk_789              │
│            ↓                      │
│ STRIPE CHARGES CARD              │
│ ✓ Payment captured               │
│ ✓ chargeId: ch_abc123            │
│            ↓                      │
│ ✓ BOOKING CONFIRMED!             │
│ [View Booking]                   │
│ [Back to Dashboard]              │
└──────────────────────────────────┘
        ↓
   NOTIFICATION SENT TO PROVIDER
   "New booking: John Smith"
   "Friday 2-4 PM"
   "Confirm or Decline?"
```

---

## Payment Processing (Behind Scenes)

```
CLIENT CLICKS "CONFIRM BOOKING"
        │
        ↓
CLIENT BROWSER
├─ POST /api/charge
├─ payload:
│  ├─ amount: 9000
│  ├─ paymentMethodId: pm_xxx
│  ├─ customerId: cus_xxx
│  ├─ bookingId: bk_xxx
│  └─ providerId: prov_xxx
│
└────────────────────────┐
                         │
                         ↓
                    YOUR SERVER
                    ├─ Validates input
                    ├─ Checks amount
                    │
                    └────────────────┐
                                     │
                                     ↓
                                 STRIPE API
                                 ├─ Create charge
                                 │  ├─ customer: cus_xxx
                                 │  ├─ payment_method: pm_xxx
                                 │  ├─ amount: 9000
                                 │  ├─ currency: cad
                                 │  ├─ off_session: true
                                 │  └─ confirm: true
                                 │
                                 └─ Processing...
                                   ├─ Validate card
                                   ├─ Check fraud
                                   ├─ Authorize transaction
                                   ├─ Capture funds
                                   │
                                   └─ ✓ SUCCESS
                                     ├─ chargeId: ch_xxx
                                     ├─ status: succeeded
                                     ├─ amount: 9000
                                     │
                                     └──────────────────┐
                                                        │
                                                        ↓
                                                YOUR SERVER
                                                ├─ Store chargeId
                                                ├─ Update booking:
                                                │  └─ status: paid
                                                │
                                                └──────────────────┐
                                                                   │
                                                                   ↓
                                                            CLIENT BROWSER
                                                            ├─ Show success
                                                            ├─ Toast: "Booked!"
                                                            └─ Navigate to /app/bookings

INSTANTLY (WEBHOOK):

STRIPE WEBHOOK
├─ Event: charge.succeeded
├─ Triggered automatically
├─ Sends to: YOUR_SERVER/webhook
│
├─ POST /webhook
│  ├─ charge.id: ch_xxx
│  ├─ charge.amount: 9000
│  ├─ charge.metadata.bookingId: bk_xxx
│  ├─ charge.metadata.providerId: prov_xxx
│  │
│  ├─ Calculate split:
│  │  ├─ Stripe fee: ~$1.79
│  │  ├─ Amount after fee: $88.21
│  │  ├─ Your cut (20%): $17.64
│  │  └─ Provider cut (80%): $70.57
│  │
│  ├─ Create transfer:
│  │  ├─ Look up provider's Stripe account
│  │  ├─ stripe.transfers.create({
│  │  │    amount: 7057,
│  │  │    currency: cad,
│  │  │    destination: acct_xxx
│  │  │  })
│  │  │
│  │  └─ ✓ Transfer created: tr_xxx
│  │
│  ├─ Update database:
│  │  ├─ booking.transfer_id = tr_xxx
│  │  └─ transaction.created = true
│  │
│  └─ Return 200 OK
```

---

## Payout Timeline

```
DAY 1 - BOOKING PAYMENT
┌──────────────────┐
│ 2:00 PM: Payment │
│ captured from    │
│ client's card    │
│                  │
│ 2:05 PM: Webhook │
│ triggered,       │
│ transfer created │
│ to provider's    │
│ Stripe account   │
└────────┬─────────┘
         │
         ↓
DAY 2-3 - PROCESSING
┌──────────────────┐
│ Stripe processes │
│ the transfer     │
│                  │
│ Your bank is     │
│ notified (if you │
│ withdraw daily)  │
└────────┬─────────┘
         │
         ↓
DAY 4-5 - PAYOUT
┌──────────────────┐
│ Provider's bank  │
│ receives payout  │
│                  │
│ $70.57 appears   │
│ in their account │
│                  │
│ Provider gets    │
│ notification     │
│ from Stripe      │
└──────────────────┘

PROVIDER'S EARNINGS DASHBOARD:
┌─────────────────────────────────┐
│ Earnings                        │
│                                 │
│ Today: $0.00                    │
│ This Week: $70.57               │
│ This Month: $70.57              │
│                                 │
│ Recent Payouts:                 │
│ Nov 22 - $70.57 (In Progress)   │
│                                 │
│ Pending Transfers:              │
│ $0.00                           │
└─────────────────────────────────┘
```

---

## Database Schema (Simplified)

```
USERS TABLE
┌─────────────────────────────────┐
│ id: uuid                        │
│ email: string                   │
│ role: "client" | "provider"     │
│ name: string                    │
│ phone: string                   │
│ defaultLocation: string         │
│                                 │
│ ★ stripeCustomerId: string      │ (Client only)
│ ★ stripeAccountId: string       │ (Provider only)
│                                 │
│ photo: url                      │
│ created_at: timestamp           │
│ updated_at: timestamp           │
└─────────────────────────────────┘

BOOKINGS TABLE
┌─────────────────────────────────┐
│ id: uuid                        │
│ clientId: uuid (FK → users)     │
│ providerId: uuid (FK → users)   │
│ serviceId: uuid (FK → services) │
│ date: date                      │
│ startTime: time                 │
│ endTime: time                   │
│ status: enum                    │
│  ├─ pending                     │
│  ├─ paid ★ (after charge)       │
│  ├─ confirmed                   │
│  ├─ completed                   │
│  └─ cancelled                   │
│                                 │
│ ★ chargeId: string              │
│ ★ transferId: string            │
│                                 │
│ amount: integer (cents)         │
│ created_at: timestamp           │
│ updated_at: timestamp           │
└─────────────────────────────────┘

TRANSACTIONS TABLE
┌─────────────────────────────────┐
│ id: uuid                        │
│ bookingId: uuid (FK)            │
│                                 │
│ chargeId: string (Stripe)       │
│ transferId: string (Stripe)     │
│                                 │
│ grossAmount: integer (cents)    │
│ stripeFee: integer (cents)      │
│ platformFee: integer (cents)    │
│ providerPayout: integer (cents) │
│                                 │
│ status: "captured" | "settled"  │
│ created_at: timestamp           │
│ paidout_at: timestamp           │
└─────────────────────────────────┘
```

---

## API Endpoints Map

```
CLIENT ENDPOINTS
├─ POST /api/client/setup-intent
│  └─ Creates Stripe SetupIntent for card saving
│
├─ POST /api/client/payment-methods
│  └─ Lists all saved payment methods for customer
│
└─ DELETE /api/client/payment-methods/:id
   └─ Removes saved payment method

PROVIDER ENDPOINTS
├─ POST /api/provider/connected-account
│  └─ Creates Stripe Connected Account
│
├─ POST /api/provider/onboarding-link
│  └─ Generates Stripe Connect onboarding URL
│
└─ GET /api/provider/account/:id
   └─ Checks Stripe account status

PAYMENT ENDPOINTS
├─ POST /api/charge
│  └─ Charges customer using saved payment method
│
└─ POST /webhook
   └─ Stripe webhook handler
      ├─ Event: charge.succeeded
      ├─ Action: Create transfer to provider
      └─ Updates database

EXISTING ENDPOINTS (Updated)
└─ POST /api/checkout-session
   └─ Now includes provider's Stripe account ID
```

---

## Component Tree

```
App
├── Routes
│   ├── / (RoleRedirect)
│   │
│   ├── /auth/sign-in (SignInPage)
│   ├── /auth/sign-up (SignUpPage)
│   │
│   ├── /onboarding (OnboardingPage) ★ Updated Step 3
│   │   └── Step 3: PaymentMethodFormWrapper
│   │       └── PaymentMethodForm
│   │           └── CardElement
│   │
│   ├── /provider/onboarding (ProviderOnboardingPage) ★ Updated Step 5
│   │   └── Step 5: Bank account button
│   │       └── Opens Stripe Connect form
│   │
│   ├── /app (AppShell)
│   │   ├── /app/browse (BrowsePage)
│   │   ├── /app/book (BookingFlowPage)
│   │   ├── /app/bookings (BookingsPage)
│   │   └── /app/book/confirm (BookingConfirmPage) ★ Updated
│   │       └── Payment method selector
│   │
│   └── /provider (ProviderShell)
│       ├── /provider/profile
│       ├── /provider/jobs
│       └── /provider/earnings
│
└── AuthProvider
    └── AuthContext
        ├── session
        ├── profile
        ├── isProfileComplete
        └── updateProfile()
```

---

## State Management Flow

```
AuthContext (Global)
├─ session
│  ├─ user
│  │  ├─ id
│  │  ├─ email
│  │  └─ role: "client" | "provider"
│  └─ accessToken
│
├─ profile
│  ├─ name
│  ├─ phone
│  ├─ defaultLocation
│  ├─ ★ stripeCustomerId (client)
│  ├─ ★ stripeAccountId (provider)
│  └─ photo
│
└─ isProfileComplete
   └─ Boolean (used for routing)

OnboardingPage (Local State)
├─ currentStep: 1-3
├─ form
│  ├─ name
│  ├─ photo
│  ├─ email
│  ├─ phone
│  ├─ defaultLocation
│  ├─ ★ stripeClientSecret
│  └─ ★ stripeCustomerId
│
└─ submitting: Boolean

BookingConfirmPage (Local State)
├─ savedPaymentMethods: Array
├─ selectedPaymentMethodId: String
└─ processing: Boolean
```

---

## Component Hierarchy

```
PaymentMethodFormWrapper
├─ Uses: Elements from Stripe
├─ Props:
│  ├─ clientSecret: string
│  ├─ onSuccess: callback
│  └─ onError: callback
│
└─ PaymentMethodForm
   ├─ Uses: useStripe, useElements hooks
   ├─ Renders:
   │  ├─ CardElement (Stripe component)
   │  ├─ Error message (conditional)
   │  ├─ Checkbox (save card)
   │  └─ Submit button
   │
   └─ On submit:
      ├─ stripe.confirmCardSetup()
      ├─ Calls onSuccess if succeeded
      └─ Calls onError if failed
```

---

## Error Handling Flow

```
USER ATTEMPTS PAYMENT
        │
        ↓
VALIDATION
├─ Amount valid? → No → Show error
├─ Payment method selected? → No → Show error
└─ Payment method valid? → No → Show error
        │
        ↓ (All valid)
        │
STRIPE CHARGE
├─ Network error? → No → Continue
├─ Card declined? → Yes → Show card error
├─ Fraud detected? → Yes → Show security error
├─ Success? → Yes → Continue
└─ Other error? → Yes → Show generic error
        │
        ↓ (Success)
        │
DATABASE UPDATE
├─ Update booking? → No → Log error (booking still paid)
├─ Update profile? → No → Log error (not critical)
└─ All success? → Yes → Show success message

RETRY LOGIC:
├─ Card error → User tries again
├─ Network error → Retry automatically
├─ Other error → Show support contact
└─ Webhook already processed? → Don't charge twice
```

---

## Security Checklist

```
CLIENT-SIDE SECURITY ✓
├─ Never store card numbers (use Stripe.js)
├─ Never send card data to your server
├─ Use HTTPS only
├─ Validate input on client
└─ Show error messages carefully (no PII)

SERVER-SIDE SECURITY ✓
├─ Validate webhook signature
├─ Verify customer owns payment method
├─ Use HTTPS only
├─ Validate amounts
├─ Log transactions (not card data)
├─ Rate limit endpoints
└─ Use environment variables for secrets

STRIPE HANDLES ✓
├─ PCI compliance (no card data on your server)
├─ Fraud detection (machine learning)
├─ 3D Secure (if needed)
├─ Card validation
└─ Secure transfers
```

---

This visual guide shows you everything at a glance. Refer to specific diagrams when implementing!
