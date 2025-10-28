# 🧾 Proxey App

Full-stack booking platform for clients and service providers. The current repo uses Create React App on the frontend and Express on the backend with Stripe checkout and optional Supabase integrations.

---

## 🚀 Current Features
- Authenticated post-login workspace with dashboard, browse, booking flow, bookings list, and account management.
- Booking draft persistence (local storage + API) and confirmation summary with Stripe checkout hand-off.
- Protected routes with Supabase Auth support; automatic onboarding redirect for incomplete profiles.
- Provider and service discovery with filters, responsive shell, and accessible bottom navigation.
- Stripe checkout session creation and webhooks already configured on the server.

---

## 🛠 Tech Stack
- **Frontend:** React (Create React App), React Router, custom CSS modules, Context-based auth.
- **Backend:** Node.js + Express, Stripe SDK, optional Supabase service-role client.
- **Database:** Supabase (if keys provided) or in-memory stubs for local development.
- **Tooling:** npm scripts, CRA dev server, ESLint defaults.

---

## ⚙️ Environment Setup

### Client (`client/.env`)
Copy `client/.env.example` and fill in values:

```
REACT_APP_API_BASE=/api
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
REACT_APP_SUPABASE_URL=
REACT_APP_SUPABASE_ANON_KEY=
```

### Server (`server/.env`)
Copy `server/.env.example` and fill in values:

```
PORT=5000
FRONTEND_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=your-dev-secret
```

If Supabase keys are omitted the app falls back to local session storage and in-memory data stubs.

---

## ▶️ Run Locally

In one terminal:

```bash
cd server
npm install
npm start
```

In another terminal:

```bash
cd client
npm install
npm start
```

The CRA dev server runs on <http://localhost:3000> and proxies API calls to the Express server on port 5000 when `REACT_APP_API_BASE=/api` is set.

---

## 🧭 Routes Map

- `/auth/sign-in`, `/auth/sign-up` – public auth pages with client/provider tabs.
- `/onboarding` – gated profile setup for first-time authenticated users.
- `/app` – dashboard shell with quick actions, draft resume, and recommendations.
- `/app/browse` – filters + provider cards.
- `/app/book` – multi-step booking form with validation, draft save, and submission.
- `/app/book/confirm` – booking summary with optional Stripe checkout hand-off.
- `/app/bookings` – upcoming/past tabs, cancellation modal, review placeholder.
- `/app/account` – profile edit, notification placeholder, sign-out.
- `/checkout`, `/success`, `/cancel` – existing Stripe demo flow.

All `/app/*` routes are protected. Refreshing keeps the session (Supabase or local token). Users without a completed profile are redirected to `/onboarding` until name/phone/location are saved.

---

## 💳 Payments

- Client calls `POST /api/payments/create-checkout` to create a Stripe Checkout session.
- Existing `/api/create-checkout-session` and webhook remain untouched; bookings are marked paid via Stripe events.

---

## 🧱 Data Layer Overview

- `/api/services`, `/api/providers` – serve catalog data (Supabase if configured, otherwise in-memory).
- `/api/bookings`, `/api/bookings/me`, `/api/bookings/:id/cancel` – manage booking drafts and cancellations.
- Client hooks (`useServices`, `useProviders`, `useBookings`) handle loading/error/empty states with skeletons and toasts.

Replace stubs with real DB tables by swapping the Supabase calls in `server/server.js` once your schema is ready.

---

## ✅ Post-login UI: Run & Test

1. Start server and client as noted above.
2. Visit `http://localhost:3000/auth/sign-in`.
3. If Supabase Auth is configured, sign in with a real user; otherwise any email/password works (stored locally).
4. Complete onboarding (name, phone, location) to unlock `/app`.
5. Explore:
   - Dashboard quick actions and draft resume.
   - Browse filters and provider cards.
   - Booking flow draft persistence and confirmation screen.
   - Bookings tabs with cancel modal.
   - Account profile edit + sign-out.
6. Optional: hit “Proceed to checkout” on the confirmation page to generate a Stripe Checkout session using the stubbed server booking.

To switch between Supabase Auth and the local JWT fallback, add/remove Supabase env keys and restart both client and server.

---

## 📌 Next Steps

- Replace in-memory provider/service data with Supabase tables.
- Wire notification preferences to real channels.
- Expand review flow in `/app/bookings` once backend endpoints exist.
- Add automated Playwright coverage for protected routes, booking happy path, and cancellations.
