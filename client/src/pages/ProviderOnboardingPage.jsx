import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import StepIndicator from "../components/ui/StepIndicator";
import { useSession } from "../auth/authContext";
import { useToast } from "../components/ui/ToastProvider";
import { SERVICE_CATEGORIES, filterCities } from "../utils/categories";
import "../styles/providerOnboarding.css";

function ProviderOnboardingPage() {
  const { updateProfile } = useSession();
  const toast = useToast();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    category: "",
    city: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [cityInputFocused, setCityInputFocused] = useState(false);
  const [citySuggestions, setCitySuggestions] = useState([]);

  const handleNameChange = (event) => {
    setForm((prev) => ({ ...prev, name: event.target.value }));
  };

  const handleCategoryChange = (event) => {
    setForm((prev) => ({ ...prev, category: event.target.value }));
  };

  const handleCityChange = (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, city: value }));

    // Update suggestions
    if (value.trim().length > 0) {
      const suggestions = filterCities(value);
      setCitySuggestions(suggestions);
    } else {
      setCitySuggestions([]);
    }
  };

  const handleCitySelect = (city) => {
    setForm((prev) => ({ ...prev, city }));
    setCitySuggestions([]);
    setCityInputFocused(false);
  };

  const handleNext = () => {
    // Validate step 1
    if (currentStep === 1) {
      if (!form.name.trim()) {
        toast.push({
          title: "Name required",
          description: "Please enter your full name to continue.",
          variant: "error",
        });
        return;
      }

      if (!form.category) {
        toast.push({
          title: "Category required",
          description: "Please select a service category to continue.",
          variant: "error",
        });
        return;
      }

      if (!form.city.trim()) {
        toast.push({
          title: "City required",
          description: "Please enter your city to continue.",
          variant: "error",
        });
        return;
      }

      // TODO: Move to next step when implemented
      toast.push({
        title: "Step 1 complete!",
        description: "Next steps coming soon.",
        variant: "success",
      });
      return;
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate(-1);
    }
  };

  const renderStepContent = () => {
    if (currentStep === 1) {
      return (
        <div className="provider-onboarding__content">
          {/* Step Header */}
          <div className="provider-onboarding__step-header">
            <h2 className="provider-onboarding__step-title">
              Set up your business profile
            </h2>
            <p className="provider-onboarding__step-subtitle">
              This information will be visible to clients on your public profile.
            </p>
          </div>

          {/* Form Fields */}
          <div className="provider-onboarding__fields">
            {/* Provider Name */}
            <label className="provider-onboarding__field">
              <span className="provider-onboarding__field-label">Full Name</span>
              <div className="provider-onboarding__input-wrapper">
                <svg
                  className="provider-onboarding__input-icon"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z" />
                </svg>
                <input
                  type="text"
                  className="provider-onboarding__input provider-onboarding__input--with-icon"
                  placeholder="e.g., John Smith"
                  value={form.name}
                  onChange={handleNameChange}
                />
              </div>
            </label>

            {/* Service Category */}
            <label className="provider-onboarding__field">
              <span className="provider-onboarding__field-label">
                Service Category
              </span>
              <div className="provider-onboarding__input-wrapper">
                <svg
                  className="provider-onboarding__input-icon"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2l-5.5 9h11L12 2zm0 3.84L13.93 9h-3.87L12 5.84zM17.5 13c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5zm0 7c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zM3 21.5h8v-8H3v8zm2-6h4v4H5v-4z" />
                </svg>
                <select
                  className="provider-onboarding__select provider-onboarding__input--with-icon"
                  value={form.category}
                  onChange={handleCategoryChange}
                >
                  <option value="" disabled>
                    Select a category
                  </option>
                  {SERVICE_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <svg
                  className="provider-onboarding__select-icon"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M7 10l5 5 5-5z" />
                </svg>
              </div>
            </label>

            {/* City */}
            <label className="provider-onboarding__field">
              <span className="provider-onboarding__field-label">City</span>
              <div className="provider-onboarding__input-wrapper provider-onboarding__autocomplete">
                <svg
                  className="provider-onboarding__input-icon"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
                <input
                  type="text"
                  className="provider-onboarding__input provider-onboarding__input--with-icon"
                  placeholder="Enter your city"
                  value={form.city}
                  onChange={handleCityChange}
                  onFocus={() => setCityInputFocused(true)}
                  onBlur={() => {
                    // Delay to allow click on suggestion
                    setTimeout(() => setCityInputFocused(false), 200);
                  }}
                  autoComplete="off"
                />
                {cityInputFocused && citySuggestions.length > 0 && (
                  <div className="provider-onboarding__suggestions">
                    {citySuggestions.map((city) => (
                      <button
                        key={city}
                        type="button"
                        className="provider-onboarding__suggestion-item"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleCitySelect(city);
                        }}
                      >
                        <svg
                          className="provider-onboarding__suggestion-icon"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                        </svg>
                        {city}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </label>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="provider-onboarding">
      {/* Header */}
      <header className="provider-onboarding__header">
        <button
          type="button"
          onClick={handleBack}
          className="provider-onboarding__back"
          aria-label="Go back"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
        </button>
        <h1 className="provider-onboarding__title">Create Profile</h1>
        <div className="provider-onboarding__header-spacer" />
      </header>

      {/* Step Indicator */}
      <StepIndicator currentStep={currentStep} totalSteps={5} />

      {/* Step Content */}
      <div className="provider-onboarding__main">
        {renderStepContent()}

        {/* Next Button */}
        <div className="provider-onboarding__footer">
          <Button
            onClick={handleNext}
            loading={submitting}
            className="provider-onboarding__button"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ProviderOnboardingPage;
