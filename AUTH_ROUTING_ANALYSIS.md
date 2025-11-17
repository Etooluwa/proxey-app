# Proxey App: Authentication & Routing Flow Analysis

## Overview
The Proxey application implements a dual-role authentication system (Client vs Service Provider) with intelligent routing logic that directs users to appropriate onboarding or dashboard pages based on their role and profile completion status.

---

## 1. Authentication Architecture

### Core Auth Context: `/Users/etosegun/proxeyapp/client/src/auth/authContext.jsx`

#### Key Features:
- **Hybrid Authentication**: Supports both Supabase and local fallback modes
- **Session Persistence**: Uses localStorage for session storage
- **Profile Management**: Stores profile data separately with completion tracking
- **Role Management**: Maintains role-to-email mapping for account validation

#### Storage Keys:
```javascript
SESSION_STORAGE_KEY = "proxey.auth.session"
PROFILE_STORAGE_KEY = "proxey.profile"
LOCAL_ROLE_KEY = "proxey.userRoles"
```

#### Session Object Structure:
```javascript
{
  user: {
    id: string,
    email: string,
    role: "client" | "provider",
    metadata: object
  },
  accessToken: string,
  refreshToken: string,
  expiresAt: number,
  mode: "supabase" | "local"
}
```

#### Profile Completion Check:
A profile is considered complete when it contains:
- `name`: Full name
- `phone`: Phone number
- `defaultLocation`: Default location

```javascript
function isProfileCompleteShape(profile) {
  return Boolean(profile.name && profile.phone && profile.defaultLocation);
}
```

#### Auth Methods:

**login({ email, password, role })**
- Validates email/password pair
- Checks if role matches stored role (prevents role mismatch)
- Retrieves existing profile or creates new session
- Returns: `{ session, profile }`

**register({ email, password, role })**
- Creates new account with role metadata
- Sets local role mapping
- Returns: `{ session, profile: null }` (new users have no profile)

**updateProfile(partialProfile, photoFile)**
- Updates user profile with optional photo upload
- Persists to both localStorage and Supabase
- Handles photo upload via Supabase storage

---

## 2. Route Configuration

### Main App Routes: `/Users/etosegun/proxeyapp/client/src/App.js`

```
/                           → RoleRedirect (entry point, intelligent routing)
/auth/sign-in               → SignInPage
/auth/sign-up               → SignUpPage

Protected Routes (authenticated users only):
├─ /onboarding              → OnboardingPage (client profile setup, 3 steps)
├─ /provider/onboarding     → ProviderOnboardingPage (provider setup, 5 steps)
│
├─ /app/*                   → AppShell (client protected routes)
│  ├─ /app                  → AppDashboard
│  ├─ /app/browse           → BrowsePage
│  ├─ /app/book             → BookingFlowPage
│  ├─ /app/bookings         → BookingsPage
│  ├─ /app/messages         → MessagesPage
│  └─ /app/account          → AccountPage
│
└─ /provider/*              → ProviderShell (provider protected routes)
   ├─ /provider             → ProviderDashboard
   ├─ /provider/jobs        → ProviderJobs
   ├─ /provider/earnings    → ProviderEarnings
   ├─ /provider/schedule    → ProviderSchedule
   └─ /provider/profile     → ProviderProfile

Public Checkout Routes:
├─ /checkout                → BookingCheckoutPage
├─ /success                 → SuccessPage
└─ /cancel                  → CancelPage
```

---

## 3. Route Guards & Protection

### ProtectedRoute: `/Users/etosegun/proxeyapp/client/src/routes/ProtectedRoute.jsx`

**Purpose**: Ensures user is authenticated and optionally has complete profile

```javascript
function ProtectedRoute({ requireProfile = true })
```

**Logic**:
1. While loading: Show loading message
2. Not authenticated: Redirect to `/auth/sign-in` (preserves intended path)
3. Profile incomplete and `requireProfile=true`: Redirect to `/onboarding`
4. All checks pass: Allow access

**Usage**:
- `<ProtectedRoute requireProfile={false} />` for onboarding routes (allows access before profile complete)
- `<ProtectedRoute />` for dashboard routes (requires complete profile)

### ProviderRoute: `/Users/etosegun/proxeyapp/client/src/routes/ProviderRoute.jsx`

**Purpose**: Role-based access control for provider-only routes

**Logic**:
1. While loading: Show "Preparing your workspace..."
2. User role is NOT "provider": Redirect to `/app` (client routes)
3. User is provider: Allow access

---

## 4. Intelligent Redirect Logic

### RoleRedirect Component: `/Users/etosegun/proxeyapp/client/src/routes/RoleRedirect.jsx`

**Purpose**: Main entry point (/) that intelligently routes users based on auth state and role

**Redirect Flow**:
```
User visits /
    ↓
Is user authenticated?
    ├─ NO → Show LoginSignup component (handles both login/signup with role selection)
    │
    └─ YES → Check user role and profile completion
        │
        ├─ Role = "client" & profile incomplete
        │   └─ Redirect to /onboarding (client setup)
        │
        ├─ Role = "provider" & profile incomplete
        │   └─ Redirect to /provider/onboarding (provider setup)
        │
        └─ Profile complete (both roles)
            └─ Redirect to role-specific dashboard
                ├─ provider → /provider
                └─ client   → /app
```

**Key Code**:
```javascript
// Check if client profile is incomplete and redirect to onboarding
if (session.user.role === "client" && !isProfileComplete) {
  return <Navigate to="/onboarding" replace />;
}

// Check if provider profile is incomplete and redirect to provider onboarding
if (session.user.role === "provider" && !isProfileComplete) {
  return <Navigate to="/provider/onboarding" replace />;
}

// Redirect to appropriate dashboard
return (
  <Navigate
    to={session.user.role === "provider" ? "/provider" : "/app"}
    replace
  />
);
```

---

## 5. Authentication Pages

### SignInPage: `/Users/etosegun/proxeyapp/client/src/pages/auth/SignInPage.jsx`

**Features**:
- Role selection tabs (Client / Service Provider)
- Email/password login
- "Remember me" checkbox (stores email in localStorage)
- Password reset placeholder (TODO: integrate with Supabase)

**Redirect Logic After Login**:
```javascript
const profileCompleteNow = 
  role === "provider"
    ? true  // Providers skip initial onboarding on first login
    : isProfileCompleteShape(result?.profile) || isProfileComplete;

if (profileCompleteNow) {
  // Has complete profile → Go to dashboard
  const destination = redirectPath
    ? redirectPath  // Restore original destination if available
    : role === "provider"
      ? "/provider"
      : "/app";
  navigate(destination, { replace: true });
} else {
  // Incomplete profile → Go to onboarding
  navigate("/onboarding", { replace: true });
}
```

**Special Behavior**: Providers are treated as having "complete" profiles on first login (they must complete provider onboarding form).

### SignUpPage: `/Users/etosegun/proxeyapp/client/src/pages/auth/SignUpPage.jsx`

**Features**:
- Role selection tabs
- Email/password/confirm password
- Form validation

**Redirect Logic After Signup**:
```javascript
if (result?.session) {
  navigate("/onboarding", { replace: true });  // Has session → onboarding
} else {
  navigate("/auth/sign-in", {
    replace: true,
    state: { role, email }
  });  // No session → requires email confirmation, go to sign-in
}
```

**Note**: Clients go to `/onboarding`, providers would go to `/provider/onboarding` via RoleRedirect.

---

## 6. Onboarding Flows

### Client Onboarding: `/Users/etosegun/proxeyapp/client/src/pages/OnboardingPage.jsx`

**3-Step Process**:
1. **Step 1**: Name and Photo (optional)
2. **Step 2**: Email and Phone (required)
3. **Step 3**: Payment Method (optional, shows coming soon)

**Completion**:
```javascript
const handleCompleteOnboarding = async () => {
  await updateProfile({
    name: form.name,
    phone: form.phone,
    email: form.email,
    defaultLocation: form.email,  // Uses email as placeholder
    isComplete: true
  }, form.photo);

  navigate("/app", { replace: true });  // → Client dashboard
};
```

### Provider Onboarding: `/Users/etosegun/proxeyapp/client/src/pages/ProviderOnboardingPage.jsx`

**5-Step Process**:
1. **Step 1**: Business Profile (name, category, city)
2. **Step 2**: Photo Upload (optional, can skip)
3. **Step 3**: Services Setup (add service offerings with prices/durations)
4. **Step 4**: Availability Schedule (set working hours for each day)
5. **Step 5**: Stripe Connection (payment setup)

**Key States**:
```javascript
const [form, setForm] = useState({
  name: "",
  category: "",
  city: "",
  photo: null,
  photoPreview: null,
  services: [],  // Array of { name, price, duration }
  availability: {
    monday: { enabled: true, from: "9:00 AM", to: "5:00 PM", ... },
    // ... all 7 days
  }
});
```

**Completion**: Currently Step 5 shows Stripe button but doesn't navigate (TODO implementation).

---

## 7. Local Storage Keys Used

| Key | Purpose | Value Type |
|-----|---------|-----------|
| `proxey.auth.session` | Current session data | JSON string |
| `proxey.profile:{userId}` | User profile data | JSON string |
| `proxey.userRoles` | Email → role mapping | JSON object |
| `proxey.lastRole` | Last used role | "client" or "provider" |
| `proxey.lastEmail` | Last email (if "remember me") | string |
| `proxey.hasLoggedIn:{userId}` | Login history flag | "true" or undefined |

---

## 8. Authentication Flow Diagrams

### Sign Up Flow
```
SignUpPage
    ↓ user fills form + selects role
register({ email, password, role })
    ├─ Supabase.auth.signUp()
    ├─ Set local role mapping
    └─ Set session
    ↓
Has session returned?
    ├─ YES → Navigate to /onboarding
    └─ NO → Navigate to /auth/sign-in with state
```

### Sign In Flow
```
SignInPage
    ↓ user fills form + selects role
login({ email, password, role })
    ├─ Validate role matches stored role
    ├─ Supabase.auth.signInWithPassword()
    └─ Return { session, profile }
    ↓
Is role "provider" OR profile complete?
    ├─ YES → Navigate to dashboard (/provider or /app)
    └─ NO → Navigate to /onboarding
```

### Root Route Navigation
```
User visits / or app initializes
    ↓
RoleRedirect checks auth state
    ├─ Not authenticated → Show LoginSignup UI
    ├─ Provider + incomplete profile → Redirect to /provider/onboarding
    ├─ Client + incomplete profile → Redirect to /onboarding
    ├─ Provider + complete profile → Redirect to /provider
    └─ Client + complete profile → Redirect to /app
```

---

## 9. Key Differences: Client vs Provider

| Aspect | Client | Provider |
|--------|--------|----------|
| **Initial Login** | Goes to onboarding if profile incomplete | Skipped (treated as complete) |
| **Onboarding Route** | `/onboarding` | `/provider/onboarding` |
| **Onboarding Steps** | 3 steps (basic profile) | 5 steps (full business setup) |
| **Profile Requirements** | name, phone, defaultLocation | name, category, city, services, availability |
| **Dashboard** | `/app` | `/provider` |
| **Route Guard** | ProtectedRoute | ProtectedRoute + ProviderRoute |

---

## 10. Critical State Management Points

### What Triggers Redirects to Onboarding:
1. **New login**: Profile missing required fields (clients only)
2. **Route guard**: ProtectedRoute component with `requireProfile=true`
3. **RoleRedirect**: Root path navigation checks profile completion
4. **SignInPage**: After login, checks `isProfileComplete` flag

### What Marks Profile as Complete:
- All three fields set: `name`, `phone`, `defaultLocation`
- Flag updated when `updateProfile()` is called with valid data
- Persisted in localStorage and Supabase metadata

### Session Persistence:
- Session restored from localStorage on app load
- Supabase listener syncs auth state changes
- Falls back to local mode if Supabase unavailable

---

## 11. Edge Cases & Known Issues

1. **Provider First Login**: Providers are treated as "complete" on login, allowing them to skip to `/provider` even without completing provider onboarding. This redirects them back to `/provider/onboarding` via ProtectedRoute.

2. **OnboardingPage Bug**: Uses email as `defaultLocation` placeholder (line 64 in OnboardingPage.jsx) - likely a temporary implementation.

3. **Provider Onboarding Step 5**: Stripe Connect button doesn't navigate anywhere - marked as TODO.

4. **Email Confirmation**: SignUp flow expects email confirmation; if not required, users can login immediately. If required, they're directed back to sign-in.

5. **Password Reset**: Marked as TODO - placeholder message shown instead of actual reset.

6. **Role Mismatch**: If user tries to login with wrong role, auth context throws error with message like "This account is registered as a provider. Switch to that role to sign in."

---

## 12. File Structure Summary

```
client/src/
├── auth/
│   └── authContext.jsx                 # Core auth logic & session management
├── routes/
│   ├── ProtectedRoute.jsx              # Requires authentication
│   ├── ProviderRoute.jsx               # Requires provider role
│   └── RoleRedirect.jsx                # Intelligent routing at /
├── pages/
│   ├── LoginSignup.jsx                 # Combined login/signup UI
│   ├── OnboardingPage.jsx              # Client onboarding (3 steps)
│   ├── ProviderOnboardingPage.jsx      # Provider onboarding (5 steps)
│   └── auth/
│       ├── SignInPage.jsx              # Sign-in page
│       └── SignUpPage.jsx              # Sign-up page
├── components/
│   └── auth/
│       └── AuthTabs.jsx                # Role selector component
└── App.js                              # Route configuration
```

---

## 13. Data Flow Summary

```
User Action → Auth Method (login/register)
    ↓
Supabase API / Local Fallback
    ↓
Update Auth Context (session, profile)
    ↓
Persist to localStorage
    ↓
Route Guard (ProtectedRoute/ProviderRoute) checks context
    ↓
Conditional Navigation (dashboard/onboarding/login)
    ↓
UI Components use useSession() hook for data
```

