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
import { request } from "../data/apiClient";
import "../styles/bookingFlow.css";

const STEPS = ["service", "schedule", "location", "custom", "notes", "review"];

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
    customInputValues: existingDraft?.customInputValues || {},
    notes: existingDraft?.notes || "",
    price: existingDraft?.price || "",
  }));
  const [stepIndex, setStepIndex] = useState(existingDraft?.stepIndex || 0);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState("");
  const [validatingPromo, setValidatingPromo] = useState(false);

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

  const discountAmount = useMemo(() => {
    if (!appliedPromo || !selectedService?.basePrice) return 0;
    if (appliedPromo.discountType === "percentage") {
      return Math.round((selectedService.basePrice * appliedPromo.discountValue) / 100);
    }
    // Fixed amount discount (stored in dollars, basePrice in cents)
    return Math.min(appliedPromo.discountValue * 100, selectedService.basePrice);
  }, [appliedPromo, selectedService]);

  const finalPrice = selectedService?.basePrice ? selectedService.basePrice - discountAmount : null;

  const validatePromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoError("Enter a promo code.");
      return;
    }
    setValidatingPromo(true);
    setPromoError("");
    try {
      const result = await request("/promotions/validate", {
        method: "POST",
        body: JSON.stringify({
          promoCode: promoCode.trim(),
          providerId: form.providerId,
          serviceName: selectedService?.name || "",
        }),
      });
      setAppliedPromo(result.promotion);
      setPromoError("");
    } catch (err) {
      setAppliedPromo(null);
      setPromoError(err.payload?.error || err.message || "Invalid promo code.");
    } finally {
      setValidatingPromo(false);
    }
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
    setPromoCode("");
    setPromoError("");
  };

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

    if (step === "custom") {
      if (selectedService?.customInputs && selectedService.customInputs.length > 0) {
        selectedService.customInputs.forEach((field) => {
          if (field.required && !form.customInputValues[field.id]) {
            nextErrors[`custom_${field.id}`] = `${field.label} is required.`;
          }
        });
      }
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
      const effectivePrice = discountAmount > 0 ? finalPrice : (selectedService?.basePrice || null);

      const bookingData = {
        serviceId: form.serviceId,
        providerId: form.providerId,
        scheduledAt: scheduledAt.toISOString(),
        location: form.location,
        notes: form.notes,
        status: "upcoming",
        price: effectivePrice,
        originalPrice: selectedService?.basePrice || null,
      };

      if (appliedPromo) {
        bookingData.promotionId = appliedPromo.id;
        bookingData.promoCode = appliedPromo.promoCode;
        bookingData.discountType = appliedPromo.discountType;
        bookingData.discountValue = appliedPromo.discountValue;
        bookingData.discountAmount = discountAmount;
      }

      if (selectedService?.requiresDeposit) {
        bookingData.depositAmount = (effectivePrice * selectedService.depositPercentage) / 100;
        bookingData.finalAmount = effectivePrice - bookingData.depositAmount;
        bookingData.depositPercentage = selectedService.depositPercentage;
      }

      if (Object.keys(form.customInputValues).length > 0) {
        bookingData.customInputValues = form.customInputValues;
      }

      const booking = await createBooking(bookingData);

      // Increment promo code usage after successful booking
      if (appliedPromo?.id) {
        request(`/promotions/${appliedPromo.id}/increment-usage`, { method: "PATCH" }).catch(() => {});
      }

      clearDraft();
      toast.push({
        title: "Booking confirmed",
        description: "We've notified your provider and saved the details.",
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

        {step === "custom" && (
          <div className="booking-flow__section">
            {selectedService?.customInputs && selectedService.customInputs.length > 0 ? (
              <div>
                <h3 style={{ marginBottom: "1.5rem", fontSize: "1.1rem", fontWeight: "bold" }}>
                  {selectedService.name} - Additional Information
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  {selectedService.customInputs.map((field) => (
                    <div key={field.id}>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: "bold" }}>
                        {field.label}
                        {field.required && <span style={{ color: "red", marginLeft: "0.25rem" }}>*</span>}
                      </label>
                      {field.type === "text" && (
                        <Input
                          id={`custom_${field.id}`}
                          type="text"
                          value={form.customInputValues[field.id] || ""}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              customInputValues: {
                                ...prev.customInputValues,
                                [field.id]: event.target.value,
                              },
                            }))
                          }
                          error={errors[`custom_${field.id}`]}
                        />
                      )}
                      {field.type === "number" && (
                        <Input
                          id={`custom_${field.id}`}
                          type="number"
                          value={form.customInputValues[field.id] || ""}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              customInputValues: {
                                ...prev.customInputValues,
                                [field.id]: event.target.value,
                              },
                            }))
                          }
                          error={errors[`custom_${field.id}`]}
                        />
                      )}
                      {field.type === "textarea" && (
                        <textarea
                          id={`custom_${field.id}`}
                          className="ui-input booking-flow__textarea"
                          value={form.customInputValues[field.id] || ""}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              customInputValues: {
                                ...prev.customInputValues,
                                [field.id]: event.target.value,
                              },
                            }))
                          }
                          style={{
                            borderColor: errors[`custom_${field.id}`] ? "#ef4444" : undefined,
                          }}
                          rows={4}
                        />
                      )}
                      {field.type === "select" && (
                        <Select
                          id={`custom_${field.id}`}
                          options={[
                            { label: "Select an option", value: "" },
                            { label: "Option 1", value: "opt1" },
                            { label: "Option 2", value: "opt2" },
                          ]}
                          value={form.customInputValues[field.id] || ""}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              customInputValues: {
                                ...prev.customInputValues,
                                [field.id]: event.target.value,
                              },
                            }))
                          }
                          error={errors[`custom_${field.id}`]}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "2rem", color: "#6B7280" }}>
                <p>No additional information needed for this service</p>
              </div>
            )}
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
            {selectedService?.customInputs && selectedService.customInputs.length > 0 && (
              <div>
                <h3>Provided Information</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {selectedService.customInputs.map((field) => (
                    <p key={field.id}>
                      <strong>{field.label}:</strong> {form.customInputValues[field.id] || "(not provided)"}
                    </p>
                  ))}
                </div>
              </div>
            )}
            {form.notes ? (
              <div>
                <h3>Notes</h3>
                <p>{form.notes}</p>
              </div>
            ) : null}
            <div style={{ gridColumn: "1 / -1" }}>
              <h3>Promo Code</h3>
              {appliedPromo ? (
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.25rem" }}>
                  <span style={{ padding: "0.25rem 0.75rem", background: "rgba(34,197,94,0.1)", color: "#15803d", borderRadius: "6px", fontSize: "0.875rem", fontWeight: 600 }}>
                    {appliedPromo.promoCode} — {appliedPromo.discountType === "percentage" ? `${appliedPromo.discountValue}% off` : `$${appliedPromo.discountValue} off`}
                  </span>
                  <button
                    type="button"
                    onClick={removePromoCode}
                    style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "0.875rem", textDecoration: "underline" }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", marginTop: "0.25rem" }}>
                  <div style={{ flex: 1 }}>
                    <Input
                      id="promo-code"
                      value={promoCode}
                      onChange={(e) => { setPromoCode(e.target.value); setPromoError(""); }}
                      placeholder="Enter promo code"
                      error={promoError}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    onClick={validatePromoCode}
                    disabled={validatingPromo}
                    style={{ whiteSpace: "nowrap", marginTop: "2px" }}
                  >
                    {validatingPromo ? "Checking…" : "Apply"}
                  </Button>
                </div>
              )}
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <h3>Pricing</h3>
              {selectedService?.basePrice ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  {discountAmount > 0 ? (
                    <>
                      <p style={{ color: "#6B7280", textDecoration: "line-through" }}>
                        Subtotal: ${(selectedService.basePrice / 100).toFixed(2)}
                      </p>
                      <p style={{ color: "#15803d", fontSize: "0.875rem" }}>
                        Discount: -${(discountAmount / 100).toFixed(2)}
                      </p>
                      <p style={{ fontWeight: 600, fontSize: "1.1rem" }}>
                        Total: ${(finalPrice / 100).toFixed(2)}
                      </p>
                    </>
                  ) : (
                    <p>Total: ${(selectedService.basePrice / 100).toFixed(2)}</p>
                  )}
                  {selectedService?.requiresDeposit && (
                    <div style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "#6B7280" }}>
                      <p>Deposit ({selectedService.depositPercentage}%): ${(((finalPrice || selectedService.basePrice) * selectedService.depositPercentage) / 100 / 100).toFixed(2)}</p>
                      <p>Final payment: ${(((finalPrice || selectedService.basePrice) * (100 - selectedService.depositPercentage)) / 100 / 100).toFixed(2)}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p>Provided after confirmation</p>
              )}
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
