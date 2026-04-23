import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { Alert, Linking, Platform } from 'react-native';

export type LocationPermissionStatus = 'granted' | 'denied' | 'undetermined';

export interface LocationCoords {
    latitude: number;
    longitude: number;
    accuracy?: number;
}

export interface UseLocationReturn {
    permissionStatus: LocationPermissionStatus;
    isLoading: boolean;
    currentLocation: LocationCoords | null;
    requestPermission: () => Promise<boolean>;
    getCurrentLocation: () => Promise<LocationCoords | null>;
    openSettings: () => void;
}

export const useLocation = (requestOnMount: boolean = false): UseLocationReturn => {
    const [permissionStatus, setPermissionStatus] = useState<LocationPermissionStatus>('undetermined');
    const [isLoading, setIsLoading] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<LocationCoords | null>(null);

    // Check current permission status
    const checkPermission = useCallback(async () => {
        try {
            const { status } = await Location.getForegroundPermissionsAsync();
            setPermissionStatus(status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined');
            return status === 'granted';
        } catch (error) {
            console.error('Error checking location permission:', error);
            return false;
        }
    }, []);

    // Request location permission
    const requestPermission = useCallback(async (): Promise<boolean> => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            const isGranted = status === 'granted';
            setPermissionStatus(isGranted ? 'granted' : 'denied');
            return isGranted;
        } catch (error) {
            console.error('Error requesting location permission:', error);
            setPermissionStatus('denied');
            return false;
        }
    }, []);

    // Get current location
    const getCurrentLocation = useCallback(async (): Promise<LocationCoords | null> => {
        setIsLoading(true);
        try {
            // Check/request permission first
            let hasPermission = permissionStatus === 'granted';
            if (!hasPermission) {
                hasPermission = await requestPermission();
            }

            if (!hasPermission) {
                return null;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            const coords: LocationCoords = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                accuracy: location.coords.accuracy ?? undefined,
            };

            setCurrentLocation(coords);
            return coords;
        } catch (error) {
            console.error('Error getting current location:', error);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [permissionStatus, requestPermission]);

    // Open device settings
    const openSettings = useCallback(() => {
        if (Platform.OS === 'ios') {
            Linking.openURL('app-settings:');
        } else {
            Linking.openSettings();
        }
    }, []);

    // Show permission required alert with option to open settings
    const showPermissionAlert = useCallback(() => {
        Alert.alert(
            'Location Permission Required',
            'Please enable location access to use this feature. You can enable it in Settings.',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Open Settings', onPress: openSettings },
            ]
        );
    }, [openSettings]);

    // Check permission on mount
    useEffect(() => {
        checkPermission();
    }, [checkPermission]);

    // Request permission on mount if specified
    useEffect(() => {
        if (requestOnMount && permissionStatus === 'undetermined') {
            requestPermission();
        }
    }, [requestOnMount, permissionStatus, requestPermission]);

    return {
        permissionStatus,
        isLoading,
        currentLocation,
        requestPermission,
        getCurrentLocation,
        openSettings,
    };
};

// Utility function to check if location is required and show appropriate UI
export const requireLocationPermission = async (
    onGranted: () => void,
    onDenied?: () => void
): Promise<void> => {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status === 'granted') {
        onGranted();
    } else {
        Alert.alert(
            'Location Access Required',
            'We need your location to provide services at your address. Please grant location access to continue.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                    onPress: onDenied
                },
                {
                    text: 'Open Settings',
                    onPress: () => {
                        if (Platform.OS === 'ios') {
                            Linking.openURL('app-settings:');
                        } else {
                            Linking.openSettings();
                        }
                    }
                },
            ]
        );
    }
};

export default useLocation;
