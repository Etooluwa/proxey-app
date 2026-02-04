import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/authContext";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (session?.user) {
      const role = session.user.role || "client";
      // Redirect based on role
      if (role === "provider") {
        navigate("/provider", { replace: true });
      } else {
        navigate("/app", { replace: true });
      }
    } else {
      // No session, redirect to login
      navigate("/auth/sign-in", { replace: true });
    }
  }, [session, loading, navigate]);

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      flexDirection: "column",
      gap: "16px"
    }}>
      <div style={{
        width: "40px",
        height: "40px",
        border: "3px solid #f3f3f3",
        borderTop: "3px solid #F58027",
        borderRadius: "50%",
        animation: "spin 1s linear infinite"
      }} />
      <p style={{ color: "#666" }}>Completing sign in...</p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
