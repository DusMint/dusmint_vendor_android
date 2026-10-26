import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { BorderRadius, Spacing } from '../theme/spacing';

export type TrustBadgeType = 'weight_verified' | 'anchor_vendor' | 'seal_verified' | 'mandi_rate';

export interface TrustBadgeProps {
  type: TrustBadgeType;
  customText?: string;
  style?: ViewStyle;
}

export const TrustBadge: React.FC<TrustBadgeProps> = ({
  type,
  customText,
  style,
}) => {
  const getBadgeConfig = () => {
    switch (type) {
      case 'weight_verified':
        return {
          icon: '⚖️',
          label: customText || '100% Weight Verified',
          bg: '#E8F5E9',
          color: '#1B5E20',
        };
      case 'anchor_vendor':
        return {
          icon: '⭐',
          label: customText || 'Anchor Vendor',
          bg: '#FEF3C7',
          color: '#B45309',
        };
      case 'seal_verified':
        return {
          icon: '🔒',
          label: customText || 'Tamper-Evident QR Seal',
          bg: '#E0F2FE',
          color: '#0369A1',
        };
      case 'mandi_rate':
        return {
          icon: '📊',
          label: customText || 'Direct Mandi Rates',
          bg: '#F3E8FF',
          color: '#7E22CE',
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, style]}>
      <Text style={styles.icon}>{config.icon}</Text>
      <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.pill,
    alignSelf: 'flex-start',
  },
  icon: {
    fontSize: 12,
    marginRight: 4,
  },
  text: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.heading,
  },
});
