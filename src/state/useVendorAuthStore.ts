import { create } from 'zustand';
import { dusmintApi } from '../api-client/client';

export interface VendorUser {
  id: string;
  phone: string;
  fullName: string;
  preferredLanguage?: string;
  role?: string;
}

interface VendorAuthState {
  token: string | null;
  user: VendorUser | null;
  selectedLanguage: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setLanguage: (lang: string) => void;
  setAuth: (token: string, user: any) => void;
  logout: () => void;
}

export const useVendorAuthStore = create<VendorAuthState>((set) => ({
  token: null,
  user: null,
  selectedLanguage: null, // null triggers language select screen first
  isAuthenticated: false,
  isLoading: false,

  setLanguage: (lang: string) => {
    set({ selectedLanguage: lang });
  },

  setAuth: (token: string, user: any) => {
    dusmintApi.setAuthToken(token);
    set({
      token,
      user,
      isAuthenticated: true,
      selectedLanguage: user?.preferredLanguage || 'en',
    });
  },

  logout: () => {
    dusmintApi.setAuthToken(null);
    set({
      token: null,
      user: null,
      isAuthenticated: false,
    });
  },
}));
