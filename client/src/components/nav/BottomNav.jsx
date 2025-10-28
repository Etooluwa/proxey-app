import { NavLink } from "react-router-dom";
import "../../styles/ui/bottomNav.css";

const ICONS = {
  home: (
    <path d="M4.5 11.5 12 4l7.5 7.5V19a1 1 0 0 1-1 1h-3.5v-5h-5v5H6a1 1 0 0 1-1-1z" />
  ),
  compass: (
    <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm3 6-1.2 5.2L8.5 13 11 8.8z" />
  ),
  plus: (
    <path d="M12 5v14M5 12h14" strokeWidth="1.5" strokeLinecap="round" />
  ),
  calendar: (
    <path d="M7 4V2m10 2V2m-9 6h8m-11 9h14a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1z" />
  ),
  user: (
    <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z" />
  ),
};

function BottomNav({ items = [], activePath }) {
  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      {items.map((item) => {
        const isActive =
          activePath === item.to || activePath.startsWith(`${item.to}/`);
        return (
          <NavLink
            key={item.to}
            to={item.to}
            aria-label={item.label}
            className={({ isActive: navActive }) =>
              [
                "bottom-nav__item",
                navActive || isActive ? "bottom-nav__item--active" : "",
              ]
                .filter(Boolean)
                .join(" ")
            }
          >
            <svg
              viewBox="0 0 24 24"
              focusable="false"
              aria-hidden="true"
              className="bottom-nav__icon"
            >
              {ICONS[item.icon] || ICONS.home}
            </svg>
            <span className="bottom-nav__label">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

export default BottomNav;
