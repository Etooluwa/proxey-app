import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { useSession } from "../auth/authContext";
import { useToast } from "../components/ui/ToastProvider";
import "../styles/account.css";

function AccountPage() {
  const { session, profile, updateProfile, logout } = useSession();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({
    name: profile?.name || "",
    phone: profile?.phone || "",
    defaultLocation: profile?.defaultLocation || "",
  });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Redirect providers to their dedicated profile page
  useEffect(() => {
    if (session?.user?.role === "provider") {
      navigate("/provider/profile", { replace: true });
    }
  }, [session?.user?.role, navigate]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ ...form, isComplete: true });
      setEditing(false);
      toast.push({
        title: "Profile updated",
        description: "Your account details were saved successfully.",
        variant: "success",
      });
    } catch (error) {
      toast.push({
        title: "Unable to update profile",
        description: error.message,
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="account">
      <header className="account__header">
        <h1 className="account__title">Account</h1>
        <p className="account__subtitle">
          Manage your profile details, default service location, and notification preferences.
        </p>
      </header>

      <div className="account__grid">
        <Card className="account__card">
          <div className="account__card-header">
            <div>
              <h2 className="card__title">Profile</h2>
              <p className="card__support">
                This information appears on your bookings and invoices.
              </p>
            </div>
            <Badge variant="default">{session?.user?.role || "client"}</Badge>
          </div>
          <div className="account__form">
            <Input
              id="account-name"
              label="Full name"
              value={form.name}
              onChange={handleChange("name")}
              disabled={!editing}
            />
            <Input
              id="account-email"
              label="Email"
              value={session?.user?.email}
              onChange={() => {}}
              disabled
              helperText="Email changes are managed through auth settings."
            />
            <Input
              id="account-phone"
              label="Phone number"
              value={form.phone}
              onChange={handleChange("phone")}
              disabled={!editing}
            />
            <Input
              id="account-location"
              label="Default location"
              value={form.defaultLocation}
              onChange={handleChange("defaultLocation")}
              disabled={!editing}
            />
          </div>
          <div className="account__actions">
            {editing ? (
              <>
                <Button variant="ghost" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} loading={saving}>
                  Save changes
                </Button>
              </>
            ) : (
              <Button variant="secondary" onClick={() => setEditing(true)}>
                Edit profile
              </Button>
            )}
          </div>
        </Card>

        <Card className="account__card">
          <h2 className="card__title">Notifications</h2>
          <p className="card__support">
            Email notifications are enabled by default. Mobile push notifications will be available
            soon.
          </p>
          <Button
            variant="ghost"
            onClick={() =>
              toast.push({
                title: "Coming soon",
                description: "Notification preferences will be configurable in a future update.",
                variant: "info",
              })
            }
          >
            Manage notifications
          </Button>
        </Card>
      </div>

      <Card className="account__card">
        <h2 className="card__title">Sign out</h2>
        <p className="card__support">We’ll clear your session from this device.</p>
        <Button variant="danger" onClick={logout}>
          Sign out
        </Button>
      </Card>
    </div>
  );
}

export default AccountPage;
