import React from 'react';
import NotificationDropdown from '../NotificationDropdown';
import klogo from '../../klogo.png';

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
    base: '#FBF7F2',
    ink: '#3D231E',
    muted: '#8C6A64',
    faded: '#B0948F',
    accent: '#C25E4A',
    hero: '#FDDCC6',
    avatarBg: '#F2EBE5',
    line: 'rgba(140,106,100,0.18)',
    sidebar: '#F5EFE8',
    card: '#FFFFFF',
    successBg: '#EBF2EC',
    success: '#5A8A5E',
    dangerBg: '#FDEDEA',
};

const F = "'Sora',system-ui,sans-serif";
const DISPLAY_F = "'Playfair Display', serif";

function formatBadgeCount(value) {
    if (!Number.isFinite(value) || value <= 0) return null;
    return value > 99 ? '99+' : String(value);
}

// ─── Desktop Header ───────────────────────────────────────────────────────────
export function DesktopHeader({ title, subtitle }) {
    return (
        <header style={{
            padding: '24px 40px 20px', display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', borderBottom: `1px solid ${T.line}`,
            position: 'sticky', top: 0, background: T.base, zIndex: 30,
        }}>
            {(title || subtitle) ? (
                <div>
                    {subtitle && (
                        <span style={{
                            fontFamily: F, fontSize: '11px', fontWeight: 500, color: T.muted,
                            letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block',
                            marginBottom: '4px',
                        }}>
                            {subtitle}
                        </span>
                    )}
                    {title && (
                        <h1 style={{
                            fontFamily: F, fontSize: '26px', fontWeight: 400,
                            letterSpacing: '-0.03em', color: T.ink, margin: 0,
                        }}>
                            {title}
                        </h1>
                    )}
                </div>
            ) : (
                <div />
            )}
            <NotificationDropdown />
        </header>
    );
}

// ─── Desktop Sidebar ──────────────────────────────────────────────────────────
export function DesktopSidebar({ items, active, onNav, userName, userInitials, userAvatar, isProvider, onSignOut }) {
    return (
        <div style={{
            width: '260px', position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 10,
            background: T.sidebar, borderRight: `1px solid ${T.line}`,
            display: 'flex', flexDirection: 'column',
        }}>
            {/* Logo */}
            <div style={{ padding: '28px 28px 8px' }}>
                <img src={klogo} alt="kliques" style={{ height: 56, width: 'auto', display: 'block', marginBottom: 4 }} />
                <p style={{ fontFamily: F, fontSize: '11px', color: T.faded, margin: '4px 0 0', letterSpacing: '0.03em' }}>
                    Relationship OS
                </p>
            </div>

            {/* User card */}
            <div style={{
                margin: '16px', padding: '14px 16px', background: T.base,
                borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '12px',
            }}>
                <div style={{
                    width: 38, height: 38, borderRadius: '50%', background: T.avatarBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: F, fontSize: '13px', fontWeight: 500, color: T.muted, flexShrink: 0,
                    overflow: 'hidden',
                }}>
                    {userAvatar ? (
                        <img src={userAvatar} alt={userName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        userInitials
                    )}
                </div>
                <div>
                    <p style={{ fontFamily: F, fontSize: '14px', fontWeight: 500, color: T.ink, margin: 0 }}>
                        {userName}
                    </p>
                    <span style={{
                        fontFamily: F, fontSize: '10px', fontWeight: 500, color: T.faded,
                        textTransform: 'uppercase', letterSpacing: '0.03em',
                    }}>
                        {isProvider ? 'Provider' : 'Client'}
                    </span>
                </div>
            </div>

            {/* Nav */}
            <nav style={{ flex: 1, padding: '0 8px', overflowY: 'auto' }}>
                {items.map((item) => {
                    const isActive = active === item.id;
                    const badgeCount = formatBadgeCount(item.count);
                    return (
                        <button
                            key={item.id}
                            onClick={() => onNav(item.id)}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '12px 20px', margin: '2px 0', width: '100%', borderRadius: '10px',
                                background: isActive ? 'rgba(194,94,74,0.08)' : 'transparent',
                                border: 'none', cursor: 'pointer', fontFamily: F, fontSize: '13px',
                                fontWeight: isActive ? 600 : 400,
                                color: isActive ? T.accent : T.muted,
                                letterSpacing: '0.01em', textAlign: 'left',
                                transition: 'background 0.15s, color 0.15s',
                            }}
                        >
                            <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                                <svg
                                    width="18"
                                    height="18"
                                    fill="none"
                                    stroke={isActive ? T.accent : T.muted}
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    viewBox="0 0 24 24"
                                    style={{ flexShrink: 0 }}
                                >
                                    <path d={item.d} />
                                </svg>
                                <span>{item.label}</span>
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {badgeCount && (
                                    <span style={{
                                        minWidth: '22px',
                                        fontSize: '11px', fontWeight: 600, color: '#fff',
                                        background: T.accent, borderRadius: '9999px',
                                        padding: '2px 8px', lineHeight: '16px', textAlign: 'center',
                                    }}>
                                        {badgeCount}
                                    </span>
                                )}
                                {item.badge && !badgeCount && (
                                    <span style={{
                                        width: '7px', height: '7px', borderRadius: '50%',
                                        background: T.accent, flexShrink: 0,
                                    }} />
                                )}
                            </span>
                        </button>
                    );
                })}
            </nav>

            {/* Sign out */}
            <div style={{ padding: '16px 24px', borderTop: `1px solid ${T.line}` }}>
                <button
                    onClick={onSignOut}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0',
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontFamily: F, fontSize: '12px', color: T.faded, width: '100%',
                    }}
                >
                    <svg width="16" height="16" fill="none" stroke={T.faded} strokeWidth="1.5" viewBox="0 0 24 24">
                        <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Sign Out
                </button>
            </div>
        </div>
    );
}

export default DesktopSidebar;
