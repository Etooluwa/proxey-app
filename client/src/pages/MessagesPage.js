import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../components/Icons';
import { useMessages } from '../contexts/MessageContext';
import { useSession } from '../auth/authContext';

const MessagesPage = () => {
    const navigate = useNavigate();
    const { session } = useSession();
    const { conversations, messages, currentConversation, setCurrentConversation, loadMessages, sendMessage, markAsRead } = useMessages();
    const [showMobileChat, setShowMobileChat] = useState(false);
    const [messageInput, setMessageInput] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);

    // Set initial active chat when conversations load
    useEffect(() => {
        if (conversations.length > 0 && !currentConversation) {
            setCurrentConversation(conversations[0].id);
            loadMessages(conversations[0].id);
        }
    }, [conversations, currentConversation, setCurrentConversation, loadMessages]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Get the active chat from conversations
    const activeChat = conversations.find(c => c.id === currentConversation);

    const handleChatSelect = (chat) => {
        markAsRead(chat.id);
        setCurrentConversation(chat.id);
        loadMessages(chat.id);
        setShowMobileChat(true);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!messageInput.trim() || !currentConversation) return;

        setSending(true);
        try {
            await sendMessage({
                conversationId: currentConversation,
                content: messageInput
            });
            setMessageInput('');
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setSending(false);
        }
    };

    // Get unread count for client
    const getConversationUnreadCount = (conversation) => {
        return conversation.client_unread_count || 0;
    };

    // Format message time
    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    // Format conversation time (relative)
    const formatConversationTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="h-full flex bg-white">
            {/* Left Sidebar: Conversation List */}
            <div className={`w-full md:w-80 lg:w-96 border-r border-gray-100 flex flex-col bg-white ${showMobileChat ? 'hidden md:flex' : 'flex'}`}>
                {/* Header */}
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Messages</h2>
                    <div className="relative">
                        <Icons.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search messages..."
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-300 transition-all"
                        />
                    </div>
                </div>

                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto">
                    {conversations.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">
                            <Icons.MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
                            <p className="text-sm">No conversations yet</p>
                            <p className="text-xs mt-2">Messages will appear here</p>
                        </div>
                    ) : (
                        conversations.map((chat) => {
                            const unreadCount = getConversationUnreadCount(chat);
                            return (
                                <button
                                    key={chat.id}
                                    onClick={() => handleChatSelect(chat)}
                                    className={`w-full p-4 flex gap-3 border-l-4 transition-all hover:bg-gray-50 ${
                                        activeChat?.id === chat.id
                                            ? 'bg-orange-50 border-orange-500'
                                            : 'border-transparent'
                                    }`}
                                >
                                    <div className="relative flex-shrink-0">
                                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                                            {(chat.provider_name || 'P')[0].toUpperCase()}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0 text-left">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="text-sm font-bold truncate text-gray-900">
                                                {chat.provider_name || 'Provider'}
                                            </h4>
                                            <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                                {formatConversationTime(chat.last_message_at)}
                                            </span>
                                        </div>
                                        <p className={`text-sm truncate ${
                                            unreadCount > 0 ? 'font-semibold text-gray-900' : 'text-gray-500'
                                        }`}>
                                            {chat.last_message || 'No messages yet'}
                                        </p>
                                    </div>
                                    {unreadCount > 0 && (
                                        <div className="flex items-center">
                                            <div className="w-6 h-6 bg-orange-500 rounded-full text-[11px] text-white font-bold flex items-center justify-center">
                                                {unreadCount}
                                            </div>
                                        </div>
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Right Side: Chat Window */}
            <div className={`flex-1 flex flex-col bg-gray-50 ${showMobileChat ? 'flex' : 'hidden md:flex'}`}>
                {activeChat ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 md:p-5 border-b border-gray-100 bg-white flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                {/* Mobile Back Button */}
                                <button
                                    onClick={() => setShowMobileChat(false)}
                                    className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full"
                                >
                                    <Icons.ArrowLeft size={20} />
                                </button>

                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                                    {(activeChat.provider_name || 'P')[0].toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-base">
                                        {activeChat.provider_name || 'Provider'}
                                    </h3>
                                    <p className="text-xs text-gray-500">Provider</p>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <button className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                                    <Icons.Wrench size={20} />
                                </button>
                                <button className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                                    <Icons.MoreVertical size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Chat Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {messages.length === 0 ? (
                                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                                    <div className="text-center">
                                        <Icons.MessageSquare size={48} className="mx-auto mb-3 text-gray-300" />
                                        <p>No messages yet</p>
                                        <p className="text-xs mt-1">Start the conversation!</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {messages.map((msg) => {
                                        const isMe = msg.sender_id === session?.user?.id;
                                        return (
                                            <div
                                                key={msg.id}
                                                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div className={`max-w-[75%] md:max-w-[65%] flex flex-col ${
                                                    isMe ? 'items-end' : 'items-start'
                                                }`}>
                                                    <div className={`px-4 py-2.5 rounded-2xl text-[15px] leading-relaxed ${
                                                        isMe
                                                            ? 'bg-orange-500 text-white rounded-tr-md'
                                                            : 'bg-white text-gray-800 rounded-tl-md shadow-sm'
                                                    }`}>
                                                        {msg.content}
                                                        {msg.image_url && (
                                                            <img src={msg.image_url} alt="Shared" className="mt-2 rounded-lg max-w-full" />
                                                        )}
                                                    </div>
                                                    <span className="text-[11px] text-gray-400 mt-1 px-1 uppercase">
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

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-gray-100">
                            <form onSubmit={handleSendMessage}>
                                <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-2xl border border-gray-200 focus-within:ring-2 focus-within:ring-orange-100 focus-within:border-orange-300 transition-all">
                                    <button
                                        type="button"
                                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <Icons.Menu size={20} />
                                    </button>
                                    <textarea
                                        placeholder="Type a message..."
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage(e);
                                            }
                                        }}
                                        className="flex-1 bg-transparent border-none outline-none text-[15px] text-gray-700 placeholder-gray-400 resize-none py-1.5 max-h-32"
                                        rows={1}
                                        disabled={sending}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!messageInput.trim() || sending}
                                        className="p-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {sending ? (
                                            <Icons.Loader size={18} className="animate-spin" />
                                        ) : (
                                            <Icons.ChevronRight size={18} />
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 bg-white">
                        <div className="text-center">
                            <Icons.MessageSquare size={64} className="mx-auto mb-4 text-gray-200" />
                            <p className="text-lg font-semibold text-gray-600 mb-2">Select a conversation</p>
                            <p className="text-sm text-gray-500">Choose a conversation from the list to start messaging</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessagesPage;
