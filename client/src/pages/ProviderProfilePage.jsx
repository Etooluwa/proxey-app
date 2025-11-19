import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Rating from "../components/ui/Rating";
import "../styles/providerProfile.css";

function ProviderProfilePage() {
  const { providerId } = useParams();
  const navigate = useNavigate();
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProvider = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API call
        // const response = await fetch(`${process.env.REACT_APP_API_URL}/api/providers/${providerId}`);
        // const data = await response.json();

        // Mock data for now
        const mockProvider = {
          id: providerId,
          name: "Jane Doe",
          title: "Master Plumber",
          avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBpc9y2ea68FozPU764iUnpvjlRlJY39sLnX5anPmzntHsN6Jbx0nFzl3fAtKfA6EcAlds_3dc_RGH6okeWOEFHy3WwOggM2AGyQY77Jhv1NdFFxfIAA1x9L2xiEcKDueRaKufKnA9KldyN7W1eZ_oh27C0JJd2MB55o_HWfY5-Bkel6T7koad9zSGc8nvQplL00mVg2x-DA5Arv_nHgERn4Fi-IEO664AwVVhW44nGv4mwjc6nPR6Oxk0ubwUljxxDHmtY5pFu_DoP",
          about: "With over 15 years of experience in residential and commercial plumbing, Jane is dedicated to providing high-quality, reliable service. She specializes in emergency repairs and eco-friendly installations. Jane takes pride in her work and ensures every project is completed with precision and care.",
          rating: 4.9,
          reviewCount: 120,
          availability: "Mon-Fri, 9 AM - 5 PM",
          services: [
            {
              id: 1,
              name: "Emergency Leak Repair",
              description: "1-2 hours • Quick response",
              price: 150,
            },
            {
              id: 2,
              name: "Drain Unclogging",
              description: "30-60 mins • Standard service",
              price: 85,
            },
            {
              id: 3,
              name: "Faucet Installation",
              description: "1 hour • All models",
              price: 120,
            },
          ],
          ratingBreakdown: {
            5: { count: 108, percentage: 90 },
            4: { count: 8, percentage: 7 },
            3: { count: 2, percentage: 2 },
            2: { count: 1, percentage: 1 },
            1: { count: 1, percentage: 0 },
          },
          reviews: [
            {
              id: 1,
              author: "John Smith",
              rating: 5,
              text: "Jane was professional and quick. Highly recommend!",
              date: "2 weeks ago",
            },
            {
              id: 2,
              author: "Sarah Johnson",
              rating: 5,
              text: "Fixed our emergency leak in less than an hour. Great service!",
              date: "1 month ago",
            },
            {
              id: 3,
              author: "Mike Davis",
              rating: 4,
              text: "Good work, very professional. Would book again.",
              date: "2 months ago",
            },
          ],
        };

        setProvider(mockProvider);
        setError(null);
      } catch (err) {
        console.error("Error fetching provider:", err);
        setError("Failed to load provider profile");
      } finally {
        setLoading(false);
      }
    };

    if (providerId) {
      fetchProvider();
    }
  }, [providerId]);

  if (loading) {
    return (
      <div className="provider-profile">
        <div className="provider-profile__loading">Loading provider profile...</div>
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="provider-profile">
        <div className="provider-profile__error">
          <p>{error || "Provider not found"}</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  const handleBooking = (service) => {
    navigate("/app/book", {
      state: {
        providerId: provider.id,
        service: service
      }
    });
  };

  return (
    <div className="provider-profile">
      {/* Top App Bar */}
      <div className="provider-profile__header">
        <button
          className="provider-profile__back-btn"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="provider-profile__title">Profile</h1>
        <button className="provider-profile__menu-btn" aria-label="More options">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 8c1.1 0 2-0.9 2-2s-0.9-2-2-2-2 0.9-2 2 0.9 2 2 2zm0 2c-1.1 0-2 0.9-2 2s0.9 2 2 2 2-0.9 2-2-0.9-2-2-2zm0 6c-1.1 0-2 0.9-2 2s0.9 2 2 2 2-0.9 2-2-0.9-2-2-2z" />
          </svg>
        </button>
      </div>

      {/* Profile Header Section */}
      <div className="provider-profile__hero">
        <img
          src={provider.avatar}
          alt={provider.name}
          className="provider-profile__avatar"
        />
        <h2 className="provider-profile__name">{provider.name}</h2>
        <p className="provider-profile__title-text">{provider.title}</p>

        <div className="provider-profile__actions">
          <button className="provider-profile__action-btn provider-profile__action-btn--secondary">
            Message
          </button>
          <button className="provider-profile__action-btn provider-profile__action-btn--primary">
            Follow
          </button>
        </div>
      </div>

      {/* About Section */}
      <section className="provider-profile__section">
        <h3 className="provider-profile__section-title">About</h3>
        <p className="provider-profile__about">{provider.about}</p>
        <a href="#" className="provider-profile__read-more">Read More</a>
      </section>

      {/* Services Section */}
      <section className="provider-profile__section">
        <h3 className="provider-profile__section-title">Services</h3>
        <div className="provider-profile__services">
          {provider.services.map((service) => (
            <div key={service.id} className="provider-profile__service-item">
              <div className="provider-profile__service-info">
                <h4 className="provider-profile__service-name">{service.name}</h4>
                <p className="provider-profile__service-description">{service.description}</p>
              </div>
              <p className="provider-profile__service-price">${service.price}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Availability Section */}
      <section className="provider-profile__section">
        <h3 className="provider-profile__section-title">Availability</h3>
        <div className="provider-profile__availability">
          <p className="provider-profile__availability-text">
            Generally available <span className="provider-profile__availability-highlight">{provider.availability}</span>
          </p>
          <Button className="provider-profile__schedule-btn">
            View Full Schedule
          </Button>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="provider-profile__section">
        <div className="provider-profile__reviews-header">
          <h3 className="provider-profile__section-title">Reviews</h3>
          <a href="#" className="provider-profile__see-all">See all</a>
        </div>

        {/* Rating Summary */}
        <div className="provider-profile__rating-summary">
          <div className="provider-profile__rating-score">
            <p className="provider-profile__rating-number">{provider.rating}</p>
            <div className="provider-profile__rating-stars">
              <Rating value={provider.rating} count={provider.reviewCount} />
            </div>
            <p className="provider-profile__rating-count">({provider.reviewCount} reviews)</p>
          </div>

          {/* Rating Breakdown */}
          <div className="provider-profile__rating-breakdown">
            {[5, 4, 3, 2, 1].map((starCount) => {
              const data = provider.ratingBreakdown[starCount];
              return (
                <div key={starCount} className="provider-profile__rating-row">
                  <p className="provider-profile__rating-label">{starCount}</p>
                  <div className="provider-profile__rating-bar-container">
                    <div
                      className="provider-profile__rating-bar"
                      style={{ width: `${data.percentage}%` }}
                    />
                  </div>
                  <p className="provider-profile__rating-percentage">{data.percentage}%</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Individual Reviews */}
        <div className="provider-profile__reviews-list">
          {provider.reviews.map((review) => (
            <div key={review.id} className="provider-profile__review-item">
              <div className="provider-profile__review-header">
                <h4 className="provider-profile__review-author">{review.author}</h4>
                <span className="provider-profile__review-date">{review.date}</span>
              </div>
              <div className="provider-profile__review-rating">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={`provider-profile__review-star ${
                      i < review.rating ? "provider-profile__review-star--filled" : ""
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <p className="provider-profile__review-text">{review.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Spacer for bottom button */}
      <div className="provider-profile__spacer" />

      {/* Floating Book Now Button */}
      <div className="provider-profile__footer">
        <Button
          className="provider-profile__book-btn"
          onClick={() => navigate("/app/book", { state: { providerId: provider.id } })}
        >
          Book Now
        </Button>
      </div>
    </div>
  );
}

export default ProviderProfilePage;
