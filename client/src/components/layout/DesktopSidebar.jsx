import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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

// ─── Bell icon SVG ────────────────────────────────────────────────────────────
function BellIcon() {
    return (
        <svg width="20" height="20" fill="none" stroke={T.ink} strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

// ─── Notification dropdown ────────────────────────────────────────────────────
function NotifDropdown({ notifications, unreadCount, onNavigate }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Use real notifications if available, otherwise show placeholder
    const displayNotifs = notifications?.slice(0, 3) || [];

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <button
                onClick={() => setOpen(!open)}
                style={{
                    position: 'relative', padding: '8px', borderRadius: '10px',
                    background: T.avatarBg, border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
            >
                <BellIcon />
                {unreadCount > 0 && (
                    <div style={{
                        position: 'absolute', top: '6px', right: '6px',
                        width: '8px', height: '8px', borderRadius: '50%', background: T.accent,
                    }} />
                )}
            </button>

            {open && (
                <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    width: '380px', background: T.card, borderRadius: '16px',
                    border: `1px solid ${T.line}`, boxShadow: '0 12px 40px rgba(61,35,30,0.10)',
                    zIndex: 20, overflow: 'hidden',
                }}>
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '20px 20px 12px',
                    }}>
                        <span style={{ fontFamily: F, fontSize: '16px', fontWeight: 500, color: T.ink }}>
                            Notifications
                        </span>
                        <span style={{
                            fontFamily: F, fontSize: '11px', fontWeight: 500, color: T.accent,
                            textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer',
                        }}>
                            Mark all read
                        </span>
                    </div>
                    <div style={{ height: '1px', background: T.line }} />

                    {displayNotifs.length === 0 ? (
                        <div style={{ padding: '24px', textAlign: 'center' }}>
                            <p style={{ fontFamily: F, fontSize: '13px', color: T.muted, margin: 0 }}>
                                No new notifications
                            </p>
                        </div>
                    ) : (
                        displayNotifs.map((n) => {
                            const initials = (n.title || '?').slice(0, 2).toUpperCase();
                            return (
                                <div key={n.id}>
                                    <button
                                        onClick={() => { onNavigate(n); setOpen(false); }}
                                        style={{
                                            display: 'flex', gap: '12px', padding: '16px 20px',
                                            width: '100%', textAlign: 'left',
                                            background: !n.is_read ? 'rgba(194,94,74,0.02)' : 'transparent',
                                            border: 'none', cursor: 'pointer', fontFamily: F,
                                        }}
                                    >
                                        <div style={{
                                            width: 32, height: 32, borderRadius: '50%',
                                            background: T.avatarBg, display: 'flex', alignItems: 'center',
                                            justifyContent: 'center', fontSize: '11px', fontWeight: 500,
                                            color: T.muted, flexShrink: 0,
                                        }}>
                                            {initials}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <span style={{ fontSize: '13px', fontWeight: !n.is_read ? 500 : 400, color: T.ink }}>
                                                    {n.title}
                                                </span>
                                                {!n.is_read && (
                                                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: T.accent, flexShrink: 0, marginTop: '4px' }} />
                                                )}
                                            </div>
                                            <p style={{ fontSize: '12px', color: T.muted, margin: '2px 0 0' }}>
                                                {n.message || n.body || ''}
                                            </p>
                                        </div>
                                    </button>
                                    <div style={{ padding: '0 20px' }}>
                                        <div style={{ height: '1px', background: T.line }} />
                                    </div>
                                </div>
                            );
                        })
                    )}

                    <button
                        onClick={() => { onNavigate(null); setOpen(false); }}
                        style={{
                            width: '100%', padding: '14px', fontFamily: F, fontSize: '13px',
                            fontWeight: 500, color: T.ink, textAlign: 'center', border: 'none',
                            cursor: 'pointer', background: 'transparent',
                        }}
                    >
                        View All Notifications
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── Desktop Header ───────────────────────────────────────────────────────────
export function DesktopHeader({ title, subtitle, notifications, unreadCount, onNotifNavigate }) {
    return (
        <header style={{
            padding: '24px 40px 20px', display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', borderBottom: `1px solid ${T.line}`,
            position: 'sticky', top: 0, background: T.base, zIndex: 5,
        }}>
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
                <h1 style={{
                    fontFamily: F, fontSize: '26px', fontWeight: 400,
                    letterSpacing: '-0.03em', color: T.ink, margin: 0,
                }}>
                    {title}
                </h1>
            </div>
            <NotifDropdown
                notifications={notifications}
                unreadCount={unreadCount}
                onNavigate={onNotifNavigate}
            />
        </header>
    );
}

// ─── Desktop Sidebar ──────────────────────────────────────────────────────────
export function DesktopSidebar({ items, active, onNav, userName, userInitials, isProvider, onSignOut }) {
    return (
        <div style={{
            width: '260px', position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 10,
            background: T.sidebar, borderRight: `1px solid ${T.line}`,
            display: 'flex', flexDirection: 'column',
        }}>
            {/* Wordmark */}
            <div style={{ padding: '28px 28px 8px' }}>
                <p style={{
                    fontFamily: "'Playfair Display',serif", fontSize: '22px',
                    fontWeight: 500, color: T.accent, letterSpacing: '-0.02em', margin: 0,
                }}>
                    kliques
                </p>
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
                }}>
                    {userInitials}
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
                            <span>{item.label}</span>
                            {item.count && (
                                <span style={{
                                    fontSize: '11px', fontWeight: 600, color: '#fff',
                                    background: T.accent, borderRadius: '9999px',
                                    padding: '2px 8px', lineHeight: '16px',
                                }}>
                                    {item.count}
                                </span>
                            )}
                            {item.badge && !item.count && (
                                <span style={{
                                    width: '7px', height: '7px', borderRadius: '50%',
                                    background: T.accent, flexShrink: 0,
                                }} />
                            )}
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
