import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSession } from "../auth/authContext";

function ProviderRoute() {
  const { session, loading } = useSession();
  const location = useLocation();

  if (loading) {
    return (
      <div className="page page--centered">
        <span aria-live="polite">Preparing your workspace…</span>
      </div>
    );
  }

  if (session?.user?.role !== "provider") {
    return <Navigate to="/app" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export default ProviderRoute;
