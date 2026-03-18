import React from 'react';

/**
 * Circular avatar with three visual variants.
 * Reference: docs/ui-reference/shared/avatar.jsx
 *
 * @param {string}   initials - 1–2 chars shown when no src
 * @param {number}   size     - diameter in px (default 44)
 * @param {'glass'|'accent'|'solid'} variant
 *   glass  — frosted white, for use inside gradient headers
 *   accent — accentLight bg + accent text, for cards/menus
 *   solid  — background tint, for neutral contexts
 * @param {string}   src      - image URL (overrides initials)
 * @param {string}   alt      - img alt / aria-label fallback
 * @param {function} onClick
 */
const Avatar = ({ initials = '?', size = 44, variant = 'glass', src, alt, onClick }) => {
    // Matches reference: glass uses rgba(255,255,255,0.2) + blur + white/30 border
    const variantClass = {
        glass:  'bg-white/20 backdrop-blur-[10px] border border-white/30 text-white',
        accent: 'bg-accentLight text-accent border border-transparent',
        solid:  'bg-background text-foreground border border-divider',
    }[variant] ?? 'bg-white/20 backdrop-blur-[10px] border border-white/30 text-white';

    const fontSize = Math.round(size * 0.32);

    return (
        <div
            onClick={onClick}
            className={`rounded-full flex items-center justify-center font-manrope font-bold flex-shrink-0 overflow-hidden select-none ${variantClass} ${onClick ? 'cursor-pointer' : ''}`}
            style={{ width: size, height: size, fontSize }}
            aria-label={alt ?? initials}
        >
            {src
                ? <img src={src} alt={alt ?? initials} className="w-full h-full object-cover" />
                : initials
            }
        </div>
    );
};

export default Avatar;
