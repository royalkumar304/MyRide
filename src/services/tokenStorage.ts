import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { apiClient } from './apiClient';
import { logger } from '../utils/logger';

const SECURE_TOKEN_KEY = 'myride_auth_jwt_token';
const FALLBACK_TOKEN_KEY = '@myride_jwt_token';
const USER_KEY = '@myride_user_profile';

/**
 * Checks whether expo-secure-store is available on the current platform/runtime.
 * SecureStore is available on native Android & iOS devices/simulators,
 * but unavailable on web browsers.
 */
async function isSecureStoreAvailable(): Promise<boolean> {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

/**
 * Token Storage Service
 * Implements hardware-backed secure storage (expo-secure-store) for JWT access tokens.
 * Plain AsyncStorage is NOT used for JWT tokens when secure storage is available.
 */
export const tokenStorage = {
  /**
   * Securely saves JWT token
   */
  async saveToken(token: string): Promise<void> {
    try {
      if (!token) return;
      const isSecureAvailable = await isSecureStoreAvailable();

      if (isSecureAvailable) {
        await SecureStore.setItemAsync(SECURE_TOKEN_KEY, token, {
          keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
        });
      } else {
        // Fallback for web environments where SecureStore is not supported
        await AsyncStorage.setItem(FALLBACK_TOKEN_KEY, token);
      }

      // Sync with centralized API client
      apiClient.setAuthToken(token);
    } catch (error) {
      logger.error('[tokenStorage.saveToken] Error saving token:', error);
    }
  },

  /**
   * Retrieves JWT token from secure storage (or web fallback)
   */
  async getToken(): Promise<string | null> {
    try {
      const isSecureAvailable = await isSecureStoreAvailable();

      if (isSecureAvailable) {
        const token = await SecureStore.getItemAsync(SECURE_TOKEN_KEY);
        if (token) return token;
      }

      // Fallback or migration check from AsyncStorage
      return await AsyncStorage.getItem(FALLBACK_TOKEN_KEY);
    } catch (error) {
      logger.error('[tokenStorage.getToken] Error retrieving token:', error);
      return null;
    }
  },

  /**
   * Securely clears JWT token from storage and ApiClient
   */
  async clearToken(): Promise<void> {
    try {
      const isSecureAvailable = await isSecureStoreAvailable();

      if (isSecureAvailable) {
        try {
          await SecureStore.deleteItemAsync(SECURE_TOKEN_KEY);
        } catch {
          // Ignore if already absent
        }
      }

      // Also ensure fallback key is deleted
      await AsyncStorage.removeItem(FALLBACK_TOKEN_KEY);

      // Clear token from centralized API client
      apiClient.setAuthToken(null);
    } catch (error) {
      logger.error('[tokenStorage.clearToken] Error clearing token:', error);
    }
  },

  // Aliases for compatibility
  async setToken(token: string): Promise<void> {
    return this.saveToken(token);
  },

  async removeToken(): Promise<void> {
    return this.clearToken();
  },

  /**
   * User profile persistence (non-sensitive metadata)
   */
  async setStoredUser(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (error) {
      logger.error('[tokenStorage.setStoredUser] Error saving user profile:', error);
    }
  },

  async getStoredUser(): Promise<User | null> {
    try {
      const userJson = await AsyncStorage.getItem(USER_KEY);
      if (!userJson) return null;
      return JSON.parse(userJson) as User;
    } catch (error) {
      logger.error('[tokenStorage.getStoredUser] Error retrieving user profile:', error);
      return null;
    }
  },

  async removeStoredUser(): Promise<void> {
    try {
      await AsyncStorage.removeItem(USER_KEY);
    } catch (error) {
      logger.error('[tokenStorage.removeStoredUser] Error removing user profile:', error);
    }
  },

  /**
   * Atomic session save (Token securely stored + User profile cached)
   */
  async saveSession(token: string, user: User): Promise<void> {
    try {
      await Promise.all([
        this.saveToken(token),
        this.setStoredUser(user),
      ]);
    } catch (error) {
      logger.error('[tokenStorage.saveSession] Error saving session:', error);
    }
  },

  /**
   * Atomic session clear (Removes secure token + cached profile)
   */
  async clearSession(): Promise<void> {
    try {
      await Promise.all([
        this.clearToken(),
        this.removeStoredUser(),
      ]);
    } catch (error) {
      logger.error('[tokenStorage.clearSession] Error clearing session:', error);
    }
  },

  /**
   * Check if a stored token exists
   */
  async hasSession(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  },
};

export default tokenStorage;
