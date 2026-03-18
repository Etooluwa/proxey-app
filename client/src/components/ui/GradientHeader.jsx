import React from 'react';
import MenuBtn from './MenuBtn';
import Logo from './Logo';

/**
 * Full-bleed warm gradient header present on every top-level screen.
 * Reference: docs/ui-reference/shared/gradient-header.jsx
 *
 * Layout (top → bottom):
 *   ☰ MenuBtn  |  kliques Logo  |  [right slot or spacer]
 *   Page title (30px bold white)
 *   Subtitle   (15px white/80)
 *   [children] — frosted stat cards, search bars, etc.
 *
 * The -mb-5 + pb-12 + rounded-b-header creates the rounded overlap
 * that lets card content slide underneath the gradient.
 *
 * @param {function}  onMenu    - opens SideMenu
 * @param {string}    title     - 30px bold white heading
 * @param {string}    subtitle  - 15px white/80 subtext
 * @param {ReactNode} right     - top-right slot (e.g. Avatar button); defaults to spacer
 * @param {ReactNode} children  - content rendered inside the gradient area
 */
const GradientHeader = ({ onMenu, title, subtitle, right, children }) => (
    <div
        className="relative z-10 px-5 pb-12 rounded-b-header -mb-5"
        style={{
            background: 'linear-gradient(180deg, #D45400 0%, #E87020 40%, #F09050 65%, #F5C4A0 82%, #F2F2F7 100%)',
        }}
    >
        {/* Top bar: menu · logo · right */}
        <div className="flex items-center justify-between pt-1 mb-4">
            <MenuBtn onClick={onMenu} white />
            <Logo size={20} color="white" />
            {right ?? <div className="w-10" />}
        </div>

        {/* Page title */}
        {title && (
            <h1 className="font-manrope text-[30px] font-bold text-white m-0 mb-1 leading-tight">
                {title}
            </h1>
        )}

        {/* Subtitle */}
        {subtitle && (
            <p className="font-manrope text-[15px] text-white/80 m-0">
                {subtitle}
            </p>
        )}

        {/* Frosted stat cards / extra content */}
        {children}
    </div>
);

export default GradientHeader;
