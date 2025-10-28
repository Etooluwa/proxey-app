import "../../styles/ui/input.css";

function Input({
  label,
  id,
  error,
  helperText,
  type = "text",
  className = "",
  ...props
}) {
  const classes = ["ui-input", error ? "ui-input--error" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <label className="ui-input__root" htmlFor={id}>
      {label ? <span className="ui-input__label">{label}</span> : null}
      <input id={id} type={type} className={classes} aria-invalid={!!error} {...props} />
      {helperText && !error ? (
        <span className="ui-input__helper">{helperText}</span>
      ) : null}
      {error ? <span className="ui-input__error">{error}</span> : null}
    </label>
  );
}

export default Input;
