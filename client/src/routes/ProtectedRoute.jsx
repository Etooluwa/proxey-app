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
      <div
        aria-hidden="true"
        style={{ minHeight: "100vh", background: "#FBF7F2" }}
      >
        <span
          aria-live="polite"
          style={{
            position: "absolute",
            width: 1,
            height: 1,
            padding: 0,
            margin: -1,
            overflow: "hidden",
            clip: "rect(0, 0, 0, 0)",
            whiteSpace: "nowrap",
            border: 0,
          }}
        >
          Loading your workspace…
        </span>
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
