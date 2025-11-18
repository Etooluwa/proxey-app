# Proxey Codebase Map - Payment & Onboarding

## Directory Structure

```
/Users/etosegun/proxeyapp/
├── server/
│   ├── server.js              # MAIN BACKEND FILE (1100 lines)
│   │   ├── Payment endpoints (lines 263-577)
│   │   ├── Webhook handler (lines 891-928)
│   │   ├── Booking endpoints (lines 397-630)
│   │   └── Provider endpoints (lines 632-890)
│   ├── package.json           # Stripe, Supabase, Express deps
│   └── .env                   # Stripe keys, Supabase URL
│
└── client/
    ├── src/
    │   ├── pages/
    │   │   ├── OnboardingPage.jsx              # CLIENT: 3 steps (photo, contact, payment)
    │   │   ├── ProviderOnboardingPage.jsx      # PROVIDER: 5 steps (profile, photo, services, availability, stripe)
    │   │   ├── BookingFlowPage.jsx             # Booking: 5 steps (service, schedule, location, notes, review)
    │   │   ├── BookingConfirmPage.jsx          # PAYMENT ENTRY POINT: Reviews booking, triggers checkout
    │   │   ├── BookingCheckoutPage.js          # Demo checkout page
    │   │   ├── SuccessPage.js                  # Payment success confirmation
    │   │   ├── CancelPage.js                   # Payment cancel page
    │   │   ├── BookingsPage.jsx                # View user's bookings
    │   │   ├── BrowsePage.jsx                  # Browse services/providers
    │   │   ├── AccountPage.jsx                 # User account management
    │   │   └── provider/
    │   │       ├── ProviderProfile.jsx         # Edit provider profile
    │   │       └── ProviderEarnings.jsx        # View earnings & transaction history
    │   │
    │   ├── data/
    │   │   ├── bookings.js                     # fetchBookings, createBooking, requestCheckout
    │   │   ├── provider.js                     # fetchProviderProfile, updateProviderProfile, fetchProviderEarnings
    │   │   ├── apiClient.js                    # HTTP request helper (adds x-user-id header)
    │   │   ├── useServices.js                  # Hook: services list
    │   │   ├── useProviders.js                 # Hook: providers list
    │   │   ├── useBookings.js                  # Hook: user bookings
    │   │   ├── services.js                     # Service data
    │   │   └── providers.js                    # Provider data
    │   │
    │   ├── utils/
    │   │   ├── stripe.js                       # initiateCheckout() - Main payment trigger
    │   │   ├── supabase.js                     # Supabase client init
    │   │   ├── photoUpload.js                  # uploadProfilePhoto()
    │   │   └── categories.js                   # SERVICE_CATEGORIES list
    │   │
    │   ├── auth/
    │   │   └── authContext.jsx                 # Session management, profile CRUD
    │   │       ├── login()
    │   │       ├── register()
    │   │       ├── logout()
    │   │       └── updateProfile()
    │   │
    │   ├── routes/
    │   │   ├── ProtectedRoute.jsx              # Requires authentication
    │   │   ├── ProviderRoute.jsx               # Requires provider role
    │   │   └── RoleRedirect.jsx                # Redirects based on role
    │   │
    │   ├── components/
    │   │   ├── ui/                             # Reusable UI components
    │   │   │   ├── Button.jsx
    │   │   │   ├── Input.jsx
    │   │   │   ├── Card.jsx
    │   │   │   ├── Select.jsx
    │   │   │   ├── StepIndicator.jsx
    │   │   │   └── ToastProvider.jsx
    │   │   ├── provider/
    │   │   │   └── EarningCard.jsx
    │   │   └── auth/
    │   │       └── AuthTabs.jsx
    │   │
    │   ├── styles/
    │   │   ├── onboarding.css                  # Client onboarding styles
    │   │   ├── providerOnboarding.css          # Provider onboarding styles
    │   │   ├── bookingFlow.css
    │   │   ├── bookingConfirm.css
    │   │   └── provider/
    │   │       ├── providerProfile.css
    │   │       └── providerEarnings.css
    │   │
    │   ├── App.js                              # Routes configuration
    │   ├── bookings/
    │   │   └── draftStore.js                   # Save/load booking drafts
    │   │
    │   └── .env                                # Stripe publishable key, Supabase URL
    │
    └── package.json                            # React, React Router, Supabase, Stripe deps
```

## Key Integration Points

### 1. Payment Initiation Flow
```
BookingConfirmPage.jsx (line 40-44)
  ↓ clicks "Proceed to checkout"
  ↓
requestCheckout(bookingId)
  ↓ (from bookings.js)
  ↓
POST /api/payments/create-checkout
  ↓ (server.js line 527)
  ↓
Stripe session created
  ↓
Returns checkoutUrl
  ↓
window.location.href = checkoutUrl
  ↓
Stripe Checkout modal
```

### 2. Payment Completion Flow
```
Client completes Stripe Checkout
  ↓
Stripe sends webhook to POST /webhook
  ↓ (server.js line 891)
  ↓
stripe.webhooks.constructEvent() validates signature
  ↓
checkout.session.completed event
  ↓
markBookingPaid(session) called
  ↓ (server.js line 930)
  ↓
Supabase bookings UPDATE: status='paid'
  ↓
Client redirected to SuccessPage.js
  ↓
Shows booking summary from sessionStorage
```

### 3. Onboarding Data Collection
```
Client:
  OnboardingPage.jsx → updateProfile() → Supabase auth user_metadata

Provider:
  ProviderOnboardingPage.jsx → updateProfile() → PATCH /api/provider/me → Supabase provider_profiles table
```

## Data Schema (In-Memory/Supabase)

### bookings table
```javascript
{
  id: UUID,
  user_id: string,
  provider_id: string,
  service_id: string,
  scheduled_at: ISO timestamp,
  location: string,
  notes: string,
  status: "draft" | "upcoming" | "completed" | "cancelled" | "paid",
  price: integer (cents),
  payment_status: "pending" | "paid",
  payment_intent_id: string (Stripe payment_intent ID),
  amount_paid: integer (cents),
  currency: string ("usd"),
  paid_at: ISO timestamp,
  created_at: ISO timestamp,
  updated_at: ISO timestamp,
  cancelled_at: ISO timestamp
}
```

### provider_profiles table
```javascript
{
  provider_id: string (primary key),
  name: string,
  phone: string,
  avatar: string (URL),
  bio: string,
  categories: string[],
  hourly_rate: integer (cents),
  schedule: [{day, startTime, endTime, available}],
  updated_at: ISO timestamp
}
```

### provider_jobs table (memory only)
```javascript
{
  id: string,
  provider_id: string,
  client_name: string,
  service_name: string,
  status: "active" | "pending" | "completed",
  scheduled_at: ISO timestamp,
  price: integer (cents),
  location: string,
  notes: string
}
```

### provider_earnings table (memory only)
```javascript
{
  provider_id: string,
  total_earned: integer (cents),
  pending_payout: integer (cents),
  transactions: [{id, jobId, date, amount, clientName}]
}
```

## Authentication Flow

```
SignUpPage/LoginSignup.jsx
  ↓
authContext.jsx login()/register()
  ↓
Supabase auth.signUp() or auth.signInWithPassword()
  ↓
Store session in localStorage
  ↓
Set role in user_metadata
  ↓
If client:
  → OnboardingPage (3 steps)
If provider:
  → ProviderOnboardingPage (5 steps)
```

## File Dependencies

### Critical Files for Payment
1. `server/server.js` - Core payment logic
2. `client/src/pages/BookingConfirmPage.jsx` - Payment trigger
3. `client/src/utils/stripe.js` - Stripe integration
4. `client/src/data/bookings.js` - Booking API
5. `client/src/auth/authContext.jsx` - User tracking

### Critical Files for Onboarding
1. `client/src/pages/OnboardingPage.jsx` - Client setup
2. `client/src/pages/ProviderOnboardingPage.jsx` - Provider setup
3. `client/src/auth/authContext.jsx` - Profile storage
4. `client/src/utils/photoUpload.js` - Photo upload
5. `client/src/utils/categories.js` - Category lists

### Critical Files for Routing
1. `client/src/App.js` - Route definitions
2. `client/src/routes/RoleRedirect.jsx` - Role-based routing
3. `client/src/routes/ProtectedRoute.jsx` - Auth protection

## Size Reference
- server.js: 1,113 lines
- ProviderOnboardingPage.jsx: 916 lines
- OnboardingPage.jsx: 348 lines
- PaymentArchitecture.md: 701 lines (this file)

## Environment Dependencies
- Stripe API (test mode)
- Supabase (PostgreSQL + Auth)
- Supabase Storage (photo uploads)
- React 19.2.0
- Express 5.1.0

## Missing/TODO
1. Stripe Connect OAuth integration
2. Client payment method storage
3. Provider bank account verification
4. Refund processing
5. Dispute/chargeback handling
6. Receipt/invoice generation
7. Transaction receipts persistence
