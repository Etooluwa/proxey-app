import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import StepIndicator from "../components/ui/StepIndicator";
import { useSession } from "../auth/authContext";
import { useToast } from "../components/ui/ToastProvider";
import "../styles/onboarding.css";

function OnboardingPage() {
  const { updateProfile } = useSession();
  const toast = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    photo: null,
    photoPreview: null,
    email: "",
    phone: "",
    defaultLocation: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      // Create preview URL
      const preview = URL.createObjectURL(file);
      setForm((prev) => ({
        ...prev,
        photo: file,
        photoPreview: preview,
      }));
    }
  };

  const handleNameChange = (event) => {
    setForm((prev) => ({ ...prev, name: event.target.value }));
  };

  const handleEmailChange = (event) => {
    setForm((prev) => ({ ...prev, email: event.target.value }));
  };

  const handlePhoneNumberChange = (event) => {
    setForm((prev) => ({ ...prev, phone: event.target.value }));
  };

  const handleCompleteOnboarding = async () => {
    setSubmitting(true);
    try {
      // Save profile data with photo upload
      await updateProfile(
        {
          name: form.name,
          phone: form.phone,
          email: form.email,
          defaultLocation: form.email, // Using email as placeholder for location
          isComplete: true,
        },
        form.photo // Pass the photo file for upload
      );

      toast.push({
        title: "Profile created!",
        description: "Welcome to Kliques! Let's get started.",
        variant: "success",
      });

      // Navigate to app
      navigate("/app", { replace: true });
    } catch (error) {
      toast.push({
        title: "Unable to save profile",
        description: error.message,
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
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
      setCurrentStep(2);
      return;
    }

    // Validate step 2
    if (currentStep === 2) {
      if (!form.email.trim()) {
        toast.push({
          title: "Email required",
          description: "Please enter your email address to continue.",
          variant: "error",
        });
        return;
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        toast.push({
          title: "Invalid email",
          description: "Please enter a valid email address.",
          variant: "error",
        });
        return;
      }

      if (!form.phone.trim()) {
        toast.push({
          title: "Phone number required",
          description: "Please enter your phone number to continue.",
          variant: "error",
        });
        return;
      }

      setCurrentStep(3);
      return;
    }

    // Step 3 - Complete onboarding
    if (currentStep === 3) {
      handleCompleteOnboarding();
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
        <div className="onboarding__content">
          {/* Profile Photo Upload */}
          <div className="onboarding__photo-section">
            <button
              type="button"
              onClick={handlePhotoClick}
              className="onboarding__photo-button"
              aria-label="Upload profile photo"
            >
              <div className="onboarding__photo-circle">
                {form.photoPreview ? (
                  <img
                    src={form.photoPreview}
                    alt="Profile preview"
                    className="onboarding__photo-preview"
                  />
                ) : (
                  <svg
                    className="onboarding__photo-icon"
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
              <div className="onboarding__photo-edit">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                </svg>
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="onboarding__photo-input"
              aria-hidden="true"
            />
            <p className="onboarding__photo-label">Tap to add a photo</p>
          </div>

          {/* Full Name Input */}
          <div className="onboarding__field-wrapper">
            <label className="onboarding__field">
              <span className="onboarding__field-label">Full Name</span>
              <input
                type="text"
                className="onboarding__input"
                placeholder="e.g., Jane Doe"
                value={form.name}
                onChange={handleNameChange}
              />
            </label>
          </div>
        </div>
      );
    }

    if (currentStep === 2) {
      return (
        <div className="onboarding__content onboarding__content--step2">
          {/* Step 2 Header */}
          <div className="onboarding__step-header">
            <h2 className="onboarding__step-title">Contact Details</h2>
            <p className="onboarding__step-subtitle">
              We'll use this to confirm your bookings.
            </p>
          </div>

          {/* Contact Fields */}
          <div className="onboarding__fields">
            <label className="onboarding__field">
              <span className="onboarding__field-label">Email Address</span>
              <input
                type="email"
                className="onboarding__input"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleEmailChange}
              />
            </label>

            <label className="onboarding__field">
              <span className="onboarding__field-label">Phone Number</span>
              <input
                type="tel"
                className="onboarding__input"
                placeholder="+1 (555) 000-0000"
                value={form.phone}
                onChange={handlePhoneNumberChange}
              />
            </label>
          </div>
        </div>
      );
    }

    if (currentStep === 3) {
      return (
        <div className="onboarding__content onboarding__content--step3">
          {/* Step 3 - Payment */}
          <div className="onboarding__payment-section">
            {/* Credit Card Icon */}
            <div className="onboarding__payment-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
              </svg>
            </div>

            {/* Title and Description */}
            <h2 className="onboarding__payment-title">Add a Payment Method</h2>
            <p className="onboarding__payment-subtitle">
              Adding a payment method now will allow for quick and seamless bookings in the future.
            </p>

            {/* Add Payment Button */}
            <Button
              variant="secondary"
              className="onboarding__add-payment-button"
              onClick={() => {
                toast.push({
                  title: "Coming soon",
                  description: "Payment method setup will be available soon.",
                  variant: "info",
                });
              }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="onboarding__button-icon">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
              Add Payment Method
            </Button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="onboarding">
      {/* Header */}
      <header className="onboarding__header">
        <button
          type="button"
          onClick={handleBack}
          className="onboarding__back"
          aria-label="Go back"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
        </button>
        <h1 className="onboarding__title">
          {currentStep === 3 ? "Payment" : "Create Your Profile"}
        </h1>
        <div className="onboarding__header-spacer" />
      </header>

      {/* Step Indicator */}
      <StepIndicator currentStep={currentStep} totalSteps={3} />

      {/* Step Content */}
      <div className="onboarding__main">
        {renderStepContent()}

        {/* Next/Save Button */}
        <div className="onboarding__footer">
          <Button
            onClick={handleNext}
            loading={submitting}
            className={currentStep === 3 ? "onboarding__button onboarding__button--save" : "onboarding__button"}
          >
            {currentStep === 3 ? "Save & Continue" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default OnboardingPage;
