import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Button from "../components/ui/Button";
import StepIndicator from "../components/ui/StepIndicator";
import { useSession } from "../auth/authContext";
import { useNotifications } from "../contexts/NotificationContext";
import { useToast } from "../components/ui/ToastProvider";
import { SERVICE_CATEGORIES, filterCities } from "../utils/categories";
import "../styles/providerOnboarding.css";

function ProviderOnboardingPage() {
  const { updateProfile, session } = useSession();
  const { addNotification } = useNotifications();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);

  const [currentStep, setCurrentStep] = useState(1);

  // Handle return from Stripe
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("completed") === "true") {
      completeOnboarding();
    }
  }, [location]);

  const completeOnboarding = async () => {
    try {
      // Update user profile metadata
      const profileData = {
        name: form.name,
        category: form.category,
        city: form.city,
        services: form.services,
        availability: form.availability,
        isProfileComplete: true,
        onboardingCompletedAt: new Date().toISOString()
      };

      await updateProfile(profileData, form.photo);

      // Sync to providers table so the provider appears in client searches
      try {
        const response = await fetch('/api/providers/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: session?.user?.id,
            name: form.name,
            email: session?.user?.email,
            phone: session?.user?.phone,
            category: form.category,
            city: form.city,
            services: form.services,
            availability: form.availability,
            stripeAccountId: form.stripeAccountId,
            isProfileComplete: true,
            onboardingCompletedAt: new Date().toISOString()
          })
        });

        if (!response.ok) {
          console.warn('[onboarding] Failed to sync provider profile to database');
        } else {
          console.log('[onboarding] Provider profile synced successfully');
        }
      } catch (syncError) {
        console.error('[onboarding] Error syncing provider profile:', syncError);
        // Don't block onboarding if sync fails
      }

      toast.push({
        title: "Setup Complete!",
        description: "Your provider profile is now active.",
        variant: "success",
      });

      // Add Welcome Notification
      addNotification({
        title: "Welcome to Kliques Pro!",
        message: "Your provider profile is live. Start managing your services and bookings.",
        type: "welcome"
      });

      navigate("/provider");
    } catch (error) {
      console.error("Failed to complete onboarding", error);
      toast.push({
        title: "Error",
        description: "Failed to finalize profile setup.",
        variant: "error",
      });
    }
  };
  const [form, setForm] = useState({
    name: "",
    category: "",
    city: "",
    photo: null,
    photoPreview: null,
    services: [],
    availability: {
      monday: { enabled: true, from: "9:00 AM", to: "5:00 PM", breakFrom: "12:00 PM", breakTo: "1:00 PM" },
      tuesday: { enabled: true, from: "9:00 AM", to: "5:00 PM", breakFrom: "12:00 PM", breakTo: "1:00 PM" },
      wednesday: { enabled: true, from: "9:00 AM", to: "5:00 PM", breakFrom: "12:00 PM", breakTo: "1:00 PM" },
      thursday: { enabled: true, from: "9:00 AM", to: "5:00 PM", breakFrom: "12:00 PM", breakTo: "1:00 PM" },
      friday: { enabled: true, from: "9:00 AM", to: "5:00 PM", breakFrom: "12:00 PM", breakTo: "1:00 PM" },
      saturday: { enabled: false, from: "9:00 AM", to: "5:00 PM", breakFrom: "12:00 PM", breakTo: "1:00 PM" },
      sunday: { enabled: false, from: "9:00 AM", to: "5:00 PM", breakFrom: "12:00 PM", breakTo: "1:00 PM" },
    },
    stripeAccountId: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [cityInputFocused, setCityInputFocused] = useState(false);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingServiceIndex, setEditingServiceIndex] = useState(null);
  const [serviceForm, setServiceForm] = useState({
    name: "",
    price: "",
    duration: "",
  });
  const [applyToAll, setApplyToAll] = useState(false);
  const [stripeConnected, setStripeConnected] = useState(false);

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

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      setForm((prev) => ({
        ...prev,
        photo: file,
        photoPreview: preview,
      }));
    }
  };

  const handleSkipPhoto = () => {
    setCurrentStep(3);
  };

  const handleAddService = () => {
    setServiceForm({ name: "", price: "", duration: "" });
    setEditingServiceIndex(null);
    setServiceModalOpen(true);
  };

  const handleEditService = (index) => {
    const service = form.services[index];
    setServiceForm(service);
    setEditingServiceIndex(index);
    setServiceModalOpen(true);
  };

  const handleDeleteService = (index) => {
    setForm((prev) => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index),
    }));
    toast.push({
      title: "Service removed",
      description: "The service has been removed from your list.",
      variant: "success",
    });
  };

  const handleSaveService = () => {
    if (!serviceForm.name.trim()) {
      toast.push({
        title: "Service name required",
        description: "Please enter a service name.",
        variant: "error",
      });
      return;
    }

    if (!serviceForm.price || parseFloat(serviceForm.price) <= 0) {
      toast.push({
        title: "Valid price required",
        description: "Please enter a valid price.",
        variant: "error",
      });
      return;
    }

    if (!serviceForm.duration || parseInt(serviceForm.duration) <= 0) {
      toast.push({
        title: "Valid duration required",
        description: "Please enter a valid duration in minutes.",
        variant: "error",
      });
      return;
    }

    if (editingServiceIndex !== null) {
      // Edit existing service
      setForm((prev) => ({
        ...prev,
        services: prev.services.map((service, index) =>
          index === editingServiceIndex ? serviceForm : service
        ),
      }));
      toast.push({
        title: "Service updated",
        description: "Your service has been updated.",
        variant: "success",
      });
    } else {
      // Add new service
      setForm((prev) => ({
        ...prev,
        services: [...prev.services, serviceForm],
      }));
      toast.push({
        title: "Service added",
        description: "Your service has been added.",
        variant: "success",
      });
    }

    setServiceModalOpen(false);
    setServiceForm({ name: "", price: "", duration: "" });
    setEditingServiceIndex(null);
  };

  const handleDayToggle = (day) => {
    setForm((prev) => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day],
          enabled: !prev.availability[day].enabled,
        },
      },
    }));
  };

  const handleTimeChange = (day, field, value) => {
    setForm((prev) => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day],
          [field]: value,
        },
      },
    }));
  };

  const handleApplyToAll = () => {
    const newApplyToAll = !applyToAll;
    setApplyToAll(newApplyToAll);

    if (newApplyToAll) {
      // Get Monday's times as the template
      const template = form.availability.monday;
      const workingDays = ["monday", "tuesday", "wednesday", "thursday", "friday"];

      setForm((prev) => ({
        ...prev,
        availability: {
          ...prev.availability,
          ...workingDays.reduce((acc, day) => {
            acc[day] = {
              ...prev.availability[day],
              from: template.from,
              to: template.to,
              breakFrom: template.breakFrom,
              breakTo: template.breakTo,
            };
            return acc;
          }, {}),
        },
      }));
    }
  };

  const handleStripeConnect = async () => {
    setSubmitting(true);

    try {
      // Validate required fields
      if (!session?.user?.id || !session?.user?.email) {
        throw new Error("User information is missing. Please log in again.");
      }

      if (!form.name) {
        throw new Error("Business name is required. Please fill in your business name in Step 1.");
      }

      // Create Stripe Connected Account
      const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

      const accountResponse = await fetch(
        `${apiUrl}/api/provider/connected-account`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: session.user.id,
            email: session.user.email,
            businessName: form.name,
          }),
        }
      );

      if (!accountResponse.ok) {
        const errorData = await accountResponse.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to create Stripe account (Status: ${accountResponse.status})`
        );
      }

      const { accountId } = await accountResponse.json();

      if (!accountId) {
        throw new Error("No account ID received from server");
      }

      // Get onboarding link
      const linkResponse = await fetch(
        `${apiUrl}/api/provider/onboarding-link`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            accountId,
            refreshUrl: `${window.location.origin}/provider/onboarding?step=5`,
            returnUrl: `${window.location.origin}/provider/onboarding?completed=true`,
          }),
        }
      );

      if (!linkResponse.ok) {
        const errorData = await linkResponse.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to get onboarding link (Status: ${linkResponse.status})`
        );
      }

      const { onboardingLink } = await linkResponse.json();

      if (!onboardingLink) {
        throw new Error("No onboarding link received from server");
      }

      // Save account ID to profile
      await updateProfile({
        stripeAccountId: accountId,
      });

      setForm((prev) => ({
        ...prev,
        stripeAccountId: accountId,
      }));

      // Open Stripe onboarding form in the same window
      toast.push({
        title: "Redirecting to Stripe",
        description: "Please complete your profile verification",
        variant: "info",
      });

      // Redirect to Stripe after a brief delay to show the toast
      setTimeout(() => {
        window.location.href = onboardingLink;
      }, 500);
    } catch (error) {
      console.error("Bank setup error:", error);
      toast.push({
        title: "Setup failed",
        description: error.message || "An unexpected error occurred",
        variant: "error",
      });
      setSubmitting(false);
    }
  };

  const handleNext = async () => {
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

      setCurrentStep(2);
      return;
    }

    // Step 2 - Photo (optional, can skip)
    if (currentStep === 2) {
      setCurrentStep(3);
      return;
    }

    // Step 3 - Services (optional, can skip)
    if (currentStep === 3) {
      setCurrentStep(4);
      return;
    }

    // Step 4 - Availability (optional, can skip)
    if (currentStep === 4) {
      setCurrentStep(5);
      return;
    }

    // Step 5 - Stripe Connect
    if (currentStep === 5) {
      await handleStripeConnect();
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

    if (currentStep === 2) {
      return (
        <div className="provider-onboarding__content provider-onboarding__content--photo">
          {/* Step Header */}
          <div className="provider-onboarding__step-header provider-onboarding__step-header--center">
            <h2 className="provider-onboarding__step-title provider-onboarding__step-title--center">
              Upload your photo
            </h2>
            <p className="provider-onboarding__step-subtitle provider-onboarding__step-subtitle--center">
              This will be shown on your public profile and helps clients recognize you.
            </p>
          </div>

          {/* Photo Upload Section */}
          <div className="provider-onboarding__photo-section">
            <button
              type="button"
              onClick={handlePhotoClick}
              className="provider-onboarding__photo-button"
              aria-label="Upload profile photo"
            >
              <div className="provider-onboarding__photo-circle">
                {form.photoPreview ? (
                  <>
                    <img
                      src={form.photoPreview}
                      alt="Profile preview"
                      className="provider-onboarding__photo-preview"
                    />
                    <div className="provider-onboarding__photo-edit">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                      </svg>
                    </div>
                  </>
                ) : (
                  <svg
                    className="provider-onboarding__photo-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="12" cy="13" r="4" strokeWidth="2" />
                  </svg>
                )}
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="provider-onboarding__photo-input"
              aria-hidden="true"
            />
            <p className="provider-onboarding__photo-label">Add Photo</p>
            <p className="provider-onboarding__photo-hint">
              Tap to upload your logo or profile picture
            </p>
          </div>
        </div>
      );
    }

    if (currentStep === 3) {
      return (
        <div className="provider-onboarding__content">
          {/* Step Header */}
          <div className="provider-onboarding__step-header">
            <h2 className="provider-onboarding__step-title">
              Set up your services
            </h2>
            <p className="provider-onboarding__step-subtitle">
              Add the services you offer. You can always edit these later.
            </p>
          </div>

          {/* Add New Service Button */}
          <button
            type="button"
            onClick={handleAddService}
            className="provider-onboarding__add-service-button"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
            Add New Service
          </button>

          {/* Service List */}
          <div className="provider-onboarding__services-list">
            {form.services.length === 0 ? (
              <div className="provider-onboarding__empty-state">
                <svg
                  className="provider-onboarding__empty-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <rect
                    x="3"
                    y="3"
                    width="18"
                    height="18"
                    rx="2"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9 9h6M9 15h6"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                <p className="provider-onboarding__empty-text">
                  No services added yet
                </p>
                <p className="provider-onboarding__empty-hint">
                  Click "Add New Service" to get started
                </p>
              </div>
            ) : (
              form.services.map((service, index) => (
                <div key={index} className="provider-onboarding__service-item">
                  <div className="provider-onboarding__service-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l-5.5 9h11L12 2zm0 3.84L13.93 9h-3.87L12 5.84zM17.5 13c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5zm0 7c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zM3 21.5h8v-8H3v8zm2-6h4v4H5v-4z" />
                    </svg>
                  </div>
                  <div className="provider-onboarding__service-info">
                    <h3 className="provider-onboarding__service-name">
                      {service.name}
                    </h3>
                    <p className="provider-onboarding__service-details">
                      ${service.price} • {service.duration} min
                    </p>
                  </div>
                  <div className="provider-onboarding__service-actions">
                    <button
                      type="button"
                      onClick={() => handleEditService(index)}
                      className="provider-onboarding__service-action-button"
                      aria-label="Edit service"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteService(index)}
                      className="provider-onboarding__service-action-button provider-onboarding__service-action-button--delete"
                      aria-label="Delete service"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }

    if (currentStep === 4) {
      const days = [
        { key: "monday", label: "Monday" },
        { key: "tuesday", label: "Tuesday" },
        { key: "wednesday", label: "Wednesday" },
        { key: "thursday", label: "Thursday" },
        { key: "friday", label: "Friday" },
        { key: "saturday", label: "Saturday" },
        { key: "sunday", label: "Sunday" },
      ];

      return (
        <div className="provider-onboarding__content provider-onboarding__content--availability">
          {/* Step Header */}
          <div className="provider-onboarding__step-header provider-onboarding__step-header--center">
            <h2 className="provider-onboarding__step-title provider-onboarding__step-title--center">
              Set Your Availability
            </h2>
            <p className="provider-onboarding__step-subtitle provider-onboarding__step-subtitle--center">
              Let clients know when you're available for bookings. You can change this anytime.
            </p>
          </div>

          {/* Apply to all checkbox */}
          <div className="provider-onboarding__apply-all">
            <label className="provider-onboarding__checkbox-label">
              <input
                type="checkbox"
                checked={applyToAll}
                onChange={handleApplyToAll}
                className="provider-onboarding__checkbox"
              />
              <span className="provider-onboarding__checkbox-text">
                Apply to all working days
              </span>
            </label>
          </div>

          {/* Day List */}
          <div className="provider-onboarding__days-list">
            {days.map((day) => {
              const dayData = form.availability[day.key];
              const isWeekend = day.key === "saturday" || day.key === "sunday";

              return (
                <div key={day.key} className="provider-onboarding__day-card">
                  {/* Day Header */}
                  <div className="provider-onboarding__day-header">
                    <span
                      className={`provider-onboarding__day-name ${!dayData.enabled ? "provider-onboarding__day-name--disabled" : ""
                        }`}
                    >
                      {day.label}
                    </span>
                    <label className="provider-onboarding__toggle">
                      <input
                        type="checkbox"
                        checked={dayData.enabled}
                        onChange={() => handleDayToggle(day.key)}
                        className="provider-onboarding__toggle-input"
                      />
                      <span className="provider-onboarding__toggle-slider"></span>
                    </label>
                  </div>

                  {/* Time Inputs - Only show if day is enabled */}
                  {dayData.enabled && (
                    <div className="provider-onboarding__day-times">
                      <div className="provider-onboarding__time-row">
                        <div className="provider-onboarding__time-field">
                          <label className="provider-onboarding__time-label">From</label>
                          <input
                            type="text"
                            className="provider-onboarding__time-input"
                            value={dayData.from}
                            onChange={(e) => handleTimeChange(day.key, "from", e.target.value)}
                            placeholder="9:00 AM"
                          />
                        </div>
                        <div className="provider-onboarding__time-field">
                          <label className="provider-onboarding__time-label">To</label>
                          <input
                            type="text"
                            className="provider-onboarding__time-input"
                            value={dayData.to}
                            onChange={(e) => handleTimeChange(day.key, "to", e.target.value)}
                            placeholder="5:00 PM"
                          />
                        </div>
                      </div>
                      <div className="provider-onboarding__time-row">
                        <div className="provider-onboarding__time-field">
                          <label className="provider-onboarding__time-label">Break From</label>
                          <input
                            type="text"
                            className="provider-onboarding__time-input"
                            value={dayData.breakFrom}
                            onChange={(e) => handleTimeChange(day.key, "breakFrom", e.target.value)}
                            placeholder="12:00 PM"
                          />
                        </div>
                        <div className="provider-onboarding__time-field">
                          <label className="provider-onboarding__time-label">Break To</label>
                          <input
                            type="text"
                            className="provider-onboarding__time-input"
                            value={dayData.breakTo}
                            onChange={(e) => handleTimeChange(day.key, "breakTo", e.target.value)}
                            placeholder="1:00 PM"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (currentStep === 5) {
      return (
        <div className="provider-onboarding__content provider-onboarding__content--stripe">
          {/* Step Content - Centered */}
          <div className="provider-onboarding__stripe-container">
            {/* Icon */}
            <div className="provider-onboarding__stripe-icon-wrapper">
              <div className="provider-onboarding__stripe-icon-outer">
                <div className="provider-onboarding__stripe-icon-inner">
                  <svg
                    className="provider-onboarding__stripe-icon"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Title */}
            <h2 className="provider-onboarding__stripe-title">
              Connect your bank account
            </h2>

            {/* Subtitle */}
            <p className="provider-onboarding__stripe-subtitle">
              Proxey uses Stripe for fast, secure payouts. Connect your account to receive payments directly from clients.
            </p>

            {/* Info Text */}
            <p style={{ marginTop: "1rem", color: "#666", textAlign: "center", fontSize: "14px" }}>
              You'll be redirected to Stripe to complete your profile securely.
            </p>
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
        <h1 className="provider-onboarding__title">
          {currentStep === 2 ? "Setup Wizard" : currentStep === 3 ? "Services" : currentStep === 4 ? "Availability" : currentStep === 5 ? "Get Paid" : "Create Profile"}
        </h1>
        <div className="provider-onboarding__header-spacer" />
      </header>

      {/* Step Indicator */}
      <StepIndicator currentStep={currentStep} totalSteps={5} />

      {/* Step Content */}
      <div className="provider-onboarding__main">
        {renderStepContent()}

        {/* Next Button */}
        <div className="provider-onboarding__footer">
          {currentStep === 5 ? (
            <button
              onClick={handleStripeConnect}
              className="provider-onboarding__stripe-button"
            >
              <svg
                className="provider-onboarding__stripe-logo"
                viewBox="0 0 60 25"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 0 1-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.04 1.26-.06 1.48zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.07-2.58-2.08-2.58zM40.95 20.3c-1.44 0-2.32-.6-2.9-1.04l-.02 4.63-4.12.87V5.57h3.76l.08 1.02a4.7 4.7 0 0 1 3.23-1.29c2.9 0 5.62 2.6 5.62 7.4 0 5.23-2.7 7.6-5.65 7.6zM40 8.95c-.95 0-1.54.34-1.97.81l.02 6.12c.4.44.98.78 1.95.78 1.52 0 2.54-1.65 2.54-3.87 0-2.15-1.04-3.84-2.54-3.84zM28.24 5.57h4.13v14.44h-4.13V5.57zm0-4.7L32.37 0v3.36l-4.13.88V.88zm-4.32 9.35v9.79H19.8V5.57h3.7l.12 1.22c1-1.77 3.07-1.41 3.62-1.22v3.79c-.52-.17-2.29-.43-3.32.86zm-8.55 4.72c0 2.43 2.6 1.68 3.12 1.46v3.36c-.55.3-1.54.54-2.89.54a4.15 4.15 0 0 1-4.27-4.24l.01-13.17 4.02-.86v3.54h3.14V9.1h-3.13v5.85zm-4.91.7c0 2.97-2.31 4.66-5.73 4.66a11.2 11.2 0 0 1-4.46-.93v-3.93c1.38.75 3.1 1.31 4.46 1.31.92 0 1.53-.24 1.53-1C6.26 13.77 0 14.51 0 9.95 0 7.04 2.28 5.3 5.62 5.3c1.36 0 2.72.2 4.09.75v3.88a9.23 9.23 0 0 0-4.1-1.06c-.86 0-1.44.25-1.44.93 0 1.85 6.29.97 6.29 5.88z"
                  fill="white"
                />
              </svg>
              Connect with Stripe
            </button>
          ) : (
            <Button
              onClick={handleNext}
              loading={submitting}
              className="provider-onboarding__button"
            >
              {currentStep === 3 || currentStep === 4 ? "Continue" : "Next"}
            </Button>
          )}
          {currentStep === 5 && (
            <button
              type="button"
              onClick={completeOnboarding}
              className="provider-onboarding__skip-button"
              style={{ marginTop: '1rem' }}
            >
              Skip for now (Demo)
            </button>
          )}
          {currentStep === 2 && (
            <button
              type="button"
              onClick={handleSkipPhoto}
              className="provider-onboarding__skip-button"
            >
              Skip for now
            </button>
          )}
        </div>
      </div>

      {/* Service Modal */}
      {serviceModalOpen && (
        <div className="provider-onboarding__modal-overlay" onClick={() => setServiceModalOpen(false)}>
          <div className="provider-onboarding__modal" onClick={(e) => e.stopPropagation()}>
            <div className="provider-onboarding__modal-header">
              <h2 className="provider-onboarding__modal-title">
                {editingServiceIndex !== null ? "Edit Service" : "Add New Service"}
              </h2>
              <button
                type="button"
                onClick={() => setServiceModalOpen(false)}
                className="provider-onboarding__modal-close"
                aria-label="Close modal"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>

            <div className="provider-onboarding__modal-body">
              <label className="provider-onboarding__field">
                <span className="provider-onboarding__field-label">Service Name</span>
                <input
                  type="text"
                  className="provider-onboarding__input"
                  placeholder="e.g., House Cleaning"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm((prev) => ({ ...prev, name: e.target.value }))}
                />
              </label>

              <label className="provider-onboarding__field">
                <span className="provider-onboarding__field-label">Price ($)</span>
                <input
                  type="number"
                  className="provider-onboarding__input"
                  placeholder="e.g., 50"
                  min="0"
                  step="0.01"
                  value={serviceForm.price}
                  onChange={(e) => setServiceForm((prev) => ({ ...prev, price: e.target.value }))}
                />
              </label>

              <label className="provider-onboarding__field">
                <span className="provider-onboarding__field-label">Duration (minutes)</span>
                <input
                  type="number"
                  className="provider-onboarding__input"
                  placeholder="e.g., 60"
                  min="0"
                  step="5"
                  value={serviceForm.duration}
                  onChange={(e) => setServiceForm((prev) => ({ ...prev, duration: e.target.value }))}
                />
              </label>
            </div>

            <div className="provider-onboarding__modal-footer">
              <button
                type="button"
                onClick={() => setServiceModalOpen(false)}
                className="provider-onboarding__modal-cancel"
              >
                Cancel
              </button>
              <Button
                onClick={handleSaveService}
                className="provider-onboarding__modal-save"
              >
                {editingServiceIndex !== null ? "Update" : "Add"} Service
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProviderOnboardingPage;
