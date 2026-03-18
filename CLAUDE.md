# Kliques App — Claude Memory

## Project Overview
**Kliques** (formerly Proxey) is a **relationship OS** for independent service providers and their clients. Not a marketplace — it's a tool for building and maintaining ongoing client-provider relationships. Think vocal trainers, hairstylists, personal trainers, tutors.

**The core shift:** The app used to be built around discovery and transactions (browse → book → pay). It's now built around relationships and continuity (my kliques → relationship timeline → rebook). The "My kliques" screen is the entry point for both clients and providers — showing people you have ongoing relationships with, not a search page.

**Live URL:** mykliques.com  
**Backend URL:** proxeybooking-app.onrender.com

## Naming
This app was formerly called **Proxey**. It has been rebranded to **Kliques**.
- The repo folder is still named "proxeyapp" — do not rename it
- The backend URL still contains "proxey" — this is expected
- Any references to "Proxey" in existing code are legacy — do not change them unless specifically asked
- All NEW code, UI text, comments, and user-facing strings should use "Kliques" or "kliques"
- The logo wordmark is "kliques" (lowercase, Playfair Display font)

## Tech Stack
- **Frontend:** React 18.3.0 (Create React App), React Router 6.26.1
- **Styling:** Tailwind CSS (migrating from CSS Modules — new pages use Tailwind, legacy pages may still have CSS Modules)
- **State Management:** Context API (AuthContext, BookingContext, NotificationContext, MessageContext)
- **Payment:** Stripe (@stripe/stripe-js, @stripe/react-stripe-js) + Stripe Connect for provider payouts
- **Charts:** Recharts
- **Icons:** Lucide React
- **Backend:** Node.js + Express.js 5.1.0
- **Database:** Supabase (PostgreSQL)
- **PDF Generation:** jspdf (client), PDFKit (server)
- **Hosting:** Frontend → Render Static Site (mykliques.com via Cloudflare CDN), Backend → Render Web Service

## UI Direction — Apple Health-Inspired Design System
**IMPORTANT:** We are migrating to a new UI. See `/docs/ui-reference/DESIGN_SYSTEM.md` for the full design system.

Screen mockups are in `/docs/ui-reference/client/` and `/docs/ui-reference/provider/`. These are JSX prototypes showing the exact UI for each screen. When building or updating a page, **read the matching reference file first** and match its layout, component structure, and visual hierarchy. Convert inline styles to Tailwind classes.

### Brand & Colors
- **Brand color:** `#FF751F` (warm orange) — the ONLY accent color
- **Page background:** `#F2F2F7` (Apple system gray)
- **Card surfaces:** `#FFFFFF` (white cards on gray bg)
- **Primary text:** `#0D1619` (near-black)
- **Secondary text:** `#6B7280`
- **CTA buttons:** `#0D1619` fill (near-black), white text
- **Dividers:** `#E5E5EA`
- **OLD colors to replace:** `#F58027` → `#FF751F`, `#12a6a1` teal → remove entirely, orange-to-teal gradient → remove entirely

### Gradient Header
Every main screen has a warm gradient header:
```css
background: linear-gradient(180deg, #D45400 0%, #E87020 40%, #F09050 65%, #F5C4A0 82%, #F2F2F7 100%);
border-radius: 0 0 28px 28px;
```
- White text throughout the gradient area
- Frosted glass stat cards in gradient: `bg-white/20 backdrop-blur-[10px]`
- The gradient covers roughly 40% of the screen height

### Typography
- **UI Font:** "Manrope", system-ui, sans-serif
- **Logo Font:** "Playfair Display", Georgia, serif (wordmark only)
- Page titles: 30px bold white (inside gradient)
- Section headers: 18px bold
- Card titles: 16px semibold
- Body: 14px regular

### Key Patterns
- **Cards everywhere:** All content sits in white rounded cards (16px radius, subtle shadow) on the gray `#F2F2F7` background
- **No tab bar:** Navigation is an offcanvas hamburger menu (slide from left) for both client and provider
- **GradientHeader:** Hamburger (white) + "kliques" logo (white) + optional right element (avatar, action button)
- **Connected timelines:** History/relationship screens use dots + vertical connecting line between cards
- **Footer on every page:** kliques logo + About/Terms/Privacy/Support + © 2026

### UI Reference Files
| File | Description |
|------|-------------|
| **Root** | |
| `/docs/ui-reference/kliques-prototype-full.jsx` | Complete working prototype — all screens in a single file. Use as the master reference when you need to see how everything fits together. |
| `/docs/ui-reference/README.md` | Index of all files with descriptions and usage instructions |
| `/docs/ui-reference/DESIGN_SYSTEM.md` | Full design system — colors, gradient, typography, card patterns, layout rules |
| **Shared components** (`/docs/ui-reference/shared/`) | |
| `shared/tokens.js` | Design tokens — all colors, fonts, gradient definition |
| `shared/gradient-header.jsx` | GradientHeader — warm gradient header with hamburger + logo |
| `shared/card.jsx` | Card — white rounded card surface component |
| `shared/side-menu.jsx` | SideMenu — offcanvas hamburger navigation |
| `shared/nav-header.jsx` | Nav — back/close navigation bar for sub-screens |
| `shared/footer.jsx` | Footer — page footer (logo + links + copyright) |
| `shared/avatar.jsx` | Avatar — circle avatar with initials + frosted glass |
| `shared/badge.jsx` | Badge — status pill badge |
| `shared/logo.jsx` | Logo — kliques wordmark component |
| `shared/menu-button.jsx` | MenuBtn — hamburger icon button |
| `shared/phone-frame.jsx` | Phone — phone mockup wrapper (prototype only, not for production) |
| `shared/app-router.jsx` | KliquesApp — main app router with role switcher (prototype only) |
| **Client screens** (`/docs/ui-reference/client/`) | |
| `client/my-kliques.jsx` | My kliques — provider relationship list |
| `client/relationship.jsx` | Relationship — connected timeline with provider + rebook buttons |
| `client/select-services.jsx` | Select services — category pills + toggle-select service cards |
| `client/service-detail.jsx` | Service detail — bottom sheet with radio option cards |
| `client/select-time.jsx` | Select time — date picker card + time slot cards |
| `client/booking-confirmed.jsx` | Booking confirmed — success state + receipt card |
| `client/messages.jsx` | Messages — conversation cards with unread indicators |
| `client/profile.jsx` | Profile — avatar in gradient + settings cards |
| **Provider screens** (`/docs/ui-reference/provider/`) | |
| `provider/dashboard.jsx` | Dashboard — frosted stats in gradient + pending bookings + schedule |
| `provider/bookings.jsx` | Bookings — accept/reject cards with client notes |
| `provider/my-kliques.jsx` | My kliques — client cards with Active/At risk/New badges |
| `provider/client-timeline.jsx` | Client timeline — gradient header + connected timeline cards |
| `provider/services.jsx` | Services — service management cards + Add button |
| `provider/service-editor.jsx` | Service editor — grouped form cards (details, pricing, deposits, intake questions) |
| `provider/calendar.jsx` | Calendar — month grid card + day schedule cards |
| `provider/messages.jsx` | Messages — conversation cards with unread dots |
| `provider/earnings.jsx` | Earnings — total in frosted gradient card + chart + breakdown cards |
| `provider/smart-alerts.jsx` | Smart alerts — color-coded actionable alert cards |
| `provider/appointment-detail.jsx` | Appointment detail — client card + session notes + mark complete |
| `provider/profile.jsx` | Profile — avatar + stats in gradient + settings cards |

## User Roles
| Role | Entry Point | Menu Items |
|------|------------|------------|
| Client | `/app` | My kliques, Messages, Profile |
| Provider | `/provider` | Home, Bookings, My kliques, Services, Calendar, Messages, Earnings, Profile |
| Admin | `/admin` | (unchanged) |

## Page Mapping (Old → New)
When rebuilding pages, follow this mapping:

| Old Route | New Purpose | UI Reference |
|-----------|------------|-------------|
| `/app` (dashboard) | My kliques (relationship list) | `client/my-kliques.jsx` |
| `/app/browse` | Demoted — no longer entry point | — |
| `/app/bookings` | Merged into per-provider relationship view | `client/relationship.jsx` |
| `/app/booking-flow` | Keep, reskin with cards | `client/select-services.jsx` → `select-time.jsx` → `booking-confirmed.jsx` |
| `/app/messages` | Keep, reskin | `client/messages.jsx` |
| `/app/account` | Profile | `client/profile.jsx` |
| `/provider` (dashboard) | Dashboard with pending bookings + schedule | `provider/dashboard.jsx` |
| `/provider/appointments` | Bookings (accept/reject) | `provider/bookings.jsx` |
| `/provider/services` | Service management + editor | `provider/services.jsx`, `provider/service-editor.jsx` |
| `/provider/schedule` | Calendar (month grid + day schedule) | `provider/calendar.jsx` |
| `/provider/earnings` | Earnings with chart | `provider/earnings.jsx` |
| `/provider/messages` | Keep, reskin | `provider/messages.jsx` |
| `/provider/profile` | Profile with gradient header | `provider/profile.jsx` |

## New Features to Build
These are **new** features that don't exist in the current codebase:

1. **Client "My kliques" list** — Query: `SELECT DISTINCT provider_id, COUNT(*), MAX(created_at) FROM bookings WHERE client_id = X GROUP BY provider_id` joined with provider_profiles for name/role/rating
2. **Client relationship timeline** — Query: `SELECT * FROM bookings WHERE client_id = X AND provider_id = Y ORDER BY created_at DESC` — shows history with a specific provider
3. **Provider "My kliques" list** — Same pattern grouped by client_id
4. **Provider client timeline** — History with a specific client
5. **Booking accept/reject UI** — Card-based UI with Accept (primary) / Decline (secondary) per pending booking
6. **Service editor** — Full form: pricing, deposit vs full upfront, intake questions (select from options), client notes toggle, photos
7. **Connected timeline UI** — Dots + vertical line connecting history cards

## Database Connection
- **Supabase Project URL:** https://iruabnazdxfmvtxhgemf.supabase.co
- **Database Pooler Host:** aws-1-ca-central-1.pooler.supabase.com
- **Database User:** postgres.iruabnazdxfmvtxhgemf
- **Direct SQL Access:** Use `/usr/local/opt/libpq/bin/psql` with DATABASE_URL from server/.env
- **MCP Config:** `.mcp.json` in project root (Supabase native MCP)

## Database Tables (26 tables)
providers, provider_profiles, client_profiles, bookings, provider_jobs, services, promotions, reviews, notifications, client_notifications, messages, portfolio_media, provider_time_blocks, provider_availability, time_requests, client_transactions, provider_invoices, disputes, conversations, service_intake_questions, service_intake_options, booking_intake_responses, provider_onboarding_drafts, provider_invites, provider_clients, disputes

## Project Structure
```
/client                    — React frontend
  /src/pages              — Page components
  /src/components         — Shared components
  /src/styles             — CSS (legacy — migrating to Tailwind)
  /src/contexts           — AuthContext, BookingContext, etc.
/server                    — Express backend
  index.js                — Main server (95+ API endpoints)
/docs
  /ui-reference           — UI mockup JSX files + design system
    kliques-prototype-full.jsx  — Complete working prototype (single file, master reference)
    README.md             — File index with descriptions + Claude Code usage instructions
    DESIGN_SYSTEM.md      — Full design system documentation
    /client               — 8 client screen JSX files
    /provider             — 12 provider screen JSX files
    /shared               — Design tokens, shared component JSX files (gradient-header, card, side-menu, footer, avatar, badge, logo, nav, etc.)
```

## Key Files
- `CLAUDE.md` — This file
- `.mcp.json` — MCP server config for Supabase
- `client/tailwind.config.js` — Tailwind config (update with new brand colors)
- `client/src/App.js` — Main app routing
- `server/index.js` — Express server entry (5,229 lines)
- `docs/ui-reference/DESIGN_SYSTEM.md` — Design system reference

## Context Providers
- **AuthContext** — Session, login/logout, profile
- **BookingContext** — Client booking list/state
- **NotificationContext** — Real-time notifications (Supabase)
- **MessageContext** — Real-time messaging (Supabase)

## Known Gaps / Active Work
- No "Mark as Complete" button in provider UI for active appointments
- `completed_at` timestamp not set on completion
- No auto-complete logic
- Messaging is functional but incomplete in some areas
- Codebase root folder still named "proxeyapp" — needs rename
- Old CSS Modules being replaced by Tailwind incrementally
- Old brand colors (#F58027, #12a6a1) being replaced with new system