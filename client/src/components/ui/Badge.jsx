import "../../styles/ui/badge.css";

function Badge({ children, variant = "default", className = "" }) {
  const classes = ["ui-badge", `ui-badge--${variant}`, className]
    .filter(Boolean)
    .join(" ");
  return <span className={classes}>{children}</span>;
}

export default Badge;
