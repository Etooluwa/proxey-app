import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Card from "../components/ui/Card";
import Nav from "../components/ui/Nav";
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

const BASE_STEPS = ["service", "detail", "schedule", "location", "custom", "notes", "review"];

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

  // ── Intake-step state ──────────────────────────────────────────────────────
  const [intakeQuestions, setIntakeQuestions] = useState([]);   // questions with options
  const [clientNotesEnabled, setClientNotesEnabled] = useState(false);
  const [intakeAnswers, setIntakeAnswers] = useState({});       // { questionId: responseText }
  const [clientNote, setClientNote] = useState("");
  const [intakeLoading, setIntakeLoading] = useState(false);

  // STEPS = base steps + optional "intake" after "service"
  const STEPS = useMemo(
    () =>
      intakeQuestions.length > 0 || clientNotesEnabled
        ? ["service", "intake", "detail", "schedule", "location", "custom", "notes", "review"]
        : BASE_STEPS,
    [intakeQuestions.length, clientNotesEnabled]
  );

  // ── Service-step state (must be declared at top level, not inside early return) ──
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedServiceIds, setSelectedServiceIds] = useState(() => {
    const preSelected = location.state?.serviceId || existingDraft?.serviceId;
    return preSelected ? [preSelected] : [];
  });

  // ── Detail-step state ──────────────────────────────────────────────────────
  const [selectedOptionIdx, setSelectedOptionIdx] = useState(null);
  const [showFullDesc, setShowFullDesc] = useState(false);

  // ── Schedule-step state ────────────────────────────────────────────────────
  const [selectedDateIdx, setSelectedDateIdx] = useState(0);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);

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

    if (step === "detail") {
      if (selectedOptionIdx === null) nextErrors.optionIdx = "Select an option to continue.";
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

      // Build intake responses array
      const intakeResponses = [];
      intakeQuestions.forEach((q) => {
        const ans = intakeAnswers[q.id];
        if (ans !== undefined && ans !== "") {
          intakeResponses.push({ questionId: q.id, responseText: String(ans) });
        }
      });
      if (clientNotesEnabled && clientNote.trim()) {
        // client_notes are stored as a special question-less entry keyed by "_client_note"
        // We include them in notes instead
        bookingData.notes = [form.notes, clientNote.trim()].filter(Boolean).join("\n\n");
      }
      if (intakeResponses.length > 0) {
        bookingData.intakeResponses = intakeResponses;
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

  // ── Derived values for the service-selection step ──────────────────────────
  const allCategories = useMemo(() => {
    const cats = new Set();
    services.forEach((s) => { if (s.category) cats.add(s.category); });
    return ["All", ...Array.from(cats)];
  }, [services]);

  const filteredServices = useMemo(() => {
    if (activeCategory === "All") return services;
    return services.filter((s) => s.category === activeCategory);
  }, [services, activeCategory]);

  const toggleService = (id) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleServiceContinue = async () => {
    if (selectedServiceIds.length === 0) {
      setErrors({ serviceId: "Select at least one service to continue." });
      return;
    }
    const chosenId = selectedServiceIds[0];
    setForm((prev) => ({ ...prev, serviceId: chosenId }));
    setErrors({});

    // Fetch intake questions for the selected service
    setIntakeLoading(true);
    try {
      const data = await request(`/services/${chosenId}/intake`);
      setIntakeQuestions(data.questions || []);
      setClientNotesEnabled(data.clientNotesEnabled === true);
      setIntakeAnswers({});
      setClientNote("");
    } catch {
      setIntakeQuestions([]);
      setClientNotesEnabled(false);
    } finally {
      setIntakeLoading(false);
    }

    setStepIndex((i) => i + 1);
  };

  // Format duration from minutes
  const fmtDuration = (mins) => {
    if (!mins) return null;
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h} hr ${m} min` : `${h} hr`;
  };

  // Format price from cents
  const fmtPrice = (cents) => {
    if (!cents && cents !== 0) return "POA";
    return `$${(cents / 100).toFixed(0)}`;
  };

  // ── Schedule step — derived dates & time slots ────────────────────────────
  // Generate the next 14 days starting from today
  const schedDates = useMemo(() => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      days.push(d);
    }
    return days;
  }, []);

  // Build time slots: use provider schedule if available, else default set
  const schedTimeSlots = useMemo(() => {
    const defaultSlots = [
      "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
      "11:00 AM", "11:30 AM", "2:00 PM", "2:30 PM",
      "3:00 PM", "3:30 PM", "4:00 PM", "5:00 PM",
    ];
    if (!selectedProvider?.schedule) return defaultSlots;
    const dayName = schedDates[selectedDateIdx]
      ?.toLocaleDateString("en-US", { weekday: "long" })
      ?.toLowerCase();
    const daySchedule = selectedProvider.schedule[dayName];
    if (!daySchedule || !daySchedule.slots || daySchedule.slots.length === 0) {
      return defaultSlots;
    }
    return daySchedule.slots;
  }, [selectedProvider, schedDates, selectedDateIdx]);

  // ── Detail step — bottom sheet option picker ──────────────────────────────
  // Build options list: prefer service.options array, else derive one from the base service
  const serviceOptions_detail = useMemo(() => {
    if (!selectedService) return [];
    if (Array.isArray(selectedService.options) && selectedService.options.length > 0) {
      return selectedService.options; // [{ label, duration, price }] in cents
    }
    // Fallback: single option from base service fields
    return [
      {
        label: "Standard",
        duration: selectedService.duration || null,
        price: selectedService.basePrice || null,
        unit: selectedService.unit || "",
      },
    ];
  }, [selectedService]);

  if (step === "detail") {
    const desc = selectedService?.description || "";
    const TRUNCATE = 120;
    const isTruncatable = desc.length > TRUNCATE;
    const displayDesc = !showFullDesc && isTruncatable ? desc.slice(0, TRUNCATE) + "…" : desc;

    const handleDetailContinue = () => {
      if (selectedOptionIdx === null) return;
      const opt = serviceOptions_detail[selectedOptionIdx];
      // Propagate option price into form if available
      if (opt?.price != null) {
        setForm((prev) => ({ ...prev, price: opt.price }));
      }
      setErrors({});
      setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
    };

    return (
      <div
        className="fixed inset-0 z-50 flex flex-col justify-end font-manrope"
        style={{ background: "rgba(0,0,0,0.45)" }}
      >
        {/* Scrim — tap to go back */}
        <div
          className="absolute inset-0"
          onClick={() => setStepIndex((i) => Math.max(i - 1, 0))}
          aria-hidden="true"
        />

        {/* Sheet */}
        <div
          className="relative bg-card flex flex-col"
          style={{
            borderRadius: "20px 20px 0 0",
            maxHeight: "85vh",
            overflow: "hidden",
          }}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-2.5 pb-0 flex-shrink-0">
            <div className="w-10 h-1 rounded-full bg-divider" />
          </div>

          {/* Close button */}
          <div className="flex justify-end px-5 pt-2 pb-0 flex-shrink-0">
            <button
              onClick={() => setStepIndex((i) => Math.max(i - 1, 0))}
              className="-m-1 p-1 focus:outline-none"
              aria-label="Close"
            >
              <svg width="24" height="24" fill="none" stroke="#0D1619" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Scrollable body */}
          <div className="overflow-y-auto px-5 pb-8 flex-1">
            {/* Service name */}
            <h1 className="font-manrope text-[26px] font-bold text-foreground m-0 mb-4 mt-1">
              {selectedService?.name || "Service"}
            </h1>

            {/* Description + Read more */}
            {desc && (
              <p className="font-manrope text-[14px] text-muted m-0 mb-5" style={{ lineHeight: 1.55 }}>
                {displayDesc}
                {isTruncatable && (
                  <button
                    onClick={() => setShowFullDesc((v) => !v)}
                    className="ml-1 font-semibold text-foreground focus:outline-none"
                    style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
                  >
                    {showFullDesc ? "Show less" : "Read more"}
                  </button>
                )}
              </p>
            )}

            {/* Option cards */}
            {serviceOptions_detail.map((opt, i) => {
              const isSel = selectedOptionIdx === i;
              return (
                <div
                  key={i}
                  onClick={() => setSelectedOptionIdx(i)}
                  className="flex items-start gap-3.5 bg-card rounded-card mb-3 p-4 cursor-pointer active:scale-[0.98] transition-transform"
                  style={{
                    border: isSel ? "2px solid #FF751F" : "1px solid #E5E5EA",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  }}
                >
                  {/* Radio circle */}
                  <div
                    className="flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: isSel ? "#FF751F" : "transparent",
                      border: isSel ? "none" : "2px solid #D1D5DB",
                    }}
                  >
                    {isSel && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>

                  {/* Info */}
                  <div>
                    <p className="font-manrope text-[16px] font-semibold text-foreground m-0 mb-0.5">
                      {opt.label}
                    </p>
                    {opt.duration && (
                      <p className="font-manrope text-[14px] text-muted m-0 mb-1">
                        {fmtDuration(opt.duration)}
                      </p>
                    )}
                    {opt.price != null && (
                      <p className="font-manrope text-[15px] font-semibold text-foreground m-0">
                        {fmtPrice(opt.price)}
                        {opt.unit ? ` ${opt.unit}` : ""}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Continue button */}
            <button
              onClick={handleDetailContinue}
              disabled={selectedOptionIdx === null}
              className="w-full py-4 rounded-card font-manrope text-[16px] font-bold text-white mt-2 focus:outline-none active:scale-[0.98] transition-transform"
              style={{
                background: selectedOptionIdx !== null ? "#0D1619" : "#B0B0B0",
                cursor: selectedOptionIdx !== null ? "pointer" : "default",
              }}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Intake step — provider intake questions for the selected service ─────
  if (step === "intake") {
    const handleIntakeContinue = () => {
      setErrors({});
      setStepIndex((i) => i + 1);
    };

    return (
      <div className="flex flex-col min-h-screen bg-background font-manrope">
        <Nav
          onBack={() => setStepIndex((i) => Math.max(i - 1, 0))}
          title="A few questions"
          onClose={() => navigate(-1)}
        />

        <div className="flex-1 overflow-y-auto px-4 pt-2 pb-32">
          {intakeLoading && (
            <div className="flex items-center justify-center pt-16">
              <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            </div>
          )}

          {!intakeLoading && (
            <>
              {intakeQuestions.map((q) => (
                <div key={q.id} className="mb-6">
                  <p className="font-manrope text-[16px] font-semibold text-foreground m-0 mb-3">
                    {q.question_text}
                  </p>

                  {q.question_type === "select" && (
                    <div className="flex flex-wrap gap-2">
                      {q.options.map((opt) => {
                        const isSel = intakeAnswers[q.id] === opt.option_text;
                        return (
                          <button
                            key={opt.id}
                            onClick={() =>
                              setIntakeAnswers((prev) => ({
                                ...prev,
                                [q.id]: isSel ? "" : opt.option_text,
                              }))
                            }
                            className="px-4 py-2 rounded-pill font-manrope text-[14px] font-semibold focus:outline-none active:scale-[0.97] transition-transform"
                            style={{
                              background: isSel ? "#FF751F" : "#FFFFFF",
                              color: isSel ? "#FFFFFF" : "#0D1619",
                              border: isSel ? "none" : "1px solid #E5E5EA",
                            }}
                          >
                            {opt.option_text}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {q.question_type === "text" && (
                    <textarea
                      rows={3}
                      value={intakeAnswers[q.id] || ""}
                      onChange={(e) =>
                        setIntakeAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                      }
                      placeholder="Your answer…"
                      className="w-full font-manrope text-[15px] text-foreground resize-none focus:outline-none"
                      style={{
                        padding: "12px 14px",
                        borderRadius: "12px",
                        border: "1px solid #E5E5EA",
                        background: "#FFFFFF",
                        lineHeight: 1.5,
                      }}
                    />
                  )}
                </div>
              ))}

              {clientNotesEnabled && (
                <div className="mb-6">
                  <p className="font-manrope text-[16px] font-semibold text-foreground m-0 mb-3">
                    Anything you'd like to share for your booking?
                  </p>
                  <textarea
                    rows={4}
                    value={clientNote}
                    onChange={(e) => setClientNote(e.target.value)}
                    placeholder="Goals, preferences, access details…"
                    className="w-full font-manrope text-[15px] text-foreground resize-none focus:outline-none"
                    style={{
                      padding: "12px 14px",
                      borderRadius: "12px",
                      border: "1px solid #E5E5EA",
                      background: "#FFFFFF",
                      lineHeight: 1.5,
                    }}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Sticky continue button */}
        <div
          className="fixed bottom-0 left-0 right-0 px-4 pt-3 pb-8 bg-card"
          style={{ borderTop: "0.5px solid #E5E5EA" }}
        >
          <button
            onClick={handleIntakeContinue}
            className="w-full py-4 rounded-card font-manrope text-[16px] font-bold text-white focus:outline-none active:scale-[0.98] transition-transform"
            style={{ background: "#0D1619" }}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // ── Schedule step — full-screen time picker layout ────────────────────────
  if (step === "schedule") {
    const selectedDate = schedDates[selectedDateIdx];
    const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const handleScheduleContinue = () => {
      if (!selectedTimeSlot) return;
      // Build ISO date string from selected date + time slot
      const iso = selectedDate.toISOString().slice(0, 10); // YYYY-MM-DD
      // Convert "11:00 AM" → "11:00" / "2:30 PM" → "14:30"
      const [timePart, ampm] = selectedTimeSlot.split(" ");
      let [hh, mm] = timePart.split(":").map(Number);
      if (ampm === "PM" && hh !== 12) hh += 12;
      if (ampm === "AM" && hh === 12) hh = 0;
      const scheduledTime = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
      setForm((prev) => ({ ...prev, scheduledDate: iso, scheduledTime }));
      setErrors({});
      setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
    };

    return (
      <div className="flex flex-col min-h-screen bg-background font-manrope">
        {/* Nav */}
        <Nav
          onBack={() => setStepIndex((i) => Math.max(i - 1, 0))}
          onClose={() => navigate(-1)}
        />

        <div className="flex-1 overflow-y-auto px-4 pb-32">
          {/* Page title */}
          <h1 className="font-manrope text-[28px] font-bold text-foreground m-0 mb-5 px-1">
            Select time
          </h1>

          {/* Provider pill selector */}
          {providers.length > 0 && (
            <div
              className="flex gap-2 mb-5"
              style={{ overflowX: "auto", scrollbarWidth: "none" }}
            >
              {providers.map((p) => {
                const isActive = form.providerId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setForm((prev) => ({ ...prev, providerId: p.id }));
                      setSelectedTimeSlot(null);
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-pill font-manrope text-[14px] font-semibold whitespace-nowrap focus:outline-none active:scale-[0.97] transition-transform flex-shrink-0"
                    style={{
                      background: isActive ? "#0D1619" : "#FFFFFF",
                      color: isActive ? "#FFFFFF" : "#0D1619",
                      border: isActive ? "none" : "1px solid #E5E5EA",
                    }}
                  >
                    {/* Initials dot */}
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center font-bold flex-shrink-0"
                      style={{
                        fontSize: 9,
                        background: isActive ? "rgba(255,255,255,0.2)" : "#FFF0E6",
                        color: isActive ? "#fff" : "#FF751F",
                      }}
                    >
                      {(p.name || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                    </span>
                    {p.name}
                  </button>
                );
              })}
            </div>
          )}

          {/* Date card — circular date buttons */}
          <Card noPad>
            <div className="flex gap-3 justify-around px-3 py-5">
              {schedDates.slice(0, 7).map((d, i) => {
                const isActive = selectedDateIdx === i;
                const isToday = i === 0;
                return (
                  <button
                    key={i}
                    onClick={() => { setSelectedDateIdx(i); setSelectedTimeSlot(null); }}
                    className="flex flex-col items-center gap-1.5 focus:outline-none"
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center transition-colors"
                      style={{
                        background: isActive ? "#FF751F" : "transparent",
                        border: isActive ? "none" : "1.5px solid #D1D5DB",
                      }}
                    >
                      <span
                        className="font-manrope text-[18px] font-bold"
                        style={{ color: isActive ? "#fff" : "#0D1619" }}
                      >
                        {d.getDate()}
                      </span>
                    </div>
                    <span className="font-manrope text-[12px] font-medium text-muted">
                      {isToday ? "Today" : DAY_ABBR[d.getDay()]}
                    </span>
                  </button>
                );
              })}
            </div>
            {/* Show month + year for context */}
            <p className="font-manrope text-[12px] text-muted text-center pb-3 m-0">
              {MONTH_ABBR[selectedDate.getMonth()]} {selectedDate.getFullYear()}
            </p>
          </Card>

          {/* Available times heading */}
          <p className="font-manrope text-[15px] font-bold text-foreground m-0 mt-2 mb-3 px-1">
            Available times
          </p>

          {/* Time slot cards */}
          {schedTimeSlots.map((time) => {
            const isActive = selectedTimeSlot === time;
            return (
              <Card
                key={time}
                onClick={() => setSelectedTimeSlot(time)}
                noPad
              >
                <div
                  className="px-4 py-3.5"
                  style={{
                    border: isActive ? "2px solid #FF751F" : "2px solid transparent",
                    borderRadius: "inherit",
                  }}
                >
                  <span
                    className="font-manrope text-[16px]"
                    style={{ fontWeight: isActive ? 600 : 500, color: "#0D1619" }}
                  >
                    {time}
                  </span>
                </div>
              </Card>
            );
          })}

          {/* Waitlist link */}
          <div className="flex justify-center mt-2 mb-4">
            <button
              className="font-manrope text-[14px] font-semibold focus:outline-none"
              style={{ color: "#FF751F", background: "none", border: "none", cursor: "pointer" }}
              onClick={() => {/* waitlist flow */}}
            >
              Don't see a good time? Join the waitlist →
            </button>
          </div>
        </div>

        {/* Sticky confirm bar — only visible when time selected */}
        {selectedTimeSlot && (
          <div
            className="fixed bottom-0 left-0 right-0 px-4 pt-3 pb-8 bg-card"
            style={{ borderTop: "0.5px solid #E5E5EA" }}
          >
            <button
              onClick={handleScheduleContinue}
              className="w-full py-4 rounded-card font-manrope text-[16px] font-bold text-white focus:outline-none active:scale-[0.98] transition-transform"
              style={{ background: "#0D1619" }}
            >
              Confirm booking
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Service selection step — full-screen card-list layout ──────────────────
  if (step === "service") {
    return (
      <div className="flex flex-col min-h-screen bg-background font-manrope">
        {/* Nav bar */}
        <Nav
          onBack={() => navigate(-1)}
          title="Select services"
          onClose={() => navigate(-1)}
        />

        {/* Category pills — horizontal scroll */}
        <div
          className="flex gap-2 px-4 pb-4 pt-2"
          style={{ overflowX: "auto", scrollbarWidth: "none" }}
        >
          {allCategories.map((cat) => {
            const isActive = cat === activeCategory;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="px-4 py-2 rounded-pill font-manrope text-[14px] font-semibold whitespace-nowrap focus:outline-none active:scale-[0.97] transition-transform"
                style={{
                  background: isActive ? "#0D1619" : "#FFFFFF",
                  color: isActive ? "#FFFFFF" : "#0D1619",
                  border: isActive ? "none" : "1px solid #E5E5EA",
                  flexShrink: 0,
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Service cards — scrollable list */}
        <div className="flex-1 overflow-y-auto px-4 pb-32">
          {servicesLoading && (
            <div className="flex items-center justify-center pt-16">
              <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            </div>
          )}

          {!servicesLoading && filteredServices.length === 0 && (
            <p className="text-center text-muted font-manrope text-[14px] pt-16">
              No services found.
            </p>
          )}

          {!servicesLoading && filteredServices.map((svc) => {
            const isSel = selectedServiceIds.includes(svc.id);
            return (
              <Card key={svc.id}>
                <div className="flex justify-between items-start">
                  {/* Info */}
                  <div className="flex-1 pr-4 min-w-0">
                    <p className="font-manrope text-[17px] font-semibold text-foreground m-0 mb-1">
                      {svc.name}
                    </p>
                    {svc.duration && (
                      <p className="font-manrope text-[14px] text-muted m-0 mb-1.5">
                        {fmtDuration(svc.duration)}
                      </p>
                    )}
                    <p className="font-manrope text-[15px] font-semibold text-foreground m-0">
                      {svc.basePrice ? `${fmtPrice(svc.basePrice)} ${svc.unit || ""}`.trim() : "Price on request"}
                    </p>
                  </div>

                  {/* Circle toggle */}
                  <button
                    onClick={() => toggleService(svc.id)}
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-1 focus:outline-none active:scale-90 transition-transform"
                    aria-label={isSel ? "Deselect" : "Select"}
                    style={{
                      background: isSel ? "#FF751F" : "#FFFFFF",
                      border: isSel ? "none" : "1.5px solid #D1D5DB",
                    }}
                  >
                    <svg width="16" height="16" fill="none" stroke={isSel ? "#fff" : "#0D1619"} strokeWidth="2" viewBox="0 0 24 24">
                      <path
                        d={isSel ? "M5 13l4 4L19 7" : "M12 5v14M5 12h14"}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </Card>
            );
          })}

          {errors.serviceId && (
            <p className="font-manrope text-[13px] text-danger text-center mt-2">
              {errors.serviceId}
            </p>
          )}
        </div>

        {/* Sticky bottom bar */}
        <div
          className="fixed bottom-0 left-0 right-0 px-4 pt-3 pb-8 bg-card"
          style={{ borderTop: "0.5px solid #E5E5EA" }}
        >
          <button
            onClick={handleServiceContinue}
            disabled={selectedServiceIds.length === 0 || intakeLoading}
            className="w-full py-4 rounded-card font-manrope text-[16px] font-bold text-white focus:outline-none active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            style={{
              background: selectedServiceIds.length > 0 && !intakeLoading ? "#0D1619" : "#B0B0B0",
              cursor: selectedServiceIds.length > 0 && !intakeLoading ? "pointer" : "not-allowed",
            }}
          >
            {intakeLoading && (
              <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            )}
            {intakeLoading
              ? "Loading…"
              : selectedServiceIds.length > 0
              ? `${selectedServiceIds.length} selected · Continue`
              : "Select a service"}
          </button>
        </div>
      </div>
    );
  }

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
