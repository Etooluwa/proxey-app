import "../../styles/ui/select.css";

function Select({
  label,
  id,
  options = [],
  placeholder = "Select an option",
  error,
  helperText,
  className = "",
  ...props
}) {
  const classes = ["ui-select", error ? "ui-select--error" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <label className="ui-select__root" htmlFor={id}>
      {label ? <span className="ui-select__label">{label}</span> : null}
      <select id={id} className={classes} aria-invalid={!!error} {...props}>
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {helperText && !error ? (
        <span className="ui-select__helper">{helperText}</span>
      ) : null}
      {error ? <span className="ui-select__error">{error}</span> : null}
    </label>
  );
}

export default Select;
