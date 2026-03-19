import { useEffect, useState, useCallback } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { fetchProviderJobs, updateProviderJobStatus } from "../../data/provider";
import { useToast } from "../../components/ui/ToastProvider";
import GradientHeader from "../../components/ui/GradientHeader";
import Avatar from "../../components/ui/Avatar";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import Footer from "../../components/ui/Footer";
import DisputeModal from "../../components/ui/DisputeModal";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDateTime(iso) {
  if (!iso) return "TBD";
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function fmtPrice(val) {
  if (!val && val !== 0) return null;
  // Treat values > 1000 as cents, otherwise dollars
  const dollars = val > 1000 ? val / 100 : val;
  return `$${dollars.toFixed(0)}`;
}

function fmtDuration(mins) {
  if (!mins) return null;
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
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

// ─── Page ─────────────────────────────────────────────────────────────────────

const ProviderAppointments = () => {
  const navigate = useNavigate();
  const { onMenu } = useOutletContext() || {};
  const toast = useToast();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(null); // jobId being acted on
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [disputeJob, setDisputeJob] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchProviderJobs();
      setJobs(data || []);
    } catch (err) {
      console.error("Failed to load appointments", err);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Split into pending vs reviewed
  const pending = jobs.filter(
    (j) => (j.status || "").toLowerCase() === "pending"
  );
  const reviewed = jobs.filter(
    (j) => (j.status || "").toLowerCase() !== "pending"
  );

  const handleAccept = async (job) => {
    setActioning(job.id);
    try {
      await updateProviderJobStatus(job.id, "confirmed");
      await load();
      toast.push({
        title: "Booking accepted",
        description: `Confirmed with ${job.client_name || "client"}.`,
        variant: "success",
      });
    } catch (err) {
      toast.push({ title: "Failed to accept", description: err.message, variant: "error" });
    } finally {
      setActioning(null);
    }
  };

  const handleDecline = async (job) => {
    setActioning(job.id);
    try {
      await updateProviderJobStatus(job.id, "declined");
      await load();
      toast.push({
        title: "Booking declined",
        description: "Client has been notified.",
        variant: "info",
      });
    } catch (err) {
      toast.push({ title: "Failed to decline", description: err.message, variant: "error" });
    } finally {
      setActioning(null);
    }
  };

  const subtitle = loading
    ? "Loading…"
    : `${pending.length} pending · ${reviewed.length} reviewed`;

  return (
    <div className="flex flex-col min-h-screen bg-background font-manrope overflow-y-auto">
      <GradientHeader onMenu={onMenu} title="Bookings" subtitle={subtitle} />

      <div className="flex-1 px-4 pt-8 pb-4 flex flex-col">

        {/* Loading skeletons */}
        {loading &&
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-full h-[160px] rounded-card mb-3 animate-pulse"
              style={{ background: "#E5E5EA" }}
            />
          ))}

        {/* Pending booking cards */}
        {!loading &&
          pending.map((job) => {
            const isActioning = actioning === job.id;
            const price = fmtPrice(job.price);
            const duration = fmtDuration(job.duration);
            const note = job.notes || job.client_notes || "";

            return (
              <Card key={job.id} className="mb-3">
                {/* Client row */}
                <div className="flex items-center gap-3 mb-3">
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
                    <p className="font-manrope text-[13px] text-muted m-0 mt-0.5">
                      {fmtDateTime(job.scheduled_at)}
                    </p>
                  </div>
                  {price && (
                    <span className="font-manrope text-[16px] font-bold text-foreground flex-shrink-0">
                      {price}
                    </span>
                  )}
                </div>

                {/* Service info block */}
                <div
                  className="px-3 py-2.5 rounded-[10px] mb-3"
                  style={{ background: "#F2F2F7" }}
                >
                  <p className="font-manrope text-[14px] font-semibold text-foreground m-0">
                    {job.service_name || "Service"}
                  </p>
                  {duration && (
                    <p className="font-manrope text-[13px] text-muted m-0 mt-0.5">
                      {duration}
                    </p>
                  )}
                </div>

                {/* Client notes callout */}
                {note && (
                  <div
                    className="px-3 py-2.5 rounded-[10px] mb-3"
                    style={{ background: "#FFFBEB" }}
                  >
                    <p
                      className="font-manrope text-[14px] text-foreground m-0"
                      style={{ lineHeight: 1.5 }}
                    >
                      {note}
                    </p>
                  </div>
                )}

                {/* Action buttons: Decline (1x) + Accept (2x) */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDecline(job)}
                    disabled={isActioning}
                    className="flex-1 py-3 rounded-card font-manrope text-[14px] font-semibold text-foreground focus:outline-none active:scale-[0.98] transition-transform"
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #E5E5EA",
                      opacity: isActioning ? 0.5 : 1,
                    }}
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => handleAccept(job)}
                    disabled={isActioning}
                    className="font-manrope text-[14px] font-bold text-white focus:outline-none active:scale-[0.98] transition-transform"
                    style={{
                      flex: 2,
                      padding: "12px",
                      borderRadius: "12px",
                      border: "none",
                      background: isActioning ? "#B0B0B0" : "#0D1619",
                      cursor: isActioning ? "not-allowed" : "pointer",
                    }}
                  >
                    {isActioning ? "Saving…" : "Accept"}
                  </button>
                </div>
              </Card>
            );
          })}

        {/* Empty state — no pending bookings */}
        {!loading && pending.length === 0 && (
          <Card style={{ textAlign: "center", padding: "32px 24px", marginBottom: "12px" }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "#F0FDF4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px",
              }}
            >
              <svg width="28" height="28" fill="none" stroke="#22C55E" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p style={{ fontFamily: "Manrope, sans-serif", fontSize: "17px", fontWeight: 600, color: "#0D1619", margin: "0 0 4px" }}>
              No pending bookings
            </p>
            <p style={{ fontFamily: "Manrope, sans-serif", fontSize: "14px", color: "#6B7280", margin: 0, lineHeight: 1.5 }}>
              When clients book with you, their requests will appear here for you to accept.
            </p>
          </Card>
        )}

        {/* Reviewed section */}
        {!loading && reviewed.length > 0 && (
          <>
            <p className="font-manrope text-[15px] font-bold text-muted mt-2 mb-3 px-1">
              Reviewed
            </p>
            {reviewed.map((job) => {
              const status = (job.status || "").toLowerCase();
              const isAccepted =
                status === "confirmed" ||
                status === "accepted" ||
                status === "completed" ||
                status === "upcoming";
              const isDeclined =
                status === "declined" || status === "cancelled";

              return (
                <button
                  key={job.id}
                  onClick={() => navigate(`/provider/appointments/${job.id}`)}
                  className="w-full text-left focus:outline-none"
                  style={{ opacity: 0.6 }}
                >
                  <Card className="flex items-center gap-3 mb-2">
                    <Avatar
                      initials={getInitials(job.client_name)}
                      size={40}
                      bg="#FFF0E6"
                      color="#FF751F"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-manrope text-[15px] font-medium text-foreground m-0 truncate">
                        {job.client_name || "Client"}
                      </p>
                      <p className="font-manrope text-[13px] text-muted m-0 mt-0.5 truncate">
                        {job.service_name || "Service"}
                      </p>
                    </div>
                    {isAccepted && <Badge label="Accepted" variant="success" />}
                    {isDeclined && <Badge label="Declined" variant="danger" />}
                    {!isAccepted && !isDeclined && (
                      <Badge label={job.status} variant="muted" />
                    )}
                    {/* Dispute button for completed jobs */}
                    {status === "completed" && !job.has_dispute && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDisputeJob(job);
                          setDisputeModalOpen(true);
                        }}
                        className="ml-1 px-2.5 py-1 rounded-lg font-manrope text-[12px] font-semibold focus:outline-none"
                        style={{ background: "#FEF2F2", color: "#EF4444" }}
                      >
                        Dispute
                      </button>
                    )}
                  </Card>
                </button>
              );
            })}
          </>
        )}
      </div>

      <Footer />

      <DisputeModal
        open={disputeModalOpen}
        onClose={() => {
          setDisputeModalOpen(false);
          setDisputeJob(null);
          load();
        }}
        booking={disputeJob}
        userRole="provider"
      />
    </div>
  );
};

export default ProviderAppointments;
