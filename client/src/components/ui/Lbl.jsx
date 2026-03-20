import React from 'react';

/**
 * Uppercase label — 11px, medium weight, wide tracking.
 * Used for section labels, stat captions, status tags.
 *
 * @param {ReactNode} children
 * @param {string}    color     - Tailwind text class (default 'text-muted')
 * @param {string}    className - extra Tailwind classes
 */
const Lbl = ({ children, color = 'text-muted', className = '' }) => (
    <span className={`text-[11px] font-medium uppercase tracking-[0.05em] ${color} ${className}`}>
        {children}
    </span>
);

export default Lbl;
