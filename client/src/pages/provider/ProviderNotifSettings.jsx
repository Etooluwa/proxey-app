import { useEffect, useRef, useState } from 'react';
import { fetchProviderProfile } from '../../data/provider';
import { request } from '../../data/apiClient';
import SettingsPageLayout from '../../components/ui/SettingsPageLayout';
import Toggle from '../../components/ui/Toggle';
import Lbl from '../../components/ui/Lbl';
import Divider from '../../components/ui/Divider';

const T = { ink: '#3D231E', muted: '#8C6A64' };
const F = "'Sora',system-ui,sans-serif";

const DEFAULT_PREFS = {
    push_new_bookings:  true,
    push_confirmations: true,
    push_messages:      true,
    push_reminders:     true,
    push_payouts:       false,
    email_earnings:     true,
    email_reviews:      true,
    email_marketing:    false,
};

const PUSH_ITEMS = [
    { key: 'push_new_bookings',  label: 'New booking requests' },
    { key: 'push_confirmations', label: 'Booking confirmations' },
    { key: 'push_messages',      label: 'Client messages' },
    { key: 'push_reminders',     label: 'Session reminders' },
    { key: 'push_payouts',       label: 'Payout updates' },
];

const EMAIL_ITEMS = [
    { key: 'email_earnings',  label: 'Weekly earnings summary' },
    { key: 'email_reviews',   label: 'New reviews' },
    { key: 'email_marketing', label: 'Marketing & tips' },
];

export default function ProviderNotifSettings() {
    const [prefs, setPrefs] = useState(DEFAULT_PREFS);
    const [loading, setLoading] = useState(true);
    const saveTimer = useRef(null);

    useEffect(() => {
        fetchProviderProfile()
            .then((profile) => {
                setPrefs({ ...DEFAULT_PREFS, ...(profile?.notification_preferences || {}) });
            })
            .catch((err) => console.error('[ProviderNotifSettings] load error:', err))
            .finally(() => setLoading(false));
    }, []);

    // Debounced auto-save — fires 600ms after the last toggle
    const scheduleSave = (nextPrefs) => {
        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(async () => {
            try {
                await request('/provider/me', {
                    method: 'PATCH',
                    body: JSON.stringify({ notification_preferences: nextPrefs }),
                });
            } catch (err) {
                console.error('[ProviderNotifSettings] save error:', err);
            }
        }, 600);
    };

    const toggle = (key) => {
        setPrefs((prev) => {
            const next = { ...prev, [key]: !prev[key] };
            scheduleSave(next);
            return next;
        });
    };

    return (
        <SettingsPageLayout title="Notifications">
            {loading ? (
                <p style={{ fontFamily: F, fontSize: 14, color: T.muted, marginTop: 24 }}>Loading…</p>
            ) : (
                <>
                    <Lbl>Push Notifications</Lbl>
                    {PUSH_ITEMS.map((item, i) => (
                        <div key={item.key}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0' }}>
                                <span style={{ fontFamily: F, fontSize: 15, color: T.ink }}>{item.label}</span>
                                <Toggle on={prefs[item.key]} onChange={() => toggle(item.key)} />
                            </div>
                            {i < PUSH_ITEMS.length - 1 && <Divider />}
                        </div>
                    ))}

                    <Lbl style={{ marginTop: 24, marginBottom: 0 }}>Email Notifications</Lbl>
                    {EMAIL_ITEMS.map((item, i) => (
                        <div key={item.key}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0' }}>
                                <span style={{ fontFamily: F, fontSize: 15, color: T.ink }}>{item.label}</span>
                                <Toggle on={prefs[item.key]} onChange={() => toggle(item.key)} />
                            </div>
                            {i < EMAIL_ITEMS.length - 1 && <Divider />}
                        </div>
                    ))}
                </>
            )}
        </SettingsPageLayout>
    );
}
