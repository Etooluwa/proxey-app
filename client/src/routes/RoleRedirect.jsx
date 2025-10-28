import { Navigate } from "react-router-dom";
import { useSession } from "../auth/authContext";

function RoleRedirect() {
  const { session, loading } = useSession();

  if (loading) {
    return (
      <div className="page page--centered">
        <span aria-live="polite">Loading…</span>
      </div>
    );
  }

  if (!session?.user) {
    return <Navigate to="/auth/sign-in" replace />;
  }

  return (
    <Navigate
      to={session.user.role === "provider" ? "/provider" : "/app"}
      replace
    />
  );
}

export default RoleRedirect;
