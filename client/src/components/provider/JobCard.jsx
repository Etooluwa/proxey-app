import Button from "../ui/Button";
import Badge from "../ui/Badge";
import "../../styles/provider/jobCard.css";

const STATUS_LABELS = {
  pending: { label: "Pending", variant: "warning" },
  active: { label: "In Progress", variant: "success" },
  completed: { label: "Completed", variant: "default" },
};

function JobCard({ job, onAccept, onDecline, onComplete }) {
  if (!job) return null;

  const statusBadge = STATUS_LABELS[job.status] || STATUS_LABELS.pending;
  const scheduledAt = job.scheduledAt
    ? new Date(job.scheduledAt).toLocaleString()
    : "TBD";

  return (
    <article className="provider-job-card">
      <header className="provider-job-card__header">
        <div>
          <h3>{job.clientName}</h3>
          <p>{job.serviceName}</p>
        </div>
        <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
      </header>
      <dl className="provider-job-card__details">
        <div>
          <dt>Scheduled</dt>
          <dd>{scheduledAt}</dd>
        </div>
        <div>
          <dt>Location</dt>
          <dd>{job.location || "Client to confirm"}</dd>
        </div>
        <div>
          <dt>Price</dt>
          <dd>${((job.price || 0) / 100).toFixed(2)}</dd>
        </div>
      </dl>
      {job.notes ? <p className="provider-job-card__notes">{job.notes}</p> : null}
      <footer className="provider-job-card__actions">
        {job.status === "pending" ? (
          <>
            <Button variant="secondary" onClick={() => onAccept?.(job)}>
              Accept
            </Button>
            <Button variant="ghost" onClick={() => onDecline?.(job)}>
              Decline
            </Button>
          </>
        ) : null}
        {job.status === "active" ? (
          <Button variant="primary" onClick={() => onComplete?.(job)}>
            Mark as complete
          </Button>
        ) : null}
      </footer>
    </article>
  );
}

export default JobCard;
