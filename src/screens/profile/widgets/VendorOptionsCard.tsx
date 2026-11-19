import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface VendorOptionItem {
  id: string;
  label: string;
  iconName: string;
  badgeText?: string;
  badgeType?: 'green' | 'neutral' | 'orange';
}

interface Props {
  options: VendorOptionItem[];
  onOptionPress: (option: VendorOptionItem) => void;
}

export const VendorOptionsCard: React.FC<Props> = ({ options, onOptionPress }) => {
  return (
    <View style={styles.card}>
      {options.map((option, index) => {
        const isLast = index === options.length - 1;
        return (
          <React.Fragment key={option.id}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => onOptionPress(option)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={option.label}
            >
              <View style={styles.left}>
                <View style={styles.iconCircle}>
                  <Ionicons
                    name={option.iconName as any}
                    size={20}
                    color="#0F172A"
                  />
                </View>
                <Text style={styles.label}>{option.label}</Text>
              </View>

              <View style={styles.right}>
                {Boolean(option.badgeText) && (
                  <View
                    style={[
                      styles.badge,
                      option.badgeType === 'orange'
                        ? styles.badgeOrange
                        : option.badgeType === 'neutral'
                        ? styles.badgeNeutral
                        : styles.badgeGreen,
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        option.badgeType === 'orange'
                          ? styles.badgeTextOrange
                          : option.badgeType === 'neutral'
                          ? styles.badgeTextNeutral
                          : styles.badgeTextGreen,
                      ]}
                      numberOfLines={1}
                    >
                      {option.badgeText}
                    </Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </View>
            </TouchableOpacity>
            {!isLast && <View style={styles.divider} />}
          </React.Fragment>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginTop: 14,
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8ECF2',
    borderRadius: 20,
    paddingHorizontal: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  row: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: '48%',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeGreen: {
    backgroundColor: '#DCFCE7',
  },
  badgeOrange: {
    backgroundColor: '#FFF7ED',
  },
  badgeNeutral: {
    backgroundColor: '#F1F5F9',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  badgeTextGreen: {
    color: '#15803D',
  },
  badgeTextOrange: {
    color: '#EA580C',
  },
  badgeTextNeutral: {
    color: '#475569',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
});
