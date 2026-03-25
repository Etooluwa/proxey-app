import { useEffect, useRef, useState } from 'react';
import { request } from '../data/apiClient';
import { useIsDesktop } from '../hooks/useIsDesktop';
import SettingsPageLayout from '../components/ui/SettingsPageLayout';
import Toggle from '../components/ui/Toggle';
import Lbl from '../components/ui/Lbl';
import Divider from '../components/ui/Divider';

const T = { ink: '#3D231E', muted: '#8C6A64' };
const F = "'Sora',system-ui,sans-serif";

const DEFAULT_PREFS = {
    push_booking_confirmations: true,
    push_reminders:             true,
    push_review_requests:       true,
    email_booking_confirmations: true,
    email_invoices:             true,
    email_monthly_summary:      false,
};

const PUSH_ITEMS = [
    { key: 'push_booking_confirmations', label: 'Booking confirmations' },
    { key: 'push_reminders',             label: 'Session reminders' },
    { key: 'push_review_requests',       label: 'Review requests' },
];

const EMAIL_ITEMS = [
    { key: 'email_booking_confirmations', label: 'Booking confirmations' },
    { key: 'email_invoices',              label: 'Booking invoices' },
    { key: 'email_monthly_summary',       label: 'Monthly summary' },
];

export default function ClientNotifSettings() {
    const [prefs, setPrefs] = useState(DEFAULT_PREFS);
    const [loading, setLoading] = useState(true);
    const saveTimer = useRef(null);
    const isDesktop = useIsDesktop();

    useEffect(() => {
        request('/client/profile')
            .then((data) => {
                const p = data?.profile || data || {};
                setPrefs({ ...DEFAULT_PREFS, ...(p.notification_preferences || {}) });
            })
            .catch((err) => console.error('[ClientNotifSettings] load error:', err))
            .finally(() => setLoading(false));
    }, []);

    // Debounced auto-save — fires 600ms after the last toggle
    const scheduleSave = (nextPrefs) => {
        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(async () => {
            try {
                await request('/client/notification-preferences', {
                    method: 'PATCH',
                    body: JSON.stringify({ notification_preferences: nextPrefs }),
                });
            } catch (err) {
                console.error('[ClientNotifSettings] save error:', err);
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

    const NotifGroup = ({ items, label }) => (
        <div>
            <Lbl>{label}</Lbl>
            {items.map((item, i) => (
                <div key={item.key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0' }}>
                        <span style={{ fontFamily: F, fontSize: 15, color: T.ink }}>{item.label}</span>
                        <Toggle on={prefs[item.key]} onChange={() => toggle(item.key)} />
                    </div>
                    {i < items.length - 1 && <Divider />}
                </div>
            ))}
        </div>
    );

    return (
        <SettingsPageLayout title="Notifications">
            {loading ? (
                <p style={{ fontFamily: F, fontSize: 14, color: T.muted, marginTop: 24 }}>Loading…</p>
            ) : isDesktop ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                    <NotifGroup items={PUSH_ITEMS} label="Push Notifications" />
                    <NotifGroup items={EMAIL_ITEMS} label="Email Notifications" />
                </div>
            ) : (
                <>
                    <NotifGroup items={PUSH_ITEMS} label="Push Notifications" />
                    <div style={{ marginTop: 24 }}>
                        <NotifGroup items={EMAIL_ITEMS} label="Email Notifications" />
                    </div>
                </>
            )}
        </SettingsPageLayout>
    );
}
