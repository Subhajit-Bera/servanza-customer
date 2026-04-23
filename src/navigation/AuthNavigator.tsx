import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAppSelector } from '../store/hooks';

// Auth Screens
import SplashScreen from '../screens/auth/SplashScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import PhoneEntryScreen from '../screens/auth/PhoneEntryScreen';
import OTPScreen from '../screens/auth/OTPScreen';
import ProfileSetupScreen from '../screens/auth/ProfileSetupScreen';

export type AuthStackParamList = {
    Splash: undefined;
    Onboarding: undefined;
    Login: undefined;
    PhoneEntry: undefined;
    OTP: { phone: string; confirmation: any };
    ProfileSetup: { isNewUser?: boolean };
};

const Stack = createStackNavigator<AuthStackParamList>();

const AuthNavigator: React.FC = () => {
    // If loginRequested=true the user was in the app as a guest and tapped
    // "Log In" — skip Splash (no loading animation) and go straight to Login.
    const loginRequested = useAppSelector((state) => state.auth.loginRequested);

    return (
        <Stack.Navigator
            initialRouteName={loginRequested ? 'Login' : 'Splash'}
            screenOptions={{
                headerShown: false,
                cardStyle: { backgroundColor: 'white' },
            }}
        >
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="PhoneEntry" component={PhoneEntryScreen} />
            <Stack.Screen name="OTP" component={OTPScreen} />
            <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        </Stack.Navigator>
    );
};

export default AuthNavigator;
