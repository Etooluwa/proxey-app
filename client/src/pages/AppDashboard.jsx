import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../auth/authContext";
import "../App.css";
import "../styles/dashboard.css";

function AppDashboard() {
  const { session, profile } = useSession();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/app/browse?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="dashboard dashboard--welcome">
      <div className="dashboard__search-section">
        <form onSubmit={handleSearch} className="dashboard__search-form">
          <div className="dashboard__search-wrapper">
            <svg
              className="dashboard__search-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" strokeWidth="2" />
              <path d="m21 21-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              className="dashboard__search-input"
              placeholder="Search service or provider"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search for services or providers"
            />
          </div>
        </form>
      </div>

      <div className="dashboard__empty-state">
        <div className="dashboard__empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8" strokeWidth="2.5" />
            <path d="m21 21-4.35-4.35" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="dashboard__empty-title">Welcome to Kliques!</h1>
        <p className="dashboard__empty-subtitle">
          Start by searching for services or providers above to find what you need.
        </p>
      </div>
    </div>
  );
}

export default AppDashboard;
