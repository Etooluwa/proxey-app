import { useEffect, useState, useCallback } from "react";
import ScheduleEditor from "../../components/provider/ScheduleEditor";
import { useToast } from "../../components/ui/ToastProvider";
import {
  fetchProviderTimeBlocks,
  saveProviderTimeBlocks,
} from "../../data/provider";
import "../../styles/provider/providerSchedule.css";

function ProviderSchedule() {
  const toast = useToast();
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const dayMap = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const toSchedule = (blocks = []) => {
    if (!Array.isArray(blocks)) return [];
    const byDay = blocks.reduce((acc, block) => {
      const idx = block.day_index ?? block.dayIndex ?? 0;
      if (!acc[idx]) acc[idx] = [];
      acc[idx].push(block);
      return acc;
    }, {});
    return Object.entries(byDay).map(([dayIndex, dayBlocks]) => {
      const earliest = dayBlocks.reduce(
        (min, b) => (b.start_time < min ? b.start_time : min),
        dayBlocks[0].start_time
      );
      const latest = dayBlocks.reduce(
        (max, b) => (b.end_time > max ? b.end_time : max),
        dayBlocks[0].end_time
      );
      const available = dayBlocks.some((b) => b.is_available ?? true);
      return {
        day: dayMap[Number(dayIndex)] || "Sunday",
        startTime: earliest,
        endTime: latest,
        available,
      };
    });
  };

  const fromSchedule = (sched = []) =>
    (sched || []).map((item) => ({
      dayIndex: dayMap.indexOf(item.day),
      startTime: item.startTime,
      endTime: item.endTime,
      isAvailable: item.available,
    }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const blocks = await fetchProviderTimeBlocks();
      setSchedule(toSchedule(blocks));
    } catch (error) {
      toast.push({
        title: "Unable to load schedule",
        description: error.message,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (nextSchedule) => {
    setSaving(true);
    try {
      const saved = await saveProviderTimeBlocks(fromSchedule(nextSchedule));
      setSchedule(toSchedule(saved));
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
