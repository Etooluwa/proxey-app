import { Navigate, useNavigate } from "react-router-dom";
import { useSession } from "../auth/authContext";
import LoginSignup from "../pages/LoginSignup";

function RoleRedirect() {
  const navigate = useNavigate();
  const { session, loading, login, register, isProfileComplete } = useSession();

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
          const result = await login({ email, password, role });
          // After login, the state will update and RoleRedirect will re-render
          // The new render will check isProfileComplete and redirect appropriately
        }}
        onSignup={async ({ role, email, password }) => {
          const result = await register({ email, password, role });
          // After signup, SignUpPage now redirects to the correct onboarding path
        }}
      />
    );
  }

  // Check if client profile is incomplete and redirect to onboarding
  if (session.user.role === "client" && !isProfileComplete) {
    return <Navigate to="/onboarding" replace />;
  }

  // Check if provider profile is incomplete and redirect to provider onboarding
  if (session.user.role === "provider" && !isProfileComplete) {
    return <Navigate to="/provider/onboarding" replace />;
  }

  return (
    <Navigate
      to={session.user.role === "provider" ? "/provider" : "/app"}
      replace
    />
  );
}

export default RoleRedirect;
