import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSession } from "../auth/authContext";

function ProtectedRoute({ children, allowedRoles, requireProfile = true }) {
  const { session, loading, isProfileComplete } = useSession();
  const location = useLocation();

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
        to="/auth/sign-in"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    // Redirect to the correct dashboard based on their actual role
    return <Navigate to={session.user.role === 'client' ? '/app' : '/provider'} replace />;
  }

  if (requireProfile && !isProfileComplete && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return children ? children : <Outlet />;
}

export default ProtectedRoute;
