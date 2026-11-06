import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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
  const renderIcon = (color: string) => {
    switch (type) {
      case 'weight_verified':
        return <MaterialCommunityIcons name="scale-balance" size={14} color={color} style={styles.iconStyle} />;
      case 'anchor_vendor':
        return <Ionicons name="shield-checkmark" size={13} color={color} style={styles.iconStyle} />;
      case 'seal_verified':
        return <Ionicons name="lock-closed" size={13} color={color} style={styles.iconStyle} />;
      case 'mandi_rate':
        return <Ionicons name="trending-down" size={13} color={color} style={styles.iconStyle} />;
    }
  };

  const getBadgeConfig = () => {
    switch (type) {
      case 'weight_verified':
        return {
          label: customText || '100% Weight Verified',
          bg: '#E8F5E9',
          color: '#1B5E20',
        };
      case 'anchor_vendor':
        return {
          label: customText || 'Anchor Vendor',
          bg: '#FEF3C7',
          color: '#B45309',
        };
      case 'seal_verified':
        return {
          label: customText || 'Tamper-Evident QR Seal',
          bg: '#E0F2FE',
          color: '#0369A1',
        };
      case 'mandi_rate':
        return {
          label: customText || 'Direct Mandi Rates',
          bg: '#F3E8FF',
          color: '#7E22CE',
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, style]}>
      {renderIcon(config.color)}
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
  iconStyle: {
    marginRight: 4,
  },
  text: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.heading,
  },
});
