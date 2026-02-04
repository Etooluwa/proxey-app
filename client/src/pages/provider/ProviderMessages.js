import { useState, useEffect, useRef } from 'react';
import { Icons } from '../../components/Icons';
import { useMessages } from '../../contexts/MessageContext';
import { useSession } from '../../auth/authContext';

const ProviderMessages = () => {
    const { session } = useSession();
    const { conversations, messages, currentConversation, setCurrentConversation, loadMessages, sendMessage, markAsRead } = useMessages();
    const [showMobileChat, setShowMobileChat] = useState(false);
    const [messageInput, setMessageInput] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);

    // Initialize current conversation from conversations on first load
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

    // Get the current active chat from conversations
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

    // Format conversation time
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

    // Get unread count for provider
    const getConversationUnreadCount = (conversation) => {
        return conversation.provider_unread_count || 0;
    };

    return (
        <div className="max-w-7xl mx-auto h-[calc(100vh-140px)] min-h-[600px] bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex relative">

            {/* Left Sidebar: Client List */}
            <div className={`w-full md:w-96 border-r border-gray-100 flex-col bg-white absolute inset-0 z-10 md:relative md:flex ${showMobileChat ? 'hidden' : 'flex'}`}>
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Client Messages</h2>
                    <div className="relative">
                        <Icons.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search clients..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300 transition-all"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {conversations.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">
                            <Icons.MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
                            <p className="text-sm">No conversations yet</p>
                            <p className="text-xs mt-2">Messages from clients will appear here</p>
                        </div>
                    ) : (
                        conversations.map((chat) => {
                            const unreadCount = getConversationUnreadCount(chat);
                            return (
                                <div
                                    key={chat.id}
                                    onClick={() => handleChatSelect(chat)}
                                    className={`p-4 flex gap-3 cursor-pointer border-l-4 transition-all hover:bg-gray-50 ${currentConversation === chat.id
                                            ? 'bg-brand-50/50 border-brand-500'
                                            : 'border-transparent'
                                        }`}
                                >
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                                            {(chat.client_name || 'U')[0].toUpperCase()}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex gap-2 w-full">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-bold text-gray-900 truncate block">
                                                    {chat.client_name || 'Unknown Client'}
                                                </h4>
                                                <p className={`text-xs mt-1 block truncate ${unreadCount > 0 ? 'font-bold text-gray-800' : 'text-gray-600'}`}>
                                                    {chat.last_message || 'No messages yet'}
                                                </p>
                                            </div>
                                            <div className="flex-shrink-0 flex flex-col items-end gap-1">
                                                <span className="text-xs text-gray-400 whitespace-nowrap">
                                                    {formatConversationTime(chat.last_message_at)}
                                                </span>
                                                {unreadCount > 0 && (
                                                    <div className="w-5 h-5 bg-brand-500 rounded-full text-[10px] text-white font-bold flex items-center justify-center">
                                                        {unreadCount}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Right Side: Chat Window */}
            {activeChat && (
            <div className={`flex-1 flex-col bg-gray-50/30 w-full md:w-auto absolute inset-0 z-20 md:relative md:flex ${showMobileChat ? 'flex' : 'hidden'}`}>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-100 bg-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        {/* Mobile Back Button */}
                        <button
                            onClick={() => setShowMobileChat(false)}
                            className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full"
                        >
                            <Icons.ArrowLeft size={20} />
                        </button>

                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                            {(activeChat.client_name || 'U')[0].toUpperCase()}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">{activeChat.client_name || 'Unknown Client'}</h3>
                            <span className="text-xs text-gray-500">Client</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-brand-50 text-brand-600 text-xs font-bold rounded-lg hover:bg-brand-100 transition-colors hidden md:block">
                            Create Offer
                        </button>
                        <button className="p-2 text-brand-600 bg-brand-50 rounded-full md:hidden">
                            <Icons.Tag size={20} />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                            <Icons.Menu size={20} />
                        </button>
                    </div>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
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
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] md:max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                                            <div className={`px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${isMe
                                                    ? 'bg-brand-500 text-white rounded-tr-sm'
                                                    : 'bg-white border border-gray-100 text-gray-700 rounded-tl-sm'
                                                }`}>
                                                {msg.content}
                                                {msg.image_url && (
                                                    <img src={msg.image_url} alt="Shared" className="mt-2 rounded-lg max-w-full" />
                                                )}
                                            </div>
                                            <span className="text-[10px] text-gray-400 mt-1 px-1">
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
                        <div className="flex items-end gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-200 focus-within:ring-2 focus-within:ring-brand-100 focus-within:border-brand-300 transition-all">
                            <button type="button" className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-200 transition-colors">
                                <Icons.Paperclip size={20} />
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
                                className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 resize-none py-2 max-h-32"
                                rows={1}
                                disabled={sending}
                            />
                            <button
                                type="submit"
                                disabled={!messageInput.trim() || sending}
                                className="p-2 bg-brand-500 text-white rounded-xl shadow-md hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {sending ? (
                                    <Icons.Loader size={20} className="animate-spin" />
                                ) : (
                                    <Icons.ChevronRight size={20} />
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            )}

        </div>
    );
};

export default ProviderMessages;
