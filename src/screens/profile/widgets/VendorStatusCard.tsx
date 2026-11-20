import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  isOpen: boolean;
  onToggle: (val: boolean) => void;
  isLoading?: boolean;
}

export const VendorStatusCard: React.FC<Props> = ({ isOpen, onToggle, isLoading }) => {
  // Animated value: 0 for closed / offline, 1 for open / online
  const animValue = useRef(new Animated.Value(isOpen ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(animValue, {
      toValue: isOpen ? 1 : 0,
      tension: 65,
      friction: 8,
      useNativeDriver: false,
    }).start();
  }, [isOpen, animValue]);

  const handlePress = () => {
    if (isLoading) return;
    try {
      Vibration.vibrate(25);
    } catch {}
    onToggle(!isOpen);
  };

  // Interpolated track background color
  const trackBgColor = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#E2E8F0', '#047A36'],
  });

  // Interpolated thumb horizontal position
  const thumbTranslateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2.5, 23.5],
  });

  return (
    <View style={styles.card}>
      <View style={styles.contentRow}>
        <View style={styles.leftCol}>
          {/* Icon Circle matching the exact style of the menu items below */}
          <View style={styles.iconCircle}>
            <Ionicons
              name="storefront-outline"
              size={20}
              color="#0F172A"
            />
          </View>

          <View style={styles.textCol}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>
                {isOpen ? 'Store is Accepting Orders' : 'Store is Closed'}
              </Text>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isOpen ? '#16A34A' : '#94A3B8' },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Modern Custom Sliding Toggle */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handlePress}
          disabled={isLoading}
          style={styles.toggleWrapper}
          accessibilityRole="switch"
          accessibilityState={{ checked: isOpen }}
          accessibilityLabel="Toggle store open status"
        >
          <Animated.View style={[styles.toggleTrack, { backgroundColor: trackBgColor }]}>
            <Animated.View
              style={[
                styles.toggleThumb,
                { transform: [{ translateX: thumbTranslateX }] },
              ]}
            />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8ECF2',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  textCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginLeft: 6,
  },
  toggleWrapper: {
    padding: 2,
  },
  toggleTrack: {
    width: 50,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
});
