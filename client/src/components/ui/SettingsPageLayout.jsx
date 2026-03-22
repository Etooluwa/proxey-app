/**
 * SettingsPageLayout — shared wrapper for sub-page settings screens
 *
 * Provides:
 *   - Warm cream background (#FBF7F2)
 *   - Top nav bar: back chevron (left) + centred title + spacer (right)
 *   - Scrollable content area with max-width 600px centred
 *
 * Props:
 *   title    {string}   — shown centred in the nav bar
 *   children            — page content
 */
import { useNavigate } from 'react-router-dom';

const T = { ink: '#3D231E', muted: '#8C6A64', base: '#FBF7F2' };
const F = "'Sora',system-ui,sans-serif";

export default function SettingsPageLayout({ title, children }) {
    const navigate = useNavigate();

    return (
        <div style={{ minHeight: '100vh', background: T.base, display: 'flex', flexDirection: 'column', fontFamily: F }}>
            {/* Nav bar */}
            <div style={{ padding: '20px 24px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    aria-label="Go back"
                >
                    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={T.ink} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <span style={{ fontSize: 13, fontWeight: 500, color: T.muted }}>{title}</span>
                {/* Spacer keeps title visually centred */}
                <div style={{ width: 22 }} />
            </div>

            {/* Content */}
            <div style={{ padding: '12px 24px 0', flex: 1, display: 'flex', flexDirection: 'column', maxWidth: 600, width: '100%', margin: '0 auto' }}>
                {children}
            </div>
        </div>
    );
}
