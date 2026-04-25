import { useEffect, useState, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { bookingApi } from '../api/client';
import {
    connectSocket,
    disconnectSocket,
    addSocketListener,
    removeSocketListener,
    subscribeToBookingLocation,
    unsubscribeFromBookingLocation,
    isSocketConnected,
    getSocket,
} from '../services/socketClient';

/**
 * Hook for managing socket connection
 */
export const useSocket = () => {
    const [connected, setConnected] = useState(isSocketConnected());

    useEffect(() => {
        // Connect to socket
        connectSocket();

        // Listen for connection state changes
        const handleConnect = () => setConnected(true);
        const handleDisconnect = () => setConnected(false);

        addSocketListener('connect', handleConnect);
        addSocketListener('disconnect', handleDisconnect);

        return () => {
            removeSocketListener('connect', handleConnect);
            removeSocketListener('disconnect', handleDisconnect);
        };
    }, []);

    return { connected };
};

/**
 * Hook for subscribing to buddy location updates
 */
export const useBuddyLocation = (bookingId: string | null) => {
    const [location, setLocation] = useState<{
        latitude: number;
        longitude: number;
        heading?: number;
        timestamp?: string;
        buddyId?: string;
    } | null>(null);

    const [eta, setEta] = useState<{
        minutes: number;
        distance: string;
    } | null>(null);

    useEffect(() => {
        if (!bookingId) return;

        // Subscribe to location updates
        subscribeToBookingLocation(bookingId);

        // Listen for location updates
        const handleLocationUpdate = (data: any) => {
            if (data.bookingId === bookingId || !data.bookingId) {
                setLocation({
                    latitude: data.latitude,
                    longitude: data.longitude,
                    heading: data.heading,
                    timestamp: data.timestamp,
                    buddyId: data.buddyId,
                });

                // Calculate ETA if available
                if (data.eta) {
                    setEta({
                        minutes: data.eta.minutes,
                        distance: data.eta.distance,
                    });
                }
            }
        };

        addSocketListener('buddy:location:live', handleLocationUpdate);
        addSocketListener('buddy:location:update', handleLocationUpdate);

        return () => {
            unsubscribeFromBookingLocation(bookingId);
            removeSocketListener('buddy:location:live', handleLocationUpdate);
            removeSocketListener('buddy:location:update', handleLocationUpdate);
        };
    }, [bookingId]);

    return { location, eta };
};

/**
 * Hook for listening to booking status changes
 */
export const useBookingStatus = (bookingId: string | null) => {
    const [status, setStatus] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const appState = useRef(AppState.currentState);

    const fetchLatestStatus = async () => {
        if (!bookingId) return;
        try {
            const res = await bookingApi.getBookingById(bookingId);
            const latestStatus = res.data?.data?.status || res.data?.status;
            if (latestStatus && latestStatus !== status) {
                setStatus(latestStatus);
                setLastUpdate(new Date());
            }
        } catch (error) {
            console.error('[Socket Fallback] Failed to fetch latest status', error);
        }
    };

    useEffect(() => {
        if (!bookingId) return;

        // Fetch initial status via REST to ensure we start fresh
        fetchLatestStatus();

        const handleStatusChange = (data: any) => {
            if (data.bookingId === bookingId) {
                setStatus(data.status);
                setLastUpdate(new Date());
            }
        };

        addSocketListener('booking:status:changed', handleStatusChange);
        addSocketListener('booking:updated', handleStatusChange);

        // --- AppState REST Fallback ---
        // If the app backgrounds and misses socket events, refetch on foreground
        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
                console.log('[Socket Fallback] App foregrounded. Fetching latest status...');
                fetchLatestStatus();
            }
            appState.current = nextAppState;
        });

        return () => {
            removeSocketListener('booking:status:changed', handleStatusChange);
            removeSocketListener('booking:updated', handleStatusChange);
            subscription.remove();
        };
    }, [bookingId]);

    return { status, lastUpdate };
};

/**
 * Hook for generic socket events
 */
export const useSocketEvent = <T = any>(eventName: string) => {
    const [data, setData] = useState<T | null>(null);
    const callbackRef = useRef<((data: T) => void) | null>(null);

    useEffect(() => {
        const handleEvent = (eventData: T) => {
            setData(eventData);
            callbackRef.current?.(eventData);
        };

        addSocketListener(eventName, handleEvent);

        return () => {
            removeSocketListener(eventName, handleEvent);
        };
    }, [eventName]);

    const onEvent = useCallback((callback: (data: T) => void) => {
        callbackRef.current = callback;
    }, []);

    return { data, onEvent };
};
