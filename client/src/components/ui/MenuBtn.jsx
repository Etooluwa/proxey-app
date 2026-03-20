import React from 'react';

/**
 * Hamburger button — three lines in terracotta (#C25E4A).
 * Widths: 20px, 14px, 20px with 4px gap.
 */
const MenuBtn = ({ onClick }) => (
    <button
        onClick={onClick}
        className="-m-2 p-2 flex flex-col justify-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        aria-label="Open menu"
    >
        <span className="block h-[1.75px] rounded-full bg-accent" style={{ width: 20 }} />
        <span className="block h-[1.75px] rounded-full bg-accent" style={{ width: 14 }} />
        <span className="block h-[1.75px] rounded-full bg-accent" style={{ width: 20 }} />
    </button>
);

export default MenuBtn;
