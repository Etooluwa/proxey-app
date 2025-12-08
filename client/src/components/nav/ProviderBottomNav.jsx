import { NavLink } from "react-router-dom";
import "../../styles/provider/providerBottomNav.css";

const ICONS = {
  home: (
    <path d="M4.5 11.5 12 4l7.5 7.5V19a1 1 0 0 1-1 1h-3.5v-5h-5v5H6a1 1 0 0 1-1-1z" />
  ),
  briefcase: (
    <path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2h3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7zM10 7h4V5h-4z" />
  ),
  coins: (
    <path d="M4 7a8 4 0 1 1 16 0v10a8 4 0 1 1-16 0zm8-2c3.314 0 6 1.119 6 2.5S15.314 10 12 10s-6-1.119-6-2.5S8.686 5 12 5zm-6 6.236C7.51 12.412 9.647 13 12 13c2.352 0 4.49-.588 6-1.764V15.5c0 1.381-2.686 2.5-6 2.5s-6-1.119-6-2.5z" />
  ),
  calendar: (
    <path d="M7 4V2m10 2V2m-9 6h8m3 13H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v15a2 2 0 0 1-2 2z" />
  ),
  document: (
    <path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9zm3 0v5h5M9 13h6m-6 4h6" />
  ),
  user: (
    <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z" />
  ),
};

function ProviderBottomNav({ activePath }) {
  const items = [
    { to: "/provider", label: "Home", icon: "home" },
    { to: "/provider/jobs", label: "Jobs", icon: "briefcase" },
    { to: "/provider/earnings", label: "Earnings", icon: "coins" },
    { to: "/provider/invoices", label: "Invoices", icon: "document" },
    { to: "/provider/schedule", label: "Schedule", icon: "calendar" },
    { to: "/provider/profile", label: "Profile", icon: "user" },
  ];

  return (
    <nav className="provider-bottom-nav" aria-label="Provider navigation">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            [
              "provider-bottom-nav__item",
              isActive || activePath.startsWith(item.to)
                ? "provider-bottom-nav__item--active"
                : "",
            ]
              .filter(Boolean)
              .join(" ")
          }
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            {ICONS[item.icon]}
          </svg>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default ProviderBottomNav;
