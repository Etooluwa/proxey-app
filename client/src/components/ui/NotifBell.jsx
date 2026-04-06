import React from 'react';

/**
 * Notification bell icon with optional terracotta count badge.
 *
 * @param {number}   count   - unread count; badge hidden when 0 or undefined
 * @param {function} onClick
 */
const NotifBell = ({ count, onClick }) => (
    <button
        onClick={onClick}
        className="relative p-1.5 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        aria-label={count ? `${count} notifications` : 'Notifications'}
    >
        <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#3D231E"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M15 17H5a2 2 0 01-2-2v-1c0-.5.2-1 .6-1.4L5 11V8a7 7 0 0114 0v3l1.4 1.6c.4.4.6.9.6 1.4v1a2 2 0 01-2 2h-4z" />
            <path d="M9 17v1a3 3 0 006 0v-1" />
        </svg>

        {!!count && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-white text-[10px] font-semibold leading-none" style={{ background: '#C25E4A' }}>
                {count > 99 ? '99+' : count}
            </span>
        )}
    </button>
);

export default NotifBell;
