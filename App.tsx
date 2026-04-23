import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { store } from './src/store';
import { useAppSelector, useAppDispatch } from './src/store/hooks';
import AuthNavigator from './src/navigation/AuthNavigator';
import MainNavigator from './src/navigation/MainNavigator';
import { connectSocket, disconnectSocket, addSocketListener, removeSocketListener } from './src/services/socketClient';
import { updateBookingStatus } from './src/store/slices/bookingsSlice';
import { useNotifications, useNotificationNavigation } from './src/hooks/useNotifications';
import { useLocation } from './src/hooks/useLocation';

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

  // Load cart from storage on app start
  useEffect(() => {
    const loadCart = async () => {
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        const cartData = await AsyncStorage.getItem('servanza_cart');
        if (cartData) {
          const items = JSON.parse(cartData);
          const { loadCart: loadCartAction } = await import('./src/store/slices/cartSlice');
          dispatch(loadCartAction(items));
        }
      } catch (error) {
        console.error('Failed to load cart:', error);
      }
    };
    loadCart();
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      connectSocket();

      // Listen for booking status updates and dispatch to Redux
      const handleBookingUpdate = (data: any) => {
        if (data.bookingId && data.status) {
          dispatch(updateBookingStatus({
            bookingId: data.bookingId,
            status: data.status,
            otp: data.otp,
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
          <RootStack.Screen name="Main" component={MainNavigator} />
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
      <NavigationContainer>
        <StatusBar style="dark" />
        <RootNavigator />
      </NavigationContainer>
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
