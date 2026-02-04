# Proxey App - Claude Memory

## Project Overview
**Proxey** is a two-sided marketplace mobile app connecting clients with local service providers (barbers, cleaners, wellness practitioners, auto services, etc.).

## Tech Stack
- **Frontend:** React 18.3.0 (Create React App), React Router 6.26.1
- **Styling:** CSS Modules + custom CSS
- **State Management:** Context API (AuthContext, BookingContext, NotificationContext, MessageContext)
- **Payment:** Stripe (@stripe/stripe-js, @stripe/react-stripe-js)
- **Charts:** Recharts
- **Icons:** Lucide React
- **Backend:** Node.js + Express.js 5.1.0
- **Database:** Supabase (PostgreSQL)
- **PDF Generation:** jspdf (client), PDFKit (server)

## Brand Colors
- **Primary Orange:** `#F58027` (main brand color)
- **Secondary Orange:** `#d97706` (darker accent)
- **Gradient:** `linear-gradient(90deg, #F58027, #12a6a1)` (orange to teal)

## User Roles
1. **Client** - Browse providers, book services, manage bookings, pay
2. **Provider** - Offer services, manage schedule, accept jobs, track earnings

## Database Connection
- **Supabase Project URL:** https://iruabnazdxfmvtxhgemf.supabase.co
- **Database Pooler Host:** aws-1-ca-central-1.pooler.supabase.com
- **Database User:** postgres.iruabnazdxfmvtxhgemf
- **Direct SQL Access:** Use `/usr/local/opt/libpq/bin/psql` with DATABASE_URL from server/.env
- **MCP Config:** `.mcp.json` in project root (Supabase native MCP)

## Key Features Implemented
- Multi-step booking flow (6 steps)
- Stripe payment integration
- Provider onboarding (5 steps)
- Client onboarding (3 steps)
- Availability/scheduling system
- Time request feature (clients request custom times)
- Invoice generation
- Earnings tracking
- Messaging system (placeholder)

## Project Structure
- `/client` - React frontend
- `/server` - Express backend
- Client pages in `/client/src/pages`
- Styles in `/client/src/styles`
- Components in `/client/src/components`

## UX Design Notes
- User requested complete UX redesign using **shadcn/ui** aesthetic
- 220 screens identified for full app coverage
- Design should be minimal, clean, generous whitespace
- Google Stitch prompt created for UX generation

## Important Files
- `.mcp.json` - MCP server configuration for Supabase
- `client/tailwind.config.js` - Tailwind config with brand colors
- `client/src/App.js` - Main app routing
- `server/index.js` - Express server entry point
