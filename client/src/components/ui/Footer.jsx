import React from 'react';
import Logo from './Logo';

const LINKS = ['About', 'Terms', 'Privacy', 'Support'];

/**
 * App footer — present on every screen, pinned to the bottom via mt-auto.
 * Reference: docs/ui-reference/shared/footer.jsx
 *
 * Wrap your screen in a flex-col min-h-screen container so Footer
 * always sticks to the bottom: <div className="flex flex-col min-h-screen bg-background">
 */
const Footer = () => (
    <div className="px-5 pt-8 pb-10 mt-auto">
        {/* Muted logo */}
        <div className="flex justify-center mb-3">
            <Logo size={18} color="muted" />
        </div>

        {/* Link row */}
        <div className="flex justify-center gap-4 mb-3 flex-wrap">
            {LINKS.map((link) => (
                <span
                    key={link}
                    className="font-manrope text-[13px] font-medium text-muted cursor-pointer hover:text-foreground transition-colors"
                >
                    {link}
                </span>
            ))}
        </div>

        {/* Copyright */}
        <p className="font-manrope text-[11px] text-center m-0" style={{ color: '#C7C7CC' }}>
            © 2026 Kliques. All rights reserved.
        </p>
    </div>
);

export default Footer;
