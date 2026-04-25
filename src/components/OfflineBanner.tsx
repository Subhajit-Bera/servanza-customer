import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { COLORS, TYPOGRAPHY } from '../theme';
import { Ionicons } from '@expo/vector-icons';

export const OfflineBanner: React.FC = () => {
    const { isConnected } = useNetworkStatus();
    const insets = useSafeAreaInsets();

    if (isConnected) return null;

    return (
        <View style={[styles.container, { paddingTop: Math.max(insets.top, 20) }]}>
            <View style={styles.content}>
                <Ionicons name="cloud-offline" size={20} color={COLORS.white} />
                <Text style={styles.text}>No Internet Connection</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.error,
        width: '100%',
        position: 'absolute',
        top: 0,
        zIndex: 9999,
        elevation: 10,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    text: {
        ...TYPOGRAPHY.subtitle2,
        color: COLORS.white,
        marginLeft: 8,
    },
});
