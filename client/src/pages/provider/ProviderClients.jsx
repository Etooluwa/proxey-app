import { useEffect, useState, useMemo } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useSession } from "../../auth/authContext";
import { request } from "../../data/apiClient";
import GradientHeader from "../../components/ui/GradientHeader";
import Avatar from "../../components/ui/Avatar";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import Footer from "../../components/ui/Footer";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtLtv(cents) {
  if (!cents && cents !== 0) return "$0";
  const dollars = cents > 1000 ? cents / 100 : cents;
  return `$${dollars.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function fmtLastVisit(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getInitials(name) {
  if (!name) return "C";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ─── Status badge config ─────────────────────────────────────────────────────

const STATUS_CONFIG = {
  active:   { label: "Active",   variant: "success" },
  "at-risk":{ label: "At risk",  variant: "warning" },
  new:      { label: "New",      variant: "accent"  },
};

const FILTERS = ["All", "Active", "At risk", "New"];

// ─── Page ─────────────────────────────────────────────────────────────────────

const ProviderClients = () => {
  const navigate = useNavigate();
  const { onMenu } = useOutletContext() || {};
  const { session } = useSession();

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await request("/provider/clients");
        if (!cancelled) setClients(data.clients || []);
      } catch (err) {
        console.error("Failed to load provider clients", err);
        if (!cancelled) setClients([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [session]);

  const filtered = useMemo(() => {
    if (activeFilter === "All") return clients;
    const map = { Active: "active", "At risk": "at-risk", New: "new" };
    return clients.filter((c) => c.status === map[activeFilter]);
  }, [clients, activeFilter]);

  const subtitle = loading ? "Loading…" : `${clients.length} client${clients.length !== 1 ? "s" : ""}`;

  return (
    <div className="flex flex-col min-h-screen bg-background font-manrope overflow-y-auto">
      <GradientHeader onMenu={onMenu} title="My kliques" subtitle={subtitle} />

      <div className="flex-1 px-4 pt-8 pb-4 flex flex-col">

        {/* Filter pills */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 no-scrollbar">
          {FILTERS.map((f) => {
            const active = f === activeFilter;
            return (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className="flex-shrink-0 px-4 py-[7px] rounded-pill font-manrope text-[13px] font-semibold focus:outline-none transition-colors"
                style={{
                  background: active ? "#0D1619" : "#FFFFFF",
                  color: active ? "#FFFFFF" : "#0D1619",
                  border: active ? "none" : "1px solid #E5E5EA",
                }}
              >
                {f}
              </button>
            );
          })}
        </div>

        {/* Loading skeletons */}
        {loading &&
          [1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-full h-[76px] rounded-card mb-2 animate-pulse"
              style={{ background: "#E5E5EA" }}
            />
          ))}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <Card className="flex flex-col items-center py-10">
            <svg
              width="40"
              height="40"
              fill="none"
              stroke="#D1D5DB"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
              className="mb-3"
            >
              <path
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="font-manrope text-[15px] font-semibold text-foreground">
              {activeFilter === "All" ? "No clients yet" : `No ${activeFilter.toLowerCase()} clients`}
            </p>
            <p className="font-manrope text-[13px] text-muted mt-1 text-center">
              {activeFilter === "All"
                ? "Clients will appear here once bookings are confirmed"
                : "Try a different filter"}
            </p>
          </Card>
        )}

        {/* Client cards */}
        {!loading &&
          filtered.map((client) => {
            const cfg = STATUS_CONFIG[client.status] || STATUS_CONFIG.new;
            const lastVisit = fmtLastVisit(client.last_visit);

            return (
              <button
                key={client.client_id}
                onClick={() => navigate(`/provider/client/${client.client_id}`)}
                className="w-full text-left focus:outline-none"
              >
                <Card className="flex items-center gap-3.5 mb-2">
                  <Avatar
                    initials={getInitials(client.name)}
                    size={48}
                    bg="#FFF0E6"
                    color="#FF751F"
                  />

                  <div className="flex-1 min-w-0">
                    {/* Name + badge */}
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-manrope text-[16px] font-semibold text-foreground m-0 truncate">
                        {client.name}
                      </p>
                      <Badge label={cfg.label} variant={cfg.variant} />
                    </div>

                    {/* Stats row */}
                    <div className="flex gap-3">
                      <span className="font-manrope text-[12px] text-muted">
                        {client.visits} visit{client.visits !== 1 ? "s" : ""}
                      </span>
                      <span className="font-manrope text-[12px] text-muted">
                        {fmtLtv(client.ltv)} LTV
                      </span>
                      {lastVisit && (
                        <span className="font-manrope text-[12px] text-muted">
                          Last {lastVisit}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Chevron */}
                  <svg
                    width="20"
                    height="20"
                    fill="none"
                    stroke="#6B7280"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                    className="flex-shrink-0"
                  >
                    <path
                      d="M9 5l7 7-7 7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Card>
              </button>
            );
          })}
      </div>

      <Footer />
    </div>
  );
};

export default ProviderClients;
