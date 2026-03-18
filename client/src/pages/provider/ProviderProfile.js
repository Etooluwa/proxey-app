import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useSession } from "../../auth/authContext";
import { request } from "../../data/apiClient";
import Avatar from "../../components/ui/Avatar";
import Card from "../../components/ui/Card";
import MenuBtn from "../../components/ui/MenuBtn";
import Footer from "../../components/ui/Footer";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name) {
  if (!name) return "P";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ─── Settings rows ────────────────────────────────────────────────────────────

const SETTINGS = [
  { label: "Personal details",   sub: "Name, email, phone" },
  { label: "Business details",   sub: "Studio name, address" },
  { label: "Photos & portfolio", sub: "Manage gallery images" },
  { label: "Payouts & billing",  sub: "Stripe Connect" },
  { label: "Working hours",      sub: "Availability schedule" },
  { label: "Notifications",      sub: "Email, push, SMS" },
  { label: "Booking settings",   sub: "Cancellation, buffer times" },
  { label: "Help & support",     sub: "FAQ, contact Kliques" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

const ProviderProfile = () => {
  const { onMenu } = useOutletContext() || {};
  const navigate = useNavigate();
  const { session, profile, logout } = useSession();

  const [providerProfile, setProviderProfile] = useState(null);
  const [stats, setStats] = useState({ rating: null, reviews: 0, clients: 0 });

  useEffect(() => {
    if (!session) return;
    Promise.all([
      request("/provider/me").catch(() => null),
      request("/provider/stats").catch(() => null),
    ]).then(([meData, statsData]) => {
      if (meData?.profile) setProviderProfile(meData.profile);
      if (statsData?.stats) setStats(statsData.stats);
    });
  }, [session]);

  // Derive display values
  const name =
    providerProfile?.name ||
    profile?.name ||
    session?.user?.email?.split("@")[0] ||
    "Provider";
  const studioName =
    providerProfile?.business_name || providerProfile?.studio_name || null;
  const initials = getInitials(name);

  const statCards = [
    { label: "Rating",  value: stats.rating ? `${stats.rating} ★` : "—" },
    { label: "Reviews", value: String(stats.reviews || 0) },
    { label: "Clients", value: String(stats.clients || 0) },
  ];

  const handleSignOut = async () => {
    await logout();
    navigate("/auth/signin", { replace: true });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background font-manrope overflow-y-auto">

      {/* ── Gradient header ────────────────────────────────────────────── */}
      <div
        className="relative flex flex-col"
        style={{
          background:
            "linear-gradient(180deg,#D45400 0%,#E87020 40%,#F09050 65%,#F5C4A0 82%,#F2F2F7 100%)",
          borderRadius: "0 0 28px 28px",
          marginBottom: "-20px",
          zIndex: 1,
          paddingBottom: "52px",
        }}
      >
        {/* Menu button */}
        <div className="w-full px-5 pt-1 mb-4">
          <MenuBtn onClick={onMenu} white />
        </div>

        {/* Centered avatar + name + studio */}
        <div className="flex flex-col items-center px-5">
          <Avatar initials={initials} size={80} />

          <p
            className="font-manrope font-bold text-white m-0 mt-3 mb-0.5"
            style={{ fontSize: 22 }}
          >
            {name}
          </p>

          {studioName && (
            <p
              className="font-manrope text-[14px] m-0"
              style={{ color: "rgba(255,255,255,0.8)" }}
            >
              {studioName}
            </p>
          )}

          {/* Frosted stat cards */}
          <div className="flex gap-2.5 mt-4 w-full">
            {statCards.map((s) => (
              <div
                key={s.label}
                className="flex-1 flex flex-col items-center py-3 px-2 rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.2)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <p
                  className="font-manrope font-bold text-white m-0 mb-0.5"
                  style={{ fontSize: 18 }}
                >
                  {s.value}
                </p>
                <p
                  className="font-manrope text-[12px] m-0"
                  style={{ color: "rgba(255,255,255,0.7)" }}
                >
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Settings rows ──────────────────────────────────────────────── */}
      <div className="flex-1 px-4 pt-8 pb-4 flex flex-col">

        {SETTINGS.map((item) => (
          <Card
            key={item.label}
            className="flex items-center gap-3.5 mb-2 cursor-pointer"
          >
            <div className="flex-1 min-w-0">
              <p className="font-manrope text-[16px] font-semibold text-foreground m-0">
                {item.label}
              </p>
              <p className="font-manrope text-[14px] text-muted m-0 mt-0.5">
                {item.sub}
              </p>
            </div>
            <svg
              width="20"
              height="20"
              fill="none"
              stroke="#6B7280"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
              className="flex-shrink-0"
            >
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Card>
        ))}

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="w-full font-manrope text-[15px] font-semibold focus:outline-none mt-1"
          style={{
            padding: "14px",
            borderRadius: "12px",
            border: "none",
            background: "#FEF2F2",
            color: "#EF4444",
            cursor: "pointer",
          }}
        >
          Sign out
        </button>

        <Footer />
      </div>
    </div>
  );
};

export default ProviderProfile;
