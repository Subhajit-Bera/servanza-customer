import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, formatCurrency } from '../../theme';
import { paymentApi } from '../../api/client';
import dayjs from 'dayjs';

interface Transaction {
    id: string;
    amount: number;
    status: string;
    createdAt: string;
    razorpayPaymentId?: string;
    booking?: {
        service?: {
            title: string;
        };
    };
}

const TransactionHistoryScreen: React.FC = () => {
    const navigation = useNavigation();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const response = await paymentApi.getPaymentHistory();
            setTransactions(response.data.data || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching transaction history:', err);
            setError('Failed to load transaction history.');
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: Transaction }) => {
        const isSuccess = item.status === 'SUCCESS' || item.status === 'captured';
        
        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={styles.iconContainer}>
                        <Ionicons 
                            name={isSuccess ? "checkmark-circle" : "close-circle"} 
                            size={24} 
                            color={isSuccess ? COLORS.success : COLORS.error} 
                        />
                    </View>
                    <View style={styles.headerText}>
                        <Text style={styles.serviceName} numberOfLines={1}>
                            {item.booking?.service?.title || 'Service Payment'}
                        </Text>
                        <Text style={styles.dateText}>
                            {dayjs(item.createdAt).format('MMM DD, YYYY • hh:mm A')}
                        </Text>
                    </View>
                    <Text style={styles.amountText}>
                        {formatCurrency(item.amount)}
                    </Text>
                </View>
                
                <View style={styles.cardFooter}>
                    <Text style={styles.transactionIdText}>
                        ID: {item.razorpayPaymentId || item.id}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: isSuccess ? COLORS.success + '1A' : COLORS.error + '1A' }]}>
                        <Text style={[styles.statusText, { color: isSuccess ? COLORS.success : COLORS.error }]}>
                            {isSuccess ? 'Successful' : 'Failed'}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Transaction History</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : error ? (
                <View style={styles.centerContainer}>
                    <Ionicons name="alert-circle-outline" size={60} color={COLORS.error} />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchHistory}>
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : transactions.length === 0 ? (
                <View style={styles.centerContainer}>
                    <Ionicons name="receipt-outline" size={80} color={COLORS.lightGray} />
                    <Text style={styles.emptyTitle}>No Transactions Yet</Text>
                    <Text style={styles.emptySubtitle}>When you book services, your payments will appear here.</Text>
                </View>
            ) : (
                <FlatList
                    data={transactions}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
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
    listContent: {
        padding: SPACING.lg,
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    headerText: {
        flex: 1,
    },
    serviceName: {
        ...TYPOGRAPHY.subtitle1,
        color: COLORS.textPrimary,
        marginBottom: 2,
    },
    dateText: {
        ...TYPOGRAPHY.caption,
        color: COLORS.textSecondary,
    },
    amountText: {
        ...TYPOGRAPHY.h4,
        color: COLORS.textPrimary,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: COLORS.background,
        paddingTop: SPACING.sm,
    },
    transactionIdText: {
        ...TYPOGRAPHY.caption,
        color: COLORS.textSecondary,
    },
    statusBadge: {
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4,
        borderRadius: BORDER_RADIUS.sm,
    },
    statusText: {
        ...TYPOGRAPHY.caption,
        fontWeight: 'bold',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    emptyTitle: {
        ...TYPOGRAPHY.h3,
        color: COLORS.textPrimary,
        marginTop: SPACING.md,
        marginBottom: SPACING.sm,
    },
    emptySubtitle: {
        ...TYPOGRAPHY.body2,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    errorText: {
        ...TYPOGRAPHY.body1,
        color: COLORS.textSecondary,
        marginTop: SPACING.md,
        marginBottom: SPACING.lg,
    },
    retryButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.md,
    },
    retryText: {
        color: COLORS.white,
        fontWeight: 'bold',
    },
});

export default TransactionHistoryScreen;
