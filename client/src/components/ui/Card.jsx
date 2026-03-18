import React from 'react';

/**
 * White card surface on the system-gray background.
 * Reference: docs/ui-reference/shared/card.jsx
 *
 * bg:white · radius:16px · padding:16px · shadow:0 1px 3px rgba(0,0,0,0.04)
 * mb-3 matches the 12px gap between cards in the reference.
 *
 * @param {ReactNode} children
 * @param {string}    className  - additional Tailwind classes
 * @param {function}  onClick    - adds pointer cursor + press-scale animation
 * @param {boolean}   noPad      - remove default p-4 (e.g. for full-bleed images)
 * @param {string}    as         - HTML element to render (default 'div')
 */
const Card = ({ children, className = '', onClick, noPad = false, as: Tag = 'div' }) => (
    <Tag
        onClick={onClick}
        className={[
            'bg-card rounded-card shadow-card mb-3',
            noPad ? '' : 'p-4',
            onClick ? 'cursor-pointer active:scale-[0.98] transition-transform duration-100' : '',
            className,
        ].filter(Boolean).join(' ')}
    >
        {children}
    </Tag>
);

export default Card;
