import React from 'react';

/**
 * "kliques" wordmark in Playfair Display.
 * Reference: docs/ui-reference/shared/logo.jsx
 *
 * @param {number} size  - font size in px (default 18)
 * @param {'accent'|'white'|'muted'} color - named token, or pass any CSS hex/rgb string
 */
const Logo = ({ size = 18, color = 'accent' }) => {
    const colorMap = {
        accent: 'text-accent',
        white:  'text-white',
        muted:  'text-muted',
    };
    const colorClass  = colorMap[color] ?? '';
    const inlineColor = colorMap[color] ? undefined : color;

    return (
        <span
            className={`font-playfair font-bold leading-none ${colorClass}`}
            style={{ fontSize: size, letterSpacing: '-0.5px', color: inlineColor }}
        >
            kliques
        </span>
    );
};

export default Logo;
