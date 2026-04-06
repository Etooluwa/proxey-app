import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

const ShareLinksSection = ({ handle = "" }) => {
  const [copied, setCopied] = useState(null);
  const [showQR, setShowQR] = useState(null);

  const bookingUrl = `app.mykliques.com/book/${handle}`;
  const inviteUrl = `app.mykliques.com/join/${handle}`;
  const bookingFullUrl = `https://app.mykliques.com/book/${handle}`;
  const inviteFullUrl = `https://app.mykliques.com/join/${handle}`;

  const copyLink = (type, url) => {
    navigator.clipboard.writeText(`https://${url}`).catch(() => {});
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const shareLink = (url) => {
    if (navigator.share) {
      navigator.share({ url: `https://${url}` }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`https://${url}`).catch(() => {});
    }
  };

  const QRModal = ({ type, url, fullUrl }) => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px 0 4px",
      }}
    >
      <div
        style={{
          padding: "16px",
          borderRadius: "16px",
          background: "#FFFFFF",
          border: "1px solid rgba(140,106,100,0.2)",
          marginBottom: "12px",
        }}
      >
        <QRCodeSVG value={fullUrl} size={140} />
      </div>
      <p
        style={{
          fontFamily: "'Sora', system-ui, sans-serif",
          fontSize: "13px",
          color: "#6B7280",
          margin: "0 0 8px",
          textAlign: "center",
        }}
      >
        {url}
      </p>
      <button
        onClick={() => setShowQR(null)}
        style={{
          padding: "8px 20px",
          borderRadius: "9999px",
          border: "1px solid rgba(140,106,100,0.2)",
          background: "#FFFFFF",
          fontFamily: "'Sora', system-ui, sans-serif",
          fontSize: "13px",
          fontWeight: 600,
          color: "#3D231E",
          cursor: "pointer",
        }}
      >
        Close
      </button>
    </div>
  );

  const LinkBlock = ({ type, label, url, fullUrl, iconColor, iconBg, icon }) => {
    const isCopied = copied === type;
    const isShowingQR = showQR === type;
    return (
      <div
        style={{
          padding: "14px",
          borderRadius: "12px",
          background: "#FBF7F2",
          marginBottom: type === "booking" ? "10px" : "0",
        }}
      >
        {/* Label row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "8px",
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "8px",
              background: iconBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {icon}
          </div>
          <span
            style={{
              fontFamily: "'Sora', system-ui, sans-serif",
              fontSize: "14px",
              fontWeight: 600,
              color: "#3D231E",
            }}
          >
            {label}
          </span>
        </div>

        {/* URL pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "10px 12px",
            borderRadius: "10px",
            background: "#FFFFFF",
            border: "1px solid rgba(140,106,100,0.2)",
            marginBottom: "10px",
            overflow: "hidden",
          }}
        >
          <svg
            width="14"
            height="14"
            fill="none"
            stroke="#6B7280"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
            style={{ flexShrink: 0 }}
          >
            <path
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span
            style={{
              fontFamily: "'Sora', system-ui, sans-serif",
              fontSize: "13px",
              color: "#6B7280",
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {url}
          </span>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => copyLink(type, url)}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "10px",
              border: "none",
              background: isCopied ? "#F0FDF4" : "#3D231E",
              color: isCopied ? "#15803D" : "#FFFFFF",
              fontFamily: "'Sora', system-ui, sans-serif",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            {isCopied ? (
              <>
                <svg
                  width="14"
                  height="14"
                  fill="none"
                  stroke="#15803D"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M5 13l4 4L19 7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg
                  width="14"
                  height="14"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Copy
              </>
            )}
          </button>

          {/* QR button */}
          <button
            onClick={() => setShowQR(isShowingQR ? null : type)}
            style={{
              padding: "10px 14px",
              borderRadius: "10px",
              border: "1px solid rgba(140,106,100,0.2)",
              background: isShowingQR ? "#FBF7F2" : "#FFFFFF",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="16"
              height="16"
              fill="none"
              stroke="#3D231E"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <path
                d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM17 14v3h3m-3-6h3v3m-6 3h3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Share button */}
          <button
            onClick={() => shareLink(url)}
            style={{
              padding: "10px 14px",
              borderRadius: "10px",
              border: "1px solid rgba(140,106,100,0.2)",
              background: "#FFFFFF",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="16"
              height="16"
              fill="none"
              stroke="#3D231E"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <path
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* QR expansion */}
        {isShowingQR && <QRModal type={type} url={url} fullUrl={fullUrl} />}
      </div>
    );
  };

  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: "16px",
        overflow: "hidden",
        marginBottom: "12px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      <div style={{ padding: "16px 16px 12px" }}>
        <p
          style={{
            fontFamily: "'Sora', system-ui, sans-serif",
            fontSize: "16px",
            fontWeight: 700,
            color: "#3D231E",
            margin: "0 0 4px",
          }}
        >
          Share your links
        </p>
        <p
          style={{
            fontFamily: "'Sora', system-ui, sans-serif",
            fontSize: "13px",
            color: "#6B7280",
            margin: "0 0 16px",
            lineHeight: 1.5,
          }}
        >
          Invite clients to connect or book directly with you.
        </p>

        <LinkBlock
          type="booking"
          label="Booking link"
          url={bookingUrl}
          fullUrl={bookingFullUrl}
          iconBg="#FDDCC6"
          icon={
            <svg
              width="14"
              height="14"
              fill="none"
              stroke="#C25E4A"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
        />

        <LinkBlock
          type="invite"
          label="Invite link"
          url={inviteUrl}
          fullUrl={inviteFullUrl}
          iconBg="#F0FDF4"
          icon={
            <svg
              width="14"
              height="14"
              fill="none"
              stroke="#22C55E"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M8.5 3a4 4 0 100 8 4 4 0 000-8zM20 8v6m3-3h-6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }
        />
      </div>

      {/* Footer note */}
      <div
        style={{
          padding: "12px 16px",
          borderTop: "0.5px solid rgba(140,106,100,0.2)",
          background: "#FBF7F2",
          borderRadius: "0 0 16px 16px",
        }}
      >
        <p
          style={{
            fontFamily: "'Sora', system-ui, sans-serif",
            fontSize: "12px",
            color: "#6B7280",
            margin: 0,
            textAlign: "center",
          }}
        >
          Clients who book or accept your invite will appear in My kliques
        </p>
      </div>
    </div>
  );
};

export default ShareLinksSection;
