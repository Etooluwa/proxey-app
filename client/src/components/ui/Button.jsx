import { forwardRef } from "react";
import "../../styles/ui/button.css";

const Button = forwardRef(
  (
    {
      as: Component = "button",
      variant = "primary",
      size = "md",
      icon,
      children,
      className = "",
      disabled = false,
      loading = false,
      ...props
    },
    ref
  ) => {
    const classes = [
      "ui-button",
      `ui-button--${variant}`,
      `ui-button--${size}`,
      loading ? "ui-button--loading" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <Component
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        {...props}
      >
        {icon ? <span className="ui-button__icon">{icon}</span> : null}
        <span className="ui-button__label">
          {loading ? "Please wait…" : children}
        </span>
      </Component>
    );
  }
);

export default Button;
