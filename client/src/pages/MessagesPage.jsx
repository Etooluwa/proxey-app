import Card from "../components/ui/Card";
import "../styles/messages.css";

function MessagesPage() {
  return (
    <div className="messages">
      <div className="messages__empty-state">
        <div className="messages__empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1 className="messages__empty-title">No messages yet</h1>
        <p className="messages__empty-subtitle">
          Messages with service providers will appear here once you book a service.
        </p>
      </div>
    </div>
  );
}

export default MessagesPage;
