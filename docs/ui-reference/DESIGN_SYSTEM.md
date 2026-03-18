# Kliques Design System (v4 — Apple Health-inspired)

## Brand
- **Name**: kliques
- **Brand Color**: #FF751F (warm orange)
- **Logo**: "kliques" wordmark in Playfair Display, brand orange
- **Tagline**: "Your people. Your growth."

## Visual Language
Inspired by Apple Health's warm gradient headers flowing into card-based content on a light gray background. Key principles:
- **Warm gradient header** on every main screen (burnt orange → peach → system gray)
- **White card surfaces** floating on #F2F2F7 system gray
- **Frosted glass** elements (rgba white + backdrop blur) in gradient areas
- **Generous rounded corners** (16px cards, 28px header radius)
- **Connected timelines** with dots and vertical lines for history screens

## Color Tokens
| Token | Value | Usage |
|-------|-------|-------|
| bg | #F2F2F7 | Page background (Apple system gray) |
| fg | #0D1619 | Primary text |
| muted | #6B7280 | Secondary text, metadata |
| accent | #FF751F | Selected states, active nav, links, badges |
| accentLight | #FFF0E6 | Light orange tint backgrounds |
| card | #FFFFFF | Card surface color |
| ctaBg | #0D1619 | Primary button fill (near-black) |
| ctaText | #FFFFFF | Primary button text |
| divider | #E5E5EA | Separators (Apple system divider) |
| callout | #FFF9E6 | Yellow callout backgrounds |
| success | #22C55E | Completed states |
| successLight | #F0FDF4 | Success badge backgrounds |
| warning | #F5A623 | Milestones |
| danger | #EF4444 | Destructive actions |
| dangerLight | #FEF2F2 | Danger backgrounds |
| gradTop | #D45400 | Gradient start (dark burnt orange) |
| gradMid | #E87020 | Gradient middle (warm orange) |
| gradBot | #F2F2F7 | Gradient end (matches bg) |

## Gradient
```css
background: linear-gradient(180deg, #D45400 0%, #E87020 40%, #F09050 65%, #F5C4A0 82%, #F2F2F7 100%);
border-radius: 0 0 28px 28px;
```
- Covers ~40% of screen height on main screens
- White text throughout gradient area
- Frosted glass stat cards: `background: rgba(255,255,255,0.2); backdrop-filter: blur(10px);`

## Typography
- **UI Font**: "Manrope", system-ui, sans-serif
- **Display Font**: "Playfair Display", Georgia, serif (logo wordmark only)
- **Page titles**: 30px bold white (in gradient)
- **Section headers**: 18px bold #0D1619
- **Card titles**: 16px semibold #0D1619
- **Body/metadata**: 14px regular #6B7280
- **Badges**: 13px semibold
- **Copyright**: 11px

## Card Component
```jsx
<Card>  // white, 16px radius, 16px padding, subtle shadow
  {content}
</Card>
```
- All content sits in cards on the gray background
- Cards have `box-shadow: 0 1px 3px rgba(0,0,0,0.04)`
- 12px gap between cards

## Navigation
- **Offcanvas hamburger menu** (slide from left) for both client and provider
- No tab bar — all navigation through side menu
- **GradientHeader** component: hamburger (white) + kliques logo (white) + optional right element
- Sub-screens use **Nav** component: back arrow + title + close button

## Screen Layout Pattern
```
┌──────────────────────┐
│ ☰  kliques     [AV]  │  ← GradientHeader (warm gradient)
│                       │
│  Page Title           │
│  Subtitle             │
│  [Frosted stat cards] │
│         ╭─────────╮   │  ← Rounded bottom edge
├─────────┤         ├───┤
│  ┌─────────────────┐  │  ← Cards on gray bg
│  │  Card content   │  │
│  └─────────────────┘  │
│  ┌─────────────────┐  │
│  │  Card content   │  │
│  └─────────────────┘  │
│                       │
│     kliques           │  ← Footer
│  About Terms Privacy  │
│    © 2026 Kliques     │
└───────────────────────┘
```

## Timeline Pattern (History screens)
```
  ●── ┌─────────────┐
  │   │  Card entry  │   ← Orange dot = most recent
  │   └─────────────┘
  ●── ┌─────────────┐
  │   │  Card entry  │   ← Green dot = completed
  │   └─────────────┘
  ●── ┌─────────────┐
      │  Card entry  │   ← No line after last entry
      └─────────────┘
```

## Client Screens (3 menu items + sub-screens)
1. **My kliques** — Provider list as cards on gray bg
2. **Relationship** — Gradient header with provider info + connected timeline cards
3. **Select services** — Category pills + service cards with toggle
4. **Service detail** — Bottom sheet with radio options
5. **Select time** — Date circles in card + time slot cards
6. **Booking confirmed** — Success checkmark + receipt card
7. **Messages** — Conversation cards with unread dots
8. **Profile** — Avatar in gradient + settings cards

## Provider Screens (8 menu items + sub-screens)
1. **Dashboard** — Frosted stat cards in gradient + pending bookings + schedule cards
2. **Bookings** — Accept/reject cards with client notes
3. **My kliques** — Client cards with status badges
4. **Client timeline** — Gradient header + connected timeline cards
5. **Services** — Service cards with "Add" button in gradient
6. **Service editor** — Grouped form sections in cards
7. **Calendar** — Month grid in card + day schedule cards
8. **Messages** — Conversation cards
9. **Earnings** — Total in gradient frosted card + chart card + breakdown cards
10. **Smart alerts** — Color-coded alert cards
11. **Appointment detail** — Client info card + session card
12. **Profile** — Avatar + stats in gradient + settings cards

## Footer
Present on every screen, pushed to bottom via `marginTop: auto`:
- kliques logo (muted color)
- About · Terms · Privacy · Support links
- © 2026 Kliques. All rights reserved.
