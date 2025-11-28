import React, { useState, useEffect } from 'react';
import { Icons } from '../../components/Icons';
import { useMessages } from '../../contexts/MessageContext';


const MOCK_CHAT_HISTORY = [
    { id: 1, sender: 'them', text: 'Hi there! I am interested in your deep cleaning service.', time: '10:00 AM' },
    { id: 2, sender: 'me', text: 'Hello Alice! I would be happy to help. What is the square footage of your home?', time: '10:05 AM' },
    { id: 3, sender: 'them', text: 'It is about 1200 sq ft. 2 bedrooms, 2 baths.', time: '10:08 AM' },
    { id: 4, sender: 'me', text: 'Great. My rate for that size is usually around $150. Does that work for you?', time: '10:10 AM' },
    { id: 5, sender: 'them', text: 'Yes, the code is #1234.', time: '10:12 AM' },
];

const ProviderMessages = () => {
    const { conversations, markAsRead } = useMessages();
    const [activeChatId, setActiveChatId] = useState(null);
    const [showMobileChat, setShowMobileChat] = useState(false);

    // Initialize activeChatId from conversations on first load
    useEffect(() => {
        if (conversations.length > 0 && !activeChatId) {
            setActiveChatId(conversations[0].id);
        }
    }, [conversations, activeChatId]);

    // Get the current active chat from conversations to always have fresh data
    const activeChat = conversations.find(c => c.id === activeChatId) || conversations[0];

    const handleChatSelect = (chat) => {
        markAsRead(chat.id);
        setActiveChatId(chat.id);
        setShowMobileChat(true);
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
                    {conversations.map((chat) => (
                        <div
                            key={chat.id}
                            onClick={() => handleChatSelect(chat)}
                            className={`p-4 flex gap-3 cursor-pointer border-l-4 transition-all hover:bg-gray-50 ${activeChatId === chat.id
                                    ? 'bg-brand-50/50 border-brand-500'
                                    : 'border-transparent'
                                }`}
                        >
                            <div className="relative">
                                <img src={chat.avatar} alt={chat.clientName} className="w-12 h-12 rounded-full object-cover" />
                                {chat.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className={`text-sm font-bold truncate ${activeChatId === chat.id ? 'text-brand-900' : 'text-gray-900'}`}>
                                        {chat.clientName}
                                    </h4>
                                    <span className="text-xs text-gray-400 whitespace-nowrap">{chat.time}</span>
                                </div>
                                <p className={`text-xs text-brand-600 font-medium mb-1 truncate`}>
                                    Re: {chat.serviceInterest}
                                </p>
                                <p className={`text-sm truncate ${chat.unread > 0 ? 'font-bold text-gray-800' : 'text-gray-500'}`}>
                                    {chat.lastMessage}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Side: Chat Window */}
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

                        <img src={activeChat?.avatar} alt={activeChat?.clientName} className="w-10 h-10 rounded-full object-cover" />
                        <div>
                            <h3 className="font-bold text-gray-900">{activeChat?.clientName}</h3>
                            <div className="flex items-center gap-2">
                                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-md text-gray-600 font-medium">{activeChat?.serviceInterest}</span>
                                {activeChat?.online && <span className="text-xs text-green-600 font-bold">• Online</span>}
                            </div>
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
                    {MOCK_CHAT_HISTORY.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] md:max-w-[70%] ${msg.sender === 'me' ? 'items-end' : 'items-start'} flex flex-col`}>
                                <div className={`px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.sender === 'me'
                                        ? 'bg-brand-500 text-white rounded-tr-sm'
                                        : 'bg-white border border-gray-100 text-gray-700 rounded-tl-sm'
                                    }`}>
                                    {msg.text}
                                </div>
                                <span className="text-[10px] text-gray-400 mt-1 px-1">
                                    {msg.time}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-gray-100">
                    <div className="flex items-end gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-200 focus-within:ring-2 focus-within:ring-brand-100 focus-within:border-brand-300 transition-all">
                        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-200 transition-colors">
                            <Icons.Wrench size={20} />
                        </button>
                        <textarea
                            placeholder="Type a message..."
                            className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 resize-none py-2 max-h-32"
                            rows={1}
                        />
                        <button className="p-2 bg-brand-500 text-white rounded-xl shadow-md hover:bg-brand-600 transition-colors">
                            <Icons.ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default ProviderMessages;
