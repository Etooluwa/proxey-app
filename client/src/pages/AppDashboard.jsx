import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Skeleton from "../components/ui/Skeleton";
import { useSession } from "../auth/authContext";
import useServices from "../data/useServices";
import useBookings from "../data/useBookings";
import { loadDraft } from "../bookings/draftStore";
import "../App.css";
import "../styles/dashboard.css";

function AppDashboard() {
  const { session, profile } = useSession();
  const navigate = useNavigate();
  const { services, loading: servicesLoading } = useServices();
  const { upcoming, loading: bookingsLoading } = useBookings();
  const draft = loadDraft();

  const recommendedCategories = useMemo(() => {
    const categories = services.map((service) => service.category);
    return Array.from(new Set(categories)).slice(0, 6);
  }, [services]);

  const nextBooking = upcoming?.[0];

  return (
    <div className="dashboard">
      <section>
        <h1 className="dashboard__title">
          Welcome back, {profile?.name || session?.user?.email?.split("@")[0]} 👋
        </h1>
        <p className="dashboard__subtitle">
          Plan your next booking or check what’s coming up this week.
        </p>
      </section>

      <section>
        <h2 className="app-shell__section-title">Quick actions</h2>
        <div className="quick-actions">
          <Card>
            <h3 className="card__title">Book a service</h3>
            <p className="card__support">
              Browse our trusted providers and lock in a time that works for you.
            </p>
            <Button onClick={() => navigate("/app/book")}>Start a booking</Button>
          </Card>
          <Card>
            <h3 className="card__title">My bookings</h3>
            <p className="card__support">
              Track upcoming visits, review past appointments, and manage invoices.
            </p>
            <Button variant="secondary" onClick={() => navigate("/app/bookings")}>
              View schedule
            </Button>
          </Card>
          <Card>
            <h3 className="card__title">Refer a provider</h3>
            <p className="card__support">
              Invite your favourite pros to join Proxey and earn booking credits.
            </p>
            <Button variant="ghost" onClick={() => navigate("/app/account")}>
              Share invite link
            </Button>
          </Card>
        </div>
      </section>

      <section>
        <h2 className="app-shell__section-title">Continue where you left off</h2>
        {draft ? (
          <Card>
            <h3 className="card__title">Finish your booking draft</h3>
            <p className="card__support">
              {draft.serviceName
                ? `You were booking ${draft.serviceName}. Pick up where you left off.`
                : "Pick up your draft booking and confirm the details."}
            </p>
            <Button onClick={() => navigate("/app/book")}>Resume booking</Button>
          </Card>
        ) : (
          <Card>
            <h3 className="card__title">Nothing in progress</h3>
            <p className="card__support">
              Start a new booking whenever you’re ready. We’ll save your progress automatically.
            </p>
          </Card>
        )}
      </section>

      <section>
        <h2 className="app-shell__section-title">Next booking</h2>
        {bookingsLoading ? (
          <Card>
            <Skeleton height={18} width="45%" />
            <Skeleton height={14} width="70%" />
            <Skeleton height={12} width="60%" />
          </Card>
        ) : nextBooking ? (
          <Card>
            <h3 className="card__title">Upcoming · {new Date(nextBooking.scheduledAt).toLocaleString()}</h3>
            <p className="card__support">
              {nextBooking.notes || "We’ll notify you and the provider with any changes."}
            </p>
            <Button variant="secondary" onClick={() => navigate("/app/bookings")}>
              Manage booking
            </Button>
          </Card>
        ) : (
          <Card>
            <h3 className="card__title">No bookings scheduled</h3>
            <p className="card__support">
              Ready for a fresh start? Explore providers and secure your next appointment.
            </p>
            <Button onClick={() => navigate("/app/browse")}>Browse providers</Button>
          </Card>
        )}
      </section>

      <section>
        <h2 className="app-shell__section-title">Recommended categories</h2>
        <div className="recommended">
          {servicesLoading ? (
            <Skeleton height={40} />
          ) : (
            recommendedCategories.map((category) => (
              <Link key={category} to={`/app/browse?category=${encodeURIComponent(category)}`}>
                <Badge>{category}</Badge>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default AppDashboard;
