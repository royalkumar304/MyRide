import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CityOption, DEFAULT_CITY } from '../../constants/cities';
import { SupportedLanguage } from '../../localization';
import { NotificationItem } from '../../types';
import { MOCK_NOTIFICATIONS } from '../../services/mockData';

interface UiState {
  selectedCity: CityOption;
  language: SupportedLanguage;
  notifications: NotificationItem[];
  unreadNotificationsCount: number;
  toast: {
    visible: boolean;
    message: string;
    type: 'success' | 'info' | 'error';
  } | null;
}

const initialState: UiState = {
  selectedCity: DEFAULT_CITY,
  language: 'en',
  notifications: MOCK_NOTIFICATIONS,
  unreadNotificationsCount: 2,
  toast: null,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSelectedCity: (state, action: PayloadAction<CityOption>) => {
      state.selectedCity = action.payload;
    },
    setLanguage: (state, action: PayloadAction<SupportedLanguage>) => {
      state.language = action.payload;
    },
    markAllNotificationsAsRead: (state) => {
      state.notifications.forEach(n => {
        n.isRead = true;
      });
      state.unreadNotificationsCount = 0;
    },
    showToast: (state, action: PayloadAction<{ message: string; type?: 'success' | 'info' | 'error' }>) => {
      state.toast = {
        visible: true,
        message: action.payload.message,
        type: action.payload.type || 'success',
      };
    },
    hideToast: (state) => {
      state.toast = null;
    },
  },
});

export const {
  setSelectedCity,
  setLanguage,
  markAllNotificationsAsRead,
  showToast,
  hideToast,
} = uiSlice.actions;

export default uiSlice.reducer;
