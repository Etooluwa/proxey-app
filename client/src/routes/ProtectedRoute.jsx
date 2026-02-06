import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSession } from "../auth/authContext";

function resolveUserRole(session) {
  return (
    session?.user?.role ||
    session?.user?.metadata?.role ||
    session?.user?.user_metadata?.role ||
    "client"
  );
}

function ProtectedRoute({ children, allowedRoles, requireProfile = true }) {
  const { session, loading, isProfileComplete } = useSession();
  const location = useLocation();
  const userRole = resolveUserRole(session);

  if (loading) {
    return (
      <div className="page page--centered">
        <span aria-live="polite">Loading your workspace…</span>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <Navigate
        to="/"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    const fallbackPath = userRole === "admin" ? "/admin" : userRole === "provider" ? "/provider" : "/app";
    return <Navigate to={fallbackPath} replace />;
  }

  if (requireProfile && !isProfileComplete) {
    const onboardingPath =
      userRole === "provider" ? "/provider/onboarding" : "/onboarding";
    if (location.pathname !== onboardingPath) {
      return <Navigate to={onboardingPath} replace />;
    }
  }

  // Render children if provided, otherwise use outlet for nested routes
  if (children) {
    return children;
  }

  return <Outlet />;
}

export default ProtectedRoute;
