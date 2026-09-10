import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { apiClient } from './apiClient';

const TOKEN_KEY = '@myride_jwt_token';
const USER_KEY = '@myride_user_profile';

/**
 * Token and Session Management
 * Handles persistent storage of JWT tokens and user session data
 * across app launches for mobile and web.
 */
export const tokenStorage = {
  /**
   * Save JWT token to persistent storage and update ApiClient
   */
  async setToken(token: string): Promise<void> {
    try {
      if (!token) return;
      await AsyncStorage.setItem(TOKEN_KEY, token);
      apiClient.setAuthToken(token);
    } catch (error) {
      console.error('[tokenStorage] Error saving token:', error);
    }
  },

  /**
   * Retrieve JWT token from persistent storage
   */
  async getToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      return token;
    } catch (error) {
      console.error('[tokenStorage] Error retrieving token:', error);
      return null;
    }
  },

  /**
   * Remove JWT token from storage and ApiClient
   */
  async removeToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      apiClient.setAuthToken(null);
    } catch (error) {
      console.error('[tokenStorage] Error removing token:', error);
    }
  },

  /**
   * Save user profile to persistent storage
   */
  async setStoredUser(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('[tokenStorage] Error saving user profile:', error);
    }
  },

  /**
   * Retrieve user profile from persistent storage
   */
  async getStoredUser(): Promise<User | null> {
    try {
      const userJson = await AsyncStorage.getItem(USER_KEY);
      if (!userJson) return null;
      return JSON.parse(userJson) as User;
    } catch (error) {
      console.error('[tokenStorage] Error retrieving user profile:', error);
      return null;
    }
  },

  /**
   * Remove user profile from persistent storage
   */
  async removeStoredUser(): Promise<void> {
    try {
      await AsyncStorage.removeItem(USER_KEY);
    } catch (error) {
      console.error('[tokenStorage] Error removing user profile:', error);
    }
  },

  /**
   * Atomic session save (Token + User)
   */
  async saveSession(token: string, user: User): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(TOKEN_KEY, token),
        AsyncStorage.setItem(USER_KEY, JSON.stringify(user)),
      ]);
      apiClient.setAuthToken(token);
    } catch (error) {
      console.error('[tokenStorage] Error saving session:', error);
    }
  },

  /**
   * Atomic session clear
   */
  async clearSession(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(TOKEN_KEY),
        AsyncStorage.removeItem(USER_KEY),
      ]);
      apiClient.setAuthToken(null);
    } catch (error) {
      console.error('[tokenStorage] Error clearing session:', error);
    }
  },

  /**
   * Check if a stored token exists
   */
  async hasSession(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      return !!token;
    } catch {
      return false;
    }
  },
};

export default tokenStorage;
