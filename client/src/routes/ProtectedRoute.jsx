import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSession } from "../auth/authContext";

function ProtectedRoute({ requireProfile = true }) {
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

  if (requireProfile && !isProfileComplete && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
