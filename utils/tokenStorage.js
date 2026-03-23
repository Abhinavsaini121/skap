import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

export const tokenStorage = {
  // Store access token
  async setAccessToken(token) {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
      // Error storing access token
    }
  },

  // Get access token
  async getAccessToken() {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      return token;
    } catch (error) {
      return null;
    }
  },

  // Store refresh token
  async setRefreshToken(token) {
    try {
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
    } catch (error) {
      // Error storing refresh token
    }
  },

  // Get refresh token
  async getRefreshToken() {
    try {
      const token = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      return token;
    } catch (error) {
      return null;
    }
  },

  // Clear all tokens
  async clearTokens() {
    try {
      await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY]);
    } catch (error) {
      // Error clearing tokens
    }
  },

  // Check if user has valid token
  async hasValidToken() {
    const token = await this.getAccessToken();
    return !!token;
  }
};
