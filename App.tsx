import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from './src/store';
import { useAppSelector, useAppDispatch } from './src/store/hooks';
import AuthNavigator from './src/navigation/AuthNavigator';
import MainNavigator from './src/navigation/MainNavigator';
import ProfileSetupScreen from './src/screens/auth/ProfileSetupScreen';
import { connectSocket, disconnectSocket, addSocketListener, removeSocketListener } from './src/services/socketClient';
import { updateBookingStatus } from './src/store/slices/bookingsSlice';
import { loadCart } from './src/store/slices/cartSlice';
import { checkAuthStatus } from './src/store/slices/authSlice';
import { useNotifications, useNotificationNavigation } from './src/hooks/useNotifications';
import { useLocation } from './src/hooks/useLocation';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { OfflineBanner } from './src/components/OfflineBanner';
import IncomingCallOverlay from './src/components/IncomingCallOverlay';
import { injectStore } from './src/api/client';
import { navigationRef } from './src/utils/navigationRef';

// Inject the Redux store into the Axios interceptor so it can dispatch logout() on auth failure
injectStore(store);

// Keep splash screen visible until we have hydrated local storage into Redux
SplashScreen.preventAutoHideAsync().catch(() => {/* already hidden */});

// Root Navigator that switches between Auth and Main based on auth state
const RootStack = createStackNavigator();

// Component that handles notifications (needs to be inside NavigationContainer)
const NotificationHandler: React.FC = () => {
  useNotificationNavigation();
  return null;
};

const RootNavigator: React.FC = () => {
  const { isAuthenticated, isGuest, isLoading } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  // Register for push notifications only when authenticated
  useNotifications(isAuthenticated);

  // Request location permission on app start (non-blocking)
  useLocation(true);

  // Hydrate cart from AsyncStorage before first render
  // Uses a local ready flag that we check before hiding the splash screen.
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Check auth status first
    dispatch(checkAuthStatus());

    const hydrateFromStorage = async () => {
      try {
        const cartData = await AsyncStorage.getItem('servanza_cart');
        if (cartData) {
          const items = JSON.parse(cartData);
          dispatch(loadCart(items));
        }
      } catch (error) {
        console.error('Failed to hydrate cart:', error);
      } finally {
        setIsHydrated(true);
      }
    };
    hydrateFromStorage();
  }, [dispatch]);

  // Hide splash when both auth check and cart hydration are complete
  useEffect(() => {
    if (!isLoading && isHydrated) {
      SplashScreen.hideAsync();
    }
  }, [isLoading, isHydrated]);

  useEffect(() => {
    if (isAuthenticated) {
      connectSocket();

      // Listen for booking status updates and dispatch to Redux
      const handleBookingUpdate = (data: any) => {
        if (data.bookingId && data.status) {
          dispatch(updateBookingStatus({
            bookingId: data.bookingId,
            status: data.status,
            otp: data.completionOtp || data.otp,
            assignmentId: data.assignmentId,
            buddyId: data.buddyId,
          }));
        }
      };

      addSocketListener('booking:status:changed', handleBookingUpdate);
      addSocketListener('booking:updated', handleBookingUpdate);

      return () => {
        removeSocketListener('booking:status:changed', handleBookingUpdate);
        removeSocketListener('booking:updated', handleBookingUpdate);
        disconnectSocket();
      };
    }
  }, [isAuthenticated, dispatch]);

  // Show main app for authenticated users OR guests
  // Auth stack only shows during initial loading (before splash resolves)
  const showMain = !isLoading && (isAuthenticated || isGuest);

  return (
    <>
      {isAuthenticated && <NotificationHandler />}
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {showMain ? (
          <RootStack.Group>
            <RootStack.Screen name="Main" component={MainNavigator} />
            <RootStack.Screen 
              name="ProfileSetup" 
              component={ProfileSetupScreen} 
              options={{ presentation: 'modal' }} 
            />
          </RootStack.Group>
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </>
  );
};

// App Wrapper to use hooks
const AppContent: React.FC = () => {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <NavigationContainer ref={navigationRef}>
          <StatusBar style="dark" />
          <OfflineBanner />
          <IncomingCallOverlay />
          <RootNavigator />
        </NavigationContainer>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
};

// Main App Component
export default function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}
