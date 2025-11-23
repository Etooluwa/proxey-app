import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import StepIndicator from "../components/ui/StepIndicator";
import { useSession } from "../auth/authContext";
import { useToast } from "../components/ui/ToastProvider";
import PaymentMethodFormWrapper from "../components/payment/PaymentMethodForm";
import PaymentMethodScreen from "../components/payment/PaymentMethodScreen";
import { SERVICE_CATEGORIES } from "../utils/categories";
import "../styles/onboarding.css";

function OnboardingPage() {
  const { updateProfile } = useSession();
  const toast = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const { session } = useSession();
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    photo: null,
    photoPreview: null,
    email: "",
    phone: "",
    defaultLocation: "",
    serviceCategory: [],
    stripeClientSecret: null,
    stripeCustomerId: null,
  });
  const [paymentStep, setPaymentStep] = useState(0); // 0: not started, 1: form shown, 2: complete
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
      // Save profile data with photo upload and payment info
      await updateProfile(
        {
          name: form.name,
          phone: form.phone,
          email: form.email,
          serviceCategory: form.serviceCategory,
          defaultLocation: form.email, // Using email as placeholder for location
          stripeCustomerId: form.stripeCustomerId,
          paymentMethodSetupComplete: true,
          isComplete: true,
        },
        form.photo // Pass the photo file for upload
      );

      toast.push({
        title: "Profile created!",
        description: "Welcome to Proxey! Let's get started.",
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

  const handleNext = async () => {
    // Validate step 1 (Profile Info)
    if (currentStep === 1) {
      if (!form.name.trim()) {
        toast.push({ title: "Name required", description: "Please enter your full name.", variant: "error" });
        return;
      }
      if (!form.email.trim()) {
        toast.push({ title: "Email required", description: "Please enter your email address.", variant: "error" });
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        toast.push({ title: "Invalid email", description: "Please enter a valid email address.", variant: "error" });
        return;
      }
      if (!form.phone.trim()) {
        toast.push({ title: "Phone required", description: "Please enter your phone number.", variant: "error" });
        return;
      }
      setCurrentStep(2);
      return;
    }

    // Validate step 2 (Categories)
    if (currentStep === 2) {
      if (form.serviceCategory.length === 0) {
        toast.push({ title: "Category required", description: "Please select at least one service category.", variant: "error" });
        return;
      }
      setCurrentStep(3);
      return;
    }

    // Step 3 - Payment setup
    if (currentStep === 3) {
      if (paymentStep === 0) {
        setPaymentStep(1);
      } else if (paymentStep === 2) {
        handleCompleteOnboarding();
      }
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
    if (paymentStep === 1) {
      return (
        <PaymentMethodScreen
          onBack={() => setPaymentStep(0)}
          onSuccess={() => setPaymentStep(2)}
        />
      );
    }

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

    if (currentStep === 2) {
      return (
        <div className="onboarding__content">
          <div className="onboarding__step-header">
            <h2 className="onboarding__step-title">What do you need help with?</h2>
            <p className="onboarding__step-subtitle">
              Select the services you're interested in.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {SERVICE_CATEGORIES.map((cat) => {
              const isSelected = form.serviceCategory.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setForm(prev => ({
                      ...prev,
                      serviceCategory: isSelected
                        ? prev.serviceCategory.filter(id => id !== cat.id)
                        : [...prev.serviceCategory, cat.id]
                    }));
                  }}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${isSelected
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
                >
                  <div className="font-bold text-sm">{cat.label}</div>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (currentStep === 3) {
      // Step 3a: Initial payment method prompt
      if (paymentStep === 0) {
        return (
          <div className="onboarding__content onboarding__content--step3">
            <div className="onboarding__payment-section">
              {/* Icon */}
              <div className="onboarding__payment-icon-large">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
                </svg>
              </div>

              {/* Title */}
              <h2 className="onboarding__payment-title">Add a Payment Method</h2>

              {/* Description */}
              <p className="onboarding__payment-subtitle">
                Adding a payment method now will allow for quick and seamless bookings in the future.
              </p>
            </div>
          </div>
        );
      }

      // Step 3b: Payment form
      if (paymentStep === 1 && form.stripeClientSecret) {
        return (
          <div className="onboarding__content onboarding__content--step3">
            <div className="onboarding__payment-section">
              <PaymentMethodFormWrapper
                clientSecret={form.stripeClientSecret}
                onSuccess={async (result) => {
                  try {
                    // Save the payment method ID to user's profile
                    await updateProfile({
                      stripePaymentMethodId: result.paymentMethodId,
                      paymentMethodSetupComplete: true,
                    });

                    toast.push({
                      title: "Card saved",
                      description: "Your payment method is ready to use",
                      variant: "success",
                    });
                    setPaymentStep(2);
                  } catch (error) {
                    console.error("Error saving payment method:", error);
                    toast.push({
                      title: "Error saving card",
                      description: "Card was saved to Stripe but couldn't update your profile. Please try again.",
                      variant: "error",
                    });
                  }
                }}
                onError={(error) => {
                  console.error("Payment error:", error);
                  toast.push({
                    title: "Payment error",
                    description: error?.message || "Failed to save card",
                    variant: "error",
                  });
                }}
              />
            </div>
          </div>
        );
      }

      // Step 3c: Success state
      if (paymentStep === 2) {
        return (
          <div className="onboarding__content onboarding__content--step3">
            <div className="onboarding__payment-section">
              {/* Success Icon */}
              <div className="onboarding__payment-success-icon">
                <svg viewBox="0 0 24 24" fill="currentColor" style={{ color: "#F58027", width: "48px", height: "48px" }}>
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
              </div>

              {/* Success Message */}
              <p style={{ marginTop: "1rem", color: "#F58027", fontWeight: "500", fontSize: "1rem", textAlign: "center" }}>
                Card saved successfully!
              </p>
            </div>
          </div>
        );
      }
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
        {renderStepContent() || (
          <div className="onboarding__content">
            <p>Loading...</p>
          </div>
        )}

        {/* Next/Save Button */}
        {paymentStep !== 1 && (
          <div className="onboarding__footer">
            {currentStep === 3 && paymentStep === 2 ? (
              <Button
                onClick={handleCompleteOnboarding}
                loading={submitting}
                className="onboarding__button onboarding__button--save"
              >
                Save & Continue
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                loading={submitting}
                className={currentStep === 3 ? "onboarding__button onboarding__button--save" : "onboarding__button"}
              >
                {currentStep === 3 ? "Add Payment Method" : "Next"}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default OnboardingPage;
