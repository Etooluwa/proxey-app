/**
 * SettingsPageLayout — shared wrapper for sub-page settings screens
 *
 * Mobile: back chevron nav bar + scrollable content (max-width 600px)
 * Desktop (≥1024px): two-column layout
 *   Left (300px): breadcrumb card — title + "Back" link
 *   Right (flex): white card containing page content
 *
 * Props:
 *   title    {string}   — shown in nav bar (mobile) and breadcrumb (desktop)
 *   children            — page content
 */
import { useNavigate } from 'react-router-dom';
import { useIsDesktop } from '../../hooks/useIsDesktop';

const T = {
    ink: '#3D231E', muted: '#8C6A64', faded: '#B0948F',
    line: 'rgba(140,106,100,0.18)', base: '#FBF7F2', card: '#FFFFFF',
};
const F = "'Sora',system-ui,sans-serif";

export default function SettingsPageLayout({ title, children }) {
    const navigate = useNavigate();
    const isDesktop = useIsDesktop();

    if (isDesktop) {
        return (
            <div style={{ minHeight: '100vh', background: T.base, fontFamily: F, padding: '48px 40px' }}>
                <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', gap: 24, alignItems: 'flex-start' }}>

                    {/* Left breadcrumb card */}
                    <div style={{
                        width: 300, flexShrink: 0, background: T.card, borderRadius: 20,
                        border: `1px solid ${T.line}`, padding: '28px 24px',
                        position: 'sticky', top: 48,
                    }}>
                        <button
                            onClick={() => navigate(-1)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                background: 'none', border: 'none', padding: 0,
                                cursor: 'pointer', marginBottom: 20,
                            }}
                        >
                            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                                <path d="M15 19l-7-7 7-7" />
                            </svg>
                            <span style={{ fontSize: 13, color: T.muted }}>Back</span>
                        </button>
                        <div style={{ height: 1, background: T.line, marginBottom: 20 }} />
                        <h2 style={{ fontSize: 20, fontWeight: 600, color: T.ink, margin: 0, letterSpacing: '-0.02em' }}>
                            {title}
                        </h2>
                    </div>

                    {/* Right content card */}
                    <div style={{
                        flex: 1, background: T.card, borderRadius: 20,
                        border: `1px solid ${T.line}`, padding: '32px 32px',
                        minWidth: 0,
                    }}>
                        {children}
                    </div>
                </div>
            </div>
        );
    }

    // Mobile layout
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
                <div style={{ width: 22 }} />
            </div>

            {/* Content */}
            <div style={{ padding: '12px 24px 0', flex: 1, display: 'flex', flexDirection: 'column', maxWidth: 600, width: '100%', margin: '0 auto' }}>
                {children}
            </div>
        </div>
    );
}
