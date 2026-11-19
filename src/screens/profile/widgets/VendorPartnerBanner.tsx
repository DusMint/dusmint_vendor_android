import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  commissionPct?: number;
  onPress?: () => void;
}

export const VendorPartnerBanner: React.FC<Props> = ({ commissionPct = 8.0, onPress }) => {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      Alert.alert(
        'DusMint Partner Program',
        `• T+0 Daily Settlements: Direct UPI payouts credited automatically after delivery.\n• Commission Rate: ${commissionPct}% Tier-1 Mandi Partner rate.\n• Priority Rider Dispatch: Dedicated fleet pickup for packed orders.\n• 24x7 Mandi Operations Desk support.`,
        [{ text: 'Got It' }]
      );
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={handlePress}
    >
      <View style={styles.headerRow}>
        <View style={styles.brandRow}>
          <Text style={styles.partnerBrand}>partner</Text>
          <View style={styles.joinBadge}>
            <Text style={styles.joinBadgeText}>T+0 DAILY</Text>
          </View>
        </View>
        <Ionicons name="chevron-down" size={18} color="#94A3B8" />
      </View>

      <Text style={styles.title}>
        DusMint Verified Partner • T+0 Daily Settlements
      </Text>
      <Text style={styles.subtitle}>
        Direct UPI payouts settled automatically on rider collection
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8ECF2',
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  partnerBrand: {
    color: '#047A36',
    fontWeight: '900',
    fontSize: 22,
    fontStyle: 'italic',
    letterSpacing: -0.5,
  },
  joinBadge: {
    backgroundColor: '#047A36',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  joinBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '400',
  },
});
