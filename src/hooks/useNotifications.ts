import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
    registerForPushNotifications,
    setupNotificationListeners,
    addNotificationListener,
    PushNotificationData,
} from '../services/notificationService';

/**
 * Hook for managing push notifications
 * @param isAuthenticated - Only register when user is authenticated
 */
export const useNotifications = (isAuthenticated: boolean = false) => {
    const [isRegistered, setIsRegistered] = useState(false);
    const [fcmToken, setFcmToken] = useState<string | null>(null);

    useEffect(() => {
        // Only register for push notifications when authenticated
        if (!isAuthenticated) {
            return;
        }

        // Register for push notifications
        const register = async () => {
            const token = await registerForPushNotifications();
            setFcmToken(token);
            setIsRegistered(!!token);
        };

        register();

        // Setup notification listeners
        const cleanup = setupNotificationListeners();

        return cleanup;
    }, [isAuthenticated]);

    return { isRegistered, fcmToken };
};

/**
 * Hook for handling notification deep links
 */
export const useNotificationNavigation = () => {
    const navigation = useNavigation<any>();
    const pendingNotificationRef = useRef<PushNotificationData | null>(null);

    useEffect(() => {
        // Handle notification data for navigation
        const handleNotification = (data: PushNotificationData) => {
            console.log('[useNotificationNavigation] Received notification:', data.type);

            switch (data.type) {
                case 'BOOKING_CONFIRMED':
                case 'BOOKING_ASSIGNED':
                case 'BUDDY_EN_ROUTE':
                case 'BUDDY_ARRIVED':
                case 'BOOKING_COMPLETED':
                case 'BOOKING_CANCELLED':
                    if (data.bookingId) {
                        // Navigate to booking details
                        navigation.navigate('Bookings', {
                            screen: 'BookingDetail',
                            params: { id: data.bookingId },
                        });
                    }
                    break;

                case 'CHAT_MESSAGE':
                    // Navigate to chat (when implemented)
                    console.log('[useNotificationNavigation] Chat notification received');
                    break;

                case 'PROMO':
                    // Navigate to promotions/offers (when implemented)
                    console.log('[useNotificationNavigation] Promo notification received');
                    break;

                default:
                    console.log('[useNotificationNavigation] Unknown notification type:', data.type);
            }
        };

        const unsubscribe = addNotificationListener(handleNotification);

        return unsubscribe;
    }, [navigation]);

    return { pendingNotification: pendingNotificationRef.current };
};
