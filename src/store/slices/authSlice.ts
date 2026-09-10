import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, UserRole } from '../../types';
import { tokenStorage } from '../../services/tokenStorage';
import { authService } from '../../services/authService';
import { apiClient } from '../../services/apiClient';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  activeRole: UserRole;
  isLoading: boolean;
  isRestoringSession: boolean;
  error: string | null;
}

/**
 * Initial unauthenticated state.
 * Fresh installations start with:
 * user = null, token = null, isAuthenticated = false.
 * Only authenticated after successful login or valid stored session restoration.
 */
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  activeRole: 'CUSTOMER',
  isLoading: false,
  isRestoringSession: false,
  error: null,
};

/**
 * Async thunk to restore authenticated session from persistent storage on app startup.
 * If a valid stored token exists:
 * 1. Injects token into apiClient
 * 2. Attempts to fetch current user profile from /auth/me
 * 3. Populates Redux with verified user
 * If expired or invalid (e.g. 401), clears stored session.
 */
export const initializeAuth = createAsyncThunk(
  'auth/initializeAuth',
  async (_, { dispatch }) => {
    try {
      const token = await tokenStorage.getToken();
      if (!token) {
        return null;
      }

      // Inject token into API client for outgoing requests
      apiClient.setAuthToken(token);

      const cachedUser = await tokenStorage.getStoredUser();

      try {
        const profileRes = await authService.getProfile();
        if (profileRes.success && profileRes.data) {
          await tokenStorage.saveSession(token, profileRes.data);
          return { user: profileRes.data, token };
        }
      } catch (err: any) {
        // If 401 Unauthorized or token invalid, flush session
        if (err?.statusCode === 401 || err?.isUnauthorized) {
          console.log('[initializeAuth] Stored session is invalid or expired. Flushing session.');
          await tokenStorage.clearSession();
          apiClient.setAuthToken(null);
          return null;
        }

        // If network/offline error and we have cached user, maintain offline session
        if (cachedUser) {
          console.log('[initializeAuth] Backend unreachable, using cached session for offline access.');
          return { user: cachedUser, token };
        }
      }

      if (cachedUser) {
        return { user: cachedUser, token };
      }

      // No profile could be established
      await tokenStorage.clearSession();
      apiClient.setAuthToken(null);
      return null;
    } catch (e) {
      console.warn('[initializeAuth] Error restoring session:', e);
      return null;
    }
  }
);

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.activeRole = action.payload.user.activeRole || 'CUSTOMER';
      state.isAuthenticated = true;
      state.error = null;

      // Persist session to AsyncStorage and ApiClient
      tokenStorage.saveSession(action.payload.token, action.payload.user);
    },
    restoreSession: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.activeRole = action.payload.user.activeRole || 'CUSTOMER';
      state.isAuthenticated = true;
      state.error = null;
    },
    setActiveRole: (state, action: PayloadAction<UserRole>) => {
      state.activeRole = action.payload;
      if (state.user) {
        state.user.activeRole = action.payload;
        // Update stored profile with new active role
        tokenStorage.setStoredUser(state.user);
      }
    },
    updateKycStatus: (state, action: PayloadAction<{ dlNumber: string }>) => {
      if (state.user) {
        state.user.drivingLicenseNumber = action.payload.dlNumber;
        state.user.drivingLicenseVerified = true;
        state.user.isKycVerified = true;
        tokenStorage.setStoredUser(state.user);
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.activeRole = 'CUSTOMER';
      state.error = null;

      // Clear persistent storage and ApiClient token
      tokenStorage.clearSession();
      apiClient.setAuthToken(null);
    },
    setAuthLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setAuthError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.isRestoringSession = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isRestoringSession = false;
        if (action.payload) {
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.isAuthenticated = true;
          state.activeRole = action.payload.user.activeRole || 'CUSTOMER';
          state.error = null;
        } else {
          state.user = null;
          state.token = null;
          state.isAuthenticated = false;
        }
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.isRestoringSession = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });
  },
});

export const {
  setUser,
  restoreSession,
  setActiveRole,
  updateKycStatus,
  logout,
  setAuthLoading,
  setAuthError,
} = authSlice.actions;

export default authSlice.reducer;
