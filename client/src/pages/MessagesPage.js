import { useState, useEffect, useRef } from "react";
import { useOutletContext, useLocation } from "react-router-dom";
import { useMessages } from "../contexts/MessageContext";
import { useSession } from "../auth/authContext";
import GradientHeader from "../components/ui/GradientHeader";
import Avatar from "../components/ui/Avatar";
import Card from "../components/ui/Card";
import Footer from "../components/ui/Footer";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelTime(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTime(timestamp) {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getInitials(name) {
  if (!name) return "P";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const MessagesPage = () => {
  const { onMenu } = useOutletContext() || {};
  const location = useLocation();
  const { session } = useSession();
  const {
    conversations,
    messages: messagesMap,
    currentConversation,
    setCurrentConversation,
    loadMessages,
    sendMessage,
    markAsRead,
  } = useMessages();

  const [showChat, setShowChat] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Pre-select conversation from location state (e.g., from RelationshipPage)
  useEffect(() => {
    const targetProviderId = location.state?.providerId;
    if (targetProviderId && conversations.length > 0) {
      const match = conversations.find(
        (c) => c.provider_id === targetProviderId
      );
      if (match) {
        markAsRead(match.id);
        setCurrentConversation(match.id);
        loadMessages(match.id);
        setShowChat(true);
      }
    }
  }, [location.state?.providerId, conversations]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesMap, currentConversation]);

  const activeMessages = currentConversation
    ? messagesMap[currentConversation] || []
    : [];
  const activeChat = conversations.find((c) => c.id === currentConversation);

  const handleChatSelect = (chat) => {
    markAsRead(chat.id);
    setCurrentConversation(chat.id);
    loadMessages(chat.id);
    setShowChat(true);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !currentConversation) return;
    setSending(true);
    try {
      await sendMessage({ conversationId: currentConversation, content: messageInput });
      setMessageInput("");
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  // ── Conversation list view ─────────────────────────────────────────────────
  const ConversationList = () => (
    <div className="flex flex-col min-h-screen bg-background font-manrope">
      <GradientHeader title="Messages" onMenu={onMenu} />

      <div className="flex-1 px-4 pt-8 pb-4 flex flex-col gap-0">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-3 mt-16">
            <svg
              width="48"
              height="48"
              fill="none"
              stroke="#D1D5DB"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <path
                d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="font-manrope text-[15px] font-semibold text-foreground">
              No messages yet
            </p>
            <p className="font-manrope text-[13px] text-muted text-center">
              Messages from your providers will appear here
            </p>
          </div>
        ) : (
          conversations.map((chat) => {
            const unread = (chat.client_unread_count || 0) > 0;
            const initials = getInitials(chat.provider_name);
            return (
              <button
                key={chat.id}
                onClick={() => handleChatSelect(chat)}
                className="w-full text-left focus:outline-none"
              >
                <Card className="flex items-center gap-3.5 mb-2">
                  {/* Avatar with unread dot */}
                  <div className="relative flex-shrink-0">
                    <Avatar initials={initials} size={48} />
                    {unread && (
                      <div
                        className="absolute top-0 right-0 w-[10px] h-[10px] rounded-full"
                        style={{
                          background: "#FF751F",
                          border: "2px solid #FFFFFF",
                        }}
                      />
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <p
                        className="font-manrope text-[15px] text-foreground truncate"
                        style={{ fontWeight: unread ? 700 : 500 }}
                      >
                        {chat.provider_name || "Provider"}
                      </p>
                      <span className="font-manrope text-[12px] text-muted ml-2 flex-shrink-0">
                        {formatRelTime(chat.last_message_at)}
                      </span>
                    </div>
                    <p
                      className="font-manrope text-[14px] truncate"
                      style={{ color: unread ? "#0D1619" : "#6B7280" }}
                    >
                      {chat.last_message || "No messages yet"}
                    </p>
                  </div>
                </Card>
              </button>
            );
          })
        )}
      </div>

      <Footer />
    </div>
  );

  // ── Chat window view ───────────────────────────────────────────────────────
  const ChatWindow = () => (
    <div className="flex flex-col h-screen bg-background font-manrope">
      {/* Chat header */}
      <div
        className="flex items-center gap-3 px-4 py-3 bg-white"
        style={{ borderBottom: "0.5px solid #E5E5EA" }}
      >
        <button
          onClick={() => setShowChat(false)}
          className="p-2 -ml-1 focus:outline-none"
        >
          <svg
            width="20"
            height="20"
            fill="none"
            stroke="#0D1619"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              d="M15 18l-6-6 6-6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <Avatar initials={getInitials(activeChat?.provider_name)} size={36} />
        <div className="flex-1 min-w-0">
          <p className="font-manrope text-[15px] font-bold text-foreground truncate">
            {activeChat?.provider_name || "Provider"}
          </p>
          <p className="font-manrope text-[12px] text-muted">Provider</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {activeMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-2">
            <p className="font-manrope text-[14px] text-muted">
              No messages yet
            </p>
            <p className="font-manrope text-[12px] text-muted">
              Start the conversation!
            </p>
          </div>
        ) : (
          <>
            {activeMessages.map((msg) => {
              const isMe = msg.sender_id === session?.user?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex flex-col ${
                      isMe ? "items-end" : "items-start"
                    }`}
                    style={{ maxWidth: "72%" }}
                  >
                    <div
                      className="px-4 py-2.5 font-manrope text-[15px] leading-relaxed"
                      style={{
                        borderRadius: isMe
                          ? "18px 18px 4px 18px"
                          : "18px 18px 18px 4px",
                        background: isMe ? "#0D1619" : "#FFFFFF",
                        color: isMe ? "#FFFFFF" : "#0D1619",
                        boxShadow: isMe ? "none" : "0 1px 2px rgba(0,0,0,0.06)",
                      }}
                    >
                      {msg.content}
                    </div>
                    <span className="font-manrope text-[11px] text-muted mt-1 px-1">
                      {formatTime(msg.created_at)}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input area */}
      <div
        className="px-4 py-3 bg-white"
        style={{ borderTop: "0.5px solid #E5E5EA" }}
      >
        <form onSubmit={handleSendMessage}>
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-full"
            style={{ background: "#F2F2F7" }}
          >
            <textarea
              placeholder="Message…"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              className="flex-1 bg-transparent border-none outline-none font-manrope text-[15px] text-foreground placeholder:text-muted resize-none py-0.5"
              rows={1}
              disabled={sending}
              style={{ color: "#0D1619" }}
            />
            <button
              type="submit"
              disabled={!messageInput.trim() || sending}
              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors focus:outline-none"
              style={{
                background:
                  messageInput.trim() && !sending ? "#FF751F" : "#D1D5DB",
              }}
            >
              <svg
                width="16"
                height="16"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return showChat && activeChat ? <ChatWindow /> : <ConversationList />;
};

export default MessagesPage;
