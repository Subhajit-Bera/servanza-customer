import { configureStore } from '@reduxjs/toolkit';
// Store slices
import authReducer from './slices/authSlice';
import servicesReducer from './slices/servicesSlice';
import cartReducer from './slices/cartSlice';
import bookingsReducer from './slices/bookingsSlice';
import favoritesReducer from './slices/favoritesSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        services: servicesReducer,
        cart: cartReducer,
        bookings: bookingsReducer,
        favorites: favoritesReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Redux Toolkit's async thunks include the original promise in action.meta,
                // which is non-serializable by design. Safe to ignore these paths.
                ignoredActionPaths: ['meta.arg', 'meta.baseQueryMeta'],
                ignoredPaths: [],
            },
        }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
