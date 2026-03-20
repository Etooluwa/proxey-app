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
- The logo wordmark is "kliques" (lowercase, Sora font)

## Tech Stack
- **Frontend:** React 18.3.0 (Create React App), React Router 6.26.1
- **Styling:** Tailwind CSS (migrating from CSS Modules — new pages use Tailwind, legacy pages may still have CSS Modules)
- **State Management:** Context API (AuthContext, BookingContext, NotificationContext, MessageContext)
- **Payment:** Stripe (@stripe/stripe-js, @stripe/react-stripe-js) + Stripe Connect for provider payouts
- **Charts:** Recharts
- **Icons:** Migrating from Lucide React → **@phosphor-icons/react**. New pages use Phosphor. Do NOT change existing Lucide imports unless reskinning that page.
- **Backend:** Node.js + Express.js 5.1.0
- **Database:** Supabase (PostgreSQL)
- **PDF Generation:** jspdf (client), PDFKit (server)
- **Hosting:** Frontend → Render Static Site (mykliques.com via Cloudflare CDN), Backend → Render Web Service

## UI Direction — Warm Editorial Design System (v6)

The app has been fully redesigned. The v4 Apple Health gradient system is **deprecated and removed**. The new design uses a warm cream editorial aesthetic inspired by topographic card layouts.

Reference prototypes are in `/docs/ui-reference/`. When building or updating a page, **read the matching reference file first.**

### Design Tokens
```css
base: #FBF7F2      /* Warm cream background */
ink: #3D231E        /* Deep brown-black — primary text */
muted: #8C6A64      /* Warm brown-gray — secondary text */
faded: #B0948F      /* Lightest text */
accent: #C25E4A     /* Terracotta — the ONLY accent color */
hero: #FDDCC6       /* Orange-toned hero card background */
avatarBg: #F2EBE5   /* Warm light bg for sections */
line: rgba(140,106,100,0.2) /* Warm hairline divider */
success: #5A8A5E    /* Muted earthy green */
successBg: #EBF2EC
callout: #FFF5E6    /* Warm yellow callout */
card: #FFFFFF
dangerBg: #FDEDEA
```

### Typography
- **UI Font:** "Sora" (Google Font) — 400 body, 500 emphasis, 600 labels
- **Logo Font:** "Sora" (wordmark only)
- Page titles: 32px, font-weight 600, letter-spacing -0.03em
- Labels (Lbl): 11px, uppercase, letter-spacing 0.05em, font-weight 500
- Body: 14px, weight 400

### Key Patterns
- **No white card containers** — content sits directly on the cream `#FBF7F2` base
- **Hairline dividers** (`line` color) separate sections instead of card edges
- **Hero cards:** `#FDDCC6` background + topographic SVG texture at 15% opacity, 28px border radius
- **No gradient header** — the gradient header is removed entirely
- **Hamburger menu:** Three lines in terracotta, offcanvas slide-in from left (no tab bar)
- **Header layout:** "kliques" wordmark centered (absolute positioned), notification bell between logo and avatar, hamburger on left
- **Provider headers** show avatar in header; **client headers do NOT** show avatar
- **ArrowIcon:** Diagonal arrow (↗) as interaction hint — replaces chevrons
- **Primary buttons:** `ink` fill (`#3D231E`), white text
- **Secondary buttons:** Transparent fill, `line` border
- **Connected timelines:** Dots + vertical line (unchanged pattern)
- **Footer on every page:** kliques logo + About/Terms/Privacy/Support + © 2026

### OLD things removed (do not use)
- ~~Apple Health gradient header~~ → removed entirely, do not recreate
- ~~`#F2F2F7` gray background~~ → replaced with `#FBF7F2`
- ~~`#FF751F` orange~~ → replaced with `#C25E4A` terracotta
- ~~`#0D1619` text~~ → replaced with `#3D231E`
- ~~White card containers with shadows~~ → removed, use direct-on-cream + dividers
- ~~Manrope font~~ → replaced with Sora
- ~~GradientHeader component~~ → do not use, do not import
- ~~Frosted glass stat cards~~ → removed with gradient header
- ~~`#F58027`, `#12a6a1` teal~~ → remove on sight

### UI Reference Files (v6)
| File | Description |
|------|-------------|
| `/docs/ui-reference/kliques-prototype-v6.jsx` | **Master reference** — full dual-flow prototype (client + provider) |
| `/docs/ui-reference/kliques-v6-onboarding.jsx` | Auth + onboarding flows |
| `/docs/ui-reference/kliques-v6-public.jsx` | Public booking + invite flow |
| `/docs/ui-reference/kliques-v6-provider-empty.jsx` | Provider empty states |
| `/docs/ui-reference/kliques-v6-client-empty.jsx` | Client empty states |

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

## Database Tables (20 tables)
providers, provider_profiles, client_profiles, bookings, provider_jobs, services, promotions, reviews, notifications, client_notifications, messages, portfolio_media, provider_time_blocks, provider_availability, time_requests, client_transactions, provider_invoices, disputes, users, conversations

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
- All previously built pages (v4 design) need to be reskinned to v6 (warm editorial)
- Lucide React imports being replaced by @phosphor-icons/react incrementally on reskin
- `tailwind.config.js` needs tokens updated from v4 to v6 palette
