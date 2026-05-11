import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Service, CartItem } from '../../types';
import { servicesApi } from '../../api/client';

const CART_STORAGE_KEY = 'servanza_cart';

const TAX_RATE = 0.18; // 18% GST

// Extended Cart State with coupon
interface ExtendedCartState {
    items: CartItem[];
    totalItems: number;
    subtotal: number;
    tax: number;
    total: number;
    // Coupon fields
    appliedCoupon: {
        code: string;
        discountType: 'PERCENTAGE' | 'FIXED';
        discountValue: number;
        discountAmount: number;
    } | null;
    couponError: string | null;
}

const initialState: ExtendedCartState = {
    items: [],
    totalItems: 0,
    subtotal: 0,
    tax: 0,
    total: 0,
    appliedCoupon: null,
    couponError: null,
};

// Helper to calculate totals (with optional coupon discount)
const calculateTotals = (items: CartItem[], appliedCoupon: ExtendedCartState['appliedCoupon'] = null) => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + (item.service.basePrice * item.quantity), 0);

    // Calculate coupon discount
    let discountAmount = 0;
    if (appliedCoupon) {
        if (appliedCoupon.discountType === 'PERCENTAGE') {
            discountAmount = Math.round(subtotal * (appliedCoupon.discountValue / 100));
        } else {
            discountAmount = appliedCoupon.discountValue;
        }
        // Make sure discount doesn't exceed subtotal
        discountAmount = Math.min(discountAmount, subtotal);
    }

    const discountedSubtotal = subtotal - discountAmount;
    const tax = Math.round(discountedSubtotal * TAX_RATE);
    const total = discountedSubtotal + tax;

    return { totalItems, subtotal, tax, total, discountAmount };
};

// Helper to persist cart to AsyncStorage
const persistCart = async (items: CartItem[]) => {
    try {
        await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
        console.error('Failed to persist cart:', error);
    }
};

const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        // Load cart from storage
        loadCart: (state, action: PayloadAction<CartItem[]>) => {
            state.items = action.payload;
            const totals = calculateTotals(action.payload, state.appliedCoupon);
            state.totalItems = totals.totalItems;
            state.subtotal = totals.subtotal;
            state.tax = totals.tax;
            state.total = totals.total;
            if (state.appliedCoupon) {
                state.appliedCoupon.discountAmount = totals.discountAmount;
            }
        },

        // Add item to cart
        addToCart: (state, action: PayloadAction<{ service: Service; quantity?: number; options?: Record<string, any> }>) => {
            const { service, quantity = 1, options } = action.payload;
            const existingIndex = state.items.findIndex(item => item.service.id === service.id);

            if (existingIndex !== -1) {
                state.items[existingIndex].quantity += quantity;
            } else {
                state.items.push({ service, quantity, selectedOptions: options });
            }

            const totals = calculateTotals(state.items, state.appliedCoupon);
            state.totalItems = totals.totalItems;
            state.subtotal = totals.subtotal;
            state.tax = totals.tax;
            state.total = totals.total;
            if (state.appliedCoupon) {
                state.appliedCoupon.discountAmount = totals.discountAmount;
            }

            persistCart(state.items);
        },

        // Remove item from cart
        removeFromCart: (state, action: PayloadAction<string>) => {
            state.items = state.items.filter(item => item.service.id !== action.payload);

            const totals = calculateTotals(state.items, state.appliedCoupon);
            state.totalItems = totals.totalItems;
            state.subtotal = totals.subtotal;
            state.tax = totals.tax;
            state.total = totals.total;
            if (state.appliedCoupon) {
                state.appliedCoupon.discountAmount = totals.discountAmount;
            }

            persistCart(state.items);
        },

        // Remove multiple items from cart
        removeMultipleFromCart: (state, action: PayloadAction<string[]>) => {
            state.items = state.items.filter(item => !action.payload.includes(item.service.id));

            const totals = calculateTotals(state.items, state.appliedCoupon);
            state.totalItems = totals.totalItems;
            state.subtotal = totals.subtotal;
            state.tax = totals.tax;
            state.total = totals.total;
            if (state.appliedCoupon) {
                state.appliedCoupon.discountAmount = totals.discountAmount;
            }

            persistCart(state.items);
        },

        // Update quantity
        updateQuantity: (state, action: PayloadAction<{ serviceId: string; quantity: number }>) => {
            const { serviceId, quantity } = action.payload;
            const index = state.items.findIndex(item => item.service.id === serviceId);

            if (index !== -1) {
                if (quantity <= 0) {
                    state.items.splice(index, 1);
                } else {
                    state.items[index].quantity = quantity;
                }
            }

            const totals = calculateTotals(state.items, state.appliedCoupon);
            state.totalItems = totals.totalItems;
            state.subtotal = totals.subtotal;
            state.tax = totals.tax;
            state.total = totals.total;
            if (state.appliedCoupon) {
                state.appliedCoupon.discountAmount = totals.discountAmount;
            }

            persistCart(state.items);
        },

        // Apply coupon
        applyCoupon: (state, action: PayloadAction<{
            code: string;
            discountType: 'PERCENTAGE' | 'FIXED';
            discountValue: number;
        }>) => {
            const { code, discountType, discountValue } = action.payload;

            state.appliedCoupon = {
                code,
                discountType,
                discountValue,
                discountAmount: 0, // Will be calculated
            };
            state.couponError = null;

            const totals = calculateTotals(state.items, state.appliedCoupon);
            state.subtotal = totals.subtotal;
            state.tax = totals.tax;
            state.total = totals.total;
            state.appliedCoupon.discountAmount = totals.discountAmount;
        },

        // Remove coupon
        removeCoupon: (state) => {
            state.appliedCoupon = null;
            state.couponError = null;

            const totals = calculateTotals(state.items, null);
            state.subtotal = totals.subtotal;
            state.tax = totals.tax;
            state.total = totals.total;
        },

        // Set coupon error
        setCouponError: (state, action: PayloadAction<string>) => {
            state.couponError = action.payload;
            state.appliedCoupon = null;
        },

        // Clear coupon error
        clearCouponError: (state) => {
            state.couponError = null;
        },

        // Clear cart
        clearCart: (state) => {
            state.items = [];
            state.totalItems = 0;
            state.subtotal = 0;
            state.tax = 0;
            state.total = 0;
            state.appliedCoupon = null;
            state.couponError = null;

            AsyncStorage.removeItem(CART_STORAGE_KEY);
        },
        // Update cart items with fresh service data (for price refreshes)
        updateCartItems: (state, action: PayloadAction<CartItem[]>) => {
            state.items = action.payload;
            const totals = calculateTotals(action.payload, state.appliedCoupon);
            state.totalItems = totals.totalItems;
            state.subtotal = totals.subtotal;
            state.tax = totals.tax;
            state.total = totals.total;
            if (state.appliedCoupon) {
                state.appliedCoupon.discountAmount = totals.discountAmount;
            }
            persistCart(action.payload);
        },
    },
});

// Thunk to load cart from storage on app start
export const loadCartFromStorage = () => async (dispatch: any) => {
    try {
        const cartData = await AsyncStorage.getItem(CART_STORAGE_KEY);
        if (cartData) {
            const items = JSON.parse(cartData);
            dispatch(cartSlice.actions.loadCart(items));
        }
    } catch (error) {
        console.error('Failed to load cart from storage:', error);
    }
};

// Thunk to refresh cart prices from server
export const refreshCartPrices = () => async (dispatch: any, getState: any) => {
    try {
        const { items } = getState().cart;
        if (!items || items.length === 0) return;

        // Fetch fresh service data for all items in cart
        const updatedItems: CartItem[] = [];
        let pricesChanged = false;

        for (const item of items) {
            try {
                const { data: response } = await servicesApi.getServiceById(item.service.id);
                const freshService = response.data || response;

                if (freshService && freshService.basePrice !== item.service.basePrice) {
                    console.log(`Price updated for ${freshService.title}: ${item.service.basePrice} → ${freshService.basePrice}`);
                    pricesChanged = true;
                }

                updatedItems.push({
                    ...item,
                    service: freshService || item.service,
                });
            } catch (err) {
                // If fetch fails, keep the cached item
                updatedItems.push(item);
            }
        }

        if (pricesChanged) {
            dispatch(cartSlice.actions.updateCartItems(updatedItems));
        }
    } catch (error) {
        console.error('Failed to refresh cart prices:', error);
    }
};

export const {
    loadCart,
    addToCart,
    removeFromCart,
    removeMultipleFromCart,
    updateQuantity,
    updateCartItems,
    applyCoupon,
    removeCoupon,
    setCouponError,
    clearCouponError,
    clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;
