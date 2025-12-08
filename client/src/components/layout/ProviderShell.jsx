import { useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import "../../styles/provider/providerShell.css";
import ProviderBottomNav from "../nav/ProviderBottomNav";
import Button from "../ui/Button";
import { useSession } from "../../auth/authContext";

function ProviderShell() {
  const { session, profile } = useSession();
  const location = useLocation();
  const navigate = useNavigate();

  const pageTitle = useMemo(() => {
    if (location.pathname.startsWith("/provider/jobs")) return "Jobs";
    if (location.pathname.startsWith("/provider/earnings")) return "Earnings";
    if (location.pathname.startsWith("/provider/invoices")) return "Invoices";
    if (location.pathname.startsWith("/provider/schedule")) return "Schedule";
    if (location.pathname.startsWith("/provider/profile")) return "Profile";
    return "Dashboard";
  }, [location.pathname]);

  const displayName =
    profile?.name || session?.user?.metadata?.profile?.name || session?.user?.email;

  return (
    <div className="provider-shell">
      <header className="provider-shell__header">
        <div>
          <p className="provider-shell__eyebrow">{pageTitle}</p>
          <h1 className="provider-shell__title">Hi {displayName} 👋</h1>
        </div>
        <div className="provider-shell__actions">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate("/provider/jobs")}
          >
            View Jobs
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/app")}>
            Client view
          </Button>
        </div>
      </header>
      <main className="provider-shell__main">
        <div className="provider-shell__content" role="region" aria-label={pageTitle}>
          <Outlet />
        </div>
      </main>
      <ProviderBottomNav activePath={location.pathname} />
      <div className="provider-shell__footer-spacer" aria-hidden="true" />
    </div>
  );
}

export default ProviderShell;
