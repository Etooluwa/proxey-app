import React from 'react';

/**
 * Hamburger (☰) button.
 * Reference: docs/ui-reference/shared/menu-button.jsx
 *
 * @param {function} onClick
 * @param {boolean}  white - true (default) = white stroke for gradient headers;
 *                          false = foreground stroke for light backgrounds
 */
const MenuBtn = ({ onClick, white = true }) => {
    const stroke = white ? '#ffffff' : '#0D1619';

    return (
        <button
            onClick={onClick}
            className="-m-2 p-2 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            aria-label="Open menu"
        >
            <svg width="24" height="24" fill="none" stroke={stroke} strokeWidth="2" viewBox="0 0 24 24">
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
        </button>
    );
};

export default MenuBtn;
