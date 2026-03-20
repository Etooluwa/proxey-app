import React from 'react';
import MenuBtn from './MenuBtn';
import NotifBell from './NotifBell';
import Avatar from './Avatar';

/**
 * v6 top-of-screen header.
 *
 * Layout: MenuBtn (left) | "kliques" centered (absolute) | NotifBell + Avatar (right)
 *
 * Provider screens: showAvatar={true} (default) — shows Avatar with initials.
 * Client screens:   showAvatar={false}           — NotifBell only on right.
 *
 * @param {function} onMenu       - opens SideMenu
 * @param {number}   notifCount   - unread notification count
 * @param {function} onNotif      - notification bell tap handler
 * @param {boolean}  showAvatar   - show avatar in right slot (default true)
 * @param {string}   initials     - 2-char initials for avatar
 */
const Header = ({
    onMenu,
    notifCount,
    onNotif,
    showAvatar = true,
    initials = '?',
}) => (
    <div className="relative flex items-center justify-between px-5 py-3 bg-base">
        {/* Left: hamburger */}
        <MenuBtn onClick={onMenu} />

        {/* Center: wordmark (absolute so it's truly centered) */}
        <span className="absolute left-1/2 -translate-x-1/2 text-[13px] font-semibold text-accent tracking-wide select-none pointer-events-none">
            kliques
        </span>

        {/* Right: bell + optional avatar */}
        <div className="flex items-center gap-1">
            <NotifBell count={notifCount} onClick={onNotif} />
            {showAvatar && <Avatar initials={initials} size={32} />}
        </div>
    </div>
);

export default Header;
