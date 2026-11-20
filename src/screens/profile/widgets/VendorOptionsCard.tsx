import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface VendorOptionItem {
  id: string;
  label: string;
  iconName: string;
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
                <Ionicons name="chevron-forward" size={18} color="#475569" />
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
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
});
