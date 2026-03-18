import { useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useSession } from "../auth/authContext";
import Avatar from "../components/ui/Avatar";
import Card from "../components/ui/Card";
import MenuBtn from "../components/ui/MenuBtn";
import Footer from "../components/ui/Footer";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function memberSince(createdAt) {
  if (!createdAt) return null;
  return new Date(createdAt).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

// ─── Settings rows ─────────────────────────────────────────────────────────

const SETTINGS = [
  { label: "Personal details",   sub: "Name, email, phone" },
  { label: "Payment methods",    sub: "Manage your cards" },
  { label: "Notifications",      sub: "Email, push, SMS" },
  { label: "Privacy & security", sub: "Password, data" },
  { label: "Help & support",     sub: "FAQ, contact us" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

function AccountPage() {
  const { onMenu } = useOutletContext() || {};
  const { session, profile, logout } = useSession();
  const navigate = useNavigate();

  // Redirect providers to their dedicated profile page
  useEffect(() => {
    if (session?.user?.role === "provider") {
      navigate("/provider/profile", { replace: true });
    }
  }, [session?.user?.role, navigate]);

  const displayName = profile?.name || session?.user?.email?.split("@")[0] || "You";
  const initials    = getInitials(profile?.name || session?.user?.email || "");
  const since       = memberSince(session?.user?.created_at || profile?.created_at);

  return (
    <div
      className="flex flex-col min-h-screen bg-background font-manrope overflow-y-auto"
    >
      {/* ── Gradient header ──────────────────────────────────────────────── */}
      <div
        className="relative flex flex-col items-center pb-13"
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

        {/* Avatar + name + since */}
        <Avatar initials={initials} size={80} />
        <p
          className="font-manrope text-[22px] font-bold text-white m-0 mt-3"
        >
          {displayName}
        </p>
        {since && (
          <p
            className="font-manrope text-[14px] m-0 mt-0.5"
            style={{ color: "rgba(255,255,255,0.8)" }}
          >
            Member since {since}
          </p>
        )}
      </div>

      {/* ── Settings list ─────────────────────────────────────────────────── */}
      <div className="flex-1 px-4 pt-8 pb-4 flex flex-col" style={{ zIndex: 0 }}>
        {SETTINGS.map(({ label, sub }) => (
          <button
            key={label}
            className="w-full text-left focus:outline-none"
          >
            <Card className="flex items-center gap-3.5 mb-2">
              <div className="flex-1">
                <p className="font-manrope text-[16px] font-semibold text-foreground m-0">
                  {label}
                </p>
                <p className="font-manrope text-[14px] text-muted m-0 mt-0.5">
                  {sub}
                </p>
              </div>
              {/* Chevron */}
              <svg
                width="20"
                height="20"
                fill="none"
                stroke="#6B7280"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path
                  d="M9 5l7 7-7 7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Card>
          </button>
        ))}

        {/* Sign out */}
        <button
          onClick={logout}
          className="w-full mt-2 py-3.5 rounded-card font-manrope text-[15px] font-semibold focus:outline-none active:scale-[0.98] transition-transform"
          style={{
            background: "#FEF2F2",
            color: "#EF4444",
            border: "none",
          }}
        >
          Sign out
        </button>

        <Footer />
      </div>
    </div>
  );
}

export default AccountPage;
