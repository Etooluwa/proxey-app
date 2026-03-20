import React from 'react';

/**
 * v6 app footer — "© 2026 Kliques" left, Terms/Privacy/Help links right.
 * Faded color, 10px, uppercase.
 */
const Footer = () => (
    <div className="flex items-center justify-between px-5 py-6 mt-auto">
        <span className="text-[10px] font-medium uppercase tracking-[0.05em] text-faded">
            © 2026 Kliques
        </span>
        <div className="flex items-center gap-4">
            {['Terms', 'Privacy', 'Help'].map((link) => (
                <span
                    key={link}
                    className="text-[10px] font-medium uppercase tracking-[0.05em] text-faded cursor-pointer hover:text-muted transition-colors"
                >
                    {link}
                </span>
            ))}
        </div>
    </div>
);

export default Footer;
