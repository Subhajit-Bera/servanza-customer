import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket, addSocketListener, removeSocketListener } from '../services/socketClient';
import { servicesApi } from '../api/client';

export interface ChatMessage {
    id: string;
    bookingId: string;
    senderId: string;
    sender: {
        id: string;
        name: string;
        profileImage?: string;
        role: string;
    };
    content: string;
    type: 'TEXT' | 'IMAGE' | 'SYSTEM';
    isRead: boolean;
    createdAt: string;
}

interface UseChatOptions {
    bookingId: string;
    currentUserId: string;
}

export const useChat = ({ bookingId, currentUserId }: UseChatOptions) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [typingUser, setTypingUser] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Load chat history via REST
    const loadHistory = useCallback(async () => {
        try {
            setLoading(true);
            const response = await servicesApi.getChatMessages(bookingId);
            const data = response.data?.data || response.data;
            setMessages(data?.messages || []);
        } catch (error) {
            console.error('[Chat] Failed to load history:', error);
        } finally {
            setLoading(false);
        }
    }, [bookingId]);

    // Join chat room and set up listeners
    useEffect(() => {
        const socket = getSocket();
        if (!socket?.connected) return;

        // Join the chat room
        socket.emit('chat:join', { bookingId });

        // Load existing messages
        loadHistory();

        // Listen for new messages
        const handleNewMessage = (data: ChatMessage) => {
            if (data.bookingId === bookingId) {
                setMessages((prev) => {
                    // Deduplicate
                    if (prev.some((m) => m.id === data.id)) return prev;
                    return [...prev, data];
                });

                // Auto-read if from other person
                if (data.senderId !== currentUserId) {
                    socket.emit('chat:read', { bookingId });
                }
            }
        };

        // Also handle the notification-style event (when not in chat room)
        const handleNewMessageNotif = (data: any) => {
            if (data.bookingId === bookingId) {
                // The full message will come through chat:message in the room
                // This just increments unread if we're not actively reading
            }
        };

        const handleReadReceipt = (data: any) => {
            if (data.bookingId === bookingId && data.readBy !== currentUserId) {
                // Mark our messages as read
                setMessages((prev) =>
                    prev.map((m) =>
                        m.senderId === currentUserId && !m.isRead
                            ? { ...m, isRead: true }
                            : m
                    )
                );
            }
        };

        const handleTyping = (data: any) => {
            if (data.bookingId === bookingId && data.userId !== currentUserId) {
                setIsTyping(data.isTyping);
                setTypingUser(data.isTyping ? data.userId : null);

                // Auto-clear typing after 3s
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                if (data.isTyping) {
                    typingTimeoutRef.current = setTimeout(() => {
                        setIsTyping(false);
                        setTypingUser(null);
                    }, 3000);
                }
            }
        };

        addSocketListener('chat:message', handleNewMessage);
        addSocketListener('chat:new-message', handleNewMessageNotif);
        addSocketListener('chat:read-receipt', handleReadReceipt);
        addSocketListener('chat:typing', handleTyping);

        return () => {
            socket.emit('chat:leave', { bookingId });
            removeSocketListener('chat:message', handleNewMessage);
            removeSocketListener('chat:new-message', handleNewMessageNotif);
            removeSocketListener('chat:read-receipt', handleReadReceipt);
            removeSocketListener('chat:typing', handleTyping);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, [bookingId, currentUserId, loadHistory]);

    // Send a message
    const sendMessage = useCallback(
        (content: string) => {
            const socket = getSocket();
            if (!socket?.connected || !content.trim()) return;

            socket.emit('chat:send', {
                bookingId,
                content: content.trim(),
                type: 'TEXT',
            });
        },
        [bookingId]
    );

    // Emit typing indicator
    const sendTyping = useCallback(
        (isTyping: boolean) => {
            const socket = getSocket();
            if (!socket?.connected) return;
            socket.emit('chat:typing', { bookingId, isTyping });
        },
        [bookingId]
    );

    // Mark all messages as read
    const markAsRead = useCallback(() => {
        const socket = getSocket();
        if (!socket?.connected) return;
        socket.emit('chat:read', { bookingId });
    }, [bookingId]);

    return {
        messages,
        loading,
        isTyping,
        typingUser,
        unreadCount,
        sendMessage,
        sendTyping,
        markAsRead,
        refresh: loadHistory,
    };
};
