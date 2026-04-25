import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, TYPOGRAPHY, SPACING } from '../../theme';

const TermsScreen: React.FC = () => {
    const navigation = useNavigation();

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Terms & Conditions</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.lastUpdated}>Last Updated: May 1, 2024</Text>

                <Text style={styles.heading}>1. Acceptance of Terms</Text>
                <Text style={styles.paragraph}>
                    By accessing and using the Servanza application, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you must not use our application.
                </Text>

                <Text style={styles.heading}>2. Service Bookings</Text>
                <Text style={styles.paragraph}>
                    When you book a service through Servanza, you agree to provide accurate information and ensure you are available at the specified location and time. Cancellations must be made within the allowed timeframe to avoid penalty fees.
                </Text>

                <Text style={styles.heading}>3. User Conduct</Text>
                <Text style={styles.paragraph}>
                    Users must treat service providers (Buddies) with respect. Any form of harassment, discrimination, or abusive behavior will result in immediate termination of your account.
                </Text>

                <Text style={styles.heading}>4. Payments</Text>
                <Text style={styles.paragraph}>
                    All payments are processed securely through our payment partners. You agree to pay all charges associated with the services you book.
                </Text>

                <Text style={styles.heading}>5. Liability</Text>
                <Text style={styles.paragraph}>
                    Servanza acts as a platform connecting users with service providers. While we vet our providers, we are not directly liable for damages occurring during service execution beyond the scope defined in our dispute resolution policy.
                </Text>
                
                <View style={styles.bottomSpacer} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        backgroundColor: COLORS.white,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    headerTitle: {
        ...TYPOGRAPHY.h3,
        color: COLORS.textPrimary,
    },
    content: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    scrollContent: {
        padding: SPACING.xl,
    },
    lastUpdated: {
        ...TYPOGRAPHY.caption,
        color: COLORS.textSecondary,
        marginBottom: SPACING.xl,
    },
    heading: {
        ...TYPOGRAPHY.h4,
        color: COLORS.textPrimary,
        marginBottom: SPACING.xs,
        marginTop: SPACING.lg,
    },
    paragraph: {
        ...TYPOGRAPHY.body2,
        color: COLORS.textSecondary,
        lineHeight: 22,
    },
    bottomSpacer: {
        height: 40,
    },
});

export default TermsScreen;
