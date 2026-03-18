import React, { useEffect } from 'react';
import Avatar from './Avatar';
import Logo from './Logo';

/**
 * Offcanvas side menu — slides in from the left over a dark scrim.
 * Reference: docs/ui-reference/shared/side-menu.jsx
 *
 * @param {boolean}  open         - visibility
 * @param {function} onClose      - scrim / close tap handler
 * @param {Array}    items        - [{ id, label, d, badge?, count? }]
 *                                  d = SVG path string for the icon
 * @param {string}   active       - id of the active item
 * @param {function} onNav        - called with item.id on tap
 * @param {string}   userName     - display name in the header
 * @param {string}   userInitials - 1–2 char initials for Avatar
 * @param {string}   userPhoto    - optional photo URL
 */
const SideMenu = ({ open, onClose, items = [], active, onNav, userName = '', userInitials = '?', userPhoto }) => {
    // Lock body scroll while drawer is open
    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    if (!open) return null;

    const handleNav = (id) => {
        onNav?.(id);
        onClose?.();
    };

    return (
        /* position:fixed so it covers the full viewport regardless of scroll */
        <div className="fixed inset-0 z-50 flex">
            {/* Scrim */}
            <div
                className="absolute inset-0 bg-black/40"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Drawer panel */}
            <div
                className="relative w-[280px] h-full bg-card flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.10)]"
                style={{ animation: 'slideIn 0.25s ease-out' }}
            >
                {/* User header */}
                <div className="px-5 pt-6 pb-5" style={{ borderBottom: '0.5px solid #E5E5EA' }}>
                    <div className="flex items-center gap-3">
                        <Avatar
                            initials={userInitials}
                            src={userPhoto}
                            size={44}
                            variant="accent"
                        />
                        <div>
                            <p className="font-manrope text-[16px] font-bold text-foreground m-0 leading-tight">
                                {userName}
                            </p>
                            <Logo size={13} color="muted" />
                        </div>
                    </div>
                </div>

                {/* Nav items */}
                <nav className="flex-1 overflow-y-auto py-2">
                    {items.map((item) => {
                        const isActive = active === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => handleNav(item.id)}
                                className="w-full flex items-center gap-3.5 px-5 py-3.5 text-left focus:outline-none transition-colors"
                                style={{
                                    background: isActive ? '#FFF0E6' : 'transparent',
                                    borderRight: isActive ? '3px solid #FF751F' : '3px solid transparent',
                                }}
                            >
                                {/* Icon */}
                                <svg
                                    width="22" height="22"
                                    fill={isActive ? '#FF751F' : 'none'}
                                    stroke={isActive ? '#FF751F' : '#6B7280'}
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                >
                                    <path d={item.d} />
                                </svg>

                                {/* Label */}
                                <span
                                    className="font-manrope text-[15px]"
                                    style={{
                                        fontWeight: isActive ? 700 : 500,
                                        color: isActive ? '#0D1619' : '#6B7280',
                                    }}
                                >
                                    {item.label}
                                </span>

                                {/* Unread dot */}
                                {item.badge && (
                                    <span className="ml-auto w-2 h-2 rounded-full bg-accent flex-shrink-0" />
                                )}

                                {/* Count pill */}
                                {item.count && (
                                    <span className="ml-auto px-2 py-0.5 rounded-pill bg-accent text-white font-manrope text-[11px] font-bold leading-none">
                                        {item.count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Bottom tagline */}
                <div className="px-5 py-4" style={{ borderTop: '0.5px solid #E5E5EA' }}>
                    <p className="font-manrope text-[12px] text-muted text-center m-0">
                        kliques · relationship OS
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SideMenu;
