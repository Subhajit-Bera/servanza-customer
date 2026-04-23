import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { servicesApi } from '../../api/client';
import type { Service, Category } from '../../types';

interface ServicesState {
    services: Service[];
    categories: Category[];
    selectedService: Service | null;
    searchQuery: string;
    selectedCategoryId: string | null;
    loading: boolean;
    error: string | null;
}

const initialState: ServicesState = {
    services: [],
    categories: [],
    selectedService: null,
    searchQuery: '',
    selectedCategoryId: null,
    loading: false,
    error: null,
};

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
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchServices.fulfilled, (state, action) => {
                state.loading = false;
                state.services = action.payload;
            })
            .addCase(fetchServices.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Fetch Service by ID
            .addCase(fetchServiceById.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchServiceById.fulfilled, (state, action) => {
                state.loading = false;
                state.selectedService = action.payload;
            })
            .addCase(fetchServiceById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

            // Fetch Categories
            .addCase(fetchCategories.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchCategories.fulfilled, (state, action) => {
                state.loading = false;
                state.categories = action.payload;
            })
            .addCase(fetchCategories.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { setSearchQuery, setSelectedCategory, clearSelectedService, clearError } = servicesSlice.actions;
export default servicesSlice.reducer;
