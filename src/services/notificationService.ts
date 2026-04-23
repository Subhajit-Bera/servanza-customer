import messaging from '@react-native-firebase/messaging';
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
        // Request permissions from Firebase
        const authStatus = await messaging().requestPermission();
        const enabled =
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;

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

        // Get FCM token
        const fcmToken = await messaging().getToken();
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
    // Handle foreground messages
    const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
        console.log('[Notifications] Foreground message:', remoteMessage);

        // Show local notification for foreground messages
        if (remoteMessage.notification) {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: remoteMessage.notification.title || 'Servanza',
                    body: remoteMessage.notification.body || '',
                    data: remoteMessage.data as Record<string, string>,
                    sound: true,
                },
                trigger: null, // Show immediately
            });
        }

        // Notify callbacks
        if (remoteMessage.data) {
            notifyCallbacks(remoteMessage.data as unknown as PushNotificationData);
        }
    });

    // Handle background/quit messages when app opens from notification
    messaging().onNotificationOpenedApp((remoteMessage) => {
        console.log('[Notifications] Notification opened app:', remoteMessage);
        if (remoteMessage.data) {
            notifyCallbacks(remoteMessage.data as unknown as PushNotificationData);
        }
    });

    // Check if app was opened from notification when quit
    messaging()
        .getInitialNotification()
        .then((remoteMessage) => {
            if (remoteMessage) {
                console.log('[Notifications] App opened from quit via notification:', remoteMessage);
                if (remoteMessage.data) {
                    notifyCallbacks(remoteMessage.data as unknown as PushNotificationData);
                }
            }
        });

    // Handle token refresh
    const unsubscribeTokenRefresh = messaging().onTokenRefresh(async (token) => {
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
