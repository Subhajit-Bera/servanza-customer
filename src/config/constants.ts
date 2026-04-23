// API Base URL
export const CONFIG = {
    // Change this to your backend URL
    API_BASE_URL: 'http://192.168.29.95:3000/api/v1', // Update with your server IP

    // Feature flags
    ENABLE_PUSH_NOTIFICATIONS: true,
    ENABLE_SOCKET: true,

    // Timeouts
    API_TIMEOUT: 10000,
    SOCKET_TIMEOUT: 5000,

    // Cache settings
    CACHE_TTL: 30000, // 30 seconds

    // Razorpay
    RAZORPAY_KEY_ID: 'rzp_test_xxxxxxxxxxxx', // Replace with your key

    // Google Maps
    GOOGLE_MAPS_API_KEY: 'AIzaSyCW6yH2vM0migj58Wz7CJDLw5ZDDGvIjS8', // Replace with your key
};

// App Info
export const APP_INFO = {
    name: 'Servanza',
    tagline: 'Quality Services at Your Doorstep',
    version: '1.0.0',
};
