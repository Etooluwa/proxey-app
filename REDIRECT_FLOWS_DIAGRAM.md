# Proxey Auth & Redirect Flows - Visual Diagrams

## 1. Complete User Journey Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    User Visits Application                       │
│                      (/ or any route)                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │  AuthProvider Initializes      │
        │  - Load session from storage   │
        │  - Init Supabase listener      │
        │  - Set loading = false         │
        └────────────────────┬───────────┘
                            │
                            ▼
        ┌────────────────────────────────┐
        │  Route Evaluation (App.js)     │
        │  Current Route: /              │
        │  → Goes to RoleRedirect        │
        └────────────────────┬───────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │  Is User Loaded?      │
                └──────────┬──────┬─────┘
                    NO    │      │   YES
                         ▼      ▼
                    Loading   Check Auth
                    Screen    State
                              │
                    ┌─────────┴──────────┐
                    │                    │
                    NO AUTH         HAS AUTH
                    │                    │
                    ▼                    ▼
        ┌─────────────────────┐  ┌──────────────────────┐
        │  Show LoginSignup   │  │ Check User Role &    │
        │  - Role toggle      │  │ Profile Status       │
        │  - Login/Signup     │  │                      │
        │  - Email/Password   │  └──────────┬───────────┘
        └────────────┬────────┘             │
                     │         ┌─────────────┼──────────────┐
                     │         │             │              │
                     │         ▼             ▼              ▼
          ┌──────────────────┐  │  Client +  Provider +  Both +
          │  User Submits    │  │  Complete  Complete    Complete
          │  Login/Signup    │  │  Profile   Profile     
          │                  │  │  = /app    = /provider
          └──────┬───────────┘  │            │
                 │              │            │
                 ▼              ▼            ▼
        ┌──────────────────┐  Redirect   Redirect   Redirect
        │ Auth Methods:    │  to /app    to /provider  to
        │ - login()        │            (dashboard)   dashboard
        │ - register()     │
        │                  │  ┌──────────────────────────────┐
        └──────┬───────────┘  │                              │
               │              └──────────────────────────────┘
               ▼
      ┌──────────────────────┐
      │ Update Session in    │
      │ Auth Context         │
      └──────┬───────────────┘
             │
             ▼
    ┌──────────────────────┐
    │ Persist to           │
    │ localStorage         │
    └──────┬───────────────┘
           │
           ▼
    ┌──────────────────────┐
    │ Route Update Triggers│
    │ Redirect or Allow    │
    │ access to page       │
    └──────────────────────┘
```

---

## 2. Authentication State Machine

```
                    ┌─────────────┐
                    │   UNKNOWN   │ (App loading)
                    └──────┬──────┘
                           │
                  (Session init or check)
                           │
            ┌──────────────┴──────────────┐
            │                             │
            ▼                             ▼
      ┌─────────────┐            ┌─────────────┐
      │ UNAUTHENTICATED         │ AUTHENTICATED
      │                          │
      │ - No session in storage  │ - Session loaded
      │ - No Supabase auth       │ - User logged in
      │ - Show LoginSignup       │ - Ready for routes
      │                          │
      └──────────┬───────────────┴──────────┬─────────────────┐
                 │                          │                 │
       (User registers)      (User logs in) │          (User logged in)
                 │                          │                 │
                 ▼                          ▼                 ▼
         ┌──────────────┐         ┌─────────────────┐   ┌──────────────┐
         │ Session in   │         │ Session in      │   │ Check        │
         │ AuthContext  │         │ AuthContext +   │   │ Profile      │
         │ (may be null)          │ Profile data    │   │ Completeness │
         └──────┬───────┘         └────────┬────────┘   └──────┬───────┘
                │                         │                    │
                ▼                         ▼                    │
         ┌──────────────┐         ┌────────────────┐         │
         │ Redirect to: │         │ Redirect to:   │         │
         │ - /onboarding        │ - Dashboard    │         │
         │  (complete profile)  │   (if complete)│◄────────┘
         │ OR                   │ - /onboarding  │ (if incomplete)
         │ /provider/onboarding │   (if incomplete)
         │  (if provider)       │                │
         └──────────────┘       └────────────────┘
```

---

## 3. Route Protection Flow (for /app/*)

```
User navigates to protected route
e.g., /app/browse
│
└─► ProtectedRoute Component
    │
    ├─ While loading = true?
    │  └─► Show "Loading your workspace…"
    │      Return (no navigation)
    │
    ├─ session?.user is falsy?
    │  └─► Navigate to /auth/sign-in
    │      (Preserve original path in state)
    │      Return
    │
    ├─ requireProfile = true AND !isProfileComplete?
    │  └─► Navigate to /onboarding
    │      Return
    │
    └─ All checks pass?
       └─► Render <Outlet /> (allow route)
           Next nested route components render

Example Routes using ProtectedRoute:

<Route element={<ProtectedRoute requireProfile={false} />}>
  <Route path="/onboarding" element={<OnboardingPage />} />
  <Route path="/provider/onboarding" element={<ProviderOnboardingPage />} />
</Route>

<Route element={<ProtectedRoute />}>  {/* requireProfile={true} by default */}
  <Route element={<AppShell />}>
    <Route path="/app" element={<AppDashboard />} />
    <Route path="/app/browse" element={<BrowsePage />} />
    ...
  </Route>
</Route>
```

---

## 4. Provider Route Protection (Role-Based)

```
User navigates to /provider/*
│
└─► ProviderRoute Component
    │
    ├─ While loading = true?
    │  └─► Show "Preparing your workspace…"
    │      Return
    │
    ├─ session?.user?.role !== "provider"?
    │  └─► Navigate to /app
    │      (Redirect non-providers to client area)
    │      Return
    │
    └─ User IS provider?
       └─► Render <Outlet />
           Continue to nested provider routes
           (within ProviderShell)
```

---

## 5. Login/Signup Decision Tree

```
┌────────────────────────────────┐
│  User on SignInPage/SignUpPage │
└────────────┬───────────────────┘
             │
             ▼
    ┌─────────────────────┐
    │ User selects role:  │
    │ - Client            │
    │ - Provider          │
    └────────┬────────────┘
             │
             ▼
    ┌─────────────────────┐
    │ User provides creds │
    │ - Email             │
    │ - Password          │
    │ - Confirm (if signup)
    └────────┬────────────┘
             │
    ┌────────▼──────────────────────────────┐
    │ Call auth method:                      │
    │ - login() OR register()                │
    └────────┬───────────────────────────────┘
             │
    ┌────────▼──────────────────────────────┐
    │ Success? Return { session, profile }  │
    │ Error? Throw and display error        │
    └────────┬───────────────────────────────┘
             │
    ┌────────▼────────────────────────────────────┐
    │                                              │
    │  For SIGNUP:                                │
    │  if (session) → /onboarding                 │
    │  else → /auth/sign-in (needs verification) │
    │                                              │
    │  For LOGIN (SignInPage only):               │
    │  Check: profileCompleteNow =                │
    │    role === "provider" ? true :             │
    │    isProfileCompleteShape(profile)          │
    │                                              │
    │  if (profileCompleteNow)                    │
    │    → /provider (if provider) or /app        │
    │  else                                        │
    │    → /onboarding                            │
    │                                              │
    └──────────────────────────────────────────────┘
```

---

## 6. RoleRedirect Component Logic (Root Path /)

```
User visits / (root)
│
▼
┌─────────────────────────────────────┐
│ RoleRedirect Component              │
│ (Handles: /, /app, /provider, etc)  │
└────────────┬────────────────────────┘
             │
             ▼
    ┌─────────────────┐
    │  loading = true?│
    │   Show loading  │
    │   Return        │
    └────────┬────────┘
             │ NO
             ▼
    ┌──────────────────────┐
    │ !session?.user       │
    │ (Not authenticated)  │
    └────────┬─────────────┘
             │ YES
             ▼
    ┌────────────────────────────────┐
    │ Render <LoginSignup />         │
    │ - Show role selection          │
    │ - Handle login/signup actions  │
    │ - Navigate on success          │
    └────────────────────────────────┘

             NO (User authenticated)
             │
             ▼
    ┌──────────────────────────────────┐
    │ Check user.role and isProfileComplete
    └────────┬───────────────────────────┘
             │
    ┌────────┴──────────────────────────────────────┐
    │                                               │
    ▼                                               ▼
 CLIENT                                          PROVIDER
 │                                               │
 ├─ profile incomplete?                          ├─ profile incomplete?
 │  YES → Navigate to /onboarding                │  YES → Navigate to /provider/onboarding
 │  NO  → Navigate to /app                       │  NO  → Navigate to /provider
 │                                               │
 └──────────────────────────────────┬────────────┘
                                    │
                                    ▼
                        Redirect happens with { replace: true }
                        (replaces history entry)
```

---

## 7. Client Onboarding Flow

```
┌─────────────────────────────────────┐
│ User on /onboarding                 │
│ (Reached after signup OR incomplete │
│  profile login)                     │
└────────────┬────────────────────────┘
             │
             ▼
    Step 1: Name & Photo
    ├─ Input: name (required)
    ├─ Input: photo (optional, file)
    ├─ Validate: name not empty
    └─► Next →
             │
             ▼
    Step 2: Contact Details
    ├─ Input: email (required)
    ├─ Input: phone (required)
    ├─ Validate: email format, phone not empty
    └─► Next →
             │
             ▼
    Step 3: Payment Method
    ├─ Display: Credit card icon
    ├─ Message: "Coming soon"
    ├─ Button: "Add Payment Method" (disabled/placeholder)
    └─► Save & Continue →
             │
             ▼
    ┌────────────────────────────────┐
    │ Call updateProfile():          │
    │ {                              │
    │   name,                        │
    │   phone,                       │
    │   email,                       │
    │   defaultLocation: email,      │
    │   isComplete: true             │
    │ }                              │
    │ + photo file                   │
    └────────┬─────────────────────┘
             │
             ▼
    Success?
    ├─ YES: Show toast, Navigate to /app
    └─ NO: Show error toast, Stay on form
```

---

## 8. Provider Onboarding Flow (5 Steps)

```
┌─────────────────────────────────────┐
│ User on /provider/onboarding        │
│ (Auto-redirect for new providers)   │
└────────────┬────────────────────────┘
             │
             ▼
    Step 1: Business Profile
    ├─ Input: name (required) - Full Name
    ├─ Input: category (required) - Service Category dropdown
    ├─ Input: city (required) - With autocomplete suggestions
    ├─ Validate: All 3 fields not empty
    └─► Next →
             │
             ▼
    Step 2: Photo Upload
    ├─ Button: Click to upload photo
    ├─ Preview: Shows selected image
    ├─ Optional: Can skip with "Skip for now"
    └─► Next (auto to Step 3) →
             │
             ▼
    Step 3: Services Setup
    ├─ Button: "+ Add New Service"
    ├─ Modal allows:
    │  ├─ name (required)
    │  ├─ price (required, > 0)
    │  └─ duration (required, > 0)
    ├─ List: Shows all added services
    ├─ Actions: Edit/Delete service
    └─► Next →
             │
             ▼
    Step 4: Availability Schedule
    ├─ Display: 7-day schedule (Mon-Sun)
    ├─ Toggle: Enable/Disable each day
    ├─ If enabled, set:
    │  ├─ from: Start time
    │  ├─ to: End time
    │  ├─ breakFrom: Break start
    │  └─ breakTo: Break end
    ├─ Checkbox: "Apply to all working days"
    └─► Next →
             │
             ▼
    Step 5: Stripe Connection
    ├─ Display: Payment/card icon
    ├─ Message: Connect your bank account
    ├─ Button: "Connect with Stripe"
    │  (Currently: TODO - doesn't navigate)
    └─ After completion: TBD
             │
             └─► Should navigate to /provider dashboard

    NOTE: Currently Step 5 is incomplete - no navigation logic
```

---

## 9. Profile Completion Determination

```
isProfileComplete Calculation
│
┌─────────────────────────────────────┐
│ Check: session?.user exists?        │
│ NO  → isProfileComplete = false      │
│ YES → Continue checking              │
└─────────────────────────────────────┘
│
└─► Check: profile.name?              │
    Check: profile.phone?              │
    Check: profile.defaultLocation?    │
    │
    └─► If ALL three exist and truthy:
        isProfileComplete = true
        
        Else:
        isProfileComplete = false
```

---

## 10. Session Persistence Timeline

```
Timeline: User Journey Through Auth & Storage

APP LOADS
│
├─► Check localStorage["proxey.auth.session"]
│   ├─ Found? Load into state (loading = true)
│   └─ Not found? State stays null
│
├─► Init Supabase listener (if available)
│   └─ Listen for auth state changes
│
└─► Set loading = false
    Routes now evaluate user auth state
    │
    USER LOGS IN / SIGNS UP
    │
    ├─► Auth method executes (login/register)
    │   ├─ Supabase.auth.signIn/signUp
    │   └─ Update local state { session, profile }
    │
    ├─► Save to localStorage:
    │   ├─ localStorage["proxey.auth.session"] = session
    │   ├─ localStorage["proxey.profile:{userId}"] = profile
    │   ├─ localStorage["proxey.userRoles"] = { email: role }
    │   ├─ localStorage["proxey.lastRole"] = role
    │   └─ localStorage["proxey.lastEmail"] = email (if remember)
    │
    ├─► Supabase listener detects change
    │   └─ Syncs session state across tabs/windows
    │
    └─► Routes re-evaluate
        Redirects happen based on:
        - Auth state
        - Role
        - Profile completion
        - Intended destination
        │
        USER CLOSES TAB / REFRESHES PAGE
        │
        ├─► App reloads
        │   └─ Loads session from localStorage immediately
        │
        ├─► Supabase listener reconnects
        │   └─ Validates session with server
        │
        └─► Routes re-evaluate
            Page loads with correct auth state
            (No re-login needed if session valid)
```

---

## 11. Error Handling & Edge Cases

```
LOGIN/SIGNUP ERROR SCENARIOS
│
├─ Email format invalid
│  └─ Show error on email field
│
├─ Password too short
│  └─ Show error on password field
│
├─ Passwords don't match (signup)
│  └─ Show error on confirm password
│
├─ Email already exists
│  └─ Show error: "Email in use" → Suggest sign in
│
├─ Role mismatch on login
│  └─ Error: "Account registered as {storedRole}"
│     Suggest: "Switch to that role to sign in"
│
├─ Supabase unavailable
│  └─ Fall back to local mode
│     Create local session (no server sync)
│     Show info toast
│
└─ Session invalid/expired
   └─ Logout user
      Redirect to /auth/sign-in
      Show: "Session expired, please sign in again"

PROFILE COMPLETION ISSUES
│
├─ Profile data corrupted/lost
│  └─ isProfileComplete = false
│     Redirect to onboarding
│     User can re-enter data
│
├─ Photo upload fails
│  └─ Continue without photo
│     Show warning toast
│     Allow profile to complete
│
└─ Default location not set properly
   └─ Workaround: Uses email as fallback
      (Known issue - should ask for actual location)
```

---

## 12. State Transitions Summary

```
UNAUTHENTICATED STATE
│
├─ Can see: /auth/sign-in, /auth/sign-up, /
├─ On /: See LoginSignup component
├─ On /app: Redirect to /auth/sign-in
├─ On /provider: Redirect to /auth/sign-in
└─ On /onboarding: Redirect to /auth/sign-in
   
AUTHENTICATED + INCOMPLETE PROFILE (Client)
│
├─ Can see: /onboarding, /, /auth/sign-in, /auth/sign-up
├─ On /: Redirect to /onboarding
├─ On /app: Redirect to /onboarding
├─ On /provider: Redirect to /app (wrong role) then /onboarding
└─ On /onboarding: Stay (full access)

AUTHENTICATED + INCOMPLETE PROFILE (Provider)
│
├─ Can see: /provider/onboarding, /, /auth/sign-in, /auth/sign-up
├─ On /: Redirect to /provider/onboarding
├─ On /provider: Redirect to /provider/onboarding
├─ On /app: Redirect to /app (allowed by client route guard)
│            Then ProtectedRoute redirects to /onboarding
│            Then RoleRedirect redirects to /provider/onboarding
└─ On /provider/onboarding: Stay (full access)

AUTHENTICATED + COMPLETE PROFILE (Client)
│
├─ Can see: /app/*, /
├─ On /: Redirect to /app
├─ On /app/*: Full access (all routes)
├─ On /provider: Redirect to /app
└─ On /onboarding: Redirect to /app

AUTHENTICATED + COMPLETE PROFILE (Provider)
│
├─ Can see: /provider/*, /
├─ On /: Redirect to /provider
├─ On /provider/*: Full access (all routes)
├─ On /app: Redirect to /provider
└─ On /provider/onboarding: Redirect to /provider
```

