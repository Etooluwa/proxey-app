# Proxey Payment Architecture & Onboarding Analysis

## Executive Summary

The Proxey application implements a **Stripe-based payment system** with separate onboarding flows for clients and service providers. The architecture uses **Supabase for authentication and data persistence** with **in-memory fallbacks** for development. The payment flow is transaction-focused (per-booking), and provider payouts are integrated through Stripe.

---

## 1. CURRENT PAYMENT SETUP

### 1.1 Payment Processing Infrastructure

**Stripe Integration:**
- **Package:** `stripe` (v19.1.0) on server, `@stripe/stripe-js` (v8.1.0) on client
- **Environment Variables:**
  - Server: `STRIPE_SECRET_KEY` (sk_test_...)
  - Server: `STRIPE_WEBHOOK_SECRET` (whsec_...)
  - Client: `REACT_APP_STRIPE_PUBLISHABLE_KEY` (pk_test_...)

**API Endpoints (Server - /Users/etosegun/proxeyapp/server/server.js):**

1. **POST /api/create-checkout-session** (Lines 263-332)
   - Creates Stripe checkout session
   - Parameters: `serviceName`, `amount`, `currency`, `bookingId`, `providerId`, `customerEmail`
   - Returns: `sessionId`
   - **Amount Format:** Must be integer in smallest currency unit (cents for USD)
   - **Metadata:** Stores `bookingId` and `providerId`
   - **Fallback URLs:** Uses `FRONTEND_URL` env variable for success/cancel redirects

2. **POST /api/payments/create-checkout** (Lines 527-577)
   - Creates checkout session linked to existing booking
   - Parameters: `bookingId`, `successUrl`, `cancelUrl`
   - Returns: `checkoutUrl` and `sessionId`
   - Fetches booking and service details from memory store

3. **POST /webhook** (Lines 891-928)
   - Stripe webhook endpoint for payment events
   - **Events Handled:** `checkout.session.completed`
   - **Webhook Function:** `markBookingPaid(session)` - updates booking status to "paid"
   - Validates Stripe signature using `STRIPE_WEBHOOK_SECRET`

### 1.2 Webhook Processing

**Event Handler: markBookingPaid() (Lines 930-1018)**

Triggered when Stripe payment completes:
- Extracts `bookingId` and `providerId` from session metadata
- Updates booking record in Supabase with:
  - `status: "paid"`
  - `payment_status: "paid"`
  - `payment_intent_id: session.payment_intent`
  - `amount_paid: session.amount_total`
  - `currency: session.currency`
  - `paid_at: current ISO timestamp`
- **Error Handling:**
  - Column mismatch fallback (code 42703) - falls back to status-only update
  - Logs errors to console and optional webhook alert URL

### 1.3 Client-Side Payment Integration

**File:** /Users/etosegun/proxeyapp/client/src/utils/stripe.js

**Function: initiateCheckout()**
- Loads Stripe instance with `REACT_APP_STRIPE_PUBLISHABLE_KEY`
- Parameters: `serviceName`, `amount`, `currency`, `bookingId`, `providerId`, `customerEmail`, `successUrl`, `cancelUrl`
- Calls backend `/api/create-checkout-session` endpoint
- Stores booking summary in `sessionStorage.latestBookingSummary`
- Redirects to Stripe Checkout via `stripe.redirectToCheckout()`

---

## 2. CLIENT ONBOARDING FLOW

### 2.1 Overview
**File:** /Users/etosegun/proxeyapp/client/src/pages/OnboardingPage.jsx
**Steps:** 3 steps total
**Status:** Implemented with photo upload support

### 2.2 Step-by-Step Breakdown

#### **Step 1: Profile Photo & Name (Lines 154-220)**
**Data Collected:**
- `photo` (File object for upload to Supabase Storage)
- `name` (Full name, required)

**UI Features:**
- Photo upload with preview
- Click-to-upload button
- Photo edit overlay

**Validation:**
- `name` cannot be empty
- Throws error: "Name required - Please enter your full name to continue."

#### **Step 2: Contact Details (Lines 223-259)**
**Data Collected:**
- `email` (Email address, required)
- `phone` (Phone number, required)

**UI Features:**
- Email input with placeholder format
- Phone input with placeholder format

**Validation:**
- Email: Required + regex validation (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
- Phone: Required field
- Errors: "Email required" / "Invalid email" / "Phone number required"

#### **Step 3: Payment Method (Lines 262-299)**
**Data Collected:**
- Currently: None (placeholder step)

**Status:** NOT IMPLEMENTED
- Shows credit card icon
- Text: "Add a Payment Method"
- Button shows: "Add Payment Method"
- Toast message: "Coming soon - Payment method setup will be available soon."

### 2.3 Profile Data Persisted

**updateProfile() call (Lines 59-68):**
```javascript
{
  name: string,
  phone: string,
  email: string,
  defaultLocation: string (currently uses email as placeholder),
  isComplete: boolean (true),
  photo: File (for upload)
}
```

**Profile Completion Check:**
- `isProfileCompleteShape()` validates: `name && phone && defaultLocation`

**Photo Upload:**
- Calls `uploadProfilePhoto(photoFile, userId)`
- Returns signed URL stored in profile

---

## 3. PROVIDER ONBOARDING FLOW

### 3.1 Overview
**File:** /Users/etosegun/proxeyapp/client/src/pages/ProviderOnboardingPage.jsx
**Steps:** 5 steps total
**Status:** Fully implemented with Stripe Connect placeholder

### 3.2 Step-by-Step Breakdown

#### **Step 1: Business Profile (Lines 304-429)**
**Data Collected:**
- `name` (Full name, required)
- `category` (Service category from SERVICE_CATEGORIES list, required)
- `city` (City with autocomplete suggestions, required)

**UI Features:**
- Text input for name with user icon
- Dropdown select for categories
- Autocomplete city input with suggestions
- `filterCities()` utility for city matching

**Validation:**
- All three fields required
- Error messages: "Name required", "Category required", "City required"

**Categories Available:**
- "Home & Cleaning"
- "Beauty & Personal Care"
- "Health & Wellness"
- "Events & Entertainment"
- "Trades & Repair"
- "Auto Services"
- "Business Services"
- "Child & Pet Care"
- "Delivery & Errands"
- "Creative & Specialty"

#### **Step 2: Profile Photo (Lines 432-499)**
**Data Collected:**
- `photo` (File object)
- `photoPreview` (Local preview URL)

**Status:** Optional (can skip)
- Click to upload
- Edit overlay on existing photo
- Centralized layout

#### **Step 3: Services (Lines 502-603)**
**Data Collected per Service:**
- `name` (Service name, required)
- `price` (Dollar amount, required, must be > 0)
- `duration` (Minutes, required, must be > 0)

**UI Features:**
- Add Service button opens modal
- Service list with edit/delete options
- Service modal form with validation
- Empty state when no services

**Service Validation:**
- Name: Required, non-empty string
- Price: Required, valid number > 0
- Duration: Required, valid integer > 0
- Errors: "Service name required", "Valid price required", "Valid duration required"

**Capability:** Services can be edited and deleted at any time

#### **Step 4: Availability/Schedule (Lines 606-727)**
**Data Collected:**
- `availability` object for each day of week:
  ```javascript
  {
    [dayKey]: {
      enabled: boolean,
      from: "HH:MM AM/PM",      // Start time
      to: "HH:MM AM/PM",        // End time
      breakFrom: "HH:MM AM/PM", // Break start
      breakTo: "HH:MM AM/PM"    // Break end
    }
  }
  ```

**UI Features:**
- Day toggle switches (enabled/disabled)
- Time inputs for work hours and breaks
- "Apply to all working days" checkbox (copies Monday to Tue-Fri)
- Default: Mon-Fri enabled (9 AM - 5 PM with 12 PM - 1 PM break), Sat-Sun disabled

**Days Tracked:** Monday through Sunday

#### **Step 5: Stripe Connect (Lines 729-760)**
**Data Collected:** None currently

**Status:** PLACEHOLDER
- Shows bank/credit card icon
- Title: "Connect your bank account"
- Text: "Proxey uses Stripe for fast, secure payouts. Connect your account to receive payments directly from clients."
- Button: "Connect with Stripe" with Stripe logo
- **Implementation:** `handleStripeConnect()` shows toast: "Stripe Connect integration will be implemented here."

### 3.3 Form State Structure

```javascript
{
  name: string,
  category: string,        // Category ID
  city: string,
  photo: File | null,
  photoPreview: string | null,
  services: [
    { name, price, duration },
    ...
  ],
  availability: {
    [dayKey]: { enabled, from, to, breakFrom, breakTo }
  }
}
```

---

## 4. CURRENT PAYMENT FLOW FOR BOOKINGS/TRANSACTIONS

### 4.1 Complete Booking Payment Flow

```
Client View:
1. Browse services/providers (BrowsePage)
   ↓
2. Start booking (BookingFlowPage - 5 steps)
   - Step 1: Choose service & provider
   - Step 2: Schedule (date/time)
   - Step 3: Location
   - Step 4: Notes
   - Step 5: Review
   ↓
3. Create booking (POST /api/bookings)
   - Returns: { booking: { id, status: "upcoming", price, ... } }
   ↓
4. Redirect to confirmation page (BookingConfirmPage)
   - Displays booking details
   - Shows: Service, Provider, Date/Time, Location, Notes, Price
   - **"Proceed to checkout" button**
   ↓
5. Initiate Stripe Checkout (requestCheckout(bookingId))
   - POST /api/payments/create-checkout
   - Returns: { checkoutUrl, sessionId }
   ↓
6. Redirect to Stripe Checkout
   - User enters card details
   - ✓ Payment succeeds → Webhook triggered
   ↓
7. Success Page (SuccessPage)
   - Displays "Payment confirmed"
   - Shows booking summary from sessionStorage
   - Links back to bookings
```

### 4.2 Data Flow Details

**Booking Creation (POST /api/bookings):**
```javascript
Request: {
  serviceId: string,
  providerId: string,
  scheduledAt: ISO 8601 timestamp,
  location: string,
  notes: string (optional),
  status: "draft" | "upcoming" (default: "draft"),
  price: integer cents (optional, can be null)
}

Response: {
  id: UUID,
  userId: string,
  serviceId: string,
  providerId: string,
  scheduledAt: ISO timestamp,
  location: string,
  notes: string,
  status: string,
  createdAt: ISO timestamp,
  updatedAt: ISO timestamp,
  price: integer cents | null
}
```

**Payment Creation (POST /api/payments/create-checkout):**
```javascript
Request: {
  bookingId: string,
  successUrl: string (optional),
  cancelUrl: string (optional)
}

Response: {
  checkoutUrl: string,   // Stripe Checkout URL
  sessionId: string      // Stripe session ID
}
```

**Webhook Update (stripe.checkout.session.completed):**
```javascript
Supabase bookings table update:
{
  status: "paid",
  payment_status: "paid",
  payment_intent_id: string,
  amount_paid: integer,
  currency: string,
  paid_at: ISO timestamp,
  provider_id: string (if metadata provided)
}
```

### 4.3 Provider Job/Earnings Tracking

**Provider Jobs (GET /api/provider/jobs):**
```javascript
Response: {
  jobs: [
    {
      id: string,
      providerId: string,
      clientName: string,
      serviceName: string,
      status: "active" | "pending" | "completed",
      scheduledAt: ISO timestamp,
      price: integer cents,
      location: string,
      notes: string
    }
  ]
}
```

**Provider Earnings (GET /api/provider/earnings):**
```javascript
Response: {
  providerId: string,
  totalEarned: integer cents,
  pendingPayout: integer cents,
  transactions: [
    {
      id: string,
      jobId: string,
      date: ISO timestamp,
      amount: integer cents,
      clientName: string
    }
  ]
}
```

---

## 5. PAYMENT-RELATED FILES & INTEGRATION POINTS

### 5.1 Server Files (Express Backend)
**Location:** `/Users/etosegun/proxeyapp/server/server.js`

**Payment Endpoints:**
- Lines 263-332: POST `/api/create-checkout-session`
- Lines 527-577: POST `/api/payments/create-checkout`
- Lines 891-928: POST `/webhook`

**Payment Functions:**
- Lines 930-1018: `markBookingPaid(session)`
- Lines 1020-1074: `normalizeBooking(record)`
- Lines 1076-1109: `reportWebhookError(event, error)`

**Supporting Endpoints:**
- Lines 397-420: GET `/api/bookings/me` (fetch user bookings)
- Lines 422-485: POST `/api/bookings` (create booking)
- Lines 487-525: PATCH `/api/bookings/:id/cancel` (cancel booking)
- Lines 578-630: GET `/api/bookings/:id` (fetch single booking)

**Provider Endpoints:**
- Lines 632-683: GET `/api/provider/jobs`
- Lines 685-722: PATCH `/api/provider/jobs/:id`
- Lines 724-752: GET `/api/provider/earnings`
- Lines 754-787: GET `/api/provider/me`
- Lines 789-841: PATCH `/api/provider/me`
- Lines 843-890: PATCH `/api/provider/schedule`

### 5.2 Client Files - Payment/Checkout

**Core Payment Files:**
- `/Users/etosegun/proxeyapp/client/src/utils/stripe.js` - Stripe checkout initiation
- `/Users/etosegun/proxeyapp/client/src/pages/BookingCheckoutPage.js` - Demo checkout page
- `/Users/etosegun/proxeyapp/client/src/pages/SuccessPage.js` - Payment success page
- `/Users/etosegun/proxeyapp/client/src/pages/CancelPage.js` - Payment cancel page

**Booking Flow Files:**
- `/Users/etosegun/proxeyapp/client/src/pages/BookingFlowPage.jsx` - 5-step booking creation
- `/Users/etosegun/proxeyapp/client/src/pages/BookingConfirmPage.jsx` - Booking review & checkout trigger
- `/Users/etosegun/proxeyapp/client/src/data/bookings.js` - Booking API methods

**Data Layer:**
- `/Users/etosegun/proxeyapp/client/src/data/apiClient.js` - HTTP request helper with session auth
- `/Users/etosegun/proxeyapp/client/src/data/bookings.js` - Booking CRUD operations

### 5.3 Onboarding Files

**Client Onboarding:**
- `/Users/etosegun/proxeyapp/client/src/pages/OnboardingPage.jsx` - 3-step client profile
- `/Users/etosegun/proxeyapp/client/src/styles/onboarding.css`

**Provider Onboarding:**
- `/Users/etosegun/proxeyapp/client/src/pages/ProviderOnboardingPage.jsx` - 5-step provider setup
- `/Users/etosegun/proxeyapp/client/src/styles/providerOnboarding.css`

### 5.4 Authentication & Profile Files

**Auth Context:**
- `/Users/etosegun/proxeyapp/client/src/auth/authContext.jsx` - Session management, profile updates
- **Profile Fields Stored:**
  - `name` (string)
  - `email` (string)
  - `phone` (string)
  - `defaultLocation` (string)
  - `photo` (URL to Supabase Storage)
  - `isComplete` (boolean)
  - `role` (string: "client" or "provider")

**Provider Profile:**
- `/Users/etosegun/proxeyapp/client/src/pages/provider/ProviderProfile.jsx` - Edit provider profile
- `/Users/etosegun/proxeyapp/client/src/data/provider.js` - Provider API calls

**Provider Earnings:**
- `/Users/etosegun/proxeyapp/client/src/pages/provider/ProviderEarnings.jsx` - View earnings & transactions

---

## 6. PROFILE FIELDS STORAGE

### 6.1 Client Profile Fields

**Stored in Supabase Auth user_metadata:**
```javascript
{
  role: "client",
  profile: {
    name: string,
    email: string,
    phone: string,
    defaultLocation: string,
    photo: string (Supabase URL),
    isComplete: boolean
  }
}
```

**Also cached in localStorage:**
- Key: `proxey.profile:${userId}`
- Contains same profile object

**Auth Context Validation:**
- `isProfileCompleteShape()` checks: `name && phone && defaultLocation`

### 6.2 Provider Profile Fields

**Stored via PATCH /api/provider/me:**
```javascript
{
  provider_id: string (primary key),
  name: string,
  phone: string,
  avatar: string (URL),
  bio: string (textarea),
  categories: string[] (from CATEGORY_OPTIONS),
  hourly_rate: integer (in cents),
  hourly_rate: integer (normalized alias),
  schedule: [
    {
      day: string,
      startTime: string (HH:MM format),
      endTime: string (HH:MM format),
      available: boolean
    }
  ],
  updated_at: ISO timestamp
}
```

**Additional Provider Data (from Supabase):**
- `rating` (float, 4.6-4.9)
- `reviewCount` (integer)
- `location` (string, city)
- `servicesOffered` (array of service IDs)

### 6.3 Storage Mechanisms

**Primary Storage:** Supabase
- Auth metadata for roles
- `provider_profiles` table for provider details
- `bookings` table for transaction records
- `provider_earnings` table for payout tracking

**Fallback Storage:** In-memory + localStorage
- Memory: `memoryStore` object in server.js
- Local: `localStorage` for session and profile caching

**Photo Storage:** Supabase Storage
- Function: `uploadProfilePhoto(photoFile, userId)`
- Returns signed URL

---

## 7. STRIPE INTEGRATION DETAILS

### 7.1 Checkout Session Configuration

**Mode:** "payment" (not subscription)
**Payment Methods:** ["card"]
**Metadata Included:**
- `bookingId`
- `providerId` (optional)

**Commented Features (Ready for Future):**
```javascript
// Stripe Connect (for provider payouts):
// transfer_data: {
//   destination: providerStripeAccountId,
// },
// application_fee_amount: Math.round(amount * 0.2), // 20% platform fee
```

### 7.2 Webhook Signature Verification

**Secret Source:** `STRIPE_WEBHOOK_SECRET` environment variable
**Verification:** `stripe.webhooks.constructEvent(body, signature, secret)`
**Error Response:** 400 Bad Request on signature mismatch

### 7.3 Amount Handling

**Format Required:** Integer cents
**Validation:**
```javascript
if (!Number.isInteger(amount) || amount <= 0) {
  throw new Error("amount must be a positive integer...")
}
```

**Normalization in Client:**
```javascript
const normalizedAmount = Number.isInteger(amount)
  ? amount
  : Math.round(Number(amount));
```

---

## 8. NOT YET IMPLEMENTED

### 8.1 Client-Side Payment Methods
- **Step 3 of Client Onboarding:** "Add Payment Method" not implemented
- Expected: Stripe Elements for card tokenization
- Status: Placeholder UI only

### 8.2 Stripe Connect Integration
- **Step 5 of Provider Onboarding:** "Connect your bank account" not implemented
- Expected: OAuth flow to Stripe Connect
- Status: Button shows toast "Coming soon"
- Comments in code: `// TODO: Implement Stripe Connect integration`

### 8.3 Provider Payout System
- **Missing:** Bank account collection
- **Missing:** Actual payout processing
- **Exists:** Earnings tracking UI
- **Note:** Code contains commented example of Stripe Connect transfer_data

### 8.4 Refunds & Dispute Handling
- No refund endpoints implemented
- No dispute/chargeback handling
- Webhook only handles checkout.session.completed

---

## 9. KEY TECHNICAL NOTES

### 9.1 Amount Normalization
Booking prices stored in memory store in **cents**:
```javascript
basePrice: 12000,  // $120.00
hourlyRate: 4500,  // $45.00
```

Displayed to user as: `(amount / 100).toFixed(2)`

### 9.2 Provider ID Tracking
- Stored with booking
- Included in Stripe metadata
- Used in webhook to update provider records
- Currently not used for automatic payout routing

### 9.3 Session-Based State
- Booking summary stored in `sessionStorage.latestBookingSummary`
- Used on success page for display
- Lost on page refresh (no persistent receipt)

### 9.4 Database Fallback Pattern
All Supabase queries have fallback to in-memory store:
```javascript
if (supabase) {
  // Try Supabase
} else {
  // Use memoryStore
}
```

### 9.5 User Identification
- Client requests include `x-user-id` header (from localStorage)
- Used by: GET /api/bookings/me, PATCH /api/bookings/:id/cancel
- Retrieved from: `window.localStorage.getItem("proxey.auth.session")`

---

## 10. SUMMARY TABLE

| Feature | Status | Notes |
|---------|--------|-------|
| Stripe Checkout | ✓ Implemented | Basic payment processing working |
| Webhook Processing | ✓ Implemented | Updates booking status on payment |
| Client Onboarding (Steps 1-2) | ✓ Implemented | Profile + Contact + Photo |
| Client Payment Method Setup | ✗ Not Implemented | Placeholder in Step 3 |
| Provider Onboarding (Steps 1-4) | ✓ Implemented | Profile, Photo, Services, Availability |
| Stripe Connect | ✗ Not Implemented | Placeholder in Step 5 |
| Provider Payouts | ✗ Not Implemented | Earnings tracking UI only |
| Booking Creation & Tracking | ✓ Implemented | Full 5-step flow |
| Payment Success/Cancel Pages | ✓ Implemented | Basic redemption flow |
| Refund Processing | ✗ Not Implemented | No endpoint or logic |
| Dispute Handling | ✗ Not Implemented | No endpoint or logic |

---

## 11. ENVIRONMENT VARIABLES REQUIRED

### Server (.env)
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
FRONTEND_URL=http://localhost:3000
```

### Client (.env)
```
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
REACT_APP_SUPABASE_URL=https://...
REACT_APP_SUPABASE_ANON_KEY=...
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_API_BASE=/api
```

---

Generated: November 17, 2025
Analysis Depth: Full codebase exploration
