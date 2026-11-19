import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { NativeModules } from 'react-native';
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
  hasActiveVendor: boolean;
  isLoading: boolean;
  isHydrated: boolean;

  // Actions
  setHydrated: (val: boolean) => void;
  setLanguage: (lang: string) => void;
  setHasActiveVendor: (val: boolean) => void;
  setAuth: (token: string, user: any, hasActiveVendor?: boolean) => void;
  logout: () => void;
}

// In-memory store fallback so app never crashes if native module is not yet compiled
const memoryStore: Record<string, string> = {};

// Safe dynamic accessor: avoids importing @react-native-async-storage/async-storage if native module is null
const getNativeStorage = () => {
  try {
    const hasNative = Boolean(
      NativeModules.RNCAsyncStorage || NativeModules.PlatformLocalStorage
    );
    if (!hasNative) return null;
    return require('@react-native-async-storage/async-storage').default;
  } catch {
    return null;
  }
};

const hasNativeAsyncStorage = Boolean(
  NativeModules.RNCAsyncStorage || NativeModules.PlatformLocalStorage
);

const safeStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const storage = getNativeStorage();
      if (storage) {
        const val = await storage.getItem(name);
        if (val !== null && val !== undefined) return val;
      }
    } catch {}
    return memoryStore[name] ?? null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    memoryStore[name] = value;
    try {
      const storage = getNativeStorage();
      if (storage) {
        await storage.setItem(name, value);
      }
    } catch {}
  },
  removeItem: async (name: string): Promise<void> => {
    delete memoryStore[name];
    try {
      const storage = getNativeStorage();
      if (storage) {
        await storage.removeItem(name);
      }
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
      hasActiveVendor: false,
      isLoading: false,
      // If native storage is not compiled into the APK, start hydrated to avoid blocking the UI
      isHydrated: !hasNativeAsyncStorage,

      setHydrated: (val: boolean) => set({ isHydrated: val }),

      setLanguage: (lang: string) => {
        set({ selectedLanguage: lang });
      },

      setHasActiveVendor: (val: boolean) => {
        set({ hasActiveVendor: val });
      },

      setAuth: (token: string, user: any, hasActiveVendor = false) => {
        dusmintApi.setAuthToken(token);
        set({
          token,
          user,
          isAuthenticated: true,
          hasActiveVendor,
          selectedLanguage: user?.preferredLanguage || 'en',
        });
      },

      logout: () => {
        dusmintApi.setAuthToken(null);
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          hasActiveVendor: false,
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
        hasActiveVendor: state.hasActiveVendor,
      }),
    }
  )
);
