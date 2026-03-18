import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSession } from "../../auth/authContext";
import { request } from "../../data/apiClient";
import Nav from "../../components/ui/Nav";
import Card from "../../components/ui/Card";
import Avatar from "../../components/ui/Avatar";
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

function fmtDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function fmtDuration(mins) {
  if (!mins) return null;
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}

function fmtPrice(cents) {
  if (!cents && cents !== 0) return null;
  const dollars = cents / 100;
  return `$${dollars.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function statusBadgeVariant(status) {
  if (!status) return "muted";
  const s = status.toLowerCase();
  if (s === "confirmed" || s === "accepted" || s === "completed") return "success";
  if (s === "declined" || s === "cancelled") return "danger";
  if (s === "pending") return "warning";
  return "muted";
}

function statusLabel(status) {
  if (!status) return "Pending";
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const ProviderAppointmentDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { session } = useSession();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const data = await request(`/provider/jobs/${id}`);
      const j = data.job || null;
      setJob(j);
      setNotes(j?.notes || "");
    } catch (err) {
      console.error("Failed to load appointment:", err);
    } finally {
      setLoading(false);
    }
  }, [session, id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleMarkComplete = async () => {
    if (!job) return;
    setCompleting(true);
    try {
      await request(`/provider/jobs/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "completed" }),
      });
      setJob((prev) => ({ ...prev, status: "completed" }));
    } catch (err) {
      console.error("Failed to mark complete:", err);
    } finally {
      setCompleting(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!job) return;
    setSaving(true);
    try {
      await request(`/provider/jobs/${id}/notes`, {
        method: "PATCH",
        body: JSON.stringify({ notes }),
      });
    } catch (err) {
      console.error("Failed to save notes:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleMessage = () => {
    const clientId = job?.client_id;
    navigate("/provider/messages", { state: clientId ? { clientId } : undefined });
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background font-manrope">
        <Nav onBack={() => navigate("/provider/appointments")} title="Appointment" />
        <div className="flex-1 px-4 pt-2 pb-4 flex flex-col gap-3">
          {[80, 220].map((h) => (
            <div
              key={h}
              className="w-full rounded-card animate-pulse"
              style={{ height: h, background: "#E5E5EA" }}
            />
          ))}
        </div>
      </div>
    );
  }

  // ── Not found ─────────────────────────────────────────────────────────────
  if (!job) {
    return (
      <div className="flex flex-col min-h-screen bg-background font-manrope">
        <Nav onBack={() => navigate("/provider/appointments")} title="Appointment" />
        <div className="flex flex-col items-center justify-center flex-1 gap-2 px-4">
          <p className="font-manrope text-[15px] text-muted">Appointment not found</p>
        </div>
      </div>
    );
  }

  const isCompleted = job.status?.toLowerCase() === "completed";
  const duration = fmtDuration(job.duration);
  const price = fmtPrice(job.price);

  // Subtitle line: "N visits · Client since Jan 2025"
  const visitLabel = job.visit_count > 0
    ? `${job.visit_count}${job.visit_count === 1 ? "st" : job.visit_count === 2 ? "nd" : job.visit_count === 3 ? "rd" : "th"} visit`
    : null;
  const sinceLabel = job.client_since ? `Client since ${job.client_since}` : null;
  const clientSubtitle = [visitLabel, sinceLabel].filter(Boolean).join(" · ");

  // Detail line: "1 hr · 1-on-1 Vocal Lesson · $85"
  const detailParts = [duration, job.service_name, price].filter(Boolean);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-background font-manrope overflow-y-auto">
      <Nav onBack={() => navigate("/provider/appointments")} title="Appointment" />

      <div className="flex-1 px-4 pt-2 pb-32 flex flex-col">

        {/* ── Client card ─────────────────────────────────────────────────── */}
        <Card className="mb-3">
          <div className="flex items-center gap-3.5 mb-3">
            <Avatar
              initials={getInitials(job.client_name)}
              size={56}
              bg="#FFF0E6"
              color="#FF751F"
            />
            <div className="min-w-0">
              <p className="font-manrope text-[20px] font-bold text-foreground m-0 truncate">
                {job.client_name || "Client"}
              </p>
              {clientSubtitle ? (
                <p className="font-manrope text-[14px] text-muted m-0 mt-0.5">
                  {clientSubtitle}
                </p>
              ) : null}
            </div>
          </div>
          <Badge
            label={statusLabel(job.status)}
            variant={statusBadgeVariant(job.status)}
          />
        </Card>

        {/* ── Booking detail + notes card ──────────────────────────────────── */}
        <Card className="mb-3">
          {/* Date / time */}
          <p className="font-manrope text-[20px] font-bold text-foreground m-0 mb-1">
            {fmtDateTime(job.scheduled_at)}
          </p>

          {/* Detail line */}
          <p className="font-manrope text-[14px] text-muted m-0 mb-4">
            {detailParts.join(" · ")}
          </p>

          {/* Divider */}
          <div
            className="mb-4"
            style={{ height: "0.5px", background: "#E5E5EA" }}
          />

          {/* Session notes heading */}
          <p className="font-manrope text-[15px] font-semibold text-foreground m-0 mb-2">
            Session notes
          </p>

          {/* Previous notes (gray block) */}
          {job.previous_notes ? (
            <div
              className="px-3 py-3 rounded-xl mb-3"
              style={{ background: "#F2F2F7" }}
            >
              <p
                className="font-manrope text-[14px] text-muted m-0"
                style={{ fontStyle: "italic", lineHeight: 1.5 }}
              >
                Last: {job.previous_notes}
              </p>
            </div>
          ) : (
            <div
              className="px-3 py-3 rounded-xl mb-3"
              style={{ background: "#F2F2F7" }}
            >
              <p
                className="font-manrope text-[14px] text-muted m-0"
                style={{ fontStyle: "italic" }}
              >
                No previous session notes
              </p>
            </div>
          )}

          {/* Current session notes textarea */}
          <textarea
            placeholder="Add notes for this session…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleSaveNotes}
            disabled={saving}
            rows={3}
            className="w-full font-manrope text-[14px] text-foreground placeholder:text-muted outline-none resize-none"
            style={{
              padding: "14px",
              borderRadius: "12px",
              border: "1px solid #E5E5EA",
              background: "#F2F2F7",
              minHeight: "80px",
              lineHeight: 1.5,
            }}
          />
        </Card>

      </div>

      {/* ── Sticky bottom buttons ────────────────────────────────────────── */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-white px-4 py-3 flex gap-2.5"
        style={{
          borderTop: "0.5px solid #E5E5EA",
          paddingBottom: `calc(0.75rem + env(safe-area-inset-bottom))`,
        }}
      >
        <button
          onClick={handleMessage}
          className="flex-1 font-manrope text-[15px] font-semibold text-foreground focus:outline-none"
          style={{
            padding: "14px",
            borderRadius: "12px",
            border: "1px solid #E5E5EA",
            background: "#FFFFFF",
            cursor: "pointer",
          }}
        >
          Message
        </button>
        <button
          onClick={handleMarkComplete}
          disabled={isCompleted || completing}
          className="font-manrope text-[15px] font-semibold focus:outline-none"
          style={{
            flex: 2,
            padding: "14px",
            borderRadius: "12px",
            border: "none",
            background: isCompleted ? "#E5E5EA" : "#0D1619",
            color: isCompleted ? "#6B7280" : "#FFFFFF",
            cursor: isCompleted ? "default" : "pointer",
          }}
        >
          {completing ? "Saving…" : isCompleted ? "Completed" : "Mark complete"}
        </button>
      </div>

      <Footer />
    </div>
  );
};

export default ProviderAppointmentDetail;
