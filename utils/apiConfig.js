import Constants from 'expo-constants';

/**
 * Get the API base URL from environment variables or app.json config
 * This works in both development and production builds
 */
export const getApiUrl = () => {
  // First try process.env (works in development and if set via .env)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // Fallback to Constants.expoConfig.extra (works in production builds)
  if (Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL) {
    return Constants.expoConfig.extra.EXPO_PUBLIC_API_URL;
  }
  
  // Final fallback to localhost for development
  return "https://api.spakspak.com/api/v1";
};

// Export the base URL as a constant for convenience
export const BASE_URL = getApiUrl();

/**
 * Get Stripe publishable key for Payment Sheet (iOS & Android)
 * Set EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY in .env (e.g. pk_test_... or pk_live_...)
 */
export const getStripePublishableKey = () => {
  if (process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    return process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  }
  if (Constants.expoConfig?.extra?.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    return Constants.expoConfig.extra.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  }
  return null;
};

/**
 * Convert API image path to full URI (handles relative paths from backend)
 */
export const getImageUri = (path) => {
  if (!path || typeof path !== "string") return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const base = BASE_URL.replace(/\/$/, "");
  return `${base}${normalized}`;
};

