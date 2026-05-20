import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Alert,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme';
import { userApi } from '../../api/client';

// Address type
interface Address {
    id: string;
    label: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    latitude?: number;
    longitude?: number;
    isDefault: boolean;
}

const AddressesScreen: React.FC = () => {
    const navigation = useNavigation<StackNavigationProp<any>>();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Fetch addresses
    const fetchAddresses = async () => {
        try {
            const response = await userApi.getAddresses();
            const data = response.data?.data || response.data || [];
            setAddresses(Array.isArray(data) ? data : []);
        } catch (error: any) {
            console.error('Failed to fetch addresses:', error);
            // Don't show alert on fetch, just show empty state
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Fetch on focus
    useFocusEffect(
        useCallback(() => {
            fetchAddresses();
        }, [])
    );

    // Set default address
    const handleSetDefault = async (id: string) => {
        try {
            await userApi.setDefaultAddress(id);
            // Update local state
            setAddresses(prev => prev.map(addr => ({
                ...addr,
                isDefault: addr.id === id,
            })));
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to set default address');
        }
    };

    // Delete address
    const handleDelete = (address: Address) => {
        Alert.alert(
            'Delete Address',
            `Are you sure you want to delete "${address.label}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await userApi.deleteAddress(address.id);
                            setAddresses(prev => prev.filter(a => a.id !== address.id));
                        } catch (error: any) {
                            Alert.alert('Error', error.response?.data?.message || 'Failed to delete address');
                        }
                    },
                },
            ]
        );
    };

    // Edit address
    const handleEdit = (address: Address) => {
        navigation.navigate('AddAddress', { address });
    };

    // Add new address (with limit check)
    const handleAddAddress = () => {
        if (addresses.length >= 5) {
            Alert.alert(
                'Address Limit Reached',
                'You can have a maximum of 5 addresses. Please edit or delete an existing address.'
            );
            return;
        }
        navigation.navigate('AddAddress');
    };

    // Render address item
    const renderAddress = ({ item }: { item: Address }) => (
        <View style={styles.addressCard}>
            <View style={styles.addressHeader}>
                <View style={styles.labelContainer}>
                    <Ionicons
                        name={item.label.toLowerCase() === 'home' ? 'home' : item.label.toLowerCase() === 'work' ? 'business' : 'location'}
                        size={20}
                        color={COLORS.primary}
                    />
                    <Text style={styles.addressLabel}>{item.label}</Text>
                    {item.isDefault && (
                        <View style={styles.defaultBadge}>
                            <Text style={styles.defaultBadgeText}>Default</Text>
                        </View>
                    )}
                </View>
                <View style={styles.addressActions}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleEdit(item)}
                    >
                        <Ionicons name="pencil" size={18} color={COLORS.mediumGray} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleDelete(item)}
                    >
                        <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                    </TouchableOpacity>
                </View>
            </View>

            <Text style={styles.addressText}>{item.addressLine1}</Text>
            {item.addressLine2 && (
                <Text style={styles.addressText}>{item.addressLine2}</Text>
            )}
            <Text style={styles.addressText}>
                {item.city}, {item.state} - {item.pincode}
            </Text>

            {!item.isDefault && (
                <TouchableOpacity
                    style={styles.setDefaultButton}
                    onPress={() => handleSetDefault(item.id)}
                >
                    <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.primary} />
                    <Text style={styles.setDefaultText}>Set as default</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    // Empty state
    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={80} color={COLORS.lightGray} />
            <Text style={styles.emptyTitle}>No addresses saved</Text>
            <Text style={styles.emptySubtitle}>
                Add your addresses for faster booking
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.charcoal} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Addresses</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={handleAddAddress}
                >
                    <Ionicons name="add" size={24} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={addresses}
                    keyExtractor={(item) => item.id}
                    renderItem={renderAddress}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={renderEmpty}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => {
                                setRefreshing(true);
                                fetchAddresses();
                            }}
                            colors={[COLORS.primary]}
                        />
                    }
                />
            )}

            {/* Add New Address FAB */}
            <TouchableOpacity
                style={styles.fab}
                onPress={handleAddAddress}
            >
                <Ionicons name="add" size={28} color={COLORS.white} />
            </TouchableOpacity>
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
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: SPACING.lg,
        paddingBottom: 100,
    },
    addressCard: {
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.lg,
        marginBottom: SPACING.md,
        ...SHADOWS.light,
    },
    addressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    addressLabel: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.charcoal,
    },
    defaultBadge: {
        backgroundColor: COLORS.lightGreen,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
        borderRadius: BORDER_RADIUS.sm,
    },
    defaultBadgeText: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.primary,
    },
    addressActions: {
        flexDirection: 'row',
        gap: SPACING.xs,
    },
    actionButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.offWhite,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addressText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.darkGray,
        lineHeight: 22,
    },
    setDefaultButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        marginTop: SPACING.md,
        paddingTop: SPACING.md,
        borderTopWidth: 1,
        borderTopColor: COLORS.lightGray,
    },
    setDefaultText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.primary,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: SPACING.xxxl * 2,
    },
    emptyTitle: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.charcoal,
        marginTop: SPACING.lg,
    },
    emptySubtitle: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.mediumGray,
        marginTop: SPACING.sm,
        textAlign: 'center',
    },
    fab: {
        position: 'absolute',
        bottom: SPACING.xl,
        right: SPACING.lg,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...SHADOWS.medium,
    },
});

export default AddressesScreen;
