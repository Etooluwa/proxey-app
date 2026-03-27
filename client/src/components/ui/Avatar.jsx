import React from 'react';

/**
 * Circular avatar with warm avatarBg background and centered initials.
 *
 * @param {string}   initials - 1–2 chars (default '?')
 * @param {number}   size     - diameter in px (default 40)
 * @param {string}   src      - optional image URL
 * @param {function} onClick
 */
const Avatar = ({ initials = '?', size = 40, src = '', onClick }) => {
    const fontSize = Math.round(size * 0.36);

    return (
        <div
            onClick={onClick}
            className={`rounded-full flex items-center justify-center font-semibold flex-shrink-0 select-none bg-avatarBg text-ink ${onClick ? 'cursor-pointer' : ''}`}
            style={{ width: size, height: size, fontSize, overflow: 'hidden' }}
            aria-label={initials}
        >
            {src ? (
                <img
                    src={src}
                    alt={initials}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
            ) : (
                initials
            )}
        </div>
    );
};

export default Avatar;
