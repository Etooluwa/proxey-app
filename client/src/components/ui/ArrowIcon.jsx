import React from 'react';

/**
 * Diagonal arrow (↗) — interaction hint replacing chevrons.
 *
 * @param {number} size  - px (default 20)
 * @param {string} color - hex or CSS color (default #C25E4A = accent)
 */
const ArrowIcon = ({ size = 20, color = '#C25E4A' }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 20 20"
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <path d="M5 15L15 5M15 5H7M15 5v8" />
    </svg>
);

export default ArrowIcon;
