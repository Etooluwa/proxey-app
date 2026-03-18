# Kliques UI/UX Screen Files (v4)

Apple Health-inspired warm gradient + card-based UI system.

## How to use with Claude Code

1. **Add `DESIGN_SYSTEM.md` to your project** (e.g., `/docs/DESIGN_SYSTEM.md`)
2. **Reference it in your `CLAUDE.md`**:
   ```
   ## UI Reference
   See /docs/DESIGN_SYSTEM.md for colors, typography, gradient, card patterns.
   Brand color: #FF751F. Font: Manrope. Gray bg: #F2F2F7. White cards.
   ```
3. **Feed individual screen files** when building each feature:
   ```
   Build the provider bookings page. Here's the UI reference:
   [paste bookings.jsx]. Connect to Supabase — fetch from bookings
   table where status='pending' and provider_id=current user.
   ```

## What Claude Code needs to adapt
- Inline styles → your CSS setup (Tailwind, CSS modules, etc.)
- Mock data arrays → Supabase queries
- `go("screen_name")` → React Router / Next.js routes
- `useState` for accept/reject → Supabase mutations
- `onMenu` → your actual drawer/menu implementation

## Files

### `shared/` — Reusable components + tokens
| File | Component | Description |
|------|-----------|-------------|
| `tokens.js` | Design tokens | Colors, fonts, gradient definition |
| `gradient-header.jsx` | GradientHeader | Warm gradient header with hamburger + logo |
| `card.jsx` | Card | White rounded card surface |
| `nav-header.jsx` | Nav | Back/close navigation bar |
| `avatar.jsx` | Avatar | Circle avatar with initials + frosted glass |
| `badge.jsx` | Badge | Status pill badge |
| `footer.jsx` | Footer | Page footer (logo + links + copyright) |
| `side-menu.jsx` | SideMenu | Offcanvas hamburger menu |
| `logo.jsx` | Logo | kliques wordmark |
| `menu-button.jsx` | MenuBtn | Hamburger icon button |
| `phone-frame.jsx` | Phone | Phone mockup wrapper (prototype only) |
| `app-router.jsx` | KliquesApp | Main app with role switcher + routing |

### `client/` — Client-facing screens
| File | Screen | Key features |
|------|--------|-------------|
| `my-kliques.jsx` | My kliques | Provider cards with rating, visits, last visit |
| `relationship.jsx` | Relationship | Gradient provider header + connected timeline cards + rebook |
| `select-services.jsx` | Select services | Category pills + toggle-select service cards |
| `service-detail.jsx` | Service detail | Bottom sheet with radio option cards |
| `select-time.jsx` | Select time | Date picker card + time slot cards |
| `booking-confirmed.jsx` | Confirmed | Success state + receipt card |
| `messages.jsx` | Messages | Conversation cards with unread indicators |
| `profile.jsx` | Profile | Avatar in gradient + settings cards |

### `provider/` — Provider-facing screens
| File | Screen | Key features |
|------|--------|-------------|
| `dashboard.jsx` | Dashboard | Frosted stats in gradient + pending bookings + schedule |
| `bookings.jsx` | Bookings | Accept/reject cards with client notes, reviewed section |
| `my-kliques.jsx` | My kliques | Client cards with Active/At risk/New badges |
| `client-timeline.jsx` | Timeline | Gradient client header + connected timeline cards |
| `services.jsx` | Services | Service cards + Add button in gradient |
| `service-editor.jsx` | Editor | Grouped form cards: details, pricing, deposits, questions |
| `calendar.jsx` | Calendar | Month grid card + day schedule cards |
| `messages.jsx` | Messages | Conversation cards with unread dots |
| `earnings.jsx` | Earnings | Total in frosted gradient card + chart card + breakdown |
| `smart-alerts.jsx` | Alerts | Color-coded actionable alert cards |
| `appointment-detail.jsx` | Appointment | Client card + session card + notes |
| `profile.jsx` | Profile | Avatar + stats in gradient + settings cards |

### Root files
| File | Description |
|------|-------------|
| `kliques-prototype-full.jsx` | Complete working prototype (single file) |
| `DESIGN_SYSTEM.md` | Full design system documentation |
| `README.md` | This file |
