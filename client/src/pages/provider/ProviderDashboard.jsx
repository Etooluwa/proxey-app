import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import JobCard from "../../components/provider/JobCard";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Skeleton from "../../components/ui/Skeleton";
import { useToast } from "../../components/ui/ToastProvider";
import {
  fetchProviderJobs,
  fetchProviderTodayJobs,
  updateProviderJobStatus,
} from "../../data/provider";
import "../../styles/provider/providerDashboard.css";

function ProviderDashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const [todayJobs, setTodayJobs] = useState([]);
  const [pendingJobs, setPendingJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingJobId, setUpdatingJobId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [today, pending] = await Promise.all([
          fetchProviderTodayJobs(),
          fetchProviderJobs({ status: "pending" }),
        ]);
        if (!cancelled) {
          setTodayJobs(today);
          setPendingJobs(pending);
        }
      } catch (error) {
        if (!cancelled) {
          toast.push({
            title: "Unable to load dashboard",
            description: error.message,
            variant: "error",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const handleJobStatus = async (job, nextStatus) => {
    setUpdatingJobId(job.id);
    try {
      await updateProviderJobStatus(job.id, nextStatus);
      setPendingJobs((jobs) => jobs.filter((item) => item.id !== job.id));
      setTodayJobs((jobs) =>
        jobs.map((item) => (item.id === job.id ? { ...item, status: nextStatus } : item))
      );
      toast.push({
        title: `Job ${nextStatus}`,
        description: `${job.clientName}'s ${job.serviceName} is now ${nextStatus}.`,
        variant: "success",
      });
    } catch (error) {
      toast.push({
        title: "Update failed",
        description: error.message,
        variant: "error",
      });
    } finally {
      setUpdatingJobId(null);
    }
  };

  return (
    <div className="provider-dashboard">
      <section className="provider-dashboard__quick-actions">
        <Button variant="primary" onClick={() => navigate("/provider/jobs")}>
          Accept new job
        </Button>
        <Button variant="secondary" onClick={() => navigate("/provider/schedule")}>
          Update availability
        </Button>
        <Button variant="ghost" onClick={() => navigate("/provider/profile")}>
          Edit profile
        </Button>
      </section>

      <section>
        <header className="provider-dashboard__section-header">
          <h2>Today’s schedule</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate("/provider/schedule")}>
            View calendar
          </Button>
        </header>
        {loading ? (
          <div className="provider-dashboard__list">
            <Skeleton height={140} />
            <Skeleton height={140} />
          </div>
        ) : todayJobs.length ? (
          <div className="provider-dashboard__list">
            {todayJobs.slice(0, 3).map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onComplete={(item) => handleJobStatus(item, "completed")}
              />
            ))}
          </div>
        ) : (
          <Card className="provider-dashboard__empty">
            <h3>No jobs scheduled today</h3>
            <p>Availability is up to date. Keep an eye on new requests coming in.</p>
          </Card>
        )}
      </section>

      <section>
        <header className="provider-dashboard__section-header">
          <h2>New requests</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate("/provider/jobs")}>
            Manage jobs
          </Button>
        </header>
        {loading ? (
          <div className="provider-dashboard__list">
            <Skeleton height={140} />
          </div>
        ) : pendingJobs.length ? (
          <div className="provider-dashboard__list">
            {pendingJobs.slice(0, 3).map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onAccept={(item) => handleJobStatus(item, "active")}
                onDecline={(item) => handleJobStatus(item, "declined")}
              />
            ))}
          </div>
        ) : (
          <Card className="provider-dashboard__empty">
            <h3>No pending requests</h3>
            <p>We’ll notify you as soon as a client requests your services.</p>
          </Card>
        )}
      </section>
      {updatingJobId ? (
        <div className="provider-dashboard__updating" aria-live="polite">
          Updating job…
        </div>
      ) : null}
    </div>
  );
}

export default ProviderDashboard;
