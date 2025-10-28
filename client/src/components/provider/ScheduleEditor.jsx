import { useEffect, useState } from "react";
import Button from "../ui/Button";
import "../../styles/provider/scheduleEditor.css";

const DEFAULT_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function ScheduleEditor({ initialSchedule = [], onSave, saving }) {
  const [rows, setRows] = useState(() =>
    DEFAULT_WEEK.map((day) => ({
      day,
      startTime: "09:00",
      endTime: "17:00",
      available: false,
    }))
  );

  useEffect(() => {
    if (!initialSchedule?.length) return;
    setRows((prev) =>
      prev.map((row) => {
        const match = initialSchedule.find((item) => item.day === row.day);
        return match
          ? {
              day: row.day,
              startTime: match.startTime || "09:00",
              endTime: match.endTime || "17:00",
              available: Boolean(match.available),
            }
          : row;
      })
    );
  }, [initialSchedule]);

  const toggleDay = (index) => {
    setRows((prev) =>
      prev.map((row, idx) =>
        idx === index ? { ...row, available: !row.available } : row
      )
    );
  };

  const updateTime = (index, field, value) => {
    setRows((prev) =>
      prev.map((row, idx) => (idx === index ? { ...row, [field]: value } : row))
    );
  };

  const handleSave = () => {
    const payload = rows.filter((row) => row.available);
    onSave?.(payload);
  };

  return (
    <div className="provider-schedule-editor">
      <div className="provider-schedule-grid">
        <div className="provider-schedule-header">Day</div>
        <div className="provider-schedule-header">Availability</div>
        <div className="provider-schedule-header">Start</div>
        <div className="provider-schedule-header">End</div>
        {rows.map((row, index) => (
          <div className="provider-schedule-row" key={row.day}>
            <div className="provider-schedule-cell day">{row.day}</div>
            <div className="provider-schedule-cell availability">
              <label className="provider-schedule-toggle">
                <input
                  type="checkbox"
                  checked={row.available}
                  onChange={() => toggleDay(index)}
                />
                <span>{row.available ? "Available" : "Away"}</span>
              </label>
            </div>
            <div className="provider-schedule-cell start">
              <input
                className="provider-schedule-time"
                type="time"
                value={row.startTime}
                disabled={!row.available}
                onChange={(event) => updateTime(index, "startTime", event.target.value)}
              />
            </div>
            <div className="provider-schedule-cell end">
              <input
                className="provider-schedule-time"
                type="time"
                value={row.endTime}
                disabled={!row.available}
                onChange={(event) => updateTime(index, "endTime", event.target.value)}
              />
            </div>
          </div>
        ))}
      </div>
      <Button onClick={handleSave} loading={saving}>
        Save availability
      </Button>
    </div>
  );
}

export default ScheduleEditor;
