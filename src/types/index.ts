// Type definitions for Servanza Customer App

// User & Auth Types
export interface User {
    id: string;
    email?: string;
    phone?: string;
    name: string;
    profileImage?: string;
    role: 'USER' | 'BUDDY' | 'ADMIN';
    isActive: boolean;
    emailVerified: boolean;
    phoneVerified: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

// Address Types
export interface Address {
    id: string;
    userId: string;
    label: string; // "Home", "Work", "Other"
    formattedAddress: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country: string;
    latitude: number;
    longitude: number;
    isDefault: boolean;
}

// Service Types
export interface Category {
    id: string;
    name: string;
    description?: string;
    slug: string;
    icon?: string;
    isActive: boolean;
    sortOrder: number;
}

export interface ServiceTypeVariant {
    label: string;
    description?: string;
    price?: number;
    durationMins?: number;
    whatsIncluded?: string[];
    whatsNotIncluded?: string[];
    productsUsed?: string[];
}

// export interface ServiceMetadata {
//     types?: Record<string, ServiceTypeVariant>;
//     [key: string]: any;
// }

export interface ServiceMetadata {
    whatsIncluded?: string[];
    whatsNotIncluded?: string[];
}

export interface ServiceDescription {
    shortDescription?: string;
    description?: string;
    whatsIncluded?: string[];
    whatsNotIncluded?: string[];
    productsWeUse?: string[];
    productsNeededFromCustomer?: string[];
}

export interface Service {
    id: string;
    categoryId: string;
    title: string;
    description?: ServiceDescription | null;
    durationMins: number;
    basePrice: number;
    currency: string;
    imageUrl?: string;
    isActive: boolean;
    category?: Category;
    averageRating?: number;
    totalReviews?: number;
    metadata?: ServiceMetadata;
}

// Cart Types
export interface CartItem {
    service: Service;
    quantity: number;
    selectedOptions?: Record<string, any>;
}

export interface CartState {
    items: CartItem[];
    totalItems: number;
    subtotal: number;
    tax: number;
    total: number;
}

// Booking Types
export type BookingStatus =
    | 'PENDING'
    | 'QUEUED'
    | 'ASSIGNED'
    | 'ACCEPTED'
    | 'ON_WAY'
    | 'ARRIVED'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'FAILED'
    | 'ESCALATED';

export type PaymentMethod = 'PREPAID' | 'CASH';
export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface Booking {
    id: string;
    userId: string;
    serviceId: string;
    addressId: string;
    scheduledStart: string;
    scheduledEnd: string;
    isImmediate: boolean;
    status: BookingStatus;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    price: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
    currency: string;
    specialInstructions?: string;
    completionOtp?: string;
    completedAt?: string;
    cancelledAt?: string;
    cancellationReason?: string;
    createdAt: string;
    updatedAt: string;
    service?: Service;
    address?: Address;
    buddy?: BuddyInfo;
    review?: Review;
}

export interface BuddyInfo {
    id: string;
    name: string;
    phone?: string;
    profileImage?: string;
    rating: number;
    avgRating?: number; // Alias for rating
    totalJobs: number;
    currentLocation?: {
        latitude: number;
        longitude: number;
    };
}

// Review Types
export interface Review {
    id: string;
    bookingId: string;
    userId: string;
    buddyId: string;
    rating: number;
    comment?: string;
    createdAt: string;
    updatedAt?: string;
    user?: {
        id: string;
        name: string;
        profileImage?: string;
    };
}

// Notification Types
export type NotificationType =
    | 'BOOKING_CREATED'
    | 'BOOKING_ASSIGNED'
    | 'BOOKING_ACCEPTED'
    | 'BOOKING_STARTED'
    | 'BOOKING_COMPLETED'
    | 'BOOKING_CANCELLED'
    | 'PAYMENT_RECEIVED'
    | 'RATING_RECEIVED'
    | 'GENERAL';

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    body: string;
    data?: Record<string, any>;
    isRead: boolean;
    createdAt: string;
}

// API Response Types
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

// Payment Types
export interface RazorpayOrder {
    id: string;
    amount: number;
    currency: string;
    receipt: string;
}

export interface PaymentVerification {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

// Socket Event Types
export interface BuddyLocationUpdate {
    bookingId: string;
    latitude: number;
    longitude: number;
    bearing?: number;
    eta?: number;
}

export interface BookingStatusUpdate {
    bookingId: string;
    status: BookingStatus;
    buddyName?: string;
    buddyPhoto?: string;
    otp?: string;
    timestamp: string;
}

// Coupon Types
export interface Coupon {
    id: string;
    code: string;
    discountType: 'PERCENTAGE' | 'FIXED';
    discountValue: number;
    minOrderAmount?: number;
    maxDiscount?: number;
    validFrom: string;
    validUntil: string;
    isActive: boolean;
}

export interface AppliedCoupon {
    coupon: Coupon;
    discountAmount: number;
}

// Favorite Types
export interface Favorite {
    id: string;
    userId: string;
    serviceId: string;
    service: Service;
    createdAt: string;
}

