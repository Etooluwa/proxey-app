import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useSession } from "../../auth/authContext";
import { request } from "../../data/apiClient";
import GradientHeader from "../../components/ui/GradientHeader";
import Card from "../../components/ui/Card";
import Footer from "../../components/ui/Footer";

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_NAMES_LONG = [
  "Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday",
];
const DAY_LABELS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]; // Mon-first

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-US", {
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

// Monday-first day-of-week (0=Mon … 6=Sun)
function monFirstDow(date) {
  return (date.getDay() + 6) % 7;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const ProviderSchedule = () => {
  const navigate = useNavigate();
  const { onMenu } = useOutletContext() || {};
  const { session } = useSession();

  const today = useMemo(() => new Date(), []);
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(today.getDate());

  const [byDate, setByDate] = useState({});   // { "2026-03-19": [...bookings] }
  const [loading, setLoading] = useState(false);

  // Derived display month/year
  const { displayYear, displayMonth } = useMemo(() => {
    let m = today.getMonth() + monthOffset;
    let y = today.getFullYear();
    while (m > 11) { m -= 12; y++; }
    while (m <  0) { m += 12; y--; }
    return { displayMonth: m, displayYear: y };
  }, [today, monthOffset]);

  const isCurrentCalendarMonth =
    displayYear === today.getFullYear() && displayMonth === today.getMonth();

  // Fetch bookings for displayed month
  const loadMonth = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const data = await request(
        `/provider/calendar?year=${displayYear}&month=${displayMonth}`
      );
      setByDate(data.byDate || {});
    } catch (err) {
      console.error("Failed to load calendar", err);
      setByDate({});
    } finally {
      setLoading(false);
    }
  }, [session, displayYear, displayMonth]);

  useEffect(() => {
    loadMonth();
  }, [loadMonth]);

  const handlePrevMonth = () => { setMonthOffset((o) => o - 1); setSelectedDay(1); };
  const handleNextMonth = () => { setMonthOffset((o) => o + 1); setSelectedDay(1); };

  // Grid helpers
  const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();
  const firstDow = monFirstDow(new Date(displayYear, displayMonth, 1));

  // Set of day numbers that have bookings
  const daysWithBookings = useMemo(() => {
    const days = new Set();
    Object.keys(byDate).forEach((key) => {
      const d = new Date(key);
      if (
        d.getFullYear() === displayYear &&
        d.getMonth()    === displayMonth &&
        byDate[key]?.length > 0
      ) {
        days.add(d.getDate());
      }
    });
    return days;
  }, [byDate, displayYear, displayMonth]);

  // Selected day's bookings
  const selectedDateKey = useMemo(() => {
    const mm = String(displayMonth + 1).padStart(2, "0");
    const dd = String(selectedDay).padStart(2, "0");
    return `${displayYear}-${mm}-${dd}`;
  }, [displayYear, displayMonth, selectedDay]);

  const daySchedule = byDate[selectedDateKey] || [];

  // Label for selected day
  const selectedDow = new Date(displayYear, displayMonth, selectedDay).getDay();
  const selectedLabel = `${DAY_NAMES_LONG[selectedDow]}, ${MONTH_NAMES[displayMonth].slice(0, 3)} ${selectedDay}`;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-background font-manrope overflow-y-auto">
      <GradientHeader onMenu={onMenu} title="Calendar" />

      <div className="flex-1 px-4 pt-8 pb-4 flex flex-col">

        {/* ── Calendar card ──────────────────────────────────────────────── */}
        <Card className="mb-3">

          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevMonth}
              className="flex items-center justify-center focus:outline-none"
              style={{
                width: 32, height: 32, borderRadius: "50%",
                border: "1px solid #E5E5EA", background: "#F2F2F7",
              }}
            >
              <svg width="16" height="16" fill="none" stroke="#0D1619" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <span className="font-manrope text-[17px] font-bold text-foreground">
              {MONTH_NAMES[displayMonth]} {displayYear}
            </span>

            <button
              onClick={handleNextMonth}
              className="flex items-center justify-center focus:outline-none"
              style={{
                width: 32, height: 32, borderRadius: "50%",
                border: "1px solid #E5E5EA", background: "#F2F2F7",
              }}
            >
              <svg width="16" height="16" fill="none" stroke="#0D1619" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {/* Day-of-week header Mon–Sun */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_LABELS.map((d) => (
              <div
                key={d}
                className="text-center font-manrope text-[12px] font-semibold text-muted py-1"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Date grid */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {/* Leading empty cells for Mon-first offset */}
            {Array.from({ length: firstDow }).map((_, i) => (
              <div key={`e${i}`} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isSelected = day === selectedDay;
              const isToday = isCurrentCalendarMonth && day === today.getDate();
              const hasBooking = daysWithBookings.has(day);

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className="flex flex-col items-center justify-center focus:outline-none relative"
                  style={{
                    aspectRatio: "1",
                    borderRadius: "50%",
                    border: "none",
                    background: isSelected ? "#FF751F" : "transparent",
                    outline: isToday && !isSelected ? "2px solid #FF751F" : "none",
                    outlineOffset: "-2px",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  <span
                    className="font-manrope text-[14px]"
                    style={{
                      fontWeight: isSelected || isToday ? 700 : 400,
                      color: isSelected ? "#FFFFFF" : "#0D1619",
                    }}
                  >
                    {day}
                  </span>
                  {hasBooking && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: 3,
                        width: 4,
                        height: 4,
                        borderRadius: "50%",
                        background: isSelected ? "#FFFFFF" : "#FF751F",
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {/* ── Selected day label ─────────────────────────────────────────── */}
        <p className="font-manrope text-[16px] font-bold text-foreground mt-1 mb-3 px-1">
          {selectedLabel}
          {loading && (
            <span className="font-manrope text-[13px] font-normal text-muted ml-2">
              Loading…
            </span>
          )}
        </p>

        {/* ── Empty state ────────────────────────────────────────────────── */}
        {!loading && daySchedule.length === 0 && (
          <Card className="flex flex-col items-center py-8 gap-2">
            <svg
              width="36"
              height="36"
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
            <p className="font-manrope text-[15px] text-muted m-0">
              No bookings this day
            </p>
          </Card>
        )}

        {/* ── Booking cards ─────────────────────────────────────────────── */}
        {daySchedule.map((booking) => {
          const duration = fmtDuration(booking.duration);
          return (
            <button
              key={booking.id}
              onClick={() => navigate(`/provider/appointments/${booking.id}`)}
              className="w-full text-left focus:outline-none"
            >
              <Card className="flex items-center gap-3 mb-2">
                {/* Orange left accent bar */}
                <div
                  className="flex-shrink-0"
                  style={{ width: 4, height: 44, borderRadius: 2, background: "#FF751F" }}
                />

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="font-manrope text-[15px] font-semibold text-foreground m-0 truncate">
                    {booking.client_name || "Client"}
                  </p>
                  <p className="font-manrope text-[13px] text-muted m-0 mt-0.5 truncate">
                    {booking.service_name || "Service"}
                    {duration ? ` · ${duration}` : ""}
                  </p>
                </div>

                {/* Time */}
                <span className="font-manrope text-[14px] font-semibold text-foreground flex-shrink-0">
                  {fmtTime(booking.scheduled_at)}
                </span>
              </Card>
            </button>
          );
        })}

      </div>

      <Footer />
    </div>
  );
};

export default ProviderSchedule;
