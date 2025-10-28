import { useEffect, useState } from "react";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { useToast } from "../../components/ui/ToastProvider";
import {
  fetchProviderProfile,
  updateProviderProfile,
} from "../../data/provider";
import "../../styles/provider/providerProfile.css";

const CATEGORY_OPTIONS = [
  "Home Cleaning",
  "Organization",
  "Pet Care",
  "Wellness",
  "Beauty",
  "Handyman",
];

function ProviderProfile() {
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await fetchProviderProfile();
        if (!cancelled) {
          setProfile(data);
          setSelectedCategories(data?.categories || []);
        }
      } catch (error) {
        if (!cancelled) {
          toast.push({
            title: "Unable to load profile",
            description: error.message,
            variant: "error",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleRateChange = (event) => {
    const value = Number(event.target.value);
    setProfile((prev) => ({ ...prev, hourly_rate: Number.isNaN(value) ? 0 : value }));
  };

  const toggleCategory = (value) => {
    setSelectedCategories((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: profile?.name || "",
        phone: profile?.phone || "",
        hourly_rate: profile?.hourly_rate || 0,
        categories: selectedCategories,
        avatar: profile?.avatar || "",
        bio: profile?.bio || "",
      };
      const updated = await updateProviderProfile(payload);
      setProfile(updated);
      toast.push({
        title: "Profile updated",
        description: "Your changes are live for clients browsing your profile.",
        variant: "success",
      });
    } catch (error) {
      toast.push({
        title: "Update failed",
        description: error.message,
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="provider-profile">
        <p>Loading profile…</p>
      </div>
    );
  }

  return (
    <div className="provider-profile">
      <Card as="form" className="provider-profile__card" onSubmit={handleSubmit}>
        <h2>Business details</h2>
        <Input
          id="provider-name"
          label="Name"
          value={profile?.name || ""}
          onChange={handleChange("name")}
          required
        />
        <Input
          id="provider-phone"
          label="Phone number"
          value={profile?.phone || ""}
          onChange={handleChange("phone")}
          required
        />
        <label className="provider-profile__field">
          <span>Categories offered</span>
          <div className="provider-profile__chips">
            {CATEGORY_OPTIONS.map((category) => {
              const active = selectedCategories.includes(category);
              return (
                <button
                  type="button"
                  key={category}
                  onClick={() => toggleCategory(category)}
                  className={active ? "chip chip--active" : "chip"}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </label>
        <Input
          id="provider-rate"
          label="Hourly rate (in cents)"
          type="number"
          min="0"
          value={profile?.hourly_rate ?? 0}
          onChange={handleRateChange}
          helperText="Example: enter 6500 for $65.00/hour"
        />
        <Input
          id="provider-avatar"
          label="Profile photo URL"
          value={profile?.avatar || ""}
          onChange={handleChange("avatar")}
          placeholder="https://..."
        />
        <label className="provider-profile__field">
          <span>Bio</span>
          <textarea
            value={profile?.bio || ""}
            onChange={handleChange("bio")}
            rows={4}
            placeholder="Introduce yourself and describe the services you offer."
          />
        </label>
        <Button type="submit" loading={saving}>
          Save changes
        </Button>
      </Card>
    </div>
  );
}

export default ProviderProfile;
