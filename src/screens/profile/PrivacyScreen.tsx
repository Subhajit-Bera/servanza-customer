import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, TYPOGRAPHY, SPACING } from '../../theme';

const PrivacyScreen: React.FC = () => {
    const navigation = useNavigation();

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Privacy Policy</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                <Text style={styles.lastUpdated}>Last Updated: May 1, 2024</Text>

                <Text style={styles.heading}>1. Data Collection</Text>
                <Text style={styles.paragraph}>
                    We collect personal information such as your name, phone number, and location to provide and improve our services. We may also collect device information for diagnostic purposes.
                </Text>

                <Text style={styles.heading}>2. Location Data</Text>
                <Text style={styles.paragraph}>
                    Servanza requires access to your location to match you with nearby service providers and facilitate service delivery. This data is only actively tracked when you have an active booking.
                </Text>

                <Text style={styles.heading}>3. Data Sharing</Text>
                <Text style={styles.paragraph}>
                    We share necessary details (name, address, phone number) with your assigned service provider solely for the purpose of completing your booking. We do not sell your personal data to third parties.
                </Text>

                <Text style={styles.heading}>4. Data Security</Text>
                <Text style={styles.paragraph}>
                    We employ industry-standard security measures to protect your personal information from unauthorized access, alteration, or disclosure.
                </Text>

                <Text style={styles.heading}>5. Your Rights</Text>
                <Text style={styles.paragraph}>
                    You have the right to request access to, or deletion of, your personal data. You can manage these preferences within the app or by contacting our support team.
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

export default PrivacyScreen;
