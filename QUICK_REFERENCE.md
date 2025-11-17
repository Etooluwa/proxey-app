# Proxey Auth System - Quick Reference Guide

## Key Files at a Glance

| File | Purpose | Key Export |
|------|---------|-----------|
| `authContext.jsx` | Core auth state, login/register/logout | `AuthProvider`, `useSession()` |
| `ProtectedRoute.jsx` | Requires authentication + optionally complete profile | Route guard component |
| `ProviderRoute.jsx` | Requires provider role specifically | Role-based access control |
| `RoleRedirect.jsx` | Smart routing at root (/) based on role/profile | Entry point router |
| `SignInPage.jsx` | Login page with role selection | `/auth/sign-in` |
| `SignUpPage.jsx` | Registration page with role selection | `/auth/sign-up` |
| `OnboardingPage.jsx` | Client profile setup (3 steps) | `/onboarding` |
| `ProviderOnboardingPage.jsx` | Provider business setup (5 steps) | `/provider/onboarding` |

---

## Critical Decision Points

### 1. After User Signs Up
```javascript
// In SignUpPage.jsx
if (session exists) {
  // Direct session returned (no email verification needed)
  Navigate to /onboarding
} else {
  // Session null (email verification required)
  Navigate to /auth/sign-in with state
}
```

### 2. After User Logs In
```javascript
// In SignInPage.jsx
const profileCompleteNow = 
  role === "provider" 
    ? true  // Providers skip this check
    : isProfileCompleteShape(profile)

if (profileCompleteNow) {
  Navigate to /provider (if provider) or /app (if client)
} else {
  Navigate to /onboarding (clients only)
}
```

### 3. On Root Path (/)
```javascript
// In RoleRedirect.jsx
if (!authenticated) {
  Show LoginSignup component
} else if (client && !profileComplete) {
  Redirect to /onboarding
} else if (provider && !profileComplete) {
  Redirect to /provider/onboarding
} else {
  Redirect to appropriate dashboard
}
```

---

## Common Scenarios

### Scenario 1: New Client Signup
```
Client clicks "Sign Up" 
→ Selects "Client" role
→ Enters email/password
→ Confirms password
→ register() called
→ Session created (or pending verification)
→ Redirect to /onboarding (OR /auth/sign-in if email verification needed)
→ Complete 3-step profile
→ Redirect to /app (client dashboard)
```

### Scenario 2: New Provider Signup
```
Provider clicks "Sign Up"
→ Selects "Service Provider" role
→ Enters email/password
→ Confirms password
→ register() called
→ Session created (or pending verification)
→ Redirect to /onboarding (first!) OR /auth/sign-in if email verification needed
→ Note: First page shows /onboarding but RoleRedirect will redirect to /provider/onboarding
→ Complete 5-step provider setup
→ Redirect to /provider (provider dashboard)
```

### Scenario 3: Returning Client Login
```
Client visits /auth/sign-in
→ Selects "Client" role (auto-fills if remembered)
→ Enters email/password
→ login() called
→ Check: profile complete?
→ YES → Redirect to /app (stay on dashboard)
→ NO → Redirect to /onboarding (complete profile)
```

### Scenario 4: Returning Provider Login
```
Provider visits /auth/sign-in
→ Selects "Service Provider" role
→ Enters email/password
→ login() called
→ Check: profile complete? (ignored for providers)
→ Always treated as complete → Redirect to /provider dashboard
→ If actually incomplete, ProtectedRoute redirects to /provider/onboarding
```

---

## Profile Completion Rules

### Client Profile Complete When:
```javascript
profile.name !== "" && profile.name !== null &&
profile.phone !== "" && profile.phone !== null &&
profile.defaultLocation !== "" && profile.defaultLocation !== null
```

### Provider Profile Complete When:
```javascript
// Currently handled separately - must complete all 5 onboarding steps
// No explicit check in auth context - relies on updateProfile() being called
// with complete data
```

---

## localStorage Keys Used

```javascript
// Session & Profile
localStorage.getItem("proxey.auth.session")              // Current session
localStorage.getItem("proxey.profile:{userId}")          // User profile
localStorage.getItem("proxey.userRoles")                 // Email → role map

// User preferences
localStorage.getItem("proxey.lastRole")                  // Client or provider
localStorage.getItem("proxey.lastEmail")                 // If "remember me" checked
localStorage.getItem("proxey.hasLoggedIn:{userId}")      // Login history
```

---

## Route Protection Summary

```
Route                        | Guard Type      | Requires Profile | Redirects To
---------------------------|-----------------|------------------|--------------
/auth/sign-in              | None            | No               | N/A
/auth/sign-up              | None            | No               | N/A
/                          | RoleRedirect    | Yes              | Dashboard/Onboarding
/onboarding                | ProtectedRoute  | No               | /auth/sign-in if not auth
/provider/onboarding       | ProtectedRoute  | No               | /auth/sign-in if not auth
/app/*                     | ProtectedRoute  | Yes              | /auth/sign-in or /onboarding
/provider/*                | ProtectedRoute  | No (profile OK)  | /auth/sign-in
                           | + ProviderRoute | (role check)     | /app if not provider
```

---

## Auth Methods (from useSession hook)

```javascript
const {
  // State
  session,              // Current session object
  profile,              // Current profile object
  loading,              // True while initializing
  authError,            // Last error message
  isProfileComplete,    // Boolean - profile has required fields
  
  // Methods
  login,                // (email, password, role) → Promise<{session, profile}>
  register,             // (email, password, role) → Promise<{session, profile}>
  logout,               // () → Promise<void>
  updateProfile,        // (partialProfile, photoFile?) → Promise<profile>
  
  // Utils
  isProfileCompleteShape // (profile) → Boolean
} = useSession();
```

---

## Common Bugs & Workarounds

| Issue | Location | Workaround | Status |
|-------|----------|-----------|--------|
| Email used as defaultLocation | OnboardingPage.jsx:64 | Ask user for actual location | Known issue |
| Provider Stripe Step incomplete | ProviderOnboardingPage.jsx:797 | Step 5 doesn't navigate | TODO |
| Password reset not implemented | SignInPage.jsx:170 | Shows placeholder message | TODO |
| Photo upload optional but required | Both onboarding | User can skip photo | Working |

---

## Redirect Chain Example: New Provider

```
User navigates to /app (by mistake)
    ↓
ProtectedRoute requireProfile={true} checks: Is user authenticated? YES
    ↓
ProtectedRoute checks: Is profile complete? NO
    ↓
Navigate to /onboarding
    ↓
User is on /onboarding but role is "provider"
    ↓
RoleRedirect at root doesn't apply (not on /)
    ↓
But when navigating programmatically, use /provider/onboarding instead
    ↓
Actually: Navigate to /onboarding (ClientOnboardingPage)
→ User completes 3 steps
→ updateProfile() called
→ navigate("/app")
→ But wait - isProfileComplete is still false for provider!
→ ProtectedRoute redirects back to /onboarding
→ Infinite loop? No - because now it's treating them as incomplete client
→ This highlights the provider/client profile distinction

BETTER FLOW:
When provider signs up → Go directly to /provider/onboarding, not /onboarding
When provider logs in with incomplete provider profile → Go to /provider/onboarding
```

---

## Testing Checklist

- [ ] Can unauthenticated user access /auth/sign-in?
- [ ] Can unauthenticated user access /auth/sign-up?
- [ ] Does unauthenticated user get redirected from /app?
- [ ] Does unauthenticated user get redirected from /provider?
- [ ] Can new client complete signup → onboarding → dashboard?
- [ ] Can new provider complete signup → provider onboarding → dashboard?
- [ ] Can existing client login → dashboard?
- [ ] Can existing provider login → dashboard?
- [ ] Does role mismatch on login show error?
- [ ] Does incomplete profile redirect to onboarding?
- [ ] Does complete profile prevent onboarding access?
- [ ] Does session persist after page refresh?
- [ ] Does session sync across multiple tabs?
- [ ] Does logout clear all session data?
- [ ] Does photo upload work (if configured)?

---

## Integration Points

### With Supabase
- `supabase.auth.signUp()` - Create account
- `supabase.auth.signInWithPassword()` - Login
- `supabase.auth.signOut()` - Logout
- `supabase.auth.updateUser()` - Update profile metadata
- `supabase.auth.getSession()` - Check current session
- `supabase.auth.onAuthStateChange()` - Listen for changes

### With Photo Storage
- Photo upload uses Supabase storage (see `photoUpload.js`)
- Stored in user-specific bucket
- URL included in profile

### With Navigation
- React Router v6 used throughout
- `useNavigate()` for programmatic routing
- `useLocation()` for accessing route state
- Route parameters preserved in `state` object

---

## Performance Notes

- Session loaded from localStorage on app startup (instant)
- Supabase validation happens in background
- Route guards don't block rendering until loading = false
- Profile check is synchronous (localStorage lookup)
- No API calls for route decisions (all client-side)

---

## Security Considerations

- Passwords never stored locally (only in Supabase)
- Access tokens stored in localStorage (vulnerable to XSS)
- Refresh token stored in localStorage (vulnerable to XSS)
- Consider: HttpOnly cookies in production
- Role can be changed on server, needs re-validation on login
- Session check on each route navigation
- Fallback to local mode if Supabase unavailable (less secure)

