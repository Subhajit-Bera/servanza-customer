import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    TextInput,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, TYPOGRAPHY, SHADOWS, SPACING, BORDER_RADIUS, formatCurrency } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { removeFromCart, updateQuantity, clearCart, applyCoupon, removeCoupon, setCouponError, clearCouponError, addToCart } from '../../store/slices/cartSlice';
import { couponApi } from '../../api/client';
import { useAuthGate } from '../../hooks/useAuthGate';
import type { CartStackParamList } from '../../navigation/MainNavigator';
import type { CartItem } from '../../types';

type CartNavigationProp = StackNavigationProp<CartStackParamList, 'Cart'>;

const CartScreen: React.FC = () => {
    const navigation = useNavigation<CartNavigationProp>();
    const dispatch = useAppDispatch();
    const { requireAuth, isGuestUser } = useAuthGate();

    const { items, subtotal, tax, total, totalItems, appliedCoupon, couponError } = useAppSelector((state) => state.cart);
    const { services } = useAppSelector((state) => state.services);
    
    // Top 4 services as similar services
    const similarServices = services.slice(0, 4);

    // Checkbox selection: track selected IDs explicitly (all start selected)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(
        () => new Set(items.map(i => i.service.id))
    );
    const [couponCode, setCouponCode] = useState('');
    const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
    const [isBreakdownExpanded, setIsBreakdownExpanded] = useState(false);

    const handleQuantityChange = (serviceId: string, delta: number) => {
        const item = items.find(i => i.service.id === serviceId);
        if (item) {
            dispatch(updateQuantity({
                serviceId,
                quantity: Math.max(0, item.quantity + delta)
            }));
        }
    };

    const handleRemove = (serviceId: string) => {
        Alert.alert(
            'Remove Item',
            'Are you sure you want to remove this item?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => dispatch(removeFromCart(serviceId))
                }
            ]
        );
    };

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;

        setIsValidatingCoupon(true);
        dispatch(clearCouponError());

        try {
            const { data } = await couponApi.validateCoupon(couponCode.trim().toUpperCase());
            const coupon = data.data || data;

            if (coupon && coupon.isActive) {
                if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
                    dispatch(setCouponError(`Minimum order amount is ${formatCurrency(coupon.minOrderAmount)}`));
                    return;
                }

                dispatch(applyCoupon({
                    code: coupon.code,
                    discountType: coupon.discountType,
                    discountValue: coupon.discountValue,
                }));
                setCouponCode('');
            } else {
                dispatch(setCouponError('Invalid or expired coupon code'));
            }
        } catch (error: any) {
            dispatch(setCouponError(error.response?.data?.message || 'Invalid coupon code'));
        } finally {
            setIsValidatingCoupon(false);
        }
    };

    const handleRemoveCoupon = () => {
        dispatch(removeCoupon());
    };

    const handleProceed = () => {
        const selectedItems = items.filter(i => selectedIds.has(i.service.id));
        const hasInstant = selectedItems.some(i => i.service.isInstant);
        const hasScheduled = selectedItems.some(i => !i.service.isInstant);

        if (hasInstant && hasScheduled) {
            Alert.alert(
                'Mixed Services Detected',
                'Your selection contains both instant and scheduled services. Please checkout instant and scheduled services separately.'
            );
            return;
        }

        requireAuth(
            () => navigation.navigate('BookingForm', { selectedIds: Array.from(selectedIds) }),
            'BookingForm',
            { selectedIds: Array.from(selectedIds) }
        );
    };

    // Toggle individual item selection
    const toggleSelect = (serviceId: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(serviceId)) {
                next.delete(serviceId);
            } else {
                next.add(serviceId);
            }
            return next;
        });
    };

    // All selected when every item ID is in the set
    const isAllSelected = items.length > 0 && items.every(i => selectedIds.has(i.service.id));
    const effectivelySelected = items.filter(i => selectedIds.has(i.service.id));

    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedIds(new Set()); // deselect all
        } else {
            setSelectedIds(new Set(items.map(i => i.service.id))); // select all
        }
    };

    const isItemSelected = (serviceId: string) => selectedIds.has(serviceId);

    // Subtotal of selected items only
    const selectedSubtotal = effectivelySelected.reduce(
        (sum, i) => sum + i.service.basePrice * i.quantity, 0
    );
    const selectedTax = Math.round(selectedSubtotal * 0.18);
    const couponDiscount = appliedCoupon?.discountAmount || 0;
    const selectedTotal = selectedSubtotal + selectedTax - couponDiscount;

    const handleClearCart = () => {
        Alert.alert(
            'Clear Cart',
            'Remove all items from your cart?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear', style: 'destructive', onPress: () => dispatch(clearCart()) },
            ]
        );
    };

    const renderItem = ({ item }: { item: CartItem }) => {
        const selected = isItemSelected(item.service.id);
        return (
            <View style={[styles.cartItem, !selected && styles.cartItemDimmed]}>
                {/* Checkbox */}
                <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => toggleSelect(item.service.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <View style={[styles.checkboxInner, selected && styles.checkboxChecked]}>
                        {selected && <Ionicons name="checkmark" size={14} color={COLORS.white} />}
                    </View>
                </TouchableOpacity>

                <View style={styles.itemImageContainer}>
                    {item.service.imageUrl ? (
                        <Image source={{ uri: item.service.imageUrl }} style={styles.itemImage} />
                    ) : (
                        <View style={styles.itemPlaceholder}>
                            <Ionicons name="construct" size={24} color={COLORS.textLight} />
                        </View>
                    )}
                </View>
                <View style={styles.itemInfo}>
                    <View style={styles.itemHeader}>
                        <Text style={styles.itemTitle} numberOfLines={2}>{item.service.title}</Text>
                        <TouchableOpacity
                            onPress={() => handleRemove(item.service.id)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.itemMeta}>
                        <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
                        <Text style={styles.itemDuration}>{item.service.durationMins} mins</Text>
                    </View>

                    <View style={styles.itemFooter}>
                        <Text style={styles.itemPrice}>{formatCurrency(item.service.basePrice)}</Text>

                        <View style={styles.quantityContainer}>
                            <TouchableOpacity
                                style={styles.quantityButton}
                                onPress={() => handleQuantityChange(item.service.id, -1)}
                            >
                                <Ionicons name="remove" size={16} color={COLORS.textPrimary} />
                            </TouchableOpacity>
                            <Text style={styles.quantityText}>{item.quantity}</Text>
                            <TouchableOpacity
                                style={styles.quantityButton}
                                onPress={() => handleQuantityChange(item.service.id, 1)}
                            >
                                <Ionicons name="add" size={16} color={COLORS.textPrimary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    const renderCouponSection = () => (
        <View style={styles.couponSection}>
            <Text style={styles.sectionTitle}>Offers & Benefits</Text>

            {appliedCoupon ? (
                <View style={styles.appliedCouponCard}>
                    <View style={styles.appliedCouponIcon}>
                        <Ionicons name="pricetag" size={20} color={COLORS.white} />
                    </View>
                    <View style={styles.appliedCouponInfo}>
                        <Text style={styles.couponAppliedLabel}>
                            '{appliedCoupon.code}' Applied
                        </Text>
                        <Text style={styles.couponSavings}>
                            You save {formatCurrency(appliedCoupon.discountAmount || 0)}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={handleRemoveCoupon} style={styles.removeCouponButton}>
                        <Ionicons name="close" size={18} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.couponInputContainer}>
                    <View style={styles.couponInputWrapper}>
                        <Ionicons name="pricetag-outline" size={20} color={COLORS.textLight} />
                        <TextInput
                            style={styles.couponInput}
                            placeholder="Enter Promo Code"
                            placeholderTextColor={COLORS.textLight}
                            value={couponCode}
                            onChangeText={setCouponCode}
                            autoCapitalize="characters"
                        />
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.applyButton,
                            (!couponCode.trim() || isValidatingCoupon) && styles.applyButtonDisabled
                        ]}
                        onPress={handleApplyCoupon}
                        disabled={!couponCode.trim() || isValidatingCoupon}
                    >
                        {isValidatingCoupon ? (
                            <ActivityIndicator size="small" color={COLORS.primary} />
                        ) : (
                            <Text style={styles.applyButtonText}>Apply</Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {couponError ? (
                <Text style={styles.couponError}>{couponError}</Text>
            ) : null}
        </View>
    );

    const renderSimilarServices = () => (
        <View style={styles.similarServicesSection}>
            <Text style={styles.sectionTitle}>Similar Services</Text>
            <FlatList
                data={similarServices}
                keyExtractor={(item) => `similar-${item.id}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: SPACING.md }}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[styles.serviceCard, { width: 160 }]}
                        onPress={() => (navigation as any).navigate('ServiceDetails', { serviceId: item.id })}
                        activeOpacity={0.9}
                    >
                        <View style={styles.serviceImageContainer}>
                            {item.imageUrl ? (
                                <Image source={{ uri: item.imageUrl }} style={styles.serviceImage} />
                            ) : (
                                <View style={styles.servicePlaceholder}>
                                    <Ionicons name="construct" size={24} color={COLORS.lightGray} />
                                </View>
                            )}
                        </View>
                        <View style={styles.serviceInfo}>
                            <Text style={styles.serviceTitle} numberOfLines={2}>{item.title}</Text>
                            <View style={styles.servicePriceRow}>
                                <Text style={styles.servicePrice}>₹{item.basePrice}</Text>
                                <TouchableOpacity
                                    style={styles.addButton}
                                    onPress={() => dispatch(addToCart({ service: item, quantity: 1 }))}
                                >
                                    <Ionicons name="add" size={16} color={COLORS.white} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
            />
        </View>
    );

    if (items.length === 0) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>My Cart</Text>
                </View>
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconContainer}>
                        <Ionicons name="cart-outline" size={64} color={COLORS.primary} />
                    </View>
                    <Text style={styles.emptyTitle}>Your cart is empty</Text>
                    <Text style={styles.emptyText}>
                        Looks like you haven't added any services yet.
                    </Text>
                    <TouchableOpacity
                        style={styles.browseButton}
                        onPress={() => navigation.getParent()?.navigate('HomeTab')}
                    >
                        <Text style={styles.browseButtonText}>Browse Services</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Cart ({totalItems})</Text>
                <View style={styles.headerActions}>
                    <TouchableOpacity onPress={toggleSelectAll} style={styles.selectAllBtn}>
                        <Text style={styles.selectAllText}>
                            {isAllSelected ? 'Deselect All' : 'Select All'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleClearCart}>
                        <Text style={styles.clearText}>Clear</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Cart Items */}
            <FlatList
                data={items}
                keyExtractor={(item) => item.service.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                ListFooterComponent={
                    <View>
                        {renderCouponSection()}
                        {similarServices.length > 0 && renderSimilarServices()}
                    </View>
                }
            />


            {/* Summary Footer */}
            <View style={styles.footer}>
                <View style={styles.summaryContainer}>
                    {/* Per-item price breakdown (Accordion) */}
                    {isBreakdownExpanded && effectivelySelected.length > 0 && (
                        <View style={{ marginBottom: 4 }}>
                            {effectivelySelected.map((item) => (
                                <View style={[styles.summaryRow, { marginTop: 4 }]} key={`breakdown-${item.service.id}`}>
                                    <Text style={[styles.summaryLabel, { color: COLORS.textPrimary }]} numberOfLines={1}>
                                        {item.service.title} × {item.quantity}
                                    </Text>
                                    <Text style={[styles.summaryValue, { fontSize: TYPOGRAPHY.fontSize.sm }]}>
                                        {formatCurrency(item.service.basePrice * item.quantity)}
                                    </Text>
                                </View>
                            ))}
                            <View style={[styles.divider, { marginTop: 8 }]} />
                        </View>
                    )}

                    <TouchableOpacity 
                        style={styles.summaryRow}
                        onPress={() => setIsBreakdownExpanded(!isBreakdownExpanded)}
                        activeOpacity={0.7}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Text style={styles.summaryLabel}>
                                Subtotal ({effectivelySelected.length} item{effectivelySelected.length !== 1 ? 's' : ''})
                            </Text>
                            {effectivelySelected.length > 0 && (
                                <Ionicons 
                                    name={isBreakdownExpanded ? 'chevron-up' : 'chevron-down'} 
                                    size={16} 
                                    color={COLORS.textSecondary} 
                                />
                            )}
                        </View>
                        <Text style={styles.summaryValue}>{formatCurrency(selectedSubtotal)}</Text>
                    </TouchableOpacity>

                    {appliedCoupon && (
                        <View style={styles.summaryRow}>
                            <Text style={styles.discountLabel}>Discount</Text>
                            <Text style={styles.discountValue}>-{formatCurrency(couponDiscount)}</Text>
                        </View>
                    )}

                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Tax (18%)</Text>
                        <Text style={styles.summaryValue}>{formatCurrency(selectedTax)}</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>{formatCurrency(selectedTotal)}</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={[
                        styles.proceedButton,
                        effectivelySelected.length === 0 && styles.proceedButtonDisabled,
                    ]}
                    onPress={handleProceed}
                    activeOpacity={0.9}
                    disabled={effectivelySelected.length === 0}
                >
                    <Text style={styles.proceedButtonText}>
                        Proceed to Checkout{effectivelySelected.length > 0 ? ` (${effectivelySelected.length})` : ''}
                    </Text>
                    <View style={styles.proceedIconContainer}>
                        <Ionicons name="arrow-forward" size={20} color={COLORS.primary} />
                    </View>
                </TouchableOpacity>
            </View>
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
        paddingVertical: SPACING.lg,
        backgroundColor: COLORS.background,
    },
    headerTitle: {
        fontSize: TYPOGRAPHY.fontSize.display,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.textPrimary,
    },
    clearText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        color: COLORS.error,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    selectAllBtn: {
        paddingHorizontal: SPACING.sm,
    },
    selectAllText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        color: COLORS.primary,
    },
    checkbox: {
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.sm,
    },
    checkboxInner: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: COLORS.border,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    cartItemDimmed: {
        opacity: 0.45,
    },
    proceedButtonDisabled: {
        backgroundColor: COLORS.lightGray,
    },
    listContent: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: 200, // Space for footer
    },
    cartItem: {
        flexDirection: 'row',
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        ...SHADOWS.light,
    },
    itemImageContainer: {
        width: 80,
        height: 80,
        borderRadius: BORDER_RADIUS.lg,
        backgroundColor: COLORS.background,
        overflow: 'hidden',
    },
    itemImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    itemPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemInfo: {
        flex: 1,
        marginLeft: SPACING.md,
        justifyContent: 'space-between',
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    itemTitle: {
        flex: 1,
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.textPrimary,
        marginRight: SPACING.sm,
    },
    itemMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    itemDuration: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.textSecondary,
    },
    itemFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    itemPrice: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.primary,
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderRadius: BORDER_RADIUS.lg,
        padding: 4,
    },
    quantityButton: {
        width: 28,
        height: 28,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: BORDER_RADIUS.sm,
        backgroundColor: COLORS.white,
        ...SHADOWS.light,
    },
    quantityText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.textPrimary,
        marginHorizontal: 12,
    },
    sectionTitle: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.textPrimary,
        marginBottom: SPACING.md,
        marginTop: SPACING.md,
    },
    couponSection: {
        marginTop: SPACING.sm,
        // marginBottom: SPACING.sm,
    },
    couponInputContainer: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    couponInputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.xl,
        paddingHorizontal: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    couponInput: {
        flex: 1,
        paddingVertical: 12,
        marginLeft: SPACING.sm,
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.textPrimary,
    },
    applyButton: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
    },
    applyButtonDisabled: {
        opacity: 0.5,
    },
    applyButtonText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.primary,
    },
    couponError: {
        color: COLORS.error,
        fontSize: TYPOGRAPHY.fontSize.sm,
        marginTop: 8,
        marginLeft: 4,
    },
    appliedCouponCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.success + '15', // 15% opacity
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.success,
    },
    appliedCouponIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.success,
        justifyContent: 'center',
        alignItems: 'center',
    },
    appliedCouponInfo: {
        flex: 1,
        marginLeft: SPACING.md,
    },
    couponAppliedLabel: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.success,
    },
    couponSavings: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.success,
        marginTop: 2,
    },
    removeCouponButton: {
        padding: SPACING.sm,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.white,
        borderTopLeftRadius: BORDER_RADIUS.xxl,
        borderTopRightRadius: BORDER_RADIUS.xxl,
        padding: SPACING.lg,
        ...SHADOWS.heavy,
    },
    summaryContainer: {
        marginBottom: SPACING.lg,
        gap: 8,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.textSecondary,
    },
    summaryValue: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.textPrimary,
    },
    discountLabel: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.success,
    },
    discountValue: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.success,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.divider,
        // marginVertical: 1,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        // marginTop: 1,
    },
    totalLabel: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.textPrimary,
    },
    totalValue: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.textPrimary,
    },
    proceedButton: {
        flexDirection: 'row',
        backgroundColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.xxl,
        paddingVertical: SPACING.lg,
        paddingHorizontal: SPACING.xl,
        alignItems: 'center',
        justifyContent: 'space-between',
        ...SHADOWS.green,
    },
    proceedButtonText: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.white,
    },
    proceedIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xxl,
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    emptyTitle: {
        fontSize: TYPOGRAPHY.fontSize.xxl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.textPrimary,
        marginBottom: SPACING.sm,
    },
    emptyText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: SPACING.xxl,
    },
    browseButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.xxl,
        borderRadius: BORDER_RADIUS.xl,
        ...SHADOWS.green,
    },
    browseButtonText: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.white,
    },
    similarServicesSection: {
        marginTop: SPACING.sm,
        marginBottom: SPACING.xl,
    },
    serviceCard: {
        backgroundColor: COLORS.white,
        borderRadius: BORDER_RADIUS.lg,
        overflow: 'hidden',
        ...SHADOWS.light,
        marginBottom: SPACING.sm,
    },
    serviceImageContainer: {
        height: 100,
        backgroundColor: COLORS.lightGray,
    },
    serviceImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    servicePlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    serviceInfo: {
        padding: SPACING.md,
    },
    serviceTitle: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.textPrimary,
        marginBottom: SPACING.xs,
    },
    servicePriceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: SPACING.xs,
    },
    servicePrice: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.primary,
    },
    addButton: {
        backgroundColor: COLORS.primary,
        padding: 6,
        borderRadius: BORDER_RADIUS.md,
    },
});

export default CartScreen;
