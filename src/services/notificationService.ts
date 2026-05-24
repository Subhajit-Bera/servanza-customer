import {
    getMessaging,
    requestPermission,
    AuthorizationStatus,
    getToken,
    onMessage,
    onNotificationOpenedApp,
    getInitialNotification,
    onTokenRefresh,
} from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';
import { CONFIG } from '../config/constants';
import * as SecureStore from 'expo-secure-store';

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

import { Platform } from 'react-native';

// ─── Android Notification Channel IDs ────────────────────────────────────────
// Exported so callers always reference a typed constant, never a raw string.
export const NOTIFICATION_CHANNELS = {
    BOOKINGS: 'servanza_bookings',
    PROMOS:   'servanza_promos',
    CHAT:     'servanza_chat',
    GENERAL:  'servanza_general',
} as const;

export type NotificationChannelId = typeof NOTIFICATION_CHANNELS[keyof typeof NOTIFICATION_CHANNELS];

// ─── Register all channels at module load (Android 8.0+ requirement) ─────────
// Channels are idempotent — safe to call every app launch.
if (Platform.OS === 'android') {
    // Booking events — highest priority (job status, OTP, buddy arrival)
    Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.BOOKINGS, {
        name: 'Bookings',
        description: 'Booking confirmations, buddy updates, and job status alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#47855f',   // Servanza brand green
        enableVibrate: true,
        showBadge: true,
    });

    // Promotional offers — lower priority, no vibration
    Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.PROMOS, {
        name: 'Offers & Promotions',
        description: 'Deals, discounts, and promotional campaigns',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 100],
        lightColor: '#F59E0B',   // Amber
        enableVibrate: false,
        showBadge: false,
    });

    // In-app chat messages
    Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.CHAT, {
        name: 'Chat Messages',
        description: 'Messages from your assigned buddy',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 150, 100, 150],
        lightColor: '#3B82F6',   // Blue
        enableVibrate: true,
        showBadge: true,
    });

    // General / system alerts
    Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.GENERAL, {
        name: 'General',
        description: 'App updates and general information',
        importance: Notifications.AndroidImportance.LOW,
        enableVibrate: false,
        showBadge: false,
    });
}

// Notification types from backend
export interface PushNotificationData {
    type: 'BOOKING_CONFIRMED' | 'BOOKING_ASSIGNED' | 'BUDDY_EN_ROUTE' | 'BUDDY_ARRIVED' | 'BOOKING_COMPLETED' | 'BOOKING_CANCELLED' | 'CHAT_MESSAGE' | 'PROMO';
    bookingId?: string;
    title: string;
    body: string;
    [key: string]: any;
}

// Callback type for notification handlers
type NotificationCallback = (data: PushNotificationData) => void;

// Store for notification callbacks
const notificationCallbacks: Set<NotificationCallback> = new Set();

/**
 * Request notification permissions
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
    try {
        // Request permissions from Firebase Messaging (modular API)
        const authStatus = await requestPermission(getMessaging());
        const enabled =
            authStatus === AuthorizationStatus.AUTHORIZED ||
            authStatus === AuthorizationStatus.PROVISIONAL;

        if (enabled) {
            console.log('[Notifications] Permission granted');
        } else {
            console.log('[Notifications] Permission denied');
        }

        return enabled;
    } catch (error) {
        console.error('[Notifications] Permission request failed:', error);
        return false;
    }
};

/**
 * Get FCM token and register with backend
 */
export const registerForPushNotifications = async (): Promise<string | null> => {
    try {
        // Request permissions first
        const hasPermission = await requestNotificationPermissions();
        if (!hasPermission) {
            console.log('[Notifications] No permission, skipping registration');
            return null;
        }

        // Get FCM token (modular API)
        const fcmToken = await getToken(getMessaging());
        console.log('[Notifications] FCM Token:', fcmToken?.substring(0, 20) + '...');

        // Save token locally
        if (fcmToken) {
            await SecureStore.setItemAsync('fcm_token', fcmToken);

            // Register token with backend
            await registerTokenWithBackend(fcmToken);
        }

        return fcmToken;
    } catch (error) {
        console.error('[Notifications] Registration failed:', error);
        return null;
    }
};

/**
 * Register FCM token with backend
 */
const registerTokenWithBackend = async (token: string): Promise<void> => {
    try {
        const authToken = await SecureStore.getItemAsync('auth_token');
        if (!authToken) {
            console.log('[Notifications] No auth token, cannot register FCM token');
            return;
        }

        const response = await fetch(`${CONFIG.API_BASE_URL}/auth/fcm/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({
                token,
                appSource: 'CUSTOMER_APP',
            }),
        });

        if (response.ok) {
            console.log('[Notifications] Token registered with backend');
        } else {
            console.error('[Notifications] Failed to register token:', await response.text());
        }
    } catch (error) {
        console.error('[Notifications] Backend registration error:', error);
    }
};

/**
 * Setup notification listeners
 */
export const setupNotificationListeners = (): () => void => {
    const messaging = getMessaging();

    // Handle foreground messages (modular API)
    const unsubscribeForeground = onMessage(messaging, async (remoteMessage) => {
        console.log('[Notifications] Foreground message:', remoteMessage);

        // Extract title/body from either notification payload or data-only payload
        const title = remoteMessage.notification?.title || (remoteMessage.data?.title as string) || 'Servanza';
        const body = remoteMessage.notification?.body || (remoteMessage.data?.body as string) || '';

        // Show local notification for foreground messages
        if (title || body) {
            const channelId = resolveChannel(remoteMessage.data?.type as string);
            await Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body,
                    data: remoteMessage.data as Record<string, string>,
                    sound: true,
                    ...(Platform.OS === 'android' && { channelId }),
                },
                trigger: null, // Show immediately
            });
        }

        // Notify callbacks
        if (remoteMessage.data) {
            notifyCallbacks(remoteMessage.data as unknown as PushNotificationData);
        }
    });

    // Handle background/quit messages when app opens from notification (modular API)
    onNotificationOpenedApp(messaging, (remoteMessage) => {
        console.log('[Notifications] Notification opened app:', remoteMessage);
        if (remoteMessage.data) {
            notifyCallbacks(remoteMessage.data as unknown as PushNotificationData);
        }
    });

    // Check if app was opened from notification when quit (modular API)
    getInitialNotification(messaging)
        .then((remoteMessage) => {
            if (remoteMessage) {
                console.log('[Notifications] App opened from quit via notification:', remoteMessage);
                if (remoteMessage.data) {
                    notifyCallbacks(remoteMessage.data as unknown as PushNotificationData);
                }
            }
        });

    // Handle token refresh (modular API)
    const unsubscribeTokenRefresh = onTokenRefresh(messaging, async (token) => {
        console.log('[Notifications] Token refreshed');
        await SecureStore.setItemAsync('fcm_token', token);
        await registerTokenWithBackend(token);
    });

    // Return cleanup function
    return () => {
        unsubscribeForeground();
        unsubscribeTokenRefresh();
    };
};

/**
 * Add notification callback
 */
export const addNotificationListener = (callback: NotificationCallback): () => void => {
    notificationCallbacks.add(callback);
    return () => {
        notificationCallbacks.delete(callback);
    };
};

/**
 * Resolve the correct Android notification channel from the FCM message type.
 */
const resolveChannel = (type?: string): NotificationChannelId => {
    switch (type) {
        case 'BOOKING_CONFIRMED':
        case 'BOOKING_ASSIGNED':
        case 'BUDDY_EN_ROUTE':
        case 'BUDDY_ARRIVED':
        case 'BOOKING_COMPLETED':
        case 'BOOKING_CANCELLED':
            return NOTIFICATION_CHANNELS.BOOKINGS;
        case 'CHAT_MESSAGE':
            return NOTIFICATION_CHANNELS.CHAT;
        case 'PROMO':
            return NOTIFICATION_CHANNELS.PROMOS;
        default:
            return NOTIFICATION_CHANNELS.GENERAL;
    }
};

/**
 * Notify all callbacks
 */
const notifyCallbacks = (data: PushNotificationData): void => {
    notificationCallbacks.forEach((callback) => {
        try {
            callback(data);
        } catch (error) {
            console.error('[Notifications] Callback error:', error);
        }
    });
};

/**
 * Get stored FCM token
 */
export const getStoredFcmToken = async (): Promise<string | null> => {
    return await SecureStore.getItemAsync('fcm_token');
};

/**
 * Unregister FCM token from backend (for logout)
 */
export const unregisterPushNotifications = async (): Promise<void> => {
    try {
        const token = await getStoredFcmToken();
        const authToken = await SecureStore.getItemAsync('auth_token');

        if (token && authToken) {
            await fetch(`${CONFIG.API_BASE_URL}/auth/fcm/remove`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
                body: JSON.stringify({ token }),
            });
        }

        await SecureStore.deleteItemAsync('fcm_token');
        console.log('[Notifications] Unregistered from push notifications');
    } catch (error) {
        console.error('[Notifications] Unregister error:', error);
    }
};
