import { useEffect, useRef, useState } from 'react';
import { fetchProviderProfile } from '../../data/provider';
import { request } from '../../data/apiClient';
import { useIsDesktop } from '../../hooks/useIsDesktop';
import SettingsPageLayout from '../../components/ui/SettingsPageLayout';
import Toggle from '../../components/ui/Toggle';
import Lbl from '../../components/ui/Lbl';
import Divider from '../../components/ui/Divider';

const T = { ink: '#3D231E', muted: '#8C6A64' };
const F = "'Sora',system-ui,sans-serif";

const DEFAULT_PREFS = {
    email_new_bookings: true,
    email_reviews:      true,
    email_payout_updates: false,
};

const EMAIL_ITEMS = [
    { key: 'email_new_bookings', label: 'New booking requests' },
    { key: 'email_reviews',   label: 'New reviews' },
    { key: 'email_payout_updates', label: 'Payout updates' },
];

export default function ProviderNotifSettings() {
    const [prefs, setPrefs] = useState(DEFAULT_PREFS);
    const [loading, setLoading] = useState(true);
    const saveTimer = useRef(null);
    const isDesktop = useIsDesktop();

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
            ) : (
                <div style={{ maxWidth: isDesktop ? 520 : 'none' }}>
                    <NotifGroup items={EMAIL_ITEMS} label="Email Notifications" />
                </div>
            )}
        </SettingsPageLayout>
    );
}
