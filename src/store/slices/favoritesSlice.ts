import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { favoritesApi } from '../../api/client';
import type { Service, Favorite } from '../../types';

interface FavoritesState {
    items: Favorite[];
    favoriteIds: string[]; // For quick lookup
    isLoading: boolean;
    error: string | null;
}

const initialState: FavoritesState = {
    items: [],
    favoriteIds: [],
    isLoading: false,
    error: null,
};

// Fetch all favorites
export const fetchFavorites = createAsyncThunk(
    'favorites/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const { data } = await favoritesApi.getFavorites();
            return data.data || data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch favorites');
        }
    }
);

// Add to favorites
export const addToFavorites = createAsyncThunk(
    'favorites/add',
    async (service: Service, { rejectWithValue }) => {
        try {
            const { data } = await favoritesApi.addFavorite(service.id);
            const favorite = data.data || data;
            // Return with service data attached
            return { ...favorite, service };
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to add to favorites');
        }
    }
);

// Remove from favorites
export const removeFromFavorites = createAsyncThunk(
    'favorites/remove',
    async (serviceId: string, { rejectWithValue }) => {
        try {
            await favoritesApi.removeFavorite(serviceId);
            return serviceId;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to remove from favorites');
        }
    }
);

const favoritesSlice = createSlice({
    name: 'favorites',
    initialState,
    reducers: {
        clearFavorites: (state) => {
            state.items = [];
            state.favoriteIds = [];
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch favorites
            .addCase(fetchFavorites.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchFavorites.fulfilled, (state, action) => {
                state.isLoading = false;
                state.items = action.payload || [];
                state.favoriteIds = (action.payload || []).map((f: Favorite) => f.serviceId);
            })
            .addCase(fetchFavorites.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Add to favorites
            .addCase(addToFavorites.pending, (state) => {
                state.error = null;
            })
            .addCase(addToFavorites.fulfilled, (state, action) => {
                const favorite = action.payload;
                if (favorite && !state.favoriteIds.includes(favorite.serviceId)) {
                    state.items.push(favorite);
                    state.favoriteIds.push(favorite.serviceId);
                }
            })
            .addCase(addToFavorites.rejected, (state, action) => {
                state.error = action.payload as string;
            })
            // Remove from favorites
            .addCase(removeFromFavorites.fulfilled, (state, action) => {
                const serviceId = action.payload;
                state.items = state.items.filter(f => f.serviceId !== serviceId);
                state.favoriteIds = state.favoriteIds.filter(id => id !== serviceId);
            })
            .addCase(removeFromFavorites.rejected, (state, action) => {
                state.error = action.payload as string;
            });
    },
});

export const { clearFavorites, clearError } = favoritesSlice.actions;
export default favoritesSlice.reducer;
