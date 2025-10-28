import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Skeleton from "../components/ui/Skeleton";
import { useToast } from "../components/ui/ToastProvider";
import useServices from "../data/useServices";
import useProviders from "../data/useProviders";
import { createBooking } from "../data/bookings";
import { loadDraft, saveDraft, clearDraft } from "../bookings/draftStore";
import "../styles/bookingFlow.css";

const STEPS = ["service", "schedule", "location", "notes", "review"];

function BookingFlowPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { services, loading: servicesLoading } = useServices();
  const { providers, loading: providersLoading } = useProviders();

  const existingDraft = useMemo(() => loadDraft(), []);

  const [form, setForm] = useState(() => ({
    serviceId: existingDraft?.serviceId || "",
    providerId: location.state?.providerId || existingDraft?.providerId || "",
    scheduledDate: existingDraft?.scheduledDate || "",
    scheduledTime: existingDraft?.scheduledTime || "",
    location: existingDraft?.location || "",
    notes: existingDraft?.notes || "",
    price: existingDraft?.price || "",
  }));
  const [stepIndex, setStepIndex] = useState(existingDraft?.stepIndex || 0);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    saveDraft({ ...form, stepIndex });
  }, [form, stepIndex]);

  const serviceOptions = useMemo(
    () =>
      services.map((service) => ({
        label: `${service.name} · $${(service.basePrice / 100).toFixed(2)} ${service.unit}`,
        value: service.id,
      })),
    [services]
  );

  const providerOptions = useMemo(
    () =>
      providers
        .filter((provider) =>
          form.serviceId
            ? provider.servicesOffered?.includes(form.serviceId)
            : true
        )
        .map((provider) => ({
          label: `${provider.name} · ${(provider.rating || 0).toFixed(1)}★`,
          value: provider.id,
        })),
    [providers, form.serviceId]
  );

  const selectedService = services.find((service) => service.id === form.serviceId);
  const selectedProvider = providers.find((provider) => provider.id === form.providerId);

  const validateStep = () => {
    const nextErrors = {};
    const step = STEPS[stepIndex];

    if (step === "service") {
      if (!form.serviceId) nextErrors.serviceId = "Select a service to continue.";
      if (!form.providerId) nextErrors.providerId = "Choose a provider.";
    }

    if (step === "schedule") {
      if (!form.scheduledDate) nextErrors.scheduledDate = "Pick a date.";
      if (!form.scheduledTime) nextErrors.scheduledTime = "Choose a start time.";
    }

    if (step === "location") {
      if (!form.location) nextErrors.location = "Add a service location.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStepIndex((index) => Math.min(index + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setStepIndex((index) => Math.max(index - 1, 0));
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setSubmitting(true);
    const scheduledAt = new Date(`${form.scheduledDate}T${form.scheduledTime}`);
    try {
      const booking = await createBooking({
        serviceId: form.serviceId,
        providerId: form.providerId,
        scheduledAt: scheduledAt.toISOString(),
        location: form.location,
        notes: form.notes,
        status: "upcoming",
        price: selectedService?.basePrice || null,
      });
      clearDraft();
      toast.push({
        title: "Booking confirmed",
        description: "We’ve notified your provider and saved the details.",
        variant: "success",
      });
      navigate(`/app/book/confirm?bookingId=${booking.id}`, {
        replace: true,
        state: { bookingId: booking.id },
      });
    } catch (error) {
      toast.push({
        title: "Booking failed",
        description: error.message,
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const step = STEPS[stepIndex];

  return (
    <div className="booking-flow">
      <header className="booking-flow__header">
        <h1 className="booking-flow__title">Book a service</h1>
        <p className="booking-flow__subtitle">
          Complete each step and we’ll take care of confirmation, notifications, and payment.
        </p>
        <div className="booking-flow__steps" aria-label="Booking progress">
          {STEPS.map((item, index) => (
            <span
              key={item}
              className={`booking-flow__step ${index === stepIndex ? "booking-flow__step--active" : ""} ${
                index < stepIndex ? "booking-flow__step--done" : ""
              }`}
            >
              {index + 1}
            </span>
          ))}
        </div>
      </header>

      <Card className="booking-flow__card">
        {step === "service" && (
          <div className="booking-flow__section">
            <Select
              id="booking-service"
              label="Choose a service"
              options={serviceOptions}
              value={form.serviceId}
              onChange={(event) => setForm((prev) => ({ ...prev, serviceId: event.target.value }))}
              placeholder={servicesLoading ? "Loading services…" : "Select a service"}
              error={errors.serviceId}
              disabled={servicesLoading}
            />
            <Select
              id="booking-provider"
              label="Preferred provider"
              options={providerOptions}
              value={form.providerId}
              onChange={(event) => setForm((prev) => ({ ...prev, providerId: event.target.value }))}
              placeholder={providersLoading ? "Loading providers…" : "Select a provider"}
              error={errors.providerId}
              disabled={providersLoading || providerOptions.length === 0}
            />
            {providersLoading ? <Skeleton height={18} width="35%" /> : null}
          </div>
        )}

        {step === "schedule" && (
          <div className="booking-flow__section">
            <Input
              id="booking-date"
              label="Preferred date"
              type="date"
              value={form.scheduledDate}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, scheduledDate: event.target.value }))
              }
              error={errors.scheduledDate}
            />
            <Input
              id="booking-time"
              label="Start time"
              type="time"
              value={form.scheduledTime}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, scheduledTime: event.target.value }))
              }
              error={errors.scheduledTime}
            />
          </div>
        )}

        {step === "location" && (
          <div className="booking-flow__section">
            <Input
              id="booking-location"
              label="Service location"
              value={form.location}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, location: event.target.value }))
              }
              error={errors.location}
              helperText="Include access details like buzzer codes or concierge instructions."
            />
          </div>
        )}

        {step === "notes" && (
          <div className="booking-flow__section">
            <label className="ui-input__root" htmlFor="booking-notes">
              <span className="ui-input__label">Notes for your provider</span>
              <textarea
                id="booking-notes"
                className="ui-input booking-flow__textarea"
                rows={4}
                value={form.notes}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, notes: event.target.value }))
                }
                placeholder="Share goals, access details, or special requests."
              />
            </label>
          </div>
        )}

        {step === "review" && (
          <div className="booking-flow__review">
            <div>
              <h3>Service</h3>
              <p>{selectedService?.name}</p>
            </div>
            <div>
              <h3>Provider</h3>
              <p>{selectedProvider?.name}</p>
            </div>
            <div>
              <h3>Date & time</h3>
              <p>
                {form.scheduledDate} · {form.scheduledTime}
              </p>
            </div>
            <div>
              <h3>Location</h3>
              <p>{form.location}</p>
            </div>
            {form.notes ? (
              <div>
                <h3>Notes</h3>
                <p>{form.notes}</p>
              </div>
            ) : null}
            <div>
              <h3>Estimated price</h3>
              <p>
                {selectedService?.basePrice
                  ? `$${(selectedService.basePrice / 100).toFixed(2)}`
                  : "Provided after confirmation"}
              </p>
            </div>
          </div>
        )}

        <div className="booking-flow__actions">
          <Button variant="ghost" onClick={handleBack} disabled={stepIndex === 0}>
            Back
          </Button>
          {stepIndex < STEPS.length - 1 ? (
            <Button onClick={handleNext}>Continue</Button>
          ) : (
            <Button onClick={handleSubmit} loading={submitting} disabled={submitting}>
              Confirm booking
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

export default BookingFlowPage;
