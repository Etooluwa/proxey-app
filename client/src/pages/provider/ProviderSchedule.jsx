import { useEffect, useState } from "react";
import ScheduleEditor from "../../components/provider/ScheduleEditor";
import { useToast } from "../../components/ui/ToastProvider";
import {
  fetchProviderProfile,
  updateProviderSchedule,
} from "../../data/provider";
import "../../styles/provider/providerSchedule.css";

function ProviderSchedule() {
  const toast = useToast();
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const profile = await fetchProviderProfile();
        if (!cancelled) {
          setSchedule(profile?.schedule || []);
        }
      } catch (error) {
        if (!cancelled) {
          toast.push({
            title: "Unable to load schedule",
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

  const handleSave = async (nextSchedule) => {
    setSaving(true);
    try {
      const saved = await updateProviderSchedule(nextSchedule);
      setSchedule(saved);
      toast.push({
        title: "Availability updated",
        description: "Clients will now see your new working hours.",
        variant: "success",
      });
    } catch (error) {
      toast.push({
        title: "Unable to save schedule",
        description: error.message,
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="provider-schedule">
        <p>Loading schedule…</p>
      </div>
    );
  }

  return (
    <div className="provider-schedule">
      <p className="provider-schedule__lead">
        Toggle the days you’re accepting bookings and adjust your working hours. Clients
        can only request times inside your availability window.
      </p>
      <ScheduleEditor initialSchedule={schedule} onSave={handleSave} saving={saving} />
    </div>
  );
}

export default ProviderSchedule;
