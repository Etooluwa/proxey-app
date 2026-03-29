import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from '../auth/authContext';
import { supabase } from '../utils/supabase';
import { uploadMessageImage } from '../utils/messageImageUpload';
import { request } from '../data/apiClient';

const MessageContext = createContext();

export const useMessages = () => useContext(MessageContext);

async function enrichConversations(conversations = []) {
    if (!supabase || !Array.isArray(conversations) || conversations.length === 0) {
        return conversations;
    }

    const providerIds = Array.from(new Set(conversations.map((c) => c.provider_id).filter(Boolean)));
    const clientIds = Array.from(new Set(conversations.map((c) => c.client_id).filter(Boolean)));

    const [providersRes, clientsRes] = await Promise.all([
        providerIds.length > 0
            ? supabase
                .from('providers')
                .select('user_id, name, business_name, avatar, photo')
                .in('user_id', providerIds)
            : Promise.resolve({ data: [], error: null }),
        clientIds.length > 0
            ? supabase
                .from('client_profiles')
                .select('user_id, name, avatar')
                .in('user_id', clientIds)
            : Promise.resolve({ data: [], error: null }),
    ]);

    if (providersRes.error) throw providersRes.error;
    if (clientsRes.error) throw clientsRes.error;

    const providerMap = Object.fromEntries(
        (providersRes.data || []).map((provider) => [
            provider.user_id,
            {
                name: provider.business_name || provider.name || 'Provider',
                avatar: provider.avatar || provider.photo || null,
            },
        ])
    );

    const clientMap = Object.fromEntries(
        (clientsRes.data || []).map((client) => [
            client.user_id,
            {
                name: client.name || 'Client',
                avatar: client.avatar || null,
            },
        ])
    );

    return conversations.map((conversation) => ({
        ...conversation,
        provider_name: providerMap[conversation.provider_id]?.name || conversation.provider_name || 'Provider',
        provider_avatar: providerMap[conversation.provider_id]?.avatar || conversation.provider_avatar || null,
        client_name: clientMap[conversation.client_id]?.name || conversation.client_name || 'Client',
        client_avatar: clientMap[conversation.client_id]?.avatar || conversation.client_avatar || null,
    }));
}

export const MessageProvider = ({ children }) => {
    const { session, profile } = useSession();
    const userId = session?.user?.id;
    const userRole = session?.user?.role;

    const [conversations, setConversations] = useState([]);
    const [currentConversation, setCurrentConversation] = useState(null);
    const [messages, setMessages] = useState({});

    const updateConversationLocally = useCallback((conversationId, updater) => {
        setConversations((prev) =>
            prev.map((conversation) =>
                conversation.id === conversationId
                    ? { ...conversation, ...updater(conversation) }
                    : conversation
            )
        );
    }, []);

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

            const enriched = await enrichConversations(data || []);
            setConversations(enriched);
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
                    filter: `client_id=eq.${userId}`
                },
                () => {
                    loadConversations();
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'conversations',
                    filter: `provider_id=eq.${userId}`
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
                                ...(prev[currentConversation] || []).filter((msg) => msg.id !== payload.new.id),
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
            const { data: existing, error: existingError } = await supabase
                .from('conversations')
                .select('*')
                .eq('client_id', clientId)
                .eq('provider_id', providerId)
                .maybeSingle();

            if (existingError) throw existingError;

            if (existing) {
                const [enriched] = await enrichConversations([existing]);
                return enriched;
            }

            const [{ data: providerProfile }, { data: clientProfile }] = await Promise.all([
                supabase
                    .from('providers')
                    .select('name, business_name')
                    .eq('user_id', providerId)
                    .maybeSingle(),
                supabase
                    .from('client_profiles')
                    .select('name')
                    .eq('user_id', clientId)
                    .maybeSingle(),
            ]);

            // Create new conversation
            const { data: newConv, error: createError } = await supabase
                .from('conversations')
                .insert({
                    client_id: clientId,
                    provider_id: providerId,
                    client_name: clientProfile?.name || (isClient ? profile?.name : null),
                    provider_name: providerProfile?.business_name || providerProfile?.name || (!isClient ? profile?.name : null),
                })
                .select()
                .single();

            if (createError) throw createError;

            loadConversations();
            const [enriched] = await enrichConversations([newConv]);
            return enriched;
        } catch (error) {
            if (userRole === 'provider' && otherUserRole === 'client') {
                try {
                    const response = await request(`/provider/clients/${otherUserId}/conversation`, {
                        method: 'POST',
                    });
                    const conversation = response?.conversation;
                    if (!conversation) throw new Error('Conversation was not returned.');
                    const [enriched] = await enrichConversations([conversation]);
                    loadConversations();
                    return enriched;
                } catch (fallbackError) {
                    console.error('[messages] Provider fallback conversation create failed:', fallbackError);
                }
            }
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

            const conversation = conversations.find((item) => item.id === conversationId);
            const unreadField = userRole === 'client' ? 'provider_unread_count' : 'client_unread_count';
            const nextUnreadCount = (conversation?.[unreadField] || 0) + 1;

            const { error: conversationError } = await supabase
                .from('conversations')
                .update({
                    last_message: content || '[Image]',
                    last_message_at: data.created_at,
                    [unreadField]: nextUnreadCount,
                })
                .eq('id', conversationId);

            if (conversationError) throw conversationError;

            setMessages((prev) => ({
                ...prev,
                [conversationId]: [...(prev[conversationId] || []), data],
            }));

            updateConversationLocally(conversationId, (current) => ({
                last_message: content || '[Image]',
                last_message_at: data.created_at,
                [unreadField]: nextUnreadCount,
            }));

            request(`/conversations/${conversationId}/message-notification`, {
                method: 'POST',
                body: JSON.stringify({
                    messageId: data.id,
                    content: content || '',
                    imageUrl,
                }),
            }).catch((notifyError) => {
                console.error('[messages] Failed to create notification:', notifyError);
            });

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
            if (userRole === 'client') {
                const [{ error: messageError }, { error: conversationError }] = await Promise.all([
                    supabase
                        .from('messages')
                        .update({ read_by_client: true })
                        .eq('conversation_id', conversationId)
                        .eq('read_by_client', false),
                    supabase
                        .from('conversations')
                        .update({ client_unread_count: 0 })
                        .eq('id', conversationId),
                ]);

                if (messageError) throw messageError;
                if (conversationError) throw conversationError;
            } else {
                const [{ error: messageError }, { error: conversationError }] = await Promise.all([
                    supabase
                        .from('messages')
                        .update({ read_by_provider: true })
                        .eq('conversation_id', conversationId)
                        .eq('read_by_provider', false),
                    supabase
                        .from('conversations')
                        .update({ provider_unread_count: 0 })
                        .eq('id', conversationId),
                ]);

                if (messageError) throw messageError;
                if (conversationError) throw conversationError;
            }

            updateConversationLocally(conversationId, () => (
                userRole === 'client'
                    ? { client_unread_count: 0 }
                    : { provider_unread_count: 0 }
            ));
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
        messages,
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
