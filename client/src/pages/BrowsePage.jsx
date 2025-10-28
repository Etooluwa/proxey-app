import { useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Skeleton from "../components/ui/Skeleton";
import ProviderCard from "../components/shared/ProviderCard";
import EmptyState from "../components/shared/EmptyState";
import useProviders from "../data/useProviders";
import useServices from "../data/useServices";
import "../styles/browse.css";

const PRICE_OPTIONS = [
  { label: "Any price", value: "" },
  { label: "$25+", value: "2500" },
  { label: "$50+", value: "5000" },
  { label: "$75+", value: "7500" },
  { label: "$100+", value: "10000" },
];

const RATING_OPTIONS = [
  { label: "Any rating", value: "" },
  { label: "4+ stars", value: "4" },
  { label: "4.5+ stars", value: "4.5" },
];

function BrowsePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [minRating, setMinRating] = useState(searchParams.get("minRating") || "");

  const filters = useMemo(
    () => ({
      category,
      minPrice,
      maxPrice,
      minRating,
    }),
    [category, minPrice, maxPrice, minRating]
  );

  const { providers, loading, empty } = useProviders(filters);
  const { services } = useServices();

  const categories = useMemo(() => {
    const unique = new Set(services.map((service) => service.category));
    return Array.from(unique);
  }, [services]);

  const handleFilterChange = (nextFilters) => {
    const merged = {
      category,
      minPrice,
      maxPrice,
      minRating,
      ...nextFilters,
    };
    setCategory(merged.category);
    setMinPrice(merged.minPrice);
    setMaxPrice(merged.maxPrice);
    setMinRating(merged.minRating);

    const params = new URLSearchParams();
    Object.entries(merged).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    setSearchParams(params, { replace: true });
  };

  return (
    <div className="browse">
      <header className="browse__header">
        <h1 className="browse__title">Browse services & providers</h1>
        <p className="browse__subtitle">
          Compare packages, availability, and reviews before confirming your booking.
        </p>
      </header>

      <section>
        <Card className="browse__filters" aria-label="Filter providers">
          <div className="browse__chips" role="tablist">
            {categories.map((item) => {
              const isActive = item === category;
              return (
                <button
                  key={item}
                  role="tab"
                  type="button"
                  className={`browse__chip ${isActive ? "browse__chip--active" : ""}`}
                  onClick={() =>
                    handleFilterChange({ category: isActive ? "" : item })
                  }
                >
                  {item}
                </button>
              );
            })}
          </div>
          <div className="browse__filter-grid">
            <Select
              label="Minimum price"
              value={minPrice}
              onChange={(event) => handleFilterChange({ minPrice: event.target.value })}
              options={PRICE_OPTIONS.map(({ label, value }) => ({
                label,
                value,
              }))}
            />
            <Input
              label="Maximum price"
              type="number"
              min="0"
              value={maxPrice}
              onChange={(event) => handleFilterChange({ maxPrice: event.target.value })}
              placeholder="Max hourly rate (¢)"
            />
            <Select
              label="Minimum rating"
              value={minRating}
              onChange={(event) => handleFilterChange({ minRating: event.target.value })}
              options={RATING_OPTIONS.map(({ label, value }) => ({
                label,
                value,
              }))}
            />
            <Button variant="ghost" onClick={() => handleFilterChange({ category: "", minPrice: "", maxPrice: "", minRating: "" })}>
              Reset filters
            </Button>
          </div>
        </Card>
      </section>

      <section className="browse__results" aria-live="polite">
        {loading ? (
          <div className="grid grid--two">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index}>
                <Skeleton height={72} width="30%" />
                <Skeleton height={16} width="60%" />
                <Skeleton height={12} width="80%" />
                <Skeleton height={36} width="40%" />
              </Card>
            ))}
          </div>
        ) : empty ? (
          <EmptyState
            title="No providers match your filters"
            description="Adjust your filters or explore a different category to discover more providers."
            actionLabel="Clear filters"
            onAction={() =>
              handleFilterChange({
                category: "",
                minPrice: "",
                maxPrice: "",
                minRating: "",
              })
            }
          />
        ) : (
          <div className="grid grid--two">
            {providers.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                onBook={() =>
                  navigate("/app/book", { state: { providerId: provider.id } })
                }
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default BrowsePage;
