import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MenuBtn from './MenuBtn';
import NotifBell from './NotifBell';
import Avatar from './Avatar';
import klogo from '../../klogo.png';

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
 * @param {string}   avatarSrc    - optional avatar image URL
 */
const Header = ({
    onMenu,
    notifCount,
    onNotif,
    showAvatar = true,
    initials = '?',
    avatarSrc = '',
}) => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleAvatarClick = () => {
        if (location.pathname.startsWith('/provider')) {
            navigate('/provider/profile');
            return;
        }
        navigate('/app/profile');
    };

    return (
        <div className="relative flex items-center justify-between px-5 py-3 bg-base">
            {/* Left: hamburger */}
            <MenuBtn onClick={onMenu} />

            {/* Center: logo (absolute so it's truly centered) */}
            <img src={klogo} alt="kliques" className="absolute left-1/2 -translate-x-1/2 select-none pointer-events-none" style={{ height: 44, width: 'auto' }} />

            {/* Right: bell + optional avatar */}
            <div className="flex items-center gap-1">
                <NotifBell count={notifCount} onClick={onNotif} />
                {showAvatar && (
                    <button
                        type="button"
                        onClick={handleAvatarClick}
                        aria-label="Open profile"
                        className="flex items-center justify-center p-0 bg-transparent border-0 cursor-pointer"
                    >
                        <Avatar initials={initials} size={32} src={avatarSrc} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default Header;
