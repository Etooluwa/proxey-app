import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { useSession } from "../../auth/authContext";
import { useToast } from "../../components/ui/ToastProvider";
import "../../App.css";

const ROLE_TABS = [
  { id: "client", label: "Client" },
  { id: "provider", label: "Service Provider" },
];

function SignUpPage() {
  const { register } = useSession();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState(ROLE_TABS[0].id);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (location.state?.role) {
      setRole(location.state.role);
    }
  }, [location.state]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);

    if (!email || !password || !confirmPassword) {
      setFormError("Fill in all fields to continue.");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await register({ email, password, role });
      toast.push({
        title: "Account created",
        description:
          "Your account is ready. Check your inbox if email confirmation is required.",
        variant: "success",
      });
      if (result?.session) {
        const onboardingPath = role === "provider" ? "/provider/onboarding" : "/onboarding";
        navigate(onboardingPath, { replace: true });
      } else {
        navigate("/auth/sign-in", {
          replace: true,
          state: { role, email },
        });
      }
    } catch (error) {
      setFormError(error.message || "Failed to create account.");
      toast.push({
        title: "Sign-up failed",
        description: error.message,
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page page--centered page--gradient">
      <div className="auth">
        <section className="auth__intro">
          <span className="eyebrow">Create an account</span>
          <h1 className="auth__title">
            {role === "provider" ? "Grow with Proxey" : "Find your next go-to pro"}
          </h1>
          <p className="auth__support">
            {role === "provider"
              ? "Join a trusted marketplace and start receiving qualified bookings within minutes."
              : "Curate your home team of providers and handle payments securely on Proxey."}
          </p>
        </section>

        <section className="card auth__card">
          <div className="tabs" role="tablist" aria-label="Select account type">
            {ROLE_TABS.map((tab) => (
              <button
                key={tab.id}
                className={`tab ${role === tab.id ? "tab--active" : ""}`}
                type="button"
                role="tab"
                aria-selected={role === tab.id}
                onClick={() => setRole(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form className="form form--stacked" onSubmit={handleSubmit}>
            <Input
              id="sign-up-email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />
            <Input
              id="sign-up-password"
              label="Password"
              type="password"
              placeholder="Create a secure password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
            />
            <Input
              id="sign-up-confirm"
              label="Confirm password"
              type="password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
            />
            {formError ? <div className="alert alert--error">{formError}</div> : null}
            <Button type="submit" className="button--full" loading={submitting}>
              Create account
            </Button>
          </form>

          <p className="auth__hint">
            Already have an account?{" "}
            <Link className="link" to="/auth/sign-in" state={{ role, email }}>
              Sign in
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}

export default SignUpPage;
