import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from '../auth/authContext';
import { supabase } from '../utils/supabase';
import { uploadMessageImage } from '../utils/messageImageUpload';

const MessageContext = createContext();

export const useMessages = () => useContext(MessageContext);

export const MessageProvider = ({ children }) => {
    const { session, profile } = useSession();
    const userId = session?.user?.id;
    const userRole = session?.user?.role;

    const [conversations, setConversations] = useState([]);
    const [currentConversation, setCurrentConversation] = useState(null);
    const [messages, setMessages] = useState({});

    // Load conversations from Supabase
    const loadConversations = useCallback(async () => {
        if (!userId || !userRole || !supabase) {
            setConversations([]);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('conversations')
                .select('*')
                .or(`client_id.eq.${userId},provider_id.eq.${userId}`)
                .order('last_message_at', { ascending: false });

            if (error) throw error;

            setConversations(data || []);
        } catch (error) {
            console.error('[messages] Failed to load conversations:', error);
            setConversations([]);
        }
    }, [userId, userRole]);

    // Load messages for a specific conversation
    const loadMessages = useCallback(async (conversationId) => {
        if (!conversationId || !supabase) {
            return;
        }

        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            setMessages(prev => ({
                ...prev,
                [conversationId]: data || []
            }));
        } catch (error) {
            console.error('[messages] Failed to load messages:', error);
        }
    }, []);

    // Subscribe to real-time updates
    useEffect(() => {
        if (!userId || !supabase) return;

        // Subscribe to new conversations
        const conversationChannel = supabase
            .channel('conversations-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'conversations',
                    filter: `client_id=eq.${userId},provider_id=eq.${userId}`
                },
                () => {
                    loadConversations();
                }
            )
            .subscribe();

        // Subscribe to new messages in current conversation
        let messageChannel;
        if (currentConversation) {
            messageChannel = supabase
                .channel(`messages-${currentConversation}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'messages',
                        filter: `conversation_id=eq.${currentConversation}`
                    },
                    (payload) => {
                        setMessages(prev => ({
                            ...prev,
                            [currentConversation]: [
                                ...(prev[currentConversation] || []),
                                payload.new
                            ]
                        }));
                        loadConversations(); // Refresh to update unread counts
                    }
                )
                .subscribe();
        }

        return () => {
            conversationChannel.unsubscribe();
            if (messageChannel) messageChannel.unsubscribe();
        };
    }, [userId, currentConversation, loadConversations]);

    // Load conversations on mount
    useEffect(() => {
        loadConversations();
    }, [loadConversations]);

    // Create or get existing conversation
    const getOrCreateConversation = async (otherUserId, otherUserRole) => {
        if (!userId || !userRole || !supabase) {
            throw new Error('User not authenticated');
        }

        const isClient = userRole === 'client';
        const clientId = isClient ? userId : otherUserId;
        const providerId = isClient ? otherUserId : userId;

        try {
            // Check if conversation exists
            const { data: existing } = await supabase
                .from('conversations')
                .select('*')
                .eq('client_id', clientId)
                .eq('provider_id', providerId)
                .single();

            if (existing) {
                return existing;
            }

            // Create new conversation
            const { data: newConv, error: createError } = await supabase
                .from('conversations')
                .insert({
                    client_id: clientId,
                    provider_id: providerId,
                    client_name: isClient ? profile?.name : null,
                    provider_name: isClient ? null : profile?.name
                })
                .select()
                .single();

            if (createError) throw createError;

            loadConversations();
            return newConv;
        } catch (error) {
            console.error('[messages] Failed to create conversation:', error);
            throw error;
        }
    };

    // Send a message
    const sendMessage = async ({ conversationId, content, imageFile }) => {
        if (!userId || !userRole || !supabase) {
            throw new Error('User not authenticated');
        }

        if (!content && !imageFile) {
            throw new Error('Message must have content or image');
        }

        try {
            let imageUrl = null;

            // Upload image if provided
            if (imageFile) {
                imageUrl = await uploadMessageImage(imageFile, userId);
            }

            // Insert message
            const { data, error } = await supabase
                .from('messages')
                .insert({
                    conversation_id: conversationId,
                    sender_id: userId,
                    sender_role: userRole,
                    content,
                    image_url: imageUrl,
                    read_by_client: userRole === 'client',
                    read_by_provider: userRole === 'provider'
                })
                .select()
                .single();

            if (error) throw error;

            return data;
        } catch (error) {
            console.error('[messages] Failed to send message:', error);
            throw error;
        }
    };

    // Mark messages as read
    const markAsRead = async (conversationId) => {
        if (!userId || !userRole || !supabase) return;

        try {
            await supabase.rpc('mark_messages_as_read', {
                p_conversation_id: conversationId,
                p_user_role: userRole
            });

            loadConversations(); // Refresh to update unread counts
        } catch (error) {
            console.error('[messages] Failed to mark as read:', error);
        }
    };

    // Get unread count
    const getUnreadCount = () => {
        if (userRole === 'client') {
            return conversations.reduce((total, c) => total + (c.client_unread_count || 0), 0);
        } else if (userRole === 'provider') {
            return conversations.reduce((total, c) => total + (c.provider_unread_count || 0), 0);
        }
        return 0;
    };

    const value = {
        conversations,
        currentConversation,
        setCurrentConversation,
        messages: messages[currentConversation] || [],
        loadMessages,
        getOrCreateConversation,
        sendMessage,
        markAsRead,
        getUnreadCount,
        refresh: loadConversations
    };

    return (
        <MessageContext.Provider value={value}>
            {children}
        </MessageContext.Provider>
    );
};
