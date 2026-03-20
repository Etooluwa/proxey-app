import React from 'react';

/**
 * Back button — left chevron SVG, ink stroke, no background.
 *
 * @param {function} onClick
 * @param {string}   className - extra Tailwind classes
 */
const BackBtn = ({ onClick, className = '' }) => (
    <button
        onClick={onClick}
        className={`-m-2 p-2 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${className}`}
        aria-label="Back"
    >
        <svg width="24" height="24" fill="none" stroke="#3D231E" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    </button>
);

export default BackBtn;
