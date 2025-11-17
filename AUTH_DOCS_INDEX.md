# Proxey Authentication & Routing Documentation Index

## Overview
This documentation suite provides a complete analysis of the Proxey application's authentication and routing system, including how users are directed to appropriate onboarding or dashboard pages based on their role and profile completion status.

---

## Documents in This Suite

### 1. AUTH_ROUTING_ANALYSIS.md (Main Reference)
**Size:** ~14KB | **Sections:** 13

Comprehensive deep-dive into the entire auth system:
- Authentication architecture (hybrid Supabase + local)
- Session structure and persistence
- Route configuration and hierarchy
- Route guards (ProtectedRoute, ProviderRoute, RoleRedirect)
- Login/signup flows with code examples
- Onboarding workflows (3-step client, 5-step provider)
- localStorage keys and their purposes
- State management patterns
- Edge cases and known issues
- File structure summary
- Data flow diagrams

**Best for:** Understanding the complete system architecture, debugging issues, implementing new auth features.

### 2. REDIRECT_FLOWS_DIAGRAM.md (Visual Guide)
**Size:** ~24KB | **Sections:** 12

ASCII diagrams and visual flowcharts:
- Complete user journey flow
- Authentication state machine
- Route protection flow for /app/* routes
- Provider role-based protection
- Login/signup decision tree
- RoleRedirect logic (root path /)
- Client onboarding flow (3 steps)
- Provider onboarding flow (5 steps)
- Profile completion determination
- Session persistence timeline
- Error handling scenarios
- State transition matrix

**Best for:** Visual learners, quickly understanding redirect chains, presenting to team members, debugging navigation issues.

### 3. QUICK_REFERENCE.md (Cheat Sheet)
**Size:** ~9.5KB | **Sections:** 12

Fast lookup guide for developers:
- Key files and their purposes (table format)
- Critical decision points (code snippets)
- Common scenarios with step-by-step flows
- Profile completion rules
- localStorage keys reference
- Route protection summary (table)
- Auth methods from useSession hook
- Known bugs and workarounds
- Redirect chain examples
- Testing checklist
- Integration points
- Performance and security notes

**Best for:** Quick lookups, copy-paste reference, new team members onboarding, testing.

---

## Key Concepts Quick Links

### Authentication
- **Core Logic:** See AUTH_ROUTING_ANALYSIS.md § 1 (Authentication Architecture)
- **Visual:** See REDIRECT_FLOWS_DIAGRAM.md § 2 (Auth State Machine)
- **Reference:** See QUICK_REFERENCE.md - Auth Methods section

### Routing & Redirects
- **Complete System:** See AUTH_ROUTING_ANALYSIS.md § 2-4 (Routes & Guards)
- **Visual Flows:** See REDIRECT_FLOWS_DIAGRAM.md § 1, 3-6 (Journey & Protection Flows)
- **Quick Lookup:** See QUICK_REFERENCE.md - Route Protection Summary

### Onboarding Flows
- **Client:** See AUTH_ROUTING_ANALYSIS.md § 6a
- **Provider:** See AUTH_ROUTING_ANALYSIS.md § 6b
- **Visual Client:** See REDIRECT_FLOWS_DIAGRAM.md § 7
- **Visual Provider:** See REDIRECT_FLOWS_DIAGRAM.md § 8

### Common Issues
- **Known Bugs:** See QUICK_REFERENCE.md - Common Bugs & Workarounds
- **Edge Cases:** See AUTH_ROUTING_ANALYSIS.md § 11
- **Error Handling:** See REDIRECT_FLOWS_DIAGRAM.md § 11

---

## File Locations in Repository

### Core Authentication
```
client/src/auth/
└── authContext.jsx                 # Main auth provider & logic
```

### Route Guards
```
client/src/routes/
├── ProtectedRoute.jsx              # Auth + optional profile requirement
├── ProviderRoute.jsx               # Provider role enforcement
└── RoleRedirect.jsx                # Smart routing at root (/)
```

### Authentication Pages
```
client/src/pages/
├── LoginSignup.jsx                 # Combined login/signup UI
├── auth/
│   ├── SignInPage.jsx              # Sign-in with role selection
│   └── SignUpPage.jsx              # Sign-up with role selection
└── (Onboarding pages below)
```

### Onboarding Pages
```
client/src/pages/
├── OnboardingPage.jsx              # Client 3-step setup
└── ProviderOnboardingPage.jsx      # Provider 5-step setup
```

### Route Configuration
```
client/src/
└── App.js                          # Main route tree definition
```

---

## How to Use This Documentation

### For Understanding the System
1. Start with REDIRECT_FLOWS_DIAGRAM.md § 1 (Complete User Journey)
2. Read AUTH_ROUTING_ANALYSIS.md § 1-4 (Architecture & Guards)
3. Reference QUICK_REFERENCE.md for specific questions

### For Debugging Navigation Issues
1. Consult REDIRECT_FLOWS_DIAGRAM.md § 12 (State Transitions)
2. Check the specific redirect scenario in AUTH_ROUTING_ANALYSIS.md § 11
3. Verify localStorage keys in QUICK_REFERENCE.md

### For Implementing New Features
1. Find the relevant section in AUTH_ROUTING_ANALYSIS.md
2. Sketch flow with REDIRECT_FLOWS_DIAGRAM.md format
3. Reference exact file locations and methods in QUICK_REFERENCE.md
4. Add to testing checklist in QUICK_REFERENCE.md

### For Team Onboarding
1. Share QUICK_REFERENCE.md as intro
2. Walk through REDIRECT_FLOWS_DIAGRAM.md § 1-2 together
3. Live code review with AUTH_ROUTING_ANALYSIS.md open
4. Have them complete testing checklist

---

## Critical Facts to Remember

1. **Dual-Role System:** Users are either "client" or "provider", not both in same account
2. **Profile Completion Differs:** Clients need name/phone/location; providers need business setup (5-step form)
3. **Intelligent Routing:** RoleRedirect component handles entry point logic, routing users to correct onboarding or dashboard
4. **Session Persistence:** localStorage used for instant load, Supabase listener syncs in background
5. **Provider Special Case:** Providers are treated as "profile complete" on login even if incomplete (weird edge case)
6. **Route Guards:** Two layers - ProtectedRoute (auth check) and ProviderRoute (role check)
7. **localStorage Fallback:** App works offline-first with localStorage, Supabase is optional backend

---

## Common Scenarios

### New Client Signs Up
LoginSignup → /onboarding → Complete 3 steps → /app

### New Provider Signs Up
LoginSignup → /onboarding → RoleRedirect → /provider/onboarding → Complete 5 steps → /provider

### Returning Client Logs In
SignInPage → (if incomplete profile) → /onboarding → (if complete) → /app

### Returning Provider Logs In
SignInPage → /provider (regardless of completion status)

---

## Testing

Use the comprehensive checklist in QUICK_REFERENCE.md to verify all scenarios work:
- Unauthenticated access patterns
- New user signup flows
- Login flows for both roles
- Profile completion redirects
- Session persistence
- Logout behavior

---

## Known Issues & TODOs

1. **OnboardingPage.jsx:64** - Uses email as placeholder for defaultLocation
2. **ProviderOnboardingPage.jsx:797** - Stripe button doesn't navigate (Step 5 incomplete)
3. **SignInPage.jsx:170** - Password reset shows placeholder (not implemented)
4. **Provider Signup Redirect** - First goes to /onboarding, should go to /provider/onboarding

---

## Related Files Outside Auth System

- **Photo Upload:** `client/src/utils/photoUpload.js` - Supabase storage integration
- **Supabase Config:** `client/src/utils/supabase.js` - Supabase client setup
- **App Layout:** `client/src/components/layout/` - AppShell, ProviderShell
- **Bottom Nav:** `client/src/components/nav/` - Navigation bars for each role

---

## Document Statistics

| Document | Size | Sections | Tables | Diagrams |
|----------|------|----------|--------|----------|
| AUTH_ROUTING_ANALYSIS.md | 14KB | 13 | 2 | Multiple |
| REDIRECT_FLOWS_DIAGRAM.md | 24KB | 12 | 1 | 12 ASCII |
| QUICK_REFERENCE.md | 9.5KB | 12 | 3 | 5 code blocks |
| **Total** | **47.5KB** | **37** | **6** | **20+** |

---

## Last Updated
November 17, 2024

---

## Questions to Ask Yourself When Reading

1. "Where is the user coming from?" (unauthenticated, incomplete profile, complete profile?)
2. "What role are they?" (client, provider, or doesn't matter?)
3. "What route are they trying to access?" (/app, /provider, /onboarding, etc)
4. "What should happen?" (show page, redirect, show login, etc)

The documentation provides answers to all these questions!

