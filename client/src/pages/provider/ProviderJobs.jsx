import { useEffect, useState } from "react";
import JobCard from "../../components/provider/JobCard";
import Button from "../../components/ui/Button";
import Skeleton from "../../components/ui/Skeleton";
import { useToast } from "../../components/ui/ToastProvider";
import {
  fetchProviderJobs,
  updateProviderJobStatus,
} from "../../data/provider";
import "../../styles/provider/providerJobs.css";

const TABS = [
  { id: "active", label: "Active" },
  { id: "pending", label: "Pending" },
  { id: "completed", label: "Completed" },
];

function ProviderJobs() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("active");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await fetchProviderJobs({ status: activeTab });
        if (!cancelled) {
          setJobs(data);
        }
      } catch (error) {
        if (!cancelled) {
          toast.push({
            title: "Unable to load jobs",
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
  }, [activeTab, toast]);

  const handleUpdate = async (job, nextStatus) => {
    setUpdating(true);
    try {
      await updateProviderJobStatus(job.id, nextStatus);
      toast.push({
        title: `Job ${nextStatus}`,
        description: `${job.clientName}'s ${job.serviceName} updated.`,
        variant: "success",
      });
      const refreshed = await fetchProviderJobs({ status: activeTab });
      setJobs(refreshed);
    } catch (error) {
      toast.push({
        title: "Update failed",
        description: error.message,
        variant: "error",
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="provider-jobs">
      <div className="provider-jobs__tabs" role="tablist" aria-label="Job status">
        {TABS.map((tab) => (
          <Button
            key={tab.id}
            variant={tab.id === activeTab ? "primary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab(tab.id)}
            aria-selected={tab.id === activeTab}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="provider-jobs__list">
          <Skeleton height={150} />
          <Skeleton height={150} />
        </div>
      ) : jobs.length ? (
        <div className="provider-jobs__list">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onAccept={(item) => handleUpdate(item, "active")}
              onDecline={(item) => handleUpdate(item, "declined")}
              onComplete={(item) => handleUpdate(item, "completed")}
            />
          ))}
        </div>
      ) : (
        <p className="provider-jobs__empty">No jobs in this status right now.</p>
      )}

      {updating ? (
        <div className="provider-jobs__updating" aria-live="polite">
          Applying update…
        </div>
      ) : null}
    </div>
  );
}

export default ProviderJobs;
