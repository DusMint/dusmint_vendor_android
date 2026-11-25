import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { useVendorNetworkStore } from '../../state/useVendorNetworkStore';

export const OfflineTopBanner: React.FC = () => {
  const insets = useSafeAreaInsets();
  const isOffline = useVendorNetworkStore((s) => s.isOffline);
  const wasOffline = useVendorNetworkStore((s) => s.wasOffline);
  const isChecking = useVendorNetworkStore((s) => s.isChecking);
  const resetWasOffline = useVendorNetworkStore((s) => s.resetWasOffline);
  const checkConnectivity = useVendorNetworkStore((s) => s.checkConnectivity);

  const translateY = useRef(new Animated.Value(-120)).current;
  const topOffset = Math.max(insets.top, Platform.OS === 'android' ? 24 : 0);

  useEffect(() => {
    if (isOffline) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 3,
        speed: 14,
      }).start();
    } else if (wasOffline) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 3,
        speed: 14,
      }).start();

      const timer = setTimeout(() => {
        Animated.timing(translateY, {
          toValue: -120,
          duration: 260,
          useNativeDriver: true,
        }).start(() => {
          resetWasOffline();
        });
      }, 2200);

      return () => clearTimeout(timer);
    } else {
      Animated.timing(translateY, {
        toValue: -120,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [isOffline, wasOffline, resetWasOffline, translateY]);

  if (!isOffline && !wasOffline) {
    return null;
  }

  const isRestored = !isOffline && wasOffline;
  const bgColor = isRestored ? '#047A36' : '#DC2626';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          paddingTop: topOffset + 6,
          backgroundColor: bgColor,
          transform: [{ translateY }],
        },
      ]}
      pointerEvents={isRestored ? 'none' : 'box-none'}
    >
      <View style={styles.contentRow}>
        <View style={styles.leftGroup}>
          {isRestored ? (
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Circle cx={12} cy={12} r={10} fill="#FFFFFF" />
              <Path
                d="M8 12.5L10.5 15L16 9.5"
                stroke="#047A36"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          ) : (
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path
                d="M1 1L23 23M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M8.53 16.11a6 6 0 016.95 0M12 20h.01"
                stroke="#FFFFFF"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          )}
          <Text style={styles.bannerText} numberOfLines={1}>
            {isRestored ? 'Back online • Syncing store' : 'No internet connection'}
          </Text>
        </View>

        {!isRestored && (
          <TouchableOpacity
            onPress={() => checkConnectivity()}
            disabled={isChecking}
            activeOpacity={0.8}
            style={styles.retryPill}
          >
            {isChecking ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.retryText}>Retry</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingBottom: 10,
    paddingHorizontal: 16,
    zIndex: 99999,
    elevation: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  bannerText: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 13,
    color: '#FFFFFF',
  },
  retryPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 56,
    alignItems: 'center',
  },
  retryText: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 12,
    color: '#FFFFFF',
  },
});
