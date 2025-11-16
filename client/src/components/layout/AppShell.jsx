import { useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import BottomNav from "../nav/BottomNav";
import "../../styles/appShell.css";
import "../../App.css";

const NAV_ITEMS = [
  { label: "Home", to: "/app", icon: "home" },
  { label: "Bookings", to: "/app/bookings", icon: "calendar" },
  { label: "Messages", to: "/app/messages", icon: "message" },
  { label: "Profile", to: "/app/account", icon: "user" },
];

function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();

  const pageTitle = useMemo(() => {
    if (location.pathname.startsWith("/app/browse")) return "Browse Providers";
    if (location.pathname.startsWith("/app/book/confirm")) return "Booking Confirmation";
    if (location.pathname.startsWith("/app/book")) return "Book a Service";
    if (location.pathname.startsWith("/app/bookings")) return "My Bookings";
    if (location.pathname.startsWith("/app/messages")) return "Messages";
    if (location.pathname.startsWith("/app/account")) return "Account";
    return "Dashboard";
  }, [location.pathname]);

  const isHomePage = location.pathname === "/app";

  return (
    <div className="app-shell">
      <header className="app-shell__header app-shell__header--welcome">
        <div className="app-shell__header-left">
          <button
            className="app-shell__avatar"
            onClick={() => navigate("/app/account")}
            aria-label="View profile"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z" />
            </svg>
          </button>
          <h1 className="app-shell__welcome-text">Welcome!</h1>
        </div>
        <button
          className="app-shell__notification"
          onClick={() => alert("Notifications coming soon!")}
          aria-label="View notifications"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9z"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M13.73 21a2 2 0 0 1-3.46 0"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </header>
      <main
        className={`app-shell__main${isHomePage ? " app-shell__main--no-padding" : ""}`}
        aria-live="polite"
      >
        <div className="app-shell__content" role="region" aria-label={pageTitle}>
          <Outlet />
        </div>
      </main>
      <BottomNav items={NAV_ITEMS} activePath={location.pathname} />
      <div className="bottom-nav-placeholder" aria-hidden="true" />
    </div>
  );
}

export default AppShell;
