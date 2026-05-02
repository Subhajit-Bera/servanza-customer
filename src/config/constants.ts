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

export const WEBRTC_CONFIG = {
    iceServers: [
        // Primary Fallback: Google's free STUN servers
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },

        // Metered STUN
        {
            urls: 'stun:stun.relay.metered.ca:80',
        },
        // Metered TURN Servers (For Symmetric NAT traversal)
        {
            urls: 'turn:in.relay.metered.ca:80',
            username: 'f27bc21350803d756c169b95',    
            credential: 'VJyJWq1KLfONxuYg',
        },
        {
            urls: 'turn:in.relay.metered.ca:80?transport=tcp',
            username: 'f27bc21350803d756c169b95',
            credential: 'VJyJWq1KLfONxuYg',
        },
        {
            urls: 'turn:in.relay.metered.ca:443',
            username: 'f27bc21350803d756c169b95',
            credential: 'VJyJWq1KLfONxuYg',
        },
        {
            urls: 'turns:in.relay.metered.ca:443?transport=tcp',
            username: 'f27bc21350803d756c169b95',
            credential: 'VJyJWq1KLfONxuYg',
        },
    ],
};

// App Info
export const APP_INFO = {
    name: 'Servanza',
    tagline: 'Quality Services at Your Doorstep',
    version: '1.0.0',
};
