import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Linking,
    TextInput,
    Modal,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme';

// FAQ Data
const FAQ_DATA = [
    {
        id: '1',
        question: 'How do I book a service?',
        answer: 'Browse services from the Home screen, add items to your cart, select a time slot, and proceed to payment. You can choose immediate or scheduled bookings.',
    },
    {
        id: '2',
        question: 'How can I track my buddy?',
        answer: 'Once a buddy is assigned to your booking, you can track their live location from the booking details screen. You\'ll receive real-time updates.',
    },
    {
        id: '3',
        question: 'What payment methods are accepted?',
        answer: 'We accept UPI, credit/debit cards (Visa, Mastercard, RuPay), and digital wallets like Paytm and Amazon Pay.',
    },
    {
        id: '4',
        question: 'How do I cancel a booking?',
        answer: 'Go to My Bookings, select the booking you want to cancel, and tap "Cancel Booking". Cancellation charges may apply based on timing.',
    },
    {
        id: '5',
        question: 'How do I apply a promo code?',
        answer: 'Enter your promo code in the Cart screen before checkout. The discount will be applied automatically if the code is valid.',
    },
    {
        id: '6',
        question: 'What if I\'m not satisfied with the service?',
        answer: 'You can rate the service after completion and report any issues. Our support team will review and take appropriate action.',
    },
    {
        id: '7',
        question: 'How do I change my address?',
        answer: 'Go to Profile > Addresses to add, edit, or delete addresses. You can also set a default address for quick booking.',
    },
];

// Support Contact Info
const SUPPORT_EMAIL = 'help@servanza.com';
const SUPPORT_PHONE = '+91 9876543210';
const WHATSAPP_NUMBER = '919876543210';

const HelpScreen: React.FC = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportSubject, setReportSubject] = useState('');
    const [reportMessage, setReportMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Toggle FAQ
    const toggleFaq = (id: string) => {
        setExpandedFaq(expandedFaq === id ? null : id);
    };

    // Open email
    const handleEmail = () => {
        Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Support Request`);
    };

    // Open phone
    const handleCall = () => {
        Linking.openURL(`tel:${SUPPORT_PHONE}`);
    };

    // Open WhatsApp
    const handleWhatsApp = () => {
        Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}?text=Hi, I need help with Servanza`);
    };

    // Submit report
    const handleSubmitReport = async () => {
        if (!reportSubject.trim() || !reportMessage.trim()) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setIsSubmitting(true);
        try {
            // Simulate API call - in real app, call backend API
            await new Promise(resolve => setTimeout(resolve, 1500));

            Alert.alert(
                'Report Submitted',
                'Thank you for your feedback. Our team will review and get back to you within 24 hours.',
                [{ text: 'OK', onPress: () => setShowReportModal(false) }]
            );
            setReportSubject('');
            setReportMessage('');
        } catch (error) {
            Alert.alert('Error', 'Failed to submit report. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.charcoal} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Help & Support</Text>
                <View style={styles.headerRight} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Contact Support Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Contact Us</Text>
                    <View style={styles.contactRow}>
                        <TouchableOpacity style={styles.contactCard} onPress={handleCall}>
                            <View style={[styles.contactIcon, { backgroundColor: '#E8F5E9' }]}>
                                <Ionicons name="call" size={24} color={COLORS.primary} />
                            </View>
                            <Text style={styles.contactLabel}>Call Us</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.contactCard} onPress={handleEmail}>
                            <View style={[styles.contactIcon, { backgroundColor: '#E3F2FD' }]}>
                                <Ionicons name="mail" size={24} color="#1976D2" />
                            </View>
                            <Text style={styles.contactLabel}>Email</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.contactCard} onPress={handleWhatsApp}>
                            <View style={[styles.contactIcon, { backgroundColor: '#E8F5E9' }]}>
                                <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
                            </View>
                            <Text style={styles.contactLabel}>WhatsApp</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Report Issue Button */}
                <TouchableOpacity
                    style={styles.reportButton}
                    onPress={() => setShowReportModal(true)}
                >
                    <Ionicons name="warning-outline" size={24} color={COLORS.coral} />
                    <View style={styles.reportTextContainer}>
                        <Text style={styles.reportTitle}>Report an Issue</Text>
                        <Text style={styles.reportSubtitle}>Having trouble? Let us know</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={COLORS.mediumGray} />
                </TouchableOpacity>

                {/* FAQ Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
                    {FAQ_DATA.map((faq) => (
                        <TouchableOpacity
                            key={faq.id}
                            style={styles.faqCard}
                            onPress={() => toggleFaq(faq.id)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.faqHeader}>
                                <Text style={styles.faqQuestion}>{faq.question}</Text>
                                <Ionicons
                                    name={expandedFaq === faq.id ? 'chevron-up' : 'chevron-down'}
                                    size={20}
                                    color={COLORS.mediumGray}
                                />
                            </View>
                            {expandedFaq === faq.id && (
                                <Text style={styles.faqAnswer}>{faq.answer}</Text>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* App Info */}
                <View style={styles.appInfo}>
                    <Text style={styles.appInfoText}>Servanza v1.0.0</Text>
                    <Text style={styles.appInfoText}>© 2024 Servanza. All rights reserved.</Text>
                </View>
            </ScrollView>

            {/* Report Issue Modal */}
            <Modal
                visible={showReportModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowReportModal(false)}
            >
                <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { paddingBottom: insets.bottom + SPACING.xl }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Report an Issue</Text>
                            <TouchableOpacity onPress={() => setShowReportModal(false)}>
                                <Ionicons name="close" size={24} color={COLORS.charcoal} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.inputLabel}>Subject</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Brief description of the issue"
                            placeholderTextColor={COLORS.mediumGray}
                            value={reportSubject}
                            onChangeText={setReportSubject}
                        />

                        <Text style={styles.inputLabel}>Message</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Please describe your issue in detail..."
                            placeholderTextColor={COLORS.mediumGray}
                            value={reportMessage}
                            onChangeText={setReportMessage}
                            multiline
                            numberOfLines={5}
                            textAlignVertical="top"
                        />

                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={handleSubmitReport}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color={COLORS.white} />
                            ) : (
                                <Text style={styles.submitButtonText}>Submit Report</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.offWhite,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.lightGray,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.offWhite,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.charcoal,
    },
    headerRight: {
        width: 40,
    },
    content: {
        flex: 1,
        padding: SPACING.lg,
    },
    section: {
        marginBottom: SPACING.xl,
    },
    sectionTitle: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.charcoal,
        marginBottom: SPACING.md,
    },
    contactRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    contactCard: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        marginHorizontal: 4,
        ...SHADOWS.light,
    },
    contactIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    contactLabel: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        color: COLORS.charcoal,
    },
    reportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg,
        marginBottom: SPACING.xl,
        ...SHADOWS.light,
    },
    reportTextContainer: {
        flex: 1,
        marginLeft: SPACING.md,
    },
    reportTitle: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.charcoal,
    },
    reportSubtitle: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.mediumGray,
        marginTop: 2,
    },
    faqCard: {
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        ...SHADOWS.light,
    },
    faqHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    faqQuestion: {
        flex: 1,
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        color: COLORS.charcoal,
        marginRight: SPACING.sm,
    },
    faqAnswer: {
        marginTop: SPACING.sm,
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.mediumGray,
        lineHeight: 22,
    },
    appInfo: {
        alignItems: 'center',
        paddingVertical: SPACING.xl,
    },
    appInfoText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.mediumGray,
        marginBottom: 4,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: BORDER_RADIUS.xl,
        borderTopRightRadius: BORDER_RADIUS.xl,
        paddingHorizontal: SPACING.xl,
        paddingTop: SPACING.xl,
        paddingBottom: SPACING.xl, // overridden inline with insets
        maxHeight: '85%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: SPACING.lg,
    },
    modalTitle: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.charcoal,
    },
    inputLabel: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        color: COLORS.charcoal,
        marginBottom: SPACING.xs,
    },
    input: {
        backgroundColor: COLORS.offWhite,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.charcoal,
        marginBottom: SPACING.md,
    },
    textArea: {
        height: 120,
    },
    submitButton: {
        backgroundColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        alignItems: 'center',
        marginTop: SPACING.sm,
        ...SHADOWS.green,
    },
    submitButtonText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.white,
    },
});

export default HelpScreen;
