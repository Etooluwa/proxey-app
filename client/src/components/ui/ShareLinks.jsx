import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const TOPO_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Cg fill='none' stroke='%23C25E4A' stroke-width='1'%3E%3Cellipse cx='200' cy='200' rx='180' ry='80'/%3E%3Cellipse cx='200' cy='200' rx='140' ry='60'/%3E%3Cellipse cx='200' cy='200' rx='100' ry='45'/%3E%3Cellipse cx='200' cy='200' rx='60' ry='30'/%3E%3Cellipse cx='200' cy='200' rx='160' ry='110'/%3E%3C/g%3E%3C/svg%3E")`;

const CopyIcon = ({ stroke }) => (
    <svg width="14" height="14" fill="none" stroke={stroke} strokeWidth="2" viewBox="0 0 24 24">
        <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const CheckIcon = () => (
    <svg width="14" height="14" fill="none" stroke="#5A8A5E" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const QRIcon = ({ active }) => (
    <svg width="16" height="16" fill="none" stroke={active ? '#C25E4A' : '#8C6A64'} strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM17 14v3h3m-3-6h3v3m-6 3h3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const ShareIcon = () => (
    <svg width="16" height="16" fill="none" stroke="#8C6A64" strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const LinkBlock = ({ type, label, url, fullUrl, isHero, copied, showQR, onCopy, onToggleQR, onShare }) => {
    const isCopied = copied === type;
    const isShowingQR = showQR === type;

    return (
        <div
            className="relative overflow-hidden rounded-[16px] p-4"
            style={{
                background: isHero ? '#FDDCC6' : '#F2EBE5',
            }}
        >
            {/* Topo texture on hero block */}
            {isHero && (
                <div
                    aria-hidden="true"
                    className="absolute inset-0 pointer-events-none"
                    style={{ backgroundImage: TOPO_SVG, backgroundSize: '100% 100%', opacity: 0.12 }}
                />
            )}

            <div className="relative z-10">
                {/* Label */}
                <p className="text-[13px] font-semibold text-ink mb-2">{label}</p>

                {/* URL pill */}
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] bg-white/70 mb-3 overflow-hidden">
                    <svg width="13" height="13" fill="none" stroke="#8C6A64" strokeWidth="1.5" viewBox="0 0 24 24" className="flex-shrink-0">
                        <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-[12px] text-muted flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                        {url}
                    </span>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                    {/* Copy */}
                    <button
                        onClick={onCopy}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[10px] text-[13px] font-semibold transition-colors"
                        style={{
                            background: isCopied ? '#EBF2EC' : '#3D231E',
                            color: isCopied ? '#5A8A5E' : '#FFFFFF',
                        }}
                    >
                        {isCopied ? <CheckIcon /> : <CopyIcon stroke="#fff" />}
                        {isCopied ? 'Copied' : 'Copy'}
                    </button>

                    {/* QR */}
                    <button
                        onClick={onToggleQR}
                        className="flex items-center justify-center px-3 py-2 rounded-[10px] transition-colors"
                        style={{
                            background: isShowingQR ? 'rgba(194,94,74,0.1)' : 'rgba(255,255,255,0.6)',
                            border: '1px solid rgba(140,106,100,0.2)',
                        }}
                        aria-label="Toggle QR code"
                    >
                        <QRIcon active={isShowingQR} />
                    </button>

                    {/* Share */}
                    <button
                        onClick={onShare}
                        className="flex items-center justify-center px-3 py-2 rounded-[10px] transition-colors"
                        style={{
                            background: 'rgba(255,255,255,0.6)',
                            border: '1px solid rgba(140,106,100,0.2)',
                        }}
                        aria-label="Share link"
                    >
                        <ShareIcon />
                    </button>
                </div>

                {/* QR code expansion */}
                {isShowingQR && (
                    <div className="mt-4 flex flex-col items-center">
                        <div className="p-3 rounded-[12px] bg-white mb-2">
                            <QRCodeSVG value={fullUrl} size={130} />
                        </div>
                        <p className="text-[12px] text-muted text-center">{url}</p>
                        <button
                            onClick={onToggleQR}
                            className="mt-2 px-4 py-1.5 rounded-pill text-[12px] font-semibold text-ink"
                            style={{ border: '1px solid rgba(140,106,100,0.2)' }}
                        >
                            Close
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * Share links section — invite link (hero) + booking link (avatarBg).
 * Sits directly on the cream base, no outer white card wrapper.
 *
 * @param {string} handle - provider handle
 */
const ShareLinks = ({ handle = '' }) => {
    const [copied, setCopied] = useState(null);
    const [showQR, setShowQR] = useState(null);
    const inviteUrl = `mykliques.com/join/${handle}`;
    const bookingUrl = `mykliques.com/book/${handle}`;
    const inviteFullUrl = `https://mykliques.com/join/${handle}`;
    const bookingFullUrl = `https://mykliques.com/book/${handle}`;

    const handleCopy = (type, fullUrl) => {
        navigator.clipboard.writeText(fullUrl).catch(() => {});
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleShare = (fullUrl) => {
        if (navigator.share) {
            navigator.share({ url: fullUrl }).catch(() => {});
        } else {
            navigator.clipboard.writeText(fullUrl).catch(() => {});
        }
    };

    const toggleQR = (type) => setShowQR(prev => prev === type ? null : type);

    return (
        <div className="flex flex-col gap-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.05em] text-muted px-1">
                Share your links
            </p>

            <LinkBlock
                type="invite"
                label="Invite link"
                url={inviteUrl}
                fullUrl={inviteFullUrl}
                isHero
                copied={copied}
                showQR={showQR}
                onCopy={() => handleCopy('invite', inviteFullUrl)}
                onToggleQR={() => toggleQR('invite')}
                onShare={() => handleShare(inviteFullUrl)}
            />

            <LinkBlock
                type="booking"
                label="Booking link"
                url={bookingUrl}
                fullUrl={bookingFullUrl}
                isHero={false}
                copied={copied}
                showQR={showQR}
                onCopy={() => handleCopy('booking', bookingFullUrl)}
                onToggleQR={() => toggleQR('booking')}
                onShare={() => handleShare(bookingFullUrl)}
            />

            <p className="text-[11px] text-faded text-center px-1">
                Clients who book or accept your invite will appear in My kliques
            </p>
        </div>
    );
};

export default ShareLinks;
