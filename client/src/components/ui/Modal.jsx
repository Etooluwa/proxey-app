import "../../styles/ui/modal.css";
import Button from "./Button";

function Modal({
  title,
  description,
  open,
  onClose,
  confirmLabel = "Confirm",
  cancelLabel = "Dismiss",
  onConfirm,
  confirmVariant = "primary",
  loading = false,
  children,
}) {
  if (!open) return null;

  return (
    <div className="ui-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="ui-modal__backdrop" onClick={onClose} aria-hidden="true" />
      <div className="ui-modal__content">
        <div className="ui-modal__header">
          {title ? (
            <h2 id="modal-title" className="ui-modal__title">
              {title}
            </h2>
          ) : null}
          <button
            className="ui-modal__close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>
        {description ? (
          <p className="ui-modal__description">{description}</p>
        ) : null}
        {children ? <div className="ui-modal__body">{children}</div> : null}
        <div className="ui-modal__actions">
          <Button variant="ghost" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            loading={loading}
            aria-live="assertive"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Modal;
