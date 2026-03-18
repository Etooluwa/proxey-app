import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useSession } from "../../auth/authContext";
import {
  fetchProviderJobs,
  fetchProviderEarnings,
} from "../../data/provider";
import GradientHeader from "../../components/ui/GradientHeader";
import Avatar from "../../components/ui/Avatar";
import Card from "../../components/ui/Card";
import Footer from "../../components/ui/Footer";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtCurrency(cents) {
  if (!cents && cents !== 0) return "$0";
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function todayLabel() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function fmtTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
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

function isToday(iso) {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const ProviderDashboard = () => {
  const navigate = useNavigate();
  const { onMenu } = useOutletContext() || {};
  const { profile } = useSession();

  const [allJobs, setAllJobs] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [jobs, earn] = await Promise.all([
          fetchProviderJobs(),
          fetchProviderEarnings(),
        ]);
        if (!cancelled) {
          setAllJobs(jobs || []);
          setEarnings(earn || null);
        }
      } catch (err) {
        console.error("ProviderDashboard load error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const firstName = profile?.name?.split(" ")[0] || "there";
  const initials = getInitials(profile?.name);

  // Derived counts
  const todayJobs = allJobs.filter(
    (j) => isToday(j.scheduled_at) && j.status !== "cancelled"
  );
  const pendingJobs = allJobs.filter(
    (j) => (j.status || "").toLowerCase() === "pending"
  );

  // This-week revenue: sum of completed jobs in the current Mon–Sun week
  const weekStart = (() => {
    const d = new Date();
    const day = d.getDay(); // 0=Sun
    d.setDate(d.getDate() - ((day + 6) % 7)); // back to Monday
    d.setHours(0, 0, 0, 0);
    return d;
  })();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const weekRevenue = allJobs
    .filter((j) => {
      const d = new Date(j.scheduled_at || j.created_at);
      return (
        d >= weekStart &&
        d < weekEnd &&
        (j.status === "completed" || j.status === "confirmed")
      );
    })
    .reduce((sum, j) => sum + (j.price || 0), 0);

  // ─── Notification bell (right slot) ────────────────────────────────────────
  const hasNotifications = pendingJobs.length > 0;
  const NotifBell = (
    <button
      onClick={() => navigate("/provider/appointments")}
      className="relative flex items-center justify-center focus:outline-none"
      style={{
        width: 36,
        height: 36,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.2)",
        backdropFilter: "blur(10px)",
        border: "none",
        cursor: "pointer",
      }}
    >
      <svg
        width="18"
        height="18"
        fill="none"
        stroke="#fff"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
      >
        <path
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {hasNotifications && (
        <div
          className="absolute"
          style={{
            top: 4,
            right: 4,
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#FF751F",
            border: "2px solid rgba(255,255,255,0.9)",
          }}
        />
      )}
    </button>
  );

  // ─── Frosted stat cards (inside gradient) ──────────────────────────────────
  const StatCards = (
    <div className="flex gap-2.5 mt-4">
      {/* Today */}
      <div
        className="flex-1 px-3 py-3.5 rounded-xl"
        style={{
          background: "rgba(255,255,255,0.2)",
          backdropFilter: "blur(10px)",
        }}
      >
        <p
          className="font-manrope text-[12px] m-0 mb-1.5"
          style={{ color: "rgba(255,255,255,0.75)" }}
        >
          Today
        </p>
        <p className="font-manrope text-[22px] font-bold text-white m-0 mb-0.5">
          {loading ? "—" : todayJobs.length}
        </p>
        <p
          className="font-manrope text-[12px] font-semibold m-0"
          style={{ color: "rgba(255,255,255,0.9)" }}
        >
          bookings
        </p>
      </div>

      {/* This week */}
      <div
        className="flex-1 px-3 py-3.5 rounded-xl"
        style={{
          background: "rgba(255,255,255,0.2)",
          backdropFilter: "blur(10px)",
        }}
      >
        <p
          className="font-manrope text-[12px] m-0 mb-1.5"
          style={{ color: "rgba(255,255,255,0.75)" }}
        >
          This week
        </p>
        <p className="font-manrope text-[22px] font-bold text-white m-0 mb-0.5">
          {loading ? "—" : fmtCurrency(weekRevenue)}
        </p>
        <p
          className="font-manrope text-[12px] font-semibold m-0"
          style={{ color: "rgba(255,255,255,0.9)" }}
        >
          {earnings?.weekChangePercent != null
            ? `${earnings.weekChangePercent > 0 ? "+" : ""}${earnings.weekChangePercent}%`
            : "revenue"}
        </p>
      </div>
    </div>
  );

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-background font-manrope overflow-y-auto">
      <GradientHeader
        onMenu={onMenu}
        right={NotifBell}
      >
        <p
          className="font-manrope text-[14px] m-0 mt-3 mb-0.5"
          style={{ color: "rgba(255,255,255,0.7)" }}
        >
          {todayLabel()}
        </p>
        <h1 className="font-manrope text-[28px] font-bold text-white m-0">
          Hi, {firstName}
        </h1>
        {StatCards}
      </GradientHeader>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 px-4 pt-8 pb-4 flex flex-col">

        {/* Pending bookings banner */}
        {!loading && pendingJobs.length > 0 && (
          <button
            onClick={() => navigate("/provider/appointments")}
            className="w-full text-left focus:outline-none mb-2"
          >
            <Card
              className="flex items-center gap-3"
              style={{ background: "#FFF0E6" }}
            >
              <div
                className="flex items-center justify-center flex-shrink-0"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "#FF751F",
                }}
              >
                <span className="font-manrope text-[16px] font-bold text-white">
                  {pendingJobs.length}
                </span>
              </div>
              <div>
                <p className="font-manrope text-[15px] font-semibold text-foreground m-0">
                  Pending booking requests
                </p>
                <p className="font-manrope text-[13px] text-muted m-0 mt-0.5">
                  Tap to review and accept
                </p>
              </div>
            </Card>
          </button>
        )}

        {/* Today's schedule */}
        <p className="font-manrope text-[18px] font-bold text-foreground mt-2 mb-3.5 px-1">
          Today's schedule
        </p>

        {loading ? (
          /* Loading skeletons */
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-full h-[72px] rounded-card mb-2 animate-pulse"
              style={{ background: "#E5E5EA" }}
            />
          ))
        ) : todayJobs.length === 0 ? (
          <Card className="flex flex-col items-center py-8 gap-2">
            <svg
              width="40"
              height="40"
              fill="none"
              stroke="#D1D5DB"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <p className="font-manrope text-[15px] font-semibold text-foreground">
              No appointments today
            </p>
            <p className="font-manrope text-[13px] text-muted text-center">
              Your schedule is clear for today
            </p>
          </Card>
        ) : (
          todayJobs.map((job) => (
            <button
              key={job.id}
              onClick={() =>
                navigate(`/provider/appointments/${job.id}`)
              }
              className="w-full text-left focus:outline-none"
            >
              <Card className="flex items-center gap-3.5 mb-2">
                <Avatar
                  initials={getInitials(job.client_name)}
                  size={44}
                  bg="#FFF0E6"
                  color="#FF751F"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-manrope text-[16px] font-semibold text-foreground m-0 truncate">
                    {job.client_name || "Client"}
                  </p>
                  <p className="font-manrope text-[14px] text-muted m-0 mt-0.5 truncate">
                    {job.service_name || "Service"}
                  </p>
                </div>
                <span className="font-manrope text-[14px] font-semibold text-foreground flex-shrink-0">
                  {fmtTime(job.scheduled_at)}
                </span>
              </Card>
            </button>
          ))
        )}
      </div>

      <Footer />
    </div>
  );
};

export default ProviderDashboard;
