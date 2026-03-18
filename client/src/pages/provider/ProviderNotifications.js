import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../../auth/authContext";
import { request } from "../../data/apiClient";
import Nav from "../../components/ui/Nav";
import Card from "../../components/ui/Card";
import Footer from "../../components/ui/Footer";

// ─── Alert type config ────────────────────────────────────────────────────────
// Maps notification `type` values to background color + action label

const TYPE_CONFIG = {
  // Milestone / loyalty
  milestone:    { bg: "#FFF0E6", action: "Send reward" },
  loyalty:      { bg: "#FFF0E6", action: "Send reward" },
  // Reschedule / cancellation / reminder
  reschedule:   { bg: "#FEF2F2", action: "View message" },
  cancellation: { bg: "#FEF2F2", action: "View message" },
  reminder:     { bg: "#FEF2F2", action: "View details" },
  // New client / booking completed / review
  new_client:   { bg: "#F0FDF4", action: "View profile" },
  booking_completed: { bg: "#F0FDF4", action: "View booking" },
  review:       { bg: "#F0FDF4", action: "View review" },
};

const DEFAULT_CONFIG = { bg: "#F2F2F7", action: "View" };

function getConfig(type) {
  if (!type) return DEFAULT_CONFIG;
  const key = type.toLowerCase();
  return TYPE_CONFIG[key] || DEFAULT_CONFIG;
}

function formatRelTime(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const ProviderNotifications = () => {
  const navigate = useNavigate();
  const { session } = useSession();

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await request("/provider/notifications");
        if (!cancelled) setAlerts(data.notifications || []);
        // Mark all as read in background
        request("/provider/notifications/read-all", { method: "PATCH" }).catch(() => {});
      } catch (err) {
        console.error("Failed to load notifications:", err);
        if (!cancelled) setAlerts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [session]);

  const handleAction = (alert) => {
    const type = (alert.type || "").toLowerCase();
    if (type === "reschedule" || type === "cancellation") {
      navigate("/provider/messages");
    } else if (type === "new_client") {
      const clientId = alert.data?.client_id;
      if (clientId) navigate(`/provider/client/${clientId}`);
      else navigate("/provider/clients");
    } else if (type === "booking_completed" || type === "reminder") {
      const bookingId = alert.data?.booking_id;
      if (bookingId) navigate(`/provider/appointments/${bookingId}`);
      else navigate("/provider/appointments");
    } else if (type === "review") {
      navigate("/provider/appointments");
    } else {
      // milestone / loyalty / default
      const clientId = alert.data?.client_id;
      if (clientId) navigate(`/provider/client/${clientId}`);
      else navigate("/provider/clients");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-background font-manrope overflow-y-auto">
      <Nav onBack={() => navigate("/provider")} title="Smart alerts" />

      <div className="flex-1 px-4 pt-2 pb-4 flex flex-col">

        {/* Loading skeletons */}
        {loading &&
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-full h-[100px] rounded-card mb-3 animate-pulse"
              style={{ background: "#E5E5EA" }}
            />
          ))}

        {/* Empty state */}
        {!loading && alerts.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 gap-3 mt-16">
            <div
              className="flex items-center justify-center"
              style={{
                width: 56, height: 56, borderRadius: 14,
                background: "#F2F2F7",
              }}
            >
              <svg
                width="24" height="24" fill="none"
                stroke="#6B7280" strokeWidth="1.5" viewBox="0 0 24 24"
              >
                <path
                  d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
                  strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="font-manrope text-[15px] font-semibold text-foreground">
              No alerts
            </p>
            <p className="font-manrope text-[13px] text-muted text-center">
              Smart alerts about your clients and bookings will appear here
            </p>
          </div>
        )}

        {/* Alert cards */}
        {!loading &&
          alerts.map((alert) => {
            const { bg, action } = getConfig(alert.type);
            return (
              <Card
                key={alert.id}
                className="mb-3"
                style={{ background: bg }}
              >
                {/* Title row */}
                <div className="flex justify-between items-start gap-2 mb-1">
                  <p
                    className="font-manrope text-[16px] font-semibold text-foreground m-0 flex-1"
                  >
                    {alert.title || "Alert"}
                  </p>
                  <span className="font-manrope text-[11px] text-muted flex-shrink-0 mt-0.5">
                    {formatRelTime(alert.created_at)}
                  </span>
                </div>

                {/* Body */}
                <p
                  className="font-manrope text-[14px] text-muted m-0 mb-3"
                  style={{ lineHeight: 1.5 }}
                >
                  {alert.body || ""}
                </p>

                {/* Action button */}
                <button
                  onClick={() => handleAction(alert)}
                  className="font-manrope text-[13px] font-semibold focus:outline-none"
                  style={{
                    padding: "8px 18px",
                    borderRadius: 9999,
                    border: "none",
                    background: "#0D1619",
                    color: "#FFFFFF",
                    cursor: "pointer",
                  }}
                >
                  {action}
                </button>
              </Card>
            );
          })}

      </div>

      <Footer />
    </div>
  );
};

export default ProviderNotifications;
