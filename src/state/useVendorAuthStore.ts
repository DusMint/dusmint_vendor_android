import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  isHydrated: boolean;

  // Actions
  setHydrated: (val: boolean) => void;
  setLanguage: (lang: string) => void;
  setAuth: (token: string, user: any) => void;
  logout: () => void;
}

// Memory fallback to ensure smooth operation if native AsyncStorage is pending rebuild
const memoryStore: Record<string, string> = {};

const safeStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const val = await AsyncStorage.getItem(name);
      return val ?? memoryStore[name] ?? null;
    } catch {
      return memoryStore[name] ?? null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    memoryStore[name] = value;
    try {
      await AsyncStorage.setItem(name, value);
    } catch {}
  },
  removeItem: async (name: string): Promise<void> => {
    delete memoryStore[name];
    try {
      await AsyncStorage.removeItem(name);
    } catch {}
  },
};

export const useVendorAuthStore = create<VendorAuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      selectedLanguage: null,
      isAuthenticated: false,
      isLoading: false,
      isHydrated: false,

      setHydrated: (val: boolean) => set({ isHydrated: val }),

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
    }),
    {
      name: 'dusmint-vendor-auth',
      storage: createJSONStorage(() => safeStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          dusmintApi.setAuthToken(state.token);
        }
        useVendorAuthStore.setState({ isHydrated: true });
      },
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        selectedLanguage: state.selectedLanguage,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
