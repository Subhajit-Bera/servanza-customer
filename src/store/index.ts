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
            serializableCheck: false,
        }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

