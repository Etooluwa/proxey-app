import React, { useEffect } from 'react';
import Avatar from './Avatar';

/**
 * v6 offcanvas side menu — slides in from the left over a dark scrim.
 * 280px wide, cream base background, active item has terracotta left border.
 *
 * @param {boolean}  open         - visibility
 * @param {function} onClose      - scrim / close tap handler
 * @param {Array}    items        - [{ id, label, d, badge?, count? }]
 *                                  d = SVG path string for the icon
 * @param {string}   active       - id of the active item
 * @param {function} onNav        - called with item.id on tap
 * @param {string}   userName     - display name in the header
 * @param {string}   userInitials - 1–2 char initials for Avatar
 * @param {function} onSignOut    - sign out handler
 */
const SideMenu = ({
    open,
    onClose,
    items = [],
    active,
    onNav,
    userName = '',
    userInitials = '?',
    onSignOut,
}) => {
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
        <div className="fixed inset-0 z-50 flex">
            {/* Scrim */}
            <div
                className="absolute inset-0 bg-black/40"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Drawer */}
            <div
                className="relative w-[280px] h-full bg-base flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.10)]"
                style={{ animation: 'slideIn 0.25s ease-out' }}
            >
                {/* User header */}
                <div className="px-5 pt-6 pb-5 border-b border-line">
                    <div className="flex items-center gap-3">
                        <Avatar initials={userInitials} size={44} />
                        <div>
                            <p className="text-[16px] font-semibold text-ink m-0 leading-tight">
                                {userName}
                            </p>
                            <span className="text-[11px] font-medium uppercase tracking-[0.05em] text-muted">
                                kliques
                            </span>
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
                                    background: isActive ? 'rgba(194,94,74,0.08)' : 'transparent',
                                    borderLeft: isActive ? '3px solid #C25E4A' : '3px solid transparent',
                                }}
                            >
                                <svg
                                    width="22" height="22"
                                    fill={isActive ? '#C25E4A' : 'none'}
                                    stroke={isActive ? '#C25E4A' : '#8C6A64'}
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                >
                                    <path d={item.d} />
                                </svg>

                                <span
                                    className="text-[15px]"
                                    style={{
                                        fontWeight: isActive ? 600 : 500,
                                        color: isActive ? '#C25E4A' : '#8C6A64',
                                    }}
                                >
                                    {item.label}
                                </span>

                                {item.badge && (
                                    <span className="ml-auto w-2 h-2 rounded-full bg-accent flex-shrink-0" />
                                )}
                                {item.count && (
                                    <span className="ml-auto px-2 py-0.5 rounded-pill bg-accent text-white text-[11px] font-semibold leading-none">
                                        {item.count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Sign out */}
                {onSignOut && (
                    <div className="px-5 pb-3 border-t border-line pt-3">
                        <button
                            onClick={onSignOut}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-left focus:outline-none hover:bg-dangerBg transition-colors"
                        >
                            <svg width="20" height="20" fill="none" stroke="#8C6A64" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span className="text-[15px] font-medium text-muted">Sign out</span>
                        </button>
                    </div>
                )}

                {/* Footer tagline */}
                <div className="px-5 py-4 border-t border-line">
                    <p className="text-[11px] text-faded text-center m-0 uppercase tracking-[0.05em]">
                        Kliques · Relationship OS
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SideMenu;
