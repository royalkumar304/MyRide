import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User, UserRole } from '../../types';
import { INITIAL_MOCK_USER } from '../../services/authService';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  activeRole: UserRole;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: INITIAL_MOCK_USER,
  token: 'mock_jwt_token_user_123',
  isAuthenticated: true,
  activeRole: 'CUSTOMER',
  isLoading: false,
  error: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.activeRole = action.payload.user.activeRole;
      state.isAuthenticated = true;
      state.error = null;
    },
    setActiveRole: (state, action: PayloadAction<UserRole>) => {
      state.activeRole = action.payload;
      if (state.user) {
        state.user.activeRole = action.payload;
      }
    },
    updateKycStatus: (state, action: PayloadAction<{ dlNumber: string }>) => {
      if (state.user) {
        state.user.drivingLicenseNumber = action.payload.dlNumber;
        state.user.drivingLicenseVerified = true;
        state.user.isKycVerified = true;
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.activeRole = 'CUSTOMER';
    },
    setAuthLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setAuthError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setUser, setActiveRole, updateKycStatus, logout, setAuthLoading, setAuthError } = authSlice.actions;
export default authSlice.reducer;
