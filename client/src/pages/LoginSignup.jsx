import { useState } from "react";
import "./LoginSignup.css";

/**
 * Example usage with navigation
 * ---------------------------------
 * import { useNavigate } from "react-router-dom";
 * const navigate = useNavigate();
 *
 * <LoginSignup
 *   onContinue={({ role, email }) =>
 *     navigate(role === "provider" ? "/provider/setup" : "/dashboard")
 *   }
 * />
 */

export default function LoginSignup({ onContinue }) {
  const [role, setRole] = useState("client");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRoleSelect = (nextRole) => {
    setRole(nextRole);
  };

  const onRoleKeyDown = (event, nextRole) => {
    if (
      event.key === " " ||
      event.key === "Enter" ||
      event.key === "Spacebar" ||
      event.key === "Space"
    ) {
      event.preventDefault();
      setRole(nextRole);
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      setRole((prev) => (prev === "client" ? "provider" : "client"));
    }
  };

  const validateEmail = (value) => /\S+@\S+\.\S+/.test(value);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setEmailError("");

    if (!validateEmail(email)) {
      setEmailError("Enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      const payload = { role, email };
      if (typeof onContinue === "function") {
        await onContinue(payload);
      } else {
        // eslint-disable-next-line no-console
        console.log("Continue", payload);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogle = () => {
    // eslint-disable-next-line no-console
    console.log("Continue with Google", { role });
  };

  const handlePhone = () => {
    // eslint-disable-next-line no-console
    console.log("Continue with Phone", { role });
  };

  const emailIsValid = validateEmail(email);

  return (
    <main className="login-signup">
      <div className="login-signup__container">
        <div className="login-signup__logo" aria-hidden="true">
          PROXEY
        </div>
        <h1 className="login-signup__heading">Welcome to Proxey</h1>
        <p className="login-signup__subheading">Sign in or create an account</p>

        <form className="login-signup__form" onSubmit={handleSubmit} noValidate>
          <label className="login-signup__label" htmlFor="role-toggle">
            I am a…
          </label>

          <div
            id="role-toggle"
            className="login-signup__roles"
            role="radiogroup"
            aria-label="Account type"
          >
            {[
              { id: "client", label: "Client" },
              { id: "provider", label: "Provider" },
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={role === option.id}
                className={`login-signup__role ${
                  role === option.id ? "login-signup__role--active" : ""
                }`}
                onClick={() => handleRoleSelect(option.id)}
                onKeyDown={(event) => onRoleKeyDown(event, option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>

          <label className="login-signup__label" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            aria-required="true"
            aria-invalid={Boolean(emailError)}
            aria-describedby={emailError ? "email-error" : undefined}
            className="login-signup__input"
            autoComplete="email"
          />
          {emailError ? (
            <p id="email-error" role="alert" className="login-signup__error">
              {emailError}
            </p>
          ) : null}

          <button
            type="submit"
            className="login-signup__primary"
            disabled={!emailIsValid || isSubmitting}
          >
            {isSubmitting ? (
              <span className="login-signup__spinner" aria-label="Loading" />
            ) : (
              "Continue"
            )}
          </button>

          <div className="login-signup__divider">
            <span className="login-signup__divider-line" />
            <span className="login-signup__divider-text">or</span>
            <span className="login-signup__divider-line" />
          </div>

          <button
            type="button"
            className="login-signup__secondary"
            onClick={handleGoogle}
          >
            <span className="login-signup__secondary-icon" aria-hidden="true">
              <span className="login-signup__icon login-signup__icon--google" />
            </span>
            Continue with Google
          </button>

          <button
            type="button"
            className="login-signup__secondary"
            onClick={handlePhone}
          >
            <span className="login-signup__secondary-icon" aria-hidden="true">
              <span className="login-signup__icon login-signup__icon--phone" />
            </span>
            Continue with Phone
          </button>
        </form>

        <p className="login-signup__legal">
          By continuing, you agree to our{" "}
          <a className="login-signup__link" href="/terms">
            Terms of Service
          </a>{" "}
          and{" "}
          <a className="login-signup__link" href="/privacy">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </main>
  );
}

LoginSignup.defaultProps = {
  onContinue: undefined,
};
