import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { servicesApi } from '../../api/client';
import type { Service, Category } from '../../types';

interface ServicesState {
    services: Service[];
    categories: Category[];
    selectedService: Service | null;
    searchQuery: string;
    selectedCategoryId: string | null;
    // Granular loading flags
    isServicesLoading: boolean;
    isCategoriesLoading: boolean;
    isSelectedServiceLoading: boolean;
    // Backward-compatible derived flag (true if ANY sub-load is active)
    loading: boolean;
    error: string | null;
}

const initialState: ServicesState = {
    services: [],
    categories: [],
    selectedService: null,
    searchQuery: '',
    selectedCategoryId: null,
    isServicesLoading: false,
    isCategoriesLoading: false,
    isSelectedServiceLoading: false,
    loading: false,
    error: null,
};

// Helper: recompute the backward-compat `loading` from the three granular flags
function recomputeLoading(state: ServicesState) {
    state.loading = state.isServicesLoading || state.isCategoriesLoading || state.isSelectedServiceLoading;
}

// Fetch all services
export const fetchServices = createAsyncThunk(
    'services/fetchServices',
    async (params: { categoryId?: string; search?: string } | void, { rejectWithValue }) => {
        try {
            const response = await servicesApi.getServices(params || {});
            return response.data.data || response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch services');
        }
    }
);

// Fetch service by ID
export const fetchServiceById = createAsyncThunk(
    'services/fetchServiceById',
    async (id: string, { rejectWithValue }) => {
        try {
            const response = await servicesApi.getServiceById(id);
            return response.data.data || response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch service');
        }
    }
);

// Fetch categories
export const fetchCategories = createAsyncThunk(
    'services/fetchCategories',
    async (_, { rejectWithValue }) => {
        try {
            const response = await servicesApi.getCategories();
            return response.data.data || response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch categories');
        }
    }
);

const servicesSlice = createSlice({
    name: 'services',
    initialState,
    reducers: {
        setSearchQuery: (state, action: PayloadAction<string>) => {
            state.searchQuery = action.payload;
        },
        setSelectedCategory: (state, action: PayloadAction<string | null>) => {
            state.selectedCategoryId = action.payload;
        },
        clearSelectedService: (state) => {
            state.selectedService = null;
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch Services
            .addCase(fetchServices.pending, (state) => {
                state.isServicesLoading = true;
                state.error = null;
                recomputeLoading(state);
            })
            .addCase(fetchServices.fulfilled, (state, action) => {
                state.isServicesLoading = false;
                state.services = action.payload;
                recomputeLoading(state);
            })
            .addCase(fetchServices.rejected, (state, action) => {
                state.isServicesLoading = false;
                state.error = action.payload as string;
                recomputeLoading(state);
            })

            // Fetch Service by ID
            .addCase(fetchServiceById.pending, (state) => {
                state.isSelectedServiceLoading = true;
                recomputeLoading(state);
            })
            .addCase(fetchServiceById.fulfilled, (state, action) => {
                state.isSelectedServiceLoading = false;
                state.selectedService = action.payload;
                recomputeLoading(state);
            })
            .addCase(fetchServiceById.rejected, (state, action) => {
                state.isSelectedServiceLoading = false;
                state.error = action.payload as string;
                recomputeLoading(state);
            })

            // Fetch Categories
            .addCase(fetchCategories.pending, (state) => {
                state.isCategoriesLoading = true;
                recomputeLoading(state);
            })
            .addCase(fetchCategories.fulfilled, (state, action) => {
                state.isCategoriesLoading = false;
                state.categories = action.payload;
                recomputeLoading(state);
            })
            .addCase(fetchCategories.rejected, (state, action) => {
                state.isCategoriesLoading = false;
                state.error = action.payload as string;
                recomputeLoading(state);
            });
    },
});

export const { setSearchQuery, setSelectedCategory, clearSelectedService, clearError } = servicesSlice.actions;
export default servicesSlice.reducer;
