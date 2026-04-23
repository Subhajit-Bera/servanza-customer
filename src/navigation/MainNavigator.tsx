import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme';
import { useAppSelector } from '../store/hooks';

// Home Stack
import HomeScreen from '../screens/home/HomeScreen';
import ServiceDetailsScreen from '../screens/home/ServiceDetailsScreen';
import CategoriesScreen from '../screens/home/CategoriesScreen';
import SearchScreen from '../screens/home/SearchScreen';
import AllServicesScreen from '../screens/home/AllServicesScreen';

// Bookings Stack
import MyBookingsScreen from '../screens/bookings/MyBookingsScreen';
import BookingDetailScreen from '../screens/bookings/BookingDetailScreen';
import TrackBuddyScreen from '../screens/bookings/TrackBuddyScreen';
import ReviewScreen from '../screens/bookings/ReviewScreen';

// Cart Stack
import CartScreen from '../screens/cart/CartScreen';
import BookingFormScreen from '../screens/cart/BookingFormScreen';
import PaymentScreen from '../screens/cart/PaymentScreen';
import BookingConfirmationScreen from '../screens/cart/BookingConfirmationScreen';

// Profile Stack
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import AddressesScreen from '../screens/profile/AddressesScreen';
import AddAddressScreen from '../screens/profile/AddAddressScreen';
import NotificationsScreen from '../screens/profile/NotificationsScreen';
import HelpScreen from '../screens/profile/HelpScreen';
import FavoritesScreen from '../screens/profile/FavoritesScreen';
import ChangePasswordScreen from '../screens/profile/ChangePasswordScreen';
import MyReviewsScreen from '../screens/profile/MyReviewsScreen';

// Guest
import GuestWallScreen from '../screens/auth/GuestWallScreen';

// Type definitions
export type HomeStackParamList = {
    Home: undefined;
    ServiceDetails: { serviceId: string };
    Categories: { categoryId?: string };
    Search: undefined;
    AllServices: undefined;
};

export type BookingsStackParamList = {
    MyBookings: undefined;
    BookingDetail: { bookingId: string };
    TrackBuddy: { bookingId: string };
    Review: { bookingId: string };
};

export type CartStackParamList = {
    Cart: undefined;
    BookingForm: undefined;
    Payment: { bookingId: string };
    BookingConfirmation: { bookingId: string; scheduledTime?: string; address?: string };
    AddAddress: undefined;
};

export type ProfileStackParamList = {
    Profile: undefined;
    EditProfile: undefined;
    Addresses: undefined;
    AddAddress: { addressId?: string };
    Favorites: undefined;
    Notifications: undefined;
    Help: undefined;
    ChangePassword: undefined;
    MyReviews: undefined;
};

export type MainTabParamList = {
    HomeTab: undefined;
    BookingsTab: undefined;
    CartTab: undefined;
    ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createStackNavigator<HomeStackParamList>();
const BookingsStack = createStackNavigator<BookingsStackParamList>();
const CartStack = createStackNavigator<CartStackParamList>();
const ProfileStack = createStackNavigator<ProfileStackParamList>();

// Stack Navigators
const HomeStackNavigator = () => (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
        <HomeStack.Screen name="Home" component={HomeScreen} />
        <HomeStack.Screen name="ServiceDetails" component={ServiceDetailsScreen} />
        <HomeStack.Screen name="Categories" component={CategoriesScreen} />
        <HomeStack.Screen name="Search" component={SearchScreen} />
        <HomeStack.Screen name="AllServices" component={AllServicesScreen} />
    </HomeStack.Navigator>
);

const BookingsStackNavigator = () => {
    const { isAuthenticated, isGuest } = useAppSelector((state) => state.auth);
    if (isGuest && !isAuthenticated) {
        return (
            <GuestWallScreen
                title="Track Your Bookings"
                subtitle="Log in to view and manage your service bookings."
                icon="calendar-outline"
            />
        );
    }
    return (
        <BookingsStack.Navigator screenOptions={{ headerShown: false }}>
            <BookingsStack.Screen name="MyBookings" component={MyBookingsScreen} />
            <BookingsStack.Screen name="BookingDetail" component={BookingDetailScreen} />
            <BookingsStack.Screen name="TrackBuddy" component={TrackBuddyScreen} />
            <BookingsStack.Screen name="Review" component={ReviewScreen} />
        </BookingsStack.Navigator>
    );
};

const CartStackNavigator = () => (
    <CartStack.Navigator screenOptions={{ headerShown: false }}>
        <CartStack.Screen name="Cart" component={CartScreen} />
        <CartStack.Screen name="BookingForm" component={BookingFormScreen} />
        <CartStack.Screen name="Payment" component={PaymentScreen} />
        <CartStack.Screen name="BookingConfirmation" component={BookingConfirmationScreen} />
        <CartStack.Screen name="AddAddress" component={AddAddressScreen} />
    </CartStack.Navigator>
);

const ProfileStackNavigator = () => {
    const { isAuthenticated, isGuest } = useAppSelector((state) => state.auth);
    if (isGuest && !isAuthenticated) {
        return (
            <GuestWallScreen
                title="Your Profile"
                subtitle="Log in to manage your profile, addresses, and preferences."
                icon="person-outline"
            />
        );
    }
    return (
        <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
            <ProfileStack.Screen name="Profile" component={ProfileScreen} />
            <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
            <ProfileStack.Screen name="Addresses" component={AddressesScreen} />
            <ProfileStack.Screen name="AddAddress" component={AddAddressScreen} />
            <ProfileStack.Screen name="Favorites" component={FavoritesScreen} />
            <ProfileStack.Screen name="Notifications" component={NotificationsScreen} />
            <ProfileStack.Screen name="Help" component={HelpScreen} />
            <ProfileStack.Screen name="ChangePassword" component={ChangePasswordScreen} />
            <ProfileStack.Screen name="MyReviews" component={MyReviewsScreen} />
        </ProfileStack.Navigator>
    );
};

// Custom Tab Bar Icon
const TabIcon = ({ name, focused }: { name: keyof typeof Ionicons.glyphMap; focused: boolean }) => (
    <Ionicons name={name} size={24} color={focused ? COLORS.primary : COLORS.mediumGray} />
);

// Main Tab Navigator
const MainNavigator: React.FC = () => {
    const { totalItems } = useAppSelector((state) => state.cart);
    const insets = useSafeAreaInsets();

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.mediumGray,
                tabBarStyle: {
                    backgroundColor: COLORS.white,
                    borderTopColor: COLORS.lightGray,
                    borderTopWidth: 1,
                    paddingTop: 8,
                    paddingBottom: Math.max(insets.bottom, 8),
                    height: 57 + Math.max(insets.bottom, 8),
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '500',
                },
            }}
        >
            <Tab.Screen
                name="HomeTab"
                component={HomeStackNavigator}
                options={{
                    tabBarLabel: 'Home',
                    tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} />,
                }}
            />
            <Tab.Screen
                name="BookingsTab"
                component={BookingsStackNavigator}
                options={{
                    tabBarLabel: 'Bookings',
                    tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'calendar' : 'calendar-outline'} focused={focused} />,
                }}
            />
            <Tab.Screen
                name="CartTab"
                component={CartStackNavigator}
                options={{
                    tabBarLabel: 'Cart',
                    tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'cart' : 'cart-outline'} focused={focused} />,
                    tabBarBadge: totalItems > 0 ? totalItems : undefined,
                    tabBarBadgeStyle: {
                        backgroundColor: COLORS.coral,
                        color: COLORS.white,
                        fontSize: 10,
                        minWidth: 18,
                        height: 18,
                    },
                }}
            />
            <Tab.Screen
                name="ProfileTab"
                component={ProfileStackNavigator}
                options={{
                    tabBarLabel: 'Profile',
                    tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'person' : 'person-outline'} focused={focused} />,
                }}
            />
        </Tab.Navigator>
    );
};

export default MainNavigator;
