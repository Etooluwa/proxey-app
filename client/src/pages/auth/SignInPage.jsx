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

function SignInPage() {
  const { login, authError, isProfileComplete, isProfileCompleteShape } = useSession();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState(ROLE_TABS[0].id);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const redirectPath = location.state?.from;

  useEffect(() => {
    const storedRole = window.localStorage.getItem("proxey.lastRole");
    if (storedRole && ROLE_TABS.some((tab) => tab.id === storedRole)) {
      setRole(storedRole);
    }
    const storedEmail = window.localStorage.getItem("proxey.lastEmail");
    if (storedEmail) {
      setEmail(storedEmail);
      setRemember(true);
    }
    if (location.state?.role) {
      setRole(location.state.role);
    }
    if (location.state?.email) {
      setEmail(location.state.email);
    }
  }, [location.state]);

  useEffect(() => {
    if (remember) {
      window.localStorage.setItem("proxey.lastEmail", email);
    } else {
      window.localStorage.removeItem("proxey.lastEmail");
    }
  }, [email, remember]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);

    if (!email || !password) {
      setFormError("Enter your email and password to continue.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await login({ email, password, role });
      const signedInEmail = result?.session?.user?.email || email;
      const userId =
        result?.session?.user?.id || result?.session?.user?.email || signedInEmail;
      const loginFlagKey = userId ? `proxey.hasLoggedIn:${userId}` : null;
      const hasLoggedBefore = loginFlagKey
        ? window.localStorage.getItem(loginFlagKey) === "true"
        : false;
      window.localStorage.setItem("proxey.lastRole", role);
      toast.push({
        title: hasLoggedBefore ? "Welcome back!" : "You're signed in",
        description: hasLoggedBefore
          ? `Signed in as ${signedInEmail}`
          : "Let's finish setting up your profile to personalize your experience.",
        variant: hasLoggedBefore ? "success" : "info",
      });
      if (loginFlagKey) {
        window.localStorage.setItem(loginFlagKey, "true");
      }
      const profileCompleteNow =
        role === "provider"
          ? true
          : isProfileCompleteShape(result?.profile) || isProfileComplete;
      if (profileCompleteNow) {
        const destination = redirectPath
          ? redirectPath
          : role === "provider"
          ? "/provider"
          : "/app";
        navigate(destination, { replace: true });
      } else {
        navigate("/onboarding", { replace: true });
      }
    } catch (error) {
      setFormError(error.message || "Failed to sign in.");
      toast.push({
        title: "Sign-in failed",
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
          <span className="eyebrow">Welcome back</span>
          <h1 className="auth__title">
            {role === "provider" ? "Run your service business" : "Book trusted pros"}
          </h1>
          <p className="auth__support">
            {role === "provider"
              ? "Manage your bookings, update availability, and get paid faster."
              : "Discover top-rated providers across the GTA and manage every booking in one place."}
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
              id="sign-in-email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />
            <Input
              id="sign-in-password"
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
            <div className="auth__options">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                />
                <span>Keep me signed in</span>
              </label>
              <button
                type="button"
                className="link"
                onClick={() =>
                  toast.push({
                    title: "Password reset",
                    description:
                      "Password reset emails are handled by Supabase when configured. TODO: integrate reset endpoint.",
                    variant: "info",
                  })
                }
              >
                Forgot password?
              </button>
            </div>
            {(formError || authError) && (
              <div className="alert alert--error">{formError || authError}</div>
            )}
            <Button type="submit" className="button--full" loading={submitting}>
              Sign in
            </Button>
          </form>

          <p className="auth__hint">
            New here?{" "}
            <Link className="link" to="/auth/sign-up" state={{ role }}>
              Create an account
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}

export default SignInPage;
