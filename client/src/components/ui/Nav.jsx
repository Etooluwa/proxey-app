import React from 'react';

/**
 * Sub-screen navigation bar: back chevron · centred title · close ✕.
 *
 * @param {function} onBack  - show ‹ back chevron
 * @param {function} onClose - show ✕ close button
 * @param {string}   title
 */
const Nav = ({ onBack, onClose, title }) => (
    <div className="flex items-center justify-between px-4 pt-2 pb-1 min-h-[44px]">
        {onBack ? (
            <button
                onClick={onBack}
                className="-m-2 p-2 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                aria-label="Back"
            >
                <svg width="24" height="24" fill="none" stroke="#3D231E" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>
        ) : (
            <div className="w-10" />
        )}

        {title && (
            <span className="text-[17px] font-semibold text-ink">{title}</span>
        )}

        {onClose ? (
            <button
                onClick={onClose}
                className="-m-2 p-2 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                aria-label="Close"
            >
                <svg width="24" height="24" fill="none" stroke="#3D231E" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
            </button>
        ) : (
            <div className="w-10" />
        )}
    </div>
);

export default Nav;
