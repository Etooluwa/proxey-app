import React from 'react';

/**
 * Circular avatar with warm avatarBg background and centered initials.
 *
 * @param {string}   initials - 1–2 chars (default '?')
 * @param {number}   size     - diameter in px (default 40)
 * @param {function} onClick
 */
const Avatar = ({ initials = '?', size = 40, onClick }) => {
    const fontSize = Math.round(size * 0.36);

    return (
        <div
            onClick={onClick}
            className={`rounded-full flex items-center justify-center font-semibold flex-shrink-0 select-none bg-avatarBg text-ink ${onClick ? 'cursor-pointer' : ''}`}
            style={{ width: size, height: size, fontSize }}
            aria-label={initials}
        >
            {initials}
        </div>
    );
};

export default Avatar;
