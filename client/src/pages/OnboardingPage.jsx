import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { useSession } from "../auth/authContext";
import { useToast } from "../components/ui/ToastProvider";
import "../App.css";

function OnboardingPage() {
  const { updateProfile } = useSession();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    defaultLocation: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.name) nextErrors.name = "Add your name.";
    if (!form.phone) nextErrors.phone = "Provide a contact number.";
    if (!form.defaultLocation) nextErrors.defaultLocation = "Add your default location.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await updateProfile({ ...form, isComplete: true });
      toast.push({
        title: "Profile saved",
        description: "Your preferences are set. Let's get started!",
        variant: "success",
      });
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

  return (
    <div className="page page--centered">
      <Card className="auth__card" as="form" onSubmit={handleSubmit}>
        <h1 className="card__title">Tell us about yourself</h1>
        <p className="card__support">
          We use this information to personalize your experience and share details with providers
          when needed.
        </p>
        <Input
          id="onboarding-name"
          label="Full name"
          value={form.name}
          onChange={handleChange("name")}
          error={errors.name}
        />
        <Input
          id="onboarding-phone"
          label="Phone number"
          type="tel"
          value={form.phone}
          onChange={handleChange("phone")}
          error={errors.phone}
          helperText="We’ll only share this with providers once a booking is confirmed."
        />
        <Input
          id="onboarding-location"
          label="Default service location"
          value={form.defaultLocation}
          onChange={handleChange("defaultLocation")}
          error={errors.defaultLocation}
        />
        <Button type="submit" loading={submitting}>
          Finish onboarding
        </Button>
      </Card>
    </div>
  );
}

export default OnboardingPage;
