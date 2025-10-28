import { useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import BottomNav from "../nav/BottomNav";
import Button from "../ui/Button";
import "../../styles/appShell.css";
import "../../App.css";
import { useSession } from "../../auth/authContext";

const NAV_ITEMS = [
  { label: "Home", to: "/app", icon: "home" },
  { label: "Browse", to: "/app/browse", icon: "compass" },
  { label: "Book", to: "/app/book", icon: "plus" },
  { label: "Bookings", to: "/app/bookings", icon: "calendar" },
  { label: "Account", to: "/app/account", icon: "user" },
];

function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { session } = useSession();

  const pageTitle = useMemo(() => {
    if (location.pathname.startsWith("/app/browse")) return "Browse Providers";
    if (location.pathname.startsWith("/app/book/confirm")) return "Booking Confirmation";
    if (location.pathname.startsWith("/app/book")) return "Book a Service";
    if (location.pathname.startsWith("/app/bookings")) return "My Bookings";
    if (location.pathname.startsWith("/app/account")) return "Account";
    return "Dashboard";
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <div className="app-shell__brand" aria-label="Proxey home">
          Proxey
        </div>
        <div className="app-shell__actions">
          <span aria-live="polite" className="visually-hidden">
            Signed in as {session?.user?.email}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate("/app/book")}
            aria-label="Start a new booking"
          >
            New Booking
          </Button>
        </div>
      </header>
      <main className="app-shell__main" aria-live="polite">
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
