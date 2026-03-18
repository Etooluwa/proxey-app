import { useEffect, useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { useSession } from "../../auth/authContext";
import { request } from "../../data/apiClient";
import GradientHeader from "../../components/ui/GradientHeader";
import Card from "../../components/ui/Card";
import Footer from "../../components/ui/Footer";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
} from "recharts";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtMoney(val) {
  if (!val && val !== 0) return "$0";
  return `$${Number(val).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const SHORT_MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ─── Page ─────────────────────────────────────────────────────────────────────

const ProviderEarnings = () => {
  const { onMenu } = useOutletContext() || {};
  const { session } = useSession();

  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await request("/provider/earnings");
        if (!cancelled) setEarnings(data.earnings || null);
      } catch (err) {
        console.error("Failed to load earnings:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [session]);

  // Current month label, e.g. "March 2026"
  const now = useMemo(() => new Date(), []);
  const monthLabel = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;
  const currentMonthIdx = now.getMonth(); // 0-based

  // Last 6 months of bar chart data from monthlyData (12-month array)
  const chartData = useMemo(() => {
    if (!earnings?.monthlyData) {
      // Fallback: last 6 months with zeros
      return Array.from({ length: 6 }).map((_, i) => {
        const idx = (currentMonthIdx - 5 + i + 12) % 12;
        return { name: SHORT_MONTHS[idx], income: 0, isCurrentMonth: idx === currentMonthIdx };
      });
    }
    const all = earnings.monthlyData; // [{name, income, ...}, ...]
    return all.slice(-6).map((d, i, arr) => ({
      ...d,
      isCurrentMonth: i === arr.length - 1,
    }));
  }, [earnings, currentMonthIdx]);

  const totalThisMonth = earnings?.totalEarningsThisMonth || 0;
  const trend = earnings?.monthlyTrend ?? null;
  const breakdown = earnings?.breakdown || [];
  const nextPayoutAmount = earnings?.availableBalance || 0;
  const nextPayoutDate = earnings?.nextPayoutDate || null;

  const trendLabel = trend !== null
    ? `${trend >= 0 ? "+" : ""}${trend}%`
    : null;

  // ── Gradient children — frosted stat card ─────────────────────────────────
  const GradientContent = (
    <div
      className="mx-0 mt-4 px-4 py-4 rounded-xl"
      style={{
        background: "rgba(255,255,255,0.2)",
        backdropFilter: "blur(10px)",
      }}
    >
      <p
        className="font-manrope text-[13px] mb-1"
        style={{ color: "rgba(255,255,255,0.7)" }}
      >
        Total this month
      </p>
      <div className="flex items-baseline gap-2.5">
        <span
          className="font-manrope font-bold"
          style={{ fontSize: 36, color: "#FFFFFF" }}
        >
          {loading ? "—" : fmtMoney(totalThisMonth)}
        </span>
        {trendLabel && !loading && (
          <span
            className="font-manrope text-[14px] font-semibold"
            style={{ color: "rgba(255,255,255,0.9)" }}
          >
            {trendLabel}
          </span>
        )}
      </div>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-background font-manrope overflow-y-auto">
      <GradientHeader
        onMenu={onMenu}
        title="Earnings"
        subtitle={monthLabel}
      >
        {GradientContent}
      </GradientHeader>

      <div className="flex-1 px-4 pt-8 pb-4 flex flex-col">

        {/* ── Bar chart card ───────────────────────────────────────────── */}
        <Card className="mb-3">
          <div style={{ height: 140 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 8, right: 0, left: -28, bottom: 0 }}
                barCategoryGap="28%"
              >
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontFamily: "Manrope, sans-serif",
                    fontSize: 11,
                    fill: "#6B7280",
                  }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontFamily: "Manrope, sans-serif",
                    fontSize: 10,
                    fill: "#6B7280",
                  }}
                  tickFormatter={(v) => (v === 0 ? "" : `$${v}`)}
                />
                <Bar dataKey="income" radius={[6, 6, 3, 3]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isCurrentMonth ? "#FF751F" : "#E5E5EA"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* ── Breakdown heading ────────────────────────────────────────── */}
        <p className="font-manrope text-[16px] font-bold text-foreground mt-1 mb-3 px-1">
          Breakdown
        </p>

        {/* ── Breakdown empty state ────────────────────────────────────── */}
        {!loading && breakdown.length === 0 && (
          <Card className="mb-2">
            <p className="font-manrope text-[14px] text-muted text-center py-4">
              No completed bookings this month
            </p>
          </Card>
        )}

        {/* ── Breakdown skeleton ───────────────────────────────────────── */}
        {loading &&
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-full h-[64px] rounded-card mb-2 animate-pulse"
              style={{ background: "#E5E5EA" }}
            />
          ))}

        {/* ── Breakdown cards ──────────────────────────────────────────── */}
        {!loading &&
          breakdown.map((item) => (
            <Card key={item.name} className="flex justify-between items-center mb-2">
              <div className="min-w-0">
                <p className="font-manrope text-[16px] font-semibold text-foreground m-0 truncate">
                  {item.name}
                </p>
                <p className="font-manrope text-[13px] text-muted m-0 mt-0.5">
                  {item.sessions} {item.sessions === 1 ? "session" : "sessions"}
                </p>
              </div>
              <span className="font-manrope text-[16px] font-semibold text-foreground flex-shrink-0 ml-3">
                {fmtMoney(item.revenue)}
              </span>
            </Card>
          ))}

        {/* ── Next payout card ─────────────────────────────────────────── */}
        {!loading && (
          <Card
            className="flex justify-between items-center mt-1 mb-2"
            style={{ background: "#F0FDF4" }}
          >
            <div className="min-w-0">
              <p
                className="font-manrope text-[15px] font-semibold m-0"
                style={{ color: "#15803D" }}
              >
                Next payout
              </p>
              <p className="font-manrope text-[13px] text-muted m-0 mt-0.5">
                {nextPayoutDate
                  ? `Arrives ${nextPayoutDate} via Stripe`
                  : "Connect Stripe to receive payouts"}
              </p>
            </div>
            <span
              className="font-manrope font-bold flex-shrink-0 ml-3"
              style={{ fontSize: 20, color: "#15803D" }}
            >
              {fmtMoney(nextPayoutAmount)}
            </span>
          </Card>
        )}

      </div>

      <Footer />
    </div>
  );
};

export default ProviderEarnings;
