# Messaging System Setup Instructions

## Overview

Your app now has a complete messaging system with:
- ✅ Text messages
- ✅ Image sharing (via Supabase Storage)
- ✅ 6-month retention policy
- ✅ Real-time updates
- ✅ Read receipts
- ✅ Conversation threads between clients and providers

## Step 1: Run Database Migrations

Go to your Supabase Dashboard → SQL Editor and run these migrations in order:

### Migration 1: Create Tables

Copy and paste from: `supabase/migrations/20250105000000_create_messaging_tables.sql`

This creates:
- `conversations` table - stores conversation metadata
- `messages` table - stores individual messages
- Indexes for performance
- Triggers for auto-updating timestamps and unread counts
- RPC function `mark_messages_as_read()`
- 6-month auto-delete policy

### Migration 2: Create Storage Bucket

Copy and paste from: `supabase/migrations/20250105000001_create_message_images_bucket.sql`

This creates:
- `message-images` storage bucket
- RLS policies for secure image access
- 5MB file size limit

## Step 2: Enable Realtime (Optional but Recommended)

1. Go to Supabase Dashboard → Database → Replication
2. Enable replication for these tables:
   - `conversations`
   - `messages`

This enables instant message delivery without page refresh.

## Step 3: How It Works

### For Providers and Clients

The messaging UI pages already exist at:
- `/provider/messages` - Provider messages page
- `/client/messages` - Client messages page

### Starting a Conversation

Use the `getOrCreateConversation` function:

```javascript
import { useMessages } from '../contexts/MessageContext';

function ContactProviderButton({ providerId }) {
    const { getOrCreateConversation, setCurrentConversation } = useMessages();

    const handleContact = async () => {
        const conversation = await getOrCreateConversation(providerId, 'provider');
        setCurrentConversation(conversation.id);
        // Navigate to messages page
        navigate('/client/messages');
    };

    return <button onClick={handleContact}>Contact Provider</button>;
}
```

### Sending Messages

```javascript
import { useMessages } from '../contexts/MessageContext';

function MessageInput({ conversationId }) {
    const { sendMessage } = useMessages();
    const [content, setContent] = useState('');
    const [imageFile, setImageFile] = useState(null);

    const handleSend = async () => {
        await sendMessage({
            conversationId,
            content,
            imageFile // Optional - will be uploaded to Supabase Storage
        });
        setContent('');
        setImageFile(null);
    };
}
```

### Receiving Messages (Real-time)

Messages automatically appear in real-time when:
1. You're viewing a conversation
2. Someone sends you a message

The `MessageProvider` handles all subscriptions automatically.

## Storage Usage Estimates

### Free Tier (500MB database, 1GB storage)

**100 active users:**
- Text messages (50/month × 6 months): ~15 MB
- Message images (5/month × 6 months): ~900 MB in Storage
- Total Database: ~15 MB
- Total Storage: ~900 MB
- ✅ Stays within free tier

**400 active users:**
- Text messages: ~60 MB
- Message images: ~3.6 GB in Storage
- ⚠️ Exceeds free storage tier (need Pro plan at $25/month)

### Optimization Tips

1. **Reduce retention to 3 months** if needed
2. **Limit images per conversation** (e.g., max 10 images)
3. **Compress images** before upload (resize to 1200px max width)
4. **Use image CDN** like Cloudinary for high-volume apps

## Maintenance

### Manually Delete Expired Messages

Run this in Supabase SQL Editor periodically:

```sql
SELECT public.delete_expired_messages();
```

You can set up a cron job in Supabase to run this automatically:

```sql
-- Run daily at 2 AM
SELECT cron.schedule(
    'delete-expired-messages',
    '0 2 * * *',
    $$SELECT public.delete_expired_messages()$$
);
```

## API Reference

### MessageContext Methods

```javascript
const {
    // State
    conversations,           // Array of conversation objects
    currentConversation,     // Currently selected conversation ID
    messages,               // Array of messages for current conversation

    // Methods
    setCurrentConversation,  // Set active conversation
    loadMessages,           // Load messages for a conversation
    getOrCreateConversation, // Create or get conversation
    sendMessage,            // Send a text/image message
    markAsRead,             // Mark conversation as read
    getUnreadCount,         // Get total unread count
    refresh                 // Refresh conversations list
} = useMessages();
```

### Conversation Object

```javascript
{
    id: "uuid",
    client_id: "uuid",
    client_name: "John Doe",
    provider_id: "uuid",
    provider_name: "Jane Smith",
    last_message: "Hello!",
    last_message_at: "2025-01-05T10:30:00Z",
    client_unread_count: 2,
    provider_unread_count: 0,
    created_at: "2025-01-05T10:00:00Z",
    updated_at: "2025-01-05T10:30:00Z"
}
```

### Message Object

```javascript
{
    id: "uuid",
    conversation_id: "uuid",
    sender_id: "uuid",
    sender_role: "client" | "provider",
    content: "Hello!",
    image_url: "https://...", // null if no image
    read_by_client: true,
    read_by_provider: false,
    created_at: "2025-01-05T10:30:00Z",
    expires_at: "2025-07-05T10:30:00Z" // 6 months later
}
```

## Security

### Row Level Security (RLS)

All tables have RLS enabled:
- Users can only see their own conversations
- Users can only see messages in their conversations
- Users can only send messages in their conversations

### Storage Security

Images are stored in folders by user ID:
- `message-images/{user_id}/{timestamp}-{random}.jpg`
- Users can only upload to their own folder
- Anyone can view images (public bucket)

## Next Steps

The messaging backend is ready! To complete the integration:

1. **Update ProviderMessages UI** - Wire up the existing UI to use the new MessageContext
2. **Update ClientMessages UI** - Same for client side
3. **Add "Contact Provider" button** - On provider public profiles
4. **Test the flow** - Send messages between test accounts

Let me know when you're ready and I can update the UI components!
