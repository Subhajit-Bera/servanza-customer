import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { bookingApi } from '../../api/client';
import type { Booking, BookingStatus } from '../../types';

interface BookingsState {
    bookings: Booking[];
    selectedBooking: Booking | null;
    activeBookingId: string | null;
    loading: boolean;
    error: string | null;
    statusFilter: BookingStatus | 'ALL';
}

const initialState: BookingsState = {
    bookings: [],
    selectedBooking: null,
    activeBookingId: null,
    loading: false,
    error: null,
    statusFilter: 'ALL',
};

// Fetch all bookings
export const fetchBookings = createAsyncThunk(
    'bookings/fetchBookings',
    async (params: { status?: string; page?: number; limit?: number } = {}, { rejectWithValue }) => {
        try {
            const response = await bookingApi.getBookings(params);
            const data = response.data.data || response.data;
            // Backend returns { bookings: [...], pagination: {...} }
            // Extract only the bookings array
            return Array.isArray(data) ? data : (data.bookings || []);
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch bookings');
        }
    }
);

// Fetch booking by ID
export const fetchBookingById = createAsyncThunk(
    'bookings/fetchBookingById',
    async (id: string, { rejectWithValue }) => {
        try {
            const response = await bookingApi.getBookingById(id);
            return response.data.data || response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch booking');
        }
    }
);

// Create booking
export const createBooking = createAsyncThunk(
    'bookings/createBooking',
    async (data: any, { rejectWithValue }) => {
        try {
            const response = await bookingApi.createBooking(data);
            return response.data.data || response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create booking');
        }
    }
);

// Cancel booking
export const cancelBooking = createAsyncThunk(
    'bookings/cancelBooking',
    async ({ id, reason }: { id: string; reason?: string }, { rejectWithValue }) => {
        try {
            const response = await bookingApi.cancelBooking(id, reason);
            return response.data.data || response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to cancel booking');
        }
    }
);

// Submit review
export const submitReview = createAsyncThunk(
    'bookings/submitReview',
    async ({ bookingId, rating, comment }: { bookingId: string; rating: number; comment?: string }, { rejectWithValue }) => {
        try {
            const response = await bookingApi.addReview(bookingId, { rating, comment });
            return { bookingId, review: response.data.data || response.data };
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to submit review');
        }
    }
);

// Get booking status
export const getBookingStatus = createAsyncThunk(
    'bookings/getBookingStatus',
    async (id: string, { rejectWithValue }) => {
        try {
            const response = await bookingApi.getBookingStatus(id);
            return { id, status: response.data.data || response.data };
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to get booking status');
        }
    }
);

const bookingsSlice = createSlice({
    name: 'bookings',
    initialState,
    reducers: {
        setStatusFilter: (state, action: PayloadAction<BookingStatus | 'ALL'>) => {
            state.statusFilter = action.payload;
        },
        setActiveBooking: (state, action: PayloadAction<string | null>) => {
            state.activeBookingId = action.payload;
        },
        clearSelectedBooking: (state) => {
            state.selectedBooking = null;
        },
        updateBookingStatus: (state, action: PayloadAction<{ bookingId: string; status: BookingStatus; otp?: string }>) => {
            const { bookingId, status, otp } = action.payload;

            // Update in list
            const index = state.bookings.findIndex(b => b.id === bookingId);
            if (index !== -1) {
                state.bookings[index].status = status;
                if (otp) {
                    state.bookings[index].completionOtp = otp;
                }
            }

            // Update selected booking
            if (state.selectedBooking?.id === bookingId) {
                state.selectedBooking.status = status;
                if (otp) {
                    state.selectedBooking.completionOtp = otp;
                }
            }
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch Bookings
            .addCase(fetchBookings.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchBookings.fulfilled, (state, action) => {
                state.loading = false;
                state.bookings = action.payload;
            })
            .addCase(fetchBookings.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Fetch Booking by ID
            .addCase(fetchBookingById.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchBookingById.fulfilled, (state, action) => {
                state.loading = false;
                state.selectedBooking = action.payload;
            })
            .addCase(fetchBookingById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Create Booking
            .addCase(createBooking.pending, (state) => {
                state.loading = true;
            })
            .addCase(createBooking.fulfilled, (state, action) => {
                state.loading = false;
                // Safety: ensure bookings is always an array
                if (!Array.isArray(state.bookings)) {
                    state.bookings = [];
                }
                state.bookings.unshift(action.payload);
                state.activeBookingId = action.payload.id;
            })
            .addCase(createBooking.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Cancel Booking
            .addCase(cancelBooking.fulfilled, (state, action) => {
                const index = state.bookings.findIndex(b => b.id === action.payload.id);
                if (index !== -1) {
                    state.bookings[index] = action.payload;
                }
                if (state.selectedBooking?.id === action.payload.id) {
                    state.selectedBooking = action.payload;
                }
            });
    },
});

export const {
    setStatusFilter,
    setActiveBooking,
    clearSelectedBooking,
    updateBookingStatus,
    clearError
} = bookingsSlice.actions;
export default bookingsSlice.reducer;
