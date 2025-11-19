import { useNavigate } from "react-router-dom";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import Rating from "../ui/Rating";
import "../../styles/ui/providerCard.css";

function ProviderCard({ provider, onBook }) {
  const navigate = useNavigate();

  if (!provider) return null;

  const handleViewProfile = () => {
    navigate(`/app/provider/${provider.id}`);
  };

  return (
    <Card className="provider-card">
      <div className="provider-card__header">
        <img
          src={provider.avatar}
          alt={`${provider.name} profile`}
          className="provider-card__avatar"
        />
        <div className="provider-card__details">
          <h3 className="provider-card__name">{provider.name}</h3>
          <Rating value={provider.rating} count={provider.reviewCount} size="sm" />
          <p className="provider-card__headline">{provider.headline}</p>
        </div>
      </div>
      <div className="provider-card__meta">
        <span className="provider-card__rate">
          ${(provider.hourlyRate / 100).toFixed(2)}
          <span className="provider-card__rate-unit">/hour</span>
        </span>
        <span className="provider-card__location">{provider.location}</span>
      </div>
      <div className="provider-card__tags" aria-label="Categories">
        {provider.categories?.map((category) => (
          <Badge key={category}>{category}</Badge>
        ))}
      </div>
      <Button variant="primary" onClick={handleViewProfile}>
        View Profile
      </Button>
    </Card>
  );
}

export default ProviderCard;
