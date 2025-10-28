import "./../../styles/login.css";

export default function AuthTabs({ value, onChange }) {
  return (
    <div className="auth-tabs" role="tablist" aria-label="Account type">
      {[
        { id: "client", label: "Client" },
        { id: "provider", label: "Service Provider" },
      ].map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={value === tab.id}
          className={`auth-tab ${value === tab.id ? "is-active" : ""}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
