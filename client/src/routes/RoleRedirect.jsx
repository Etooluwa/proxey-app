import { Navigate, useNavigate } from "react-router-dom";
import { useSession } from "../auth/authContext";
import LoginSignup from "../pages/LoginSignup";

function RoleRedirect() {
  const navigate = useNavigate();
  const { session, loading } = useSession();

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
        onContinue={({ role, email }) =>
          navigate("/auth/sign-in", {
            replace: false,
            state: { role, email },
          })
        }
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
