import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as SecureStore from 'expo-secure-store';
import { authApi, userApi } from '../../api/client';
import type { User, AuthState, Address } from '../../types';

interface ExtendedAuthState extends AuthState {
    addresses: Address[];
    defaultAddressId: string | null;
    isGuest: boolean;
    loginRequested: boolean;
    pendingAction: { screen: string; params?: any } | null;
}

const initialState: ExtendedAuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    addresses: [],
    defaultAddressId: null,
    isGuest: false,
    loginRequested: false,
    pendingAction: null,
};

// Check if user is authenticated on app load
export const checkAuthStatus = createAsyncThunk(
    'auth/checkStatus',
    async (_, { rejectWithValue }) => {
        try {
            const token = await SecureStore.getItemAsync('auth_token');
            if (!token) {
                return null;
            }

            const response = await userApi.getProfile();
            return response.data.data || response.data;
        } catch (error: any) {
            await SecureStore.deleteItemAsync('auth_token');
            await SecureStore.deleteItemAsync('refresh_token');
            return rejectWithValue(error.response?.data?.message || 'Session expired');
        }
    }
);

// Verify Firebase auth (works with email, Google, phone)
export const verifyPhoneAuth = createAsyncThunk(
    'auth/verifyPhone',
    async (idToken: string, { rejectWithValue }) => {
        try {
            // Try generic Firebase endpoint first
            let response;
            try {
                response = await authApi.verifyFirebaseToken(idToken);
            } catch (genericError: any) {
                // If generic endpoint doesn't exist (404), fall back to phone endpoint
                if (genericError.response?.status === 404) {
                    console.log('Generic Firebase endpoint not available, trying phone endpoint');
                    response = await authApi.verifyFirebasePhone(idToken);
                } else {
                    throw genericError;
                }
            }

            // Backend returns { user, tokens: { accessToken, refreshToken } }
            const { user, tokens } = response.data.data;
            const { accessToken, refreshToken } = tokens;

            // Verify tokens are strings before storing
            if (typeof accessToken !== 'string' || typeof refreshToken !== 'string') {
                console.error('Invalid token format:', { accessToken: typeof accessToken, refreshToken: typeof refreshToken });
                throw new Error('Invalid token format received from server');
            }

            await SecureStore.setItemAsync('auth_token', accessToken);
            await SecureStore.setItemAsync('refresh_token', refreshToken);

            return user;
        } catch (error: any) {
            console.error('Auth verification error:', error.response?.data || error.message);
            return rejectWithValue(error.response?.data?.message || 'Authentication failed');
        }
    }
);

// Update profile
export const updateProfile = createAsyncThunk(
    'auth/updateProfile',
    async (data: Partial<User>, { rejectWithValue }) => {
        try {
            const response = await userApi.updateProfile(data);
            return response.data.data || response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
        }
    }
);

// Fetch addresses
export const fetchAddresses = createAsyncThunk(
    'auth/fetchAddresses',
    async (_, { rejectWithValue }) => {
        try {
            const response = await userApi.getAddresses();
            return response.data.data || response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch addresses');
        }
    }
);

// Add address
export const addAddress = createAsyncThunk(
    'auth/addAddress',
    async (data: Omit<Address, 'id' | 'userId'>, { rejectWithValue }) => {
        try {
            const response = await userApi.addAddress(data);
            return response.data.data || response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to add address');
        }
    }
);

// Update address
export const updateAddress = createAsyncThunk(
    'auth/updateAddress',
    async ({ id, data }: { id: string; data: Partial<Address> }, { rejectWithValue }) => {
        try {
            const response = await userApi.updateAddress(id, data);
            return response.data.data || response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update address');
        }
    }
);

// Delete address
export const deleteAddress = createAsyncThunk(
    'auth/deleteAddress',
    async (id: string, { rejectWithValue }) => {
        try {
            await userApi.deleteAddress(id);
            return id;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete address');
        }
    }
);

// Logout
export const logout = createAsyncThunk(
    'auth/logout',
    async () => {
        await SecureStore.deleteItemAsync('auth_token');
        await SecureStore.deleteItemAsync('refresh_token');
        return null;
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        },
        setDefaultAddress: (state, action: PayloadAction<string>) => {
            state.defaultAddressId = action.payload;
        },
        enterGuestMode: (state) => {
            state.isGuest = true;
            state.isLoading = false;
        },
        // Clears guest mode → root navigator auto-switches to Auth screen
        // loginRequested=true tells AuthNavigator to start at Login (skip Splash)
        clearGuest: (state) => {
            state.isGuest = false;
            state.loginRequested = true;
        },
        setPendingAction: (state, action: PayloadAction<{ screen: string; params?: any } | null>) => {
            state.pendingAction = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            // Check Auth Status
            .addCase(checkAuthStatus.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(checkAuthStatus.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload;
                state.isAuthenticated = !!action.payload;
            })
            .addCase(checkAuthStatus.rejected, (state, action) => {
                state.isLoading = false;
                state.user = null;
                state.isAuthenticated = false;
                state.error = action.payload as string;
            })

            // Verify Phone
            .addCase(verifyPhoneAuth.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(verifyPhoneAuth.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload;
                state.isAuthenticated = true;
                state.isGuest = false;
                state.loginRequested = false;
            })
            .addCase(verifyPhoneAuth.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })

            // Update Profile
            .addCase(updateProfile.fulfilled, (state, action) => {
                state.user = action.payload;
            })

            // Fetch Addresses
            .addCase(fetchAddresses.fulfilled, (state, action) => {
                state.addresses = action.payload;
                const defaultAddr = action.payload.find((a: Address) => a.isDefault);
                if (defaultAddr) {
                    state.defaultAddressId = defaultAddr.id;
                }
            })

            // Add Address
            .addCase(addAddress.fulfilled, (state, action) => {
                state.addresses.push(action.payload);
                if (action.payload.isDefault) {
                    state.defaultAddressId = action.payload.id;
                }
            })

            // Update Address
            .addCase(updateAddress.fulfilled, (state, action) => {
                const index = state.addresses.findIndex(a => a.id === action.payload.id);
                if (index !== -1) {
                    state.addresses[index] = action.payload;
                }
            })

            // Delete Address
            .addCase(deleteAddress.fulfilled, (state, action) => {
                state.addresses = state.addresses.filter(a => a.id !== action.payload);
            })

            // Logout — reset to guest mode
            .addCase(logout.fulfilled, (state) => {
                state.user = null;
                state.isAuthenticated = false;
                state.isGuest = true;
                state.pendingAction = null;
                state.addresses = [];
                state.defaultAddressId = null;
            });
    },
});

export const { setLoading, clearError, setDefaultAddress, enterGuestMode, clearGuest, setPendingAction } = authSlice.actions;
export default authSlice.reducer;
