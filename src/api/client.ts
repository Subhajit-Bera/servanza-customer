import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { CONFIG } from '../config/constants';

// Lazy import to avoid circular dependency: store → authSlice → client → store
// We import dynamically so the store is fully initialized before first use.
let _store: any;
export const injectStore = (s: any) => { _store = s; };

const BASE_URL = CONFIG.API_BASE_URL;

// Create axios instance
const apiClient = axios.create({
    baseURL: BASE_URL,
    timeout: CONFIG.API_TIMEOUT,
    headers: { 'Content-Type': 'application/json' },
});

// Request Interceptor: Attach Token
apiClient.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Token refresh queue
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Response Interceptor: Handle Token Expiry (401)
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers['Authorization'] = 'Bearer ' + token;
                        return apiClient(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = await SecureStore.getItemAsync('refresh_token');

                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }

                const response = await axios.post(`${BASE_URL}/auth/refresh-token`, {
                    refreshToken,
                });

                const { accessToken, refreshToken: newRefreshToken } = response.data.data;

                await SecureStore.setItemAsync('auth_token', accessToken);
                await SecureStore.setItemAsync('refresh_token', newRefreshToken);

                apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;

                processQueue(null, accessToken);
                isRefreshing = false;

                return apiClient(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                isRefreshing = false;

                await SecureStore.deleteItemAsync('auth_token');
                await SecureStore.deleteItemAsync('refresh_token');

                // Dispatch logout to Redux so the UI immediately returns to Login screen
                if (_store) {
                    const { logout } = await import('../store/slices/authSlice');
                    _store.dispatch(logout());
                }

                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

// Auth API
export const authApi = {
    checkPhone: (phone: string) =>
        apiClient.post('/auth/check-phone', { phone, role: 'USER' }),

    // Phone-specific Firebase auth (legacy)
    verifyFirebasePhone: (idToken: string) =>
        apiClient.post('/auth/phone/firebase', { idToken, role: 'USER' }),

    // Generic Firebase auth - works with email, Google, phone
    verifyFirebaseToken: (idToken: string) =>
        apiClient.post('/auth/firebase', { idToken, role: 'USER' }),

    updateDeviceToken: (token: string) =>
        apiClient.post('/users/device-token', { token }),

    logout: () =>
        apiClient.post('/auth/logout'),
};

// User API
export const userApi = {
    getProfile: () => apiClient.get('/users/me'),
    updateProfile: (data: any) => apiClient.put('/users/me', data),
    uploadProfileImage: (formData: FormData) =>
        apiClient.post('/users/me/image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),

    // Addresses
    getAddresses: () => apiClient.get('/users/addresses'),
    addAddress: (data: any) => apiClient.post('/users/addresses', data),
    updateAddress: (id: string, data: any) => apiClient.put(`/users/addresses/${id}`, data),
    deleteAddress: (id: string) => apiClient.delete(`/users/addresses/${id}`),
    setDefaultAddress: (id: string) => apiClient.patch(`/users/addresses/${id}/default`),

    // Notifications
    getNotifications: (page = 1, limit = 20) =>
        apiClient.get('/users/notifications', { params: { page, limit } }),
    markNotificationRead: (id: string) =>
        apiClient.patch(`/users/notifications/${id}/read`),
    markAllNotificationsRead: () =>
        apiClient.patch('/users/notifications/read-all'),
    getNotificationPreferences: () =>
        apiClient.get('/users/me/notification-preferences'),
    updateNotificationPreferences: (data: any) =>
        apiClient.patch('/users/me/notification-preferences', data),
};

// Services API
export const servicesApi = {
    getServices: (params?: { categoryId?: string; search?: string }) =>
        apiClient.get('/services', { params }),
    getServiceById: (id: string) =>
        apiClient.get(`/services/${id}`),
    getServiceReviews: (id: string, page = 1, limit = 10) =>
        apiClient.get(`/services/${id}/reviews`, { params: { page, limit } }),
    getSimilarServices: (id: string, limit = 5) =>
        apiClient.get(`/services/${id}/similar`, { params: { limit } }),
    getTrendingServices: (limit = 10) =>
        apiClient.get('/services/trending', { params: { limit } }),
    getCategories: () =>
        apiClient.get('/services/categories'),
    getCategoryBySlug: (slug: string) =>
        apiClient.get(`/services/categories/${slug}`),
};

// Booking API
export const bookingApi = {
    validateCart: (data: { items: any[]; total: number }) =>
        apiClient.post('/bookings/validate-cart', data),
    createBooking: (data: any) =>
        apiClient.post('/bookings', data),
    getBookings: (params?: { status?: string; page?: number; limit?: number }) =>
        apiClient.get('/bookings', { params }),
    getBookingById: (id: string) =>
        apiClient.get(`/bookings/${id}`),
    cancelBooking: (id: string, reason?: string) =>
        apiClient.post(`/bookings/${id}/cancel`, { reason }),
    rescheduleBooking: (id: string, data: any) =>
        apiClient.post(`/bookings/${id}/reschedule`, data),

    // Status & Tracking
    getBookingStatus: (id: string) =>
        apiClient.get(`/bookings/${id}/status`),
    getBookingTimeline: (id: string) =>
        apiClient.get(`/bookings/${id}/timeline`),
    getBuddyLocation: (id: string) =>
        apiClient.get(`/bookings/${id}/buddy-location`),

    // OTP
    resendCompletionOTP: (id: string) =>
        apiClient.post(`/bookings/${id}/resend-otp`),

    // Reviews
    addReview: (bookingId: string, data: { rating: number; comment?: string }) =>
        apiClient.post(`/bookings/${bookingId}/review`, data),
    getBookingReview: (bookingId: string) =>
        apiClient.get(`/bookings/${bookingId}/review`),

    // Retry broadcast for finding buddy
    retryBroadcast: (id: string) =>
        apiClient.post(`/bookings/${id}/retry-broadcast`),
};

// Payment API
export const paymentApi = {
    createOrder: (data: { bookingId: string; amount: number }) =>
        apiClient.post('/payments/order', data),
    verifyPayment: (data: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
        bookingId: string;
    }) =>
        apiClient.post('/payments/confirm', data),
    getPaymentHistory: (params?: { page?: number; limit?: number }) =>
        apiClient.get('/payments/history', { params }),
};

// Coupon API
export const couponApi = {
    validateCoupon: (code: string) =>
        apiClient.post('/coupons/validate', { code }),
    getAvailableCoupons: () =>
        apiClient.get('/coupons/available'),
};

// Favorites API
export const favoritesApi = {
    getFavorites: () =>
        apiClient.get('/users/favorites'),
    addFavorite: (serviceId: string) =>
        apiClient.post('/users/favorites', { serviceId }),
    removeFavorite: (serviceId: string) =>
        apiClient.delete(`/users/favorites/${serviceId}`),
    isFavorite: (serviceId: string) =>
        apiClient.get(`/users/favorites/${serviceId}/check`),
};

// Promotions API
export const promotionsApi = {
    getPromotions: () =>
        apiClient.get('/promotions'),
};

// Reviews API
export const reviewsApi = {
    createReview: (data: { bookingId: string; rating: number; comment?: string }) =>
        apiClient.post('/reviews', data),
    updateReview: (id: string, data: { rating?: number; comment?: string }) =>
        apiClient.put(`/reviews/${id}`, data),
    getMyReviews: () =>
        apiClient.get('/reviews/my'),
    checkReview: (bookingId: string) =>
        apiClient.get(`/reviews/check/${bookingId}`),
};

export default apiClient;

