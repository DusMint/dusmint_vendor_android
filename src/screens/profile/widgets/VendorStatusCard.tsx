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
    Animated.timing(animValue, {
      toValue: isOpen ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [isOpen, animValue]);

  const handlePress = () => {
    if (isLoading) return;
    try {
      Vibration.vibrate(20);
    } catch {}
    onToggle(!isOpen);
  };

  // Interpolated track background color
  const trackBgColor = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#CBD5E1', '#047A36'],
  });

  // Interpolated thumb horizontal position
  const thumbTranslateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 24],
  });

  return (
    <TouchableOpacity
      style={[styles.card, isOpen ? styles.cardOpen : styles.cardClosed]}
      activeOpacity={0.85}
      onPress={handlePress}
      disabled={isLoading}
      accessibilityRole="switch"
      accessibilityState={{ checked: isOpen }}
      accessibilityLabel="Toggle store open status"
    >
      <View style={styles.contentRow}>
        <View style={styles.leftCol}>
          {/* Icon Circle matching DusMint green/red theme */}
          <View style={[styles.iconCircle, isOpen ? styles.iconCircleOpen : styles.iconCircleClosed]}>
            <Ionicons
              name={isOpen ? 'storefront' : 'storefront-outline'}
              size={20}
              color={isOpen ? '#047A36' : '#DC2626'}
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
                  { backgroundColor: isOpen ? '#047A36' : '#DC2626' },
                ]}
              />
            </View>
            <Text style={[styles.subtext, { color: isOpen ? '#047A36' : '#64748B' }]}>
              {isOpen ? 'Online • Customers can place live orders' : 'Paused • Orders paused until you re-open'}
            </Text>
          </View>
        </View>

        {/* Modern Custom Sliding Toggle */}
        <View style={styles.toggleWrapper} pointerEvents="none">
          <Animated.View style={[styles.toggleTrack, { backgroundColor: trackBgColor }]}>
            <Animated.View
              style={[
                styles.toggleThumb,
                { transform: [{ translateX: thumbTranslateX }] },
              ]}
            />
          </Animated.View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
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
  cardOpen: {
    borderColor: '#A7F3D0',
  },
  cardClosed: {
    borderColor: '#FECACA',
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
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconCircleOpen: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  iconCircleClosed: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  textCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  subtext: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Medium',
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 6,
  },
  toggleWrapper: {
    padding: 2,
  },
  toggleTrack: {
    width: 52,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
});
