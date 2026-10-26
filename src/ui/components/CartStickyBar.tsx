import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { BorderRadius, Spacing, Shadows } from '../theme/spacing';

export interface CartStickyBarProps {
  totalItems: number;
  totalPaise: number;
  onPressViewCart: () => void;
  style?: ViewStyle;
}

export const CartStickyBar: React.FC<CartStickyBarProps> = ({
  totalItems,
  totalPaise,
  onPressViewCart,
  style,
}) => {
  if (totalItems <= 0) return null;

  const totalRupees = (totalPaise / 100).toFixed(0);

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPressViewCart}
        style={styles.bar}
      >
        <View style={styles.leftSection}>
          <View style={styles.itemBadge}>
            <Text style={styles.itemBadgeText}>{totalItems}</Text>
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.totalLabel}>TOTAL</Text>
            <Text style={styles.totalPrice}>₹{totalRupees}</Text>
          </View>
        </View>

        <View style={styles.rightSection}>
          <Text style={styles.viewCartText}>View Cart</Text>
          <Text style={styles.arrowIcon}>→</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    zIndex: 999,
  },
  bar: {
    backgroundColor: Colors.primary,
    height: 58,
    borderRadius: BorderRadius.roundButton,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    ...Shadows.heavy,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemBadge: {
    backgroundColor: Colors.accentMint,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: Spacing.sm,
  },
  itemBadgeText: {
    color: '#074824',
    fontFamily: Typography.fontFamily.headingBold,
    fontSize: Typography.fontSize.xs,
  },
  priceContainer: {
    marginLeft: 4,
  },
  totalLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 9,
    fontFamily: Typography.fontFamily.bodyMedium,
  },
  totalPrice: {
    color: Colors.textWhite,
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.headingBold,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewCartText: {
    color: Colors.textWhite,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.heading,
    marginRight: 6,
  },
  arrowIcon: {
    color: Colors.textWhite,
    fontSize: 18,
    fontFamily: Typography.fontFamily.headingBold,
  },
});
