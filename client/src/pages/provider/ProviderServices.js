import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useSession } from "../../auth/authContext";
import { request } from "../../data/apiClient";
import GradientHeader from "../../components/ui/GradientHeader";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import Footer from "../../components/ui/Footer";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtPrice(val) {
  if (!val && val !== 0) return "—";
  return `$${Number(val).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function fmtDuration(mins) {
  if (!mins) return null;
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const ProviderServices = () => {
  const navigate = useNavigate();
  const { onMenu } = useOutletContext() || {};
  const { session } = useSession();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await request("/provider/services");
        if (!cancelled) setServices(data.services || []);
      } catch (err) {
        console.error("Failed to load services", err);
        if (!cancelled) setServices([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [session]);

  // ── Add button (frosted glass, right slot in header) ──────────────────────
  const AddBtn = (
    <button
      onClick={() => navigate("/provider/services/new")}
      className="flex items-center gap-1 focus:outline-none"
      style={{
        padding: "8px 14px",
        borderRadius: 10,
        background: "rgba(255,255,255,0.25)",
        backdropFilter: "blur(10px)",
        border: "none",
        color: "#fff",
        fontFamily: "Manrope, sans-serif",
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      <svg width="14" height="14" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24">
        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
      </svg>
      Add
    </button>
  );

  const subtitle = loading
    ? "Loading…"
    : `${services.length} service${services.length !== 1 ? "s" : ""}`;

  return (
    <div className="flex flex-col min-h-screen bg-background font-manrope overflow-y-auto">
      <GradientHeader onMenu={onMenu} title="Services" subtitle={subtitle} right={AddBtn} />

      <div className="flex-1 px-4 pt-8 pb-4 flex flex-col">

        {/* Loading skeletons */}
        {loading &&
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-full h-[76px] rounded-card mb-2 animate-pulse"
              style={{ background: "#E5E5EA" }}
            />
          ))}

        {/* Empty state */}
        {!loading && services.length === 0 && (
          <Card className="flex flex-col items-center py-12 gap-3">
            <div
              className="flex items-center justify-center"
              style={{ width: 56, height: 56, borderRadius: 14, background: "#F2F2F7" }}
            >
              <svg width="24" height="24" fill="none" stroke="#6B7280" strokeWidth="1.5" viewBox="0 0 24 24">
                <path
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="font-manrope text-[15px] font-semibold text-foreground">No services yet</p>
            <p className="font-manrope text-[13px] text-muted text-center">
              Tap 'Add' to create your first service
            </p>
          </Card>
        )}

        {/* Service cards */}
        {!loading &&
          services.map((svc) => {
            const isDraft = svc.is_active === false;
            const duration = fmtDuration(svc.duration);
            const price = fmtPrice(svc.base_price || svc.basePrice);
            const bookings = svc.bookings_this_month || 0;

            return (
              <button
                key={svc.id}
                onClick={() => navigate(`/provider/services/${svc.id}`)}
                className="w-full text-left focus:outline-none"
              >
                <Card className="flex items-center gap-3.5 mb-2">
                  {/* Box icon */}
                  <div
                    className="flex items-center justify-center flex-shrink-0"
                    style={{ width: 48, height: 48, borderRadius: 12, background: "#F2F2F7" }}
                  >
                    <svg width="20" height="20" fill="none" stroke="#6B7280" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="font-manrope text-[16px] font-semibold text-foreground m-0 truncate">
                        {svc.name}
                      </p>
                      {isDraft && <Badge label="Draft" variant="muted" />}
                    </div>
                    <p className="font-manrope text-[14px] text-muted m-0">
                      {[duration, price].filter(Boolean).join(" · ")}
                      {bookings > 0 && (
                        <span className="ml-2 font-manrope text-[12px]" style={{ color: "#22C55E" }}>
                          {bookings} this month
                        </span>
                      )}
                    </p>
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
                    <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
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

export default ProviderServices;
