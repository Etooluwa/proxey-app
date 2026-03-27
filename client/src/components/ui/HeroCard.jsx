import React from 'react';

/**
 * Hero card — warm #FDDCC6 background with topographic SVG texture overlay.
 * Used for the featured/stats card at the top of main screens.
 *
 * @param {ReactNode} children
 * @param {string}    className  - extra Tailwind classes
 * @param {object}    style      - extra inline styles
 */
const TOPO_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Cg fill='none' stroke='%23C25E4A' stroke-width='1'%3E%3Cellipse cx='200' cy='200' rx='180' ry='80'/%3E%3Cellipse cx='200' cy='200' rx='140' ry='60'/%3E%3Cellipse cx='200' cy='200' rx='100' ry='45'/%3E%3Cellipse cx='200' cy='200' rx='60' ry='30'/%3E%3Cellipse cx='200' cy='200' rx='160' ry='110'/%3E%3Cellipse cx='200' cy='200' rx='120' ry='90'/%3E%3C/g%3E%3C/svg%3E")`;

const HeroCard = ({ children, className = '', style }) => (
    <div
        className={`relative overflow-hidden rounded-hero p-7 ${className}`}
        style={{ background: '#FDDCC6', ...style }}
    >
        {/* Topographic texture at 15% opacity */}
        <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
                backgroundImage: TOPO_SVG,
                backgroundSize: '100% 100%',
                opacity: 0.15,
            }}
        />
        <div className="relative" style={{ zIndex: 1 }}>
            {children}
        </div>
    </div>
);

export default HeroCard;
