import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSession } from "../../auth/authContext";
import { request } from "../../data/apiClient";
import Avatar from "../../components/ui/Avatar";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Footer from "../../components/ui/Footer";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name) {
  if (!name) return "C";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtShortDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function fmtTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function fmtPrice(cents) {
  if (!cents && cents !== 0) return null;
  const dollars = cents / 100;
  return `$${dollars.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function fmtLtv(cents) {
  if (!cents) return "$0";
  const dollars = cents / 100;
  if (dollars >= 1000)
    return `$${(dollars / 1000).toFixed(1)}k`;
  return `$${Math.round(dollars)}`;
}

// Determine the timeline "type" for each booking entry
// completedIndex counts only completed bookings (for milestone detection)
function getEntryType(booking, completedIndex) {
  const s = (booking.status || "").toLowerCase();
  if (s === "completed" && (completedIndex + 1) % 10 === 0) return "milestone";
  if (s === "completed") return "completed";
  if (s === "confirmed" || s === "accepted") return "confirmed";
  if (s === "pending") return "pending";
  return "other";
}

// Dot color per type
const DOT_COLOR = {
  confirmed: "#FF751F",  // accent orange
  pending:   "#FF751F",
  completed: "#22C55E",  // success green
  milestone: "#F59E0B",  // amber
  other:     "#6B7280",
};

// ─── Timeline entry ───────────────────────────────────────────────────────────

function TimelineEntry({ booking, entryType, isLast }) {
  const dotColor = DOT_COLOR[entryType] || DOT_COLOR.other;
  const price = fmtPrice(booking.price);
  const isMilestone = entryType === "milestone";
  const isConfirmed = entryType === "confirmed" || entryType === "pending";
  const dateLabel = fmtDate(booking.scheduled_at || booking.created_at);
  const timeLabel = fmtTime(booking.scheduled_at);

  const title = isMilestone
    ? `${booking._milestoneNumber}th session milestone`
    : booking.service_name || "Service";

  const subtext = isMilestone
    ? "Consider offering a loyalty reward."
    : booking.notes || null;

  return (
    <div className="flex gap-0">
      {/* Spine column */}
      <div
        className="flex flex-col items-center flex-shrink-0"
        style={{ width: 24, paddingTop: 20 }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: dotColor,
            flexShrink: 0,
            border: "2px solid #F2F2F7",
            zIndex: 1,
          }}
        />
        {!isLast && (
          <div
            style={{
              width: 2,
              flex: 1,
              background: "#E5E5EA",
              marginTop: -1,
            }}
          />
        )}
      </div>

      {/* Card */}
      <div className="flex-1 mb-0">
        <Card
          className="mb-3"
          style={isMilestone ? { background: "#FFFBEB" } : undefined}
        >
          {/* Title + amount */}
          <div className="flex justify-between items-start gap-2 mb-0.5">
            <p className="font-manrope text-[16px] font-semibold text-foreground m-0 flex-1">
              {title}
            </p>
            {price && !isMilestone && (
              <span className="font-manrope text-[15px] font-semibold text-foreground flex-shrink-0">
                {price}
              </span>
            )}
          </div>

          {/* Date + time */}
          <p className="font-manrope text-[13px] text-muted m-0 mb-1">
            {dateLabel}{timeLabel ? ` at ${timeLabel}` : ""}
          </p>

          {/* Notes / subtext */}
          {subtext && (
            <p className="font-manrope text-[14px] text-muted m-0 mb-1.5">
              {subtext}
            </p>
          )}

          {/* Badges */}
          {isConfirmed && (
            <div className="mt-1.5">
              <Badge label="Confirmed" variant="success" />
            </div>
          )}
          {isMilestone && (
            <div className="mt-1.5">
              <Badge label="Milestone" variant="warning" />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const ProviderClientTimeline = () => {
  const navigate = useNavigate();
  const { clientId } = useParams();
  const { session } = useSession();

  const [clientData, setClientData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await request(`/provider/clients/${clientId}`);
        if (!cancelled) setClientData(data);
      } catch (err) {
        console.error("Failed to load client timeline:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [session, clientId]);

  const client   = clientData?.client || null;
  const stats    = clientData?.stats  || {};
  const bookings = clientData?.bookings || [];

  // Build the timeline entries, injecting milestone metadata
  // Walk chronologically (oldest→newest) to number completed sessions,
  // then reverse back to newest-first for display.
  const timelineEntries = (() => {
    // Sort oldest first to count completions
    const sorted = [...bookings]
      .filter((b) => b.status !== "cancelled")
      .sort(
        (a, b) =>
          new Date(a.scheduled_at || a.created_at) -
          new Date(b.scheduled_at || b.created_at)
      );

    let completedCount = 0;
    const enriched = sorted.map((b) => {
      const s = (b.status || "").toLowerCase();
      if (s === "completed") completedCount++;
      const type = getEntryType(b, completedCount - 1);
      return {
        ...b,
        _type: type,
        _milestoneNumber: type === "milestone" ? completedCount : null,
      };
    });

    // Reverse back to newest-first for timeline display
    return enriched.reverse();
  })();

  const clientName  = client?.name || bookings[0]?.client_name || "Client";
  const initials    = getInitials(clientName);
  const clientSince = stats.first_visit ? fmtShortDate(stats.first_visit) : null;
  const ltvDisplay  = fmtLtv(stats.ltv);
  const visitCount  = stats.visits || 0;

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background font-manrope">
        <div
          className="flex flex-col pb-12"
          style={{
            background:
              "linear-gradient(180deg,#D45400 0%,#E87020 40%,#F09050 65%,#F5C4A0 82%,#F2F2F7 100%)",
            borderRadius: "0 0 28px 28px",
            marginBottom: "-20px",
            zIndex: 1,
            paddingBottom: "48px",
          }}
        >
          <div className="px-5 pt-1 mb-4">
            <button
              onClick={() => navigate("/provider/clients")}
              className="flex focus:outline-none"
              style={{ background: "none", border: "none", cursor: "pointer", padding: "8px", margin: "-8px" }}
            >
              <svg width="24" height="24" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex-1 px-4 pt-8 pb-4 flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-full h-[88px] rounded-card animate-pulse" style={{ background: "#E5E5EA" }} />
          ))}
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-background font-manrope overflow-y-auto">

      {/* ── Gradient header ────────────────────────────────────────────── */}
      <div
        className="flex flex-col"
        style={{
          background:
            "linear-gradient(180deg,#D45400 0%,#E87020 40%,#F09050 65%,#F5C4A0 82%,#F2F2F7 100%)",
          borderRadius: "0 0 28px 28px",
          marginBottom: "-20px",
          zIndex: 1,
          paddingBottom: "48px",
        }}
      >
        {/* Back button */}
        <div className="px-5 pt-1 mb-4">
          <button
            onClick={() => navigate("/provider/clients")}
            className="flex focus:outline-none"
            style={{ background: "none", border: "none", cursor: "pointer", padding: "8px", margin: "-8px" }}
          >
            <svg width="24" height="24" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Client identity */}
        <div className="flex items-center gap-3.5 px-5">
          <Avatar
            initials={initials}
            size={56}
            bg="rgba(255,255,255,0.25)"
            color="#fff"
          />
          <div className="min-w-0">
            <p
              className="font-manrope font-bold text-white m-0 mb-0.5 truncate"
              style={{ fontSize: 20 }}
            >
              {clientName}
            </p>
            {clientSince && (
              <p
                className="font-manrope text-[14px] m-0"
                style={{ color: "rgba(255,255,255,0.8)" }}
              >
                Client since {clientSince}
              </p>
            )}
          </div>
        </div>

        {/* Frosted stat pills */}
        <div className="flex gap-2.5 px-5 mt-4">
          {[
            { label: "Sessions", value: visitCount },
            { label: "Lifetime value", value: ltvDisplay },
          ].map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-2 px-3 py-2 rounded-full"
              style={{
                background: "rgba(255,255,255,0.2)",
                backdropFilter: "blur(10px)",
              }}
            >
              <span className="font-manrope text-[15px] font-bold text-white">
                {s.value}
              </span>
              <span
                className="font-manrope text-[12px]"
                style={{ color: "rgba(255,255,255,0.75)" }}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Below gradient ──────────────────────────────────────────────── */}
      <div className="flex-1 px-4 pt-8 pb-4 flex flex-col">

        {/* Action buttons */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() =>
              navigate("/provider/messages", {
                state: { clientId },
              })
            }
            className="flex-1 font-manrope text-[14px] font-semibold text-foreground focus:outline-none"
            style={{
              padding: "12px",
              borderRadius: "12px",
              border: "1px solid #E5E5EA",
              background: "#FFFFFF",
              cursor: "pointer",
            }}
          >
            Message
          </button>
          <button
            onClick={() => navigate("/provider/appointments")}
            className="flex-1 font-manrope text-[14px] font-semibold focus:outline-none"
            style={{
              padding: "12px",
              borderRadius: "12px",
              border: "none",
              background: "#0D1619",
              color: "#FFFFFF",
              cursor: "pointer",
            }}
          >
            Book for client
          </button>
        </div>

        {/* Empty state */}
        {timelineEntries.length === 0 && (
          <Card className="flex flex-col items-center py-10 gap-2">
            <svg
              width="36"
              height="36"
              fill="none"
              stroke="#D1D5DB"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4l3 3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="font-manrope text-[15px] text-muted m-0">
              No bookings yet
            </p>
          </Card>
        )}

        {/* Timeline */}
        {timelineEntries.map((entry, idx) => (
          <TimelineEntry
            key={entry.id}
            booking={entry}
            entryType={entry._type}
            isLast={idx === timelineEntries.length - 1}
          />
        ))}

      </div>

      <Footer />
    </div>
  );
};

export default ProviderClientTimeline;
