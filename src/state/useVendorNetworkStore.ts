import { create } from 'zustand';
import axios from 'axios';
import { AppState, AppStateStatus } from 'react-native';

const HEALTH_URL = process.env.EXPO_PUBLIC_API_URL
  ? process.env.EXPO_PUBLIC_API_URL.replace(/\/api\/v1\/?$/, '/health')
  : 'https://api.riksho.com/health';

interface VendorNetworkState {
  isOffline: boolean;
  wasOffline: boolean;
  isChecking: boolean;
  consecutiveFailures: number;
  setOffline: (offline: boolean) => void;
  resetWasOffline: () => void;
  checkConnectivity: () => Promise<boolean>;
}

export const useVendorNetworkStore = create<VendorNetworkState>((set, get) => ({
  isOffline: false,
  wasOffline: false,
  isChecking: false,
  consecutiveFailures: 0,

  setOffline: (offline: boolean) => {
    const current = get().isOffline;
    if (current !== offline) {
      set({
        isOffline: offline,
        wasOffline: current && !offline,
        consecutiveFailures: offline ? 2 : 0,
      });
    }
  },

  resetWasOffline: () => set({ wasOffline: false }),

  checkConnectivity: async () => {
    if (get().isChecking) return !get().isOffline;
    set({ isChecking: true });
    try {
      const response = await axios.get(HEALTH_URL, {
        timeout: 8000,
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
      });
      const isOnline = response.status === 200;
      const prevOffline = get().isOffline;

      set({
        isOffline: !isOnline,
        wasOffline: prevOffline && isOnline,
        isChecking: false,
        consecutiveFailures: 0,
      });
      return isOnline;
    } catch {
      const failures = get().consecutiveFailures + 1;
      // Require 2 consecutive failures so minor 1-off hiccups don't flash the banner
      const shouldFlagOffline = failures >= 2;
      set({
        isOffline: shouldFlagOffline ? true : get().isOffline,
        isChecking: false,
        consecutiveFailures: failures,
      });
      return false;
    }
  },
}));

export function initVendorNetworkMonitoring() {
  const store = useVendorNetworkStore.getState();
  store.checkConnectivity();

  const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
    if (nextState === 'active') {
      useVendorNetworkStore.getState().checkConnectivity();
    }
  });

  // Poll softly every 10s only while offline so the banner clears automatically when Wi-Fi returns
  const interval = setInterval(() => {
    if (useVendorNetworkStore.getState().isOffline) {
      useVendorNetworkStore.getState().checkConnectivity();
    }
  }, 10000);

  return () => {
    subscription.remove();
    clearInterval(interval);
  };
}
