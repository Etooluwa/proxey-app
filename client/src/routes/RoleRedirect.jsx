import { Navigate, useNavigate } from "react-router-dom";
import { useSession } from "../auth/authContext";
import LoginSignup from "../pages/LoginSignup";

function RoleRedirect() {
  const navigate = useNavigate();
  const { session, loading, login, register } = useSession();

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
          navigate(role === "provider" ? "/provider" : "/app", { replace: true });
        }}
        onSignup={async ({ role, email, password }) => {
          await register({ email, password, role });
          navigate(role === "provider" ? "/provider" : "/onboarding", {
            replace: true,
          });
        }}
      />
    );
  }

  return (
    <Navigate
      to={session.user.role === "provider" ? "/provider" : "/app"}
      replace
    />
  );
}

export default RoleRedirect;
