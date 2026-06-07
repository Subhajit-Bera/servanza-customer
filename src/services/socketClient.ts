import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import { CONFIG } from '../config/constants';

// Socket instance
// Events that are statically bound in connectSocket
const PREDEFINED_EVENTS = [
    'connect', 'disconnect', 'connect_error', 'error', 
    'buddy:location:live', 'buddy:location:update', 
    'booking:updated', 'booking:status:changed',
    'chat:message', 'chat:new-message', 'chat:read-receipt', 'chat:typing', 'chat:joined',
    'call:incoming', 'call:initiated', 'call:answered', 'call:ice-candidate', 'call:rejected', 'call:ended', 'call:missed'
];

let socket: Socket | null = null;

// Event listeners map
type EventCallback = (...args: any[]) => void;
const eventListeners: Map<string, Set<EventCallback>> = new Map();

// Connection state
let isConnecting = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY_BASE = 1000; // 1 second base delay

/**
 * Get the socket instance
 */
export const getSocket = (): Socket | null => socket;

/**
 * Connect to the socket server
 */
export const connectSocket = async (): Promise<Socket | null> => {
    if (socket?.connected) {
        console.log('[Socket] Already connected');
        return socket;
    }

    if (isConnecting) {
        console.log('[Socket] Connection in progress...');
        return null;
    }

    isConnecting = true;

    try {
        const token = await SecureStore.getItemAsync('auth_token');

        if (!token) {
            console.log('[Socket] No auth token, cannot connect');
            isConnecting = false;
            return null;
        }

        // Extract base URL (remove /api/v1 if present)
        const baseUrl = CONFIG.API_BASE_URL.replace('/api/v1', '').replace('/api', '');

        console.log('[Socket] Connecting to:', baseUrl);

        socket = io(baseUrl, {
            transports: ['websocket', 'polling'],
            auth: {
                token,
            },
            query: {
                supportsAck: 'true'
            },
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
            reconnectionDelay: RECONNECT_DELAY_BASE,
            reconnectionDelayMax: 10000,
            timeout: 20000,
        });

        // Setup connection event handlers
        socket.on('connect', () => {
            console.log('[Socket] Connected:', socket?.id);
            reconnectAttempts = 0;
            isConnecting = false;
            notifyListeners('connect', { socketId: socket?.id });
        });

        socket.on('disconnect', (reason) => {
            console.log('[Socket] Disconnected:', reason);
            notifyListeners('disconnect', { reason });
        });

        socket.on('connect_error', (error) => {
            console.error('[Socket] Connection error:', error.message);
            isConnecting = false;
            reconnectAttempts++;
            notifyListeners('connect_error', { error: error.message });
        });

        socket.on('error', (error) => {
            console.error('[Socket] Error:', error);
            notifyListeners('error', error);
        });

        // Listen for buddy location updates
        socket.on('buddy:location:live', (data) => {
            console.log('[Socket] Buddy location update:', data);
            notifyListeners('buddy:location:live', data);
        });

        socket.on('buddy:location:update', (data) => {
            console.log('[Socket] Buddy location broadcast:', data);
            notifyListeners('buddy:location:update', data);
        });

        const processedEvents = new Set<string>();
        const dedupeAndAck = (data: any, ack?: any) => {
            if (typeof ack === 'function') {
                ack({ success: true, timestamp: Date.now() });
            }
            if (data?.eventId) {
                if (processedEvents.has(data.eventId)) return false;
                processedEvents.add(data.eventId);
                if (processedEvents.size > 100) {
                    processedEvents.delete(Array.from(processedEvents)[0]);
                }
            }
            return true;
        };

        // Listen for booking status updates
        socket.on('booking:updated', (data, ack) => {
            if (!dedupeAndAck(data, ack)) return;
            console.log('[Socket] Booking updated:', data);
            notifyListeners('booking:updated', data);
        });

        socket.on('booking:status:changed', (data, ack) => {
            if (!dedupeAndAck(data, ack)) return;
            console.log('[Socket] Booking status changed:', data);
            notifyListeners('booking:status:changed', data);
        });

        // Listen for chat events
        ['chat:message', 'chat:new-message', 'chat:read-receipt', 'chat:typing', 'chat:joined'].forEach((event) => {
            socket!.on(event, (data) => {
                console.log(`[Socket] ${event}:`, data);
                notifyListeners(event, data);
            });
        });

        // Listen for call events
        ['call:incoming', 'call:initiated', 'call:answered', 'call:ice-candidate', 'call:rejected', 'call:ended', 'call:missed'].forEach((event) => {
            socket!.on(event, (data) => {
                console.log(`[Socket] ${event}:`, data);
                notifyListeners(event, data);
            });
        });

        // Re-bind any dynamically added listeners
        eventListeners.forEach((_, event) => {
            // Avoid re-binding the hardcoded ones above
            if (!PREDEFINED_EVENTS.includes(event)) {
                socket!.on(event, (data) => notifyListeners(event, data));
            }
        });

        return socket;
    } catch (error) {
        console.error('[Socket] Failed to connect:', error);
        isConnecting = false;
        return null;
    }
};

/**
 * Disconnect from the socket server
 */
export const disconnectSocket = (): void => {
    if (socket) {
        socket.disconnect();
        socket = null;
        console.log('[Socket] Disconnected manually');
    }
};

/**
 * Subscribe to buddy location updates for a specific booking
 */
export const subscribeToBookingLocation = (bookingId: string): void => {
    if (!socket?.connected) {
        console.warn('[Socket] Not connected, cannot subscribe to location');
        return;
    }

    socket.emit('location:subscribe', { bookingId });
    console.log('[Socket] Subscribed to location for booking:', bookingId);
};

/**
 * Unsubscribe from buddy location updates
 */
export const unsubscribeFromBookingLocation = (bookingId: string): void => {
    if (!socket?.connected) {
        return;
    }

    socket.emit('location:unsubscribe', { bookingId });
    console.log('[Socket] Unsubscribed from location for booking:', bookingId);
};

/**
 * Add event listener
 */
export const addSocketListener = (event: string, callback: EventCallback): void => {
    if (!eventListeners.has(event)) {
        eventListeners.set(event, new Set());
        // Dynamically bind to socket if already connected and not predefined
        if (socket?.connected && !PREDEFINED_EVENTS.includes(event)) {
            socket.on(event, (data) => notifyListeners(event, data));
        }
    }
    eventListeners.get(event)!.add(callback);
};

/**
 * Remove event listener
 */
export const removeSocketListener = (event: string, callback: EventCallback): void => {
    const listeners = eventListeners.get(event);
    if (listeners) {
        listeners.delete(callback);
    }
};

/**
 * Notify all listeners of an event
 */
const notifyListeners = (event: string, data: any): void => {
    const listeners = eventListeners.get(event);
    if (listeners) {
        listeners.forEach((callback) => {
            try {
                callback(data);
            } catch (error) {
                console.error(`[Socket] Error in listener for ${event}:`, error);
            }
        });
    }
};

/**
 * Check if socket is connected
 */
export const isSocketConnected = (): boolean => {
    return socket?.connected ?? false;
};
