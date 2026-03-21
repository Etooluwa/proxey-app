import React from 'react';

/**
 * Pill-shaped status badge.
 * Reference: docs/ui-reference/shared/badge.jsx
 *
 * Use `variant` for semantic colours, or pass `bg`/`color` to override.
 *
 * @param {string} label    - display text (or use children)
 * @param {'accent'|'success'|'warning'|'danger'|'muted'|'callout'} variant
 * @param {string} bg       - CSS color override for background
 * @param {string} color    - CSS color override for text
 * @param {string} className
 */
const Badge = ({ label, children, variant = 'accent', bg, color, className = '' }) => {
    const variants = {
        accent:  'bg-accentLight  text-accent',
        success: 'bg-successLight text-success',
        warning: 'bg-yellow-100   text-warning',
        danger:  'bg-dangerLight  text-danger',
        muted:   'bg-background   text-muted',
        callout: 'bg-callout      text-warning',
    };

    return (
        <span
            className={`inline-flex items-center px-3 py-1 rounded-pill font-sora text-[13px] font-semibold leading-none ${variants[variant] ?? variants.accent} ${className}`}
            style={bg || color ? { background: bg, color } : undefined}
        >
            {label ?? children}
        </span>
    );
};

export default Badge;
