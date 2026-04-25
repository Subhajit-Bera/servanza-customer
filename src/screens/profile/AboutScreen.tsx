import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../theme';

const APP_LOGO = require('../../../assets/icon.png');

const AboutScreen: React.FC = () => {
    const navigation = useNavigation();

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>About Us</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                <View style={styles.logoContainer}>
                    <Image source={APP_LOGO} style={styles.logo} />
                    <Text style={styles.appName}>Servanza</Text>
                    <Text style={styles.version}>Version 1.0.0</Text>
                </View>

                <Text style={styles.paragraph}>
                    Servanza is your trusted platform for booking verified, high-quality home services. Whether you need a quick repair, regular maintenance, or specialized cleaning, we connect you with professional Buddies in your area.
                </Text>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Our Mission</Text>
                    <Text style={styles.cardText}>
                        To simplify home management by providing reliable, transparent, and high-quality services at your fingertips.
                    </Text>
                </View>

                <View style={styles.linksContainer}>
                    <TouchableOpacity style={styles.linkRow}>
                        <Ionicons name="globe-outline" size={20} color={COLORS.primary} />
                        <Text style={styles.linkText}>Visit our website</Text>
                        <Ionicons name="open-outline" size={16} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.linkRow}>
                        <Ionicons name="mail-outline" size={20} color={COLORS.primary} />
                        <Text style={styles.linkText}>Contact Support</Text>
                        <Ionicons name="open-outline" size={16} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                </View>

                <Text style={styles.copyright}>
                    © {new Date().getFullYear()} Servanza Inc. All rights reserved.
                </Text>
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
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
        marginTop: SPACING.lg,
    },
    logo: {
        width: 100,
        height: 100,
        borderRadius: 20,
        marginBottom: SPACING.md,
    },
    appName: {
        ...TYPOGRAPHY.h2,
        color: COLORS.textPrimary,
    },
    version: {
        ...TYPOGRAPHY.caption,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    paragraph: {
        ...TYPOGRAPHY.body1,
        color: COLORS.textSecondary,
        lineHeight: 24,
        textAlign: 'center',
        marginBottom: SPACING.xl,
    },
    card: {
        backgroundColor: COLORS.background,
        padding: SPACING.lg,
        borderRadius: BORDER_RADIUS.md,
        width: '100%',
        marginBottom: SPACING.xl,
    },
    cardTitle: {
        ...TYPOGRAPHY.h4,
        color: COLORS.primary,
        marginBottom: SPACING.sm,
    },
    cardText: {
        ...TYPOGRAPHY.body2,
        color: COLORS.textSecondary,
        lineHeight: 22,
    },
    linksContainer: {
        width: '100%',
        marginBottom: SPACING.xl,
    },
    linkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    linkText: {
        ...TYPOGRAPHY.subtitle1,
        color: COLORS.textPrimary,
        flex: 1,
        marginLeft: SPACING.md,
    },
    copyright: {
        ...TYPOGRAPHY.caption,
        color: COLORS.mediumGray,
        marginTop: SPACING.xl,
    },
});

export default AboutScreen;
