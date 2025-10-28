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
      <table>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Availability</th>
            <th scope="col">Start</th>
            <th scope="col">End</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.day}>
              <th scope="row">{row.day}</th>
              <td>
                <label className="provider-schedule-editor__toggle">
                  <input
                    type="checkbox"
                    checked={row.available}
                    onChange={() => toggleDay(index)}
                  />
                  <span>{row.available ? "Available" : "Away"}</span>
                </label>
              </td>
              <td>
                <input
                  type="time"
                  value={row.startTime}
                  disabled={!row.available}
                  onChange={(event) => updateTime(index, "startTime", event.target.value)}
                />
              </td>
              <td>
                <input
                  type="time"
                  value={row.endTime}
                  disabled={!row.available}
                  onChange={(event) => updateTime(index, "endTime", event.target.value)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Button onClick={handleSave} loading={saving}>
        Save availability
      </Button>
    </div>
  );
}

export default ScheduleEditor;
