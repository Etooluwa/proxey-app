import { Navigate } from "react-router-dom";
import { useSession } from "../auth/authContext";
import LoginSignup from "../pages/LoginSignup";

function resolveUserRole(session) {
  return (
    session?.user?.role ||
    session?.user?.metadata?.role ||
    session?.user?.user_metadata?.role ||
    "client"
  );
}

function RoleRedirect() {
  const {
    session,
    loading,
    login,
    register,
    isProfileComplete,
    authError,
    clearAuthError,
  } = useSession();

  if (loading) {
    return (
      <div className="page page--centered">
        <span aria-live="polite">Loading…</span>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <LoginSignup
        onLogin={async ({ role, email, password }) => {
          await login({ email, password, role });
        }}
        onSignup={async ({ role, email, password }) => {
          await register({ email, password, role });
        }}
        globalError={authError}
        onClearError={clearAuthError}
      />
    );
  }

  const userRole = resolveUserRole(session);

  // Admin users skip onboarding and go directly to admin panel
  if (userRole === "admin") {
    return <Navigate to="/admin" replace />;
  }

  const onboardingPath =
    userRole === "provider" ? "/provider/onboarding" : "/onboarding";

  // Check if client profile is incomplete and redirect to onboarding
  if (!isProfileComplete) {
    return <Navigate to={onboardingPath} replace />;
  }

  return (
    <Navigate
      to={userRole === "provider" ? "/provider" : "/app"}
      replace
    />
  );
}

export default RoleRedirect;
