import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
    ink: '#3D231E',
    muted: '#8C6A64',
    accent: '#C25E4A',
    hero: '#FDDCC6',
    avatarBg: '#F2EBE5',
    line: 'rgba(140,106,100,0.18)',
    success: '#5A8A5E',
    successBg: '#EBF2EC',
    card: '#FFFFFF',
};
const F = "'Sora',system-ui,sans-serif";

const TOPO_SVG = `url("data:image/svg+xml,%3Csvg width='400' height='400' viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 200 Q 100 100 200 200 T 400 200' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M-50 250 Q 50 150 150 250 T 350 250' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M50 150 Q 150 50 250 150 T 450 150' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M0 300 Q 100 200 200 300 T 400 300' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3C/svg%3E")`;

// ─── Shared icon components ───────────────────────────────────────────────────
function LinkIcon() {
    return (
        <svg width="14" height="14" fill="none" stroke={T.muted} strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function QRIcon({ active }) {
    return (
        <svg width="16" height="16" fill="none" stroke={active ? T.accent : T.muted} strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM17 14v3h3m-3-6h3v3m-6 3h3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function ShareIcon() {
    return (
        <svg width="16" height="16" fill="none" stroke={T.muted} strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function InviteIcon() {
    return (
        <svg width="16" height="16" fill="none" stroke={T.accent} strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M8.5 3a4 4 0 100 8 4 4 0 000-8zM20 8v6m3-3h-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function CalendarIcon() {
    return (
        <svg width="16" height="16" fill="none" stroke={T.accent} strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

// ─── Single link card ─────────────────────────────────────────────────────────
function LinkCard({ type, icon, label, description, url, fullUrl, isHero, copied, showQR, onCopy, onToggleQR, onShare }) {
    const isCopied = copied === type;
    const isShowingQR = showQR === type;

    const urlPillBg = isHero ? 'rgba(255,255,255,0.6)' : T.card;
    const urlPillBorder = isHero ? '1px solid rgba(61,35,30,0.08)' : `1px solid ${T.line}`;
    const iconBtnBg = isHero ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.8)';

    return (
        <div style={{
            padding: '24px', borderRadius: '18px',
            background: isHero ? T.hero : T.avatarBg,
            position: 'relative', overflow: 'hidden',
        }}>
            {/* Topo texture on hero card */}
            {isHero && (
                <div aria-hidden="true" style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: TOPO_SVG, backgroundSize: 'cover',
                    opacity: 0.08, pointerEvents: 'none',
                }} />
            )}

            <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Label row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    {icon}
                    <span style={{ fontFamily: F, fontSize: '12px', fontWeight: 500, color: T.ink, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {label}
                    </span>
                </div>

                {/* Description */}
                <p style={{ fontFamily: F, fontSize: '13px', color: T.muted, margin: '0 0 12px', lineHeight: 1.5 }}>
                    {description}
                </p>

                {/* URL pill */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '10px 12px', borderRadius: '10px',
                    background: urlPillBg, border: urlPillBorder,
                    fontSize: '12px', color: T.muted, fontFamily: F,
                }}>
                    <LinkIcon />
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {url}
                    </span>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                    {/* Copy */}
                    <button
                        onClick={onCopy}
                        style={{
                            flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                            background: isCopied ? T.successBg : T.ink,
                            color: isCopied ? T.success : '#fff',
                            fontFamily: F, fontSize: '12px', fontWeight: 500,
                            cursor: 'pointer', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', gap: '5px', transition: 'background 0.2s, color 0.2s',
                        }}
                    >
                        {isCopied ? (
                            <>
                                <svg width="13" height="13" fill="none" stroke={T.success} strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Copied
                            </>
                        ) : (
                            <>
                                <svg width="13" height="13" fill="none" stroke="#fff" strokeWidth="1.5" viewBox="0 0 24 24">
                                    <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Copy
                            </>
                        )}
                    </button>

                    {/* QR */}
                    <button
                        onClick={onToggleQR}
                        aria-label="Toggle QR code"
                        style={{
                            padding: '10px 14px', borderRadius: '10px',
                            border: `1px solid ${T.line}`,
                            background: isShowingQR ? 'rgba(194,94,74,0.10)' : iconBtnBg,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                    >
                        <QRIcon active={isShowingQR} />
                    </button>

                    {/* Share */}
                    <button
                        onClick={onShare}
                        aria-label="Share link"
                        style={{
                            padding: '10px 14px', borderRadius: '10px',
                            border: `1px solid ${T.line}`, background: iconBtnBg,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                    >
                        <ShareIcon />
                    </button>
                </div>

                {/* QR expansion */}
                {isShowingQR && (
                    <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ padding: '12px', borderRadius: '12px', background: T.card, marginBottom: '8px' }}>
                            <QRCodeSVG value={fullUrl} size={140} />
                        </div>
                        <p style={{ fontFamily: F, fontSize: '11px', color: T.muted, margin: '0 0 8px', textAlign: 'center' }}>
                            {url}
                        </p>
                        <button
                            onClick={onToggleQR}
                            style={{
                                padding: '6px 16px', borderRadius: '9999px',
                                border: `1px solid ${T.line}`, background: 'transparent',
                                fontFamily: F, fontSize: '12px', fontWeight: 500,
                                color: T.ink, cursor: 'pointer',
                            }}
                        >
                            Close
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── DesktopShareLinks ────────────────────────────────────────────────────────
/**
 * Two-column share links grid for desktop.
 * Replaces the stacked mobile ShareLinks on screens >= 1024px.
 *
 * @param {string} handle - provider URL handle
 */
export default function DesktopShareLinks({ handle = '' }) {
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

    const toggleQR = (type) => setShowQR((prev) => (prev === type ? null : type));

    return (
        <div style={{ marginTop: '28px' }}>
            <span style={{
                fontFamily: F, fontSize: '11px', fontWeight: 500, color: T.muted,
                textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block',
                marginBottom: '14px',
            }}>
                Share your links
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <LinkCard
                    type="invite"
                    icon={<InviteIcon />}
                    label="Invite Link"
                    description="Send to clients to join your klique instantly."
                    url={inviteUrl}
                    fullUrl={inviteFullUrl}
                    isHero
                    copied={copied}
                    showQR={showQR}
                    onCopy={() => handleCopy('invite', inviteFullUrl)}
                    onToggleQR={() => toggleQR('invite')}
                    onShare={() => handleShare(inviteFullUrl)}
                />
                <LinkCard
                    type="booking"
                    icon={<CalendarIcon />}
                    label="Booking Link"
                    description="Your public page — clients see your profile and book."
                    url={bookingUrl}
                    fullUrl={bookingFullUrl}
                    isHero={false}
                    copied={copied}
                    showQR={showQR}
                    onCopy={() => handleCopy('booking', bookingFullUrl)}
                    onToggleQR={() => toggleQR('booking')}
                    onShare={() => handleShare(bookingFullUrl)}
                />
            </div>

            <p style={{ fontFamily: F, fontSize: '11px', color: T.muted, textAlign: 'center', margin: '14px 0 0' }}>
                Clients who book or accept your invite will appear in My kliques
            </p>
        </div>
    );
}
