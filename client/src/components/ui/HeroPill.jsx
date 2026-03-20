import React from 'react';

/**
 * Frosted glass pill for use inside HeroCard.
 * Shows an accent dot + uppercase label.
 *
 * @param {ReactNode} children
 */
const HeroPill = ({ children }) => (
    <div
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill"
        style={{
            background: 'rgba(255,255,255,0.45)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
        }}
    >
        <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
        <span className="text-[11px] font-medium uppercase tracking-[0.05em] text-ink">
            {children}
        </span>
    </div>
);

export default HeroPill;
