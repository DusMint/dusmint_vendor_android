import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { NativeModules } from 'react-native';
import { dusmintApi } from '../api-client/client';
import { VendorProfileInfo } from '../api-client/types';

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
  activeVendor: VendorProfileInfo | null;
  storePhotoUri: string | null;
  selectedLanguage: string | null;
  isAuthenticated: boolean;
  hasActiveVendor: boolean;
  isLoading: boolean;
  isHydrated: boolean;
  pendingOrdersCount: number;
  isStoreOpen: boolean;
  breakUntil: number | null;

  // Actions
  setHydrated: (val: boolean) => void;
  setPendingOrdersCount: (count: number) => void;
  setLanguage: (lang: string) => void;
  setStorePhotoUri: (uri: string | null) => void;
  setActiveVendor: (vendor: VendorProfileInfo | null) => void;
  setHasActiveVendor: (val: boolean) => void;
  setStoreOpen: (isOpen: boolean) => void;
  setStoreBreak: (durationMinutes: number | null) => void;
  setAuth: (token: string, user: any, hasActiveVendor?: boolean, vendor?: any) => void;
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
      activeVendor: null,
      storePhotoUri: null,
      selectedLanguage: null,
      isAuthenticated: false,
      hasActiveVendor: false,
      isLoading: false,
      // If native storage is not compiled into the APK, start hydrated to avoid blocking the UI
      isHydrated: !hasNativeAsyncStorage,
      pendingOrdersCount: 2,
      isStoreOpen: true,
      breakUntil: null,

      setHydrated: (val: boolean) => set({ isHydrated: val }),
      setPendingOrdersCount: (count: number) => set({ pendingOrdersCount: count }),

      setLanguage: (lang: string) => {
        set({ selectedLanguage: lang });
      },

      setStorePhotoUri: (uri: string | null) => {
        set({ storePhotoUri: uri });
      },

      setStoreBreak: (durationMinutes: number | null) => {
        set({
          breakUntil: durationMinutes ? Date.now() + durationMinutes * 60 * 1000 : null,
        });
      },

      setActiveVendor: (vendor: VendorProfileInfo | null) => {
        const photoUri =
          (vendor?.shop_photo_urls && vendor.shop_photo_urls.length > 0
            ? vendor.shop_photo_urls[0]
            : null) || null;
        set((state) => ({
          activeVendor: vendor,
          isStoreOpen: vendor?.is_open !== undefined ? vendor.is_open : state.isStoreOpen,
          storePhotoUri: photoUri || state.storePhotoUri,
        }));
      },

      setHasActiveVendor: (val: boolean) => {
        set({ hasActiveVendor: val });
      },

      setStoreOpen: (isOpen: boolean) => {
        set((state) => {
          const updatedVendor = state.activeVendor
            ? { ...state.activeVendor, is_open: isOpen }
            : null;
          return {
            isStoreOpen: isOpen,
            activeVendor: updatedVendor,
          };
        });
      },

      setAuth: (token: string, user: any, hasActiveVendor = false, vendor?: any) => {
        dusmintApi.setAuthToken(token);
        const photoUri =
          (vendor?.shop_photo_urls && vendor.shop_photo_urls.length > 0
            ? vendor.shop_photo_urls[0]
            : null) || null;
        set((state) => ({
          token,
          user,
          isAuthenticated: true,
          hasActiveVendor,
          activeVendor: vendor || state.activeVendor || null,
          isStoreOpen: vendor?.is_open !== undefined ? vendor.is_open : state.isStoreOpen,
          storePhotoUri: photoUri || state.storePhotoUri,
          selectedLanguage: user?.preferredLanguage || 'en',
        }));
      },

      logout: () => {
        dusmintApi.setAuthToken(null);
        set({
          token: null,
          user: null,
          activeVendor: null,
          storePhotoUri: null,
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
        activeVendor: state.activeVendor,
        storePhotoUri: state.storePhotoUri,
        selectedLanguage: state.selectedLanguage,
        isAuthenticated: state.isAuthenticated,
        hasActiveVendor: state.hasActiveVendor,
        isStoreOpen: state.isStoreOpen,
        breakUntil: state.breakUntil,
      }),
    }
  )
);
