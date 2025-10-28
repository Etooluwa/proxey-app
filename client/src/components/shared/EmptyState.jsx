import Button from "../ui/Button";
import Card from "../ui/Card";
import "../../styles/ui/emptyState.css";

function EmptyState({ title, description, actionLabel, onAction }) {
  return (
    <Card className="empty-state">
      <div className="empty-state__icon" aria-hidden="true">
        ☘️
      </div>
      <h3 className="empty-state__title">{title}</h3>
      <p className="empty-state__description">{description}</p>
      {actionLabel ? (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </Card>
  );
}

export default EmptyState;
