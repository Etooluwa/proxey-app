import { Navigate } from "react-router-dom";
import { useSession } from "../auth/authContext";

function resolveUserRole(session) {
  return (
    session?.user?.role ||
    session?.user?.metadata?.role ||
    session?.user?.user_metadata?.role ||
    "client"
  );
}

function RoleRedirect() {
  const { session, loading, isProfileComplete } = useSession();

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
          Loading…
        </span>
      </div>
    );
  }

  if (!session?.user) {
    return <Navigate to="/login" replace />;
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
