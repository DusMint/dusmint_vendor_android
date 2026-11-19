import React from 'react';
import { View, Text, StyleSheet, Switch, Vibration } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  isOpen: boolean;
  onToggle: (val: boolean) => void;
  isLoading?: boolean;
}

export const VendorStatusCard: React.FC<Props> = ({ isOpen, onToggle, isLoading }) => {
  const handleToggle = (val: boolean) => {
    Vibration.vibrate(40);
    onToggle(val);
  };

  return (
    <View
      style={[
        styles.card,
        {
          borderColor: isOpen ? '#BBF7D0' : '#FECACA',
          backgroundColor: isOpen ? '#F0FDF4' : '#FEF2F2',
        },
      ]}
    >
      <View style={styles.contentRow}>
        <View style={styles.leftCol}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: isOpen ? '#DCFCE7' : '#FEE2E2' },
            ]}
          >
            <Ionicons
              name={isOpen ? 'storefront' : 'storefront-outline'}
              size={20}
              color={isOpen ? '#16A34A' : '#EF4444'}
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
                  { backgroundColor: isOpen ? '#16A34A' : '#EF4444' },
                ]}
              />
            </View>
            <Text style={styles.subtitle}>
              {isOpen
                ? 'Online on customer app • Live delivery slots'
                : 'Paused • Customers cannot order from your dukaan'}
            </Text>
          </View>
        </View>

        <Switch
          value={isOpen}
          onValueChange={handleToggle}
          disabled={isLoading}
          trackColor={{ false: '#CBD5E1', true: '#86EFAC' }}
          thumbColor={isOpen ? '#16A34A' : '#94A3B8'}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 20,
    borderWidth: 1,
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
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  subtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '400',
  },
});
