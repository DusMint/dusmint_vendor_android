import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@dusmint/ui';

interface StockItem {
  id: string;
  nameEn: string;
  nameHi: string;
  unit: string;
  currentPrice: number;
  mandiMin: number;
  mandiMax: number;
  inStock: boolean;
}

const initialItems: StockItem[] = [
  {
    id: 'item-1',
    nameEn: 'Fresh Desi Tomato (Hybrid)',
    nameHi: 'ताजा टमाटर (हाइब्रिड)',
    unit: '1 kg',
    currentPrice: 32,
    mandiMin: 25,
    mandiMax: 38,
    inStock: true,
  },
  {
    id: 'item-2',
    nameEn: 'Indore Jyoti Potato (Aloo)',
    nameHi: 'इंदौर ज्योति आलू',
    unit: '1 kg',
    currentPrice: 28,
    mandiMin: 22,
    mandiMax: 34,
    inStock: true,
  },
  {
    id: 'item-3',
    nameEn: 'Nashik Red Onion (Pyaaz)',
    nameHi: 'लाल प्याज (नासिक)',
    unit: '1 kg',
    currentPrice: 35,
    mandiMin: 30,
    mandiMax: 42,
    inStock: true,
  },
  {
    id: 'item-4',
    nameEn: 'Fresh Palak (Spinach Bunch)',
    nameHi: 'ताजा पालक की गड्डी',
    unit: '250 g',
    currentPrice: 15,
    mandiMin: 12,
    mandiMax: 20,
    inStock: false,
  },
];

export const VendorStockScreen: React.FC = () => {
  const [items, setItems] = useState<StockItem[]>(initialItems);

  const toggleStock = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, inStock: !item.inStock } : item
      )
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Daily Stock & Mandi Rates</Text>
        <Text style={styles.headerSub}>
          Toggle in-stock items and check against today's government mandi bands
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {items.map((item) => (
          <View
            key={item.id}
            style={[styles.card, !item.inStock ? styles.outOfStockCard : null]}
          >
            <View style={styles.infoCol}>
              <Text style={styles.itemName}>{item.nameEn}</Text>
              <Text style={styles.itemVernacular}>{item.nameHi}</Text>
              <Text style={styles.itemUnit}>Unit: {item.unit}</Text>

              {/* Mandi Rate Comparison */}
              <View style={styles.mandiBox}>
                <Text style={styles.mandiText}>
                  Mandi Band: ₹{item.mandiMin} - ₹{item.mandiMax}
                </Text>
              </View>
            </View>

            <View style={styles.actionCol}>
              <Text style={styles.priceText}>₹{item.currentPrice}</Text>
              <View style={styles.switchRow}>
                <Text
                  style={[
                    styles.statusText,
                    { color: item.inStock ? Colors.primary : Colors.secondary },
                  ]}
                >
                  {item.inStock ? 'IN STOCK' : 'OUT'}
                </Text>
                <Switch
                  value={item.inStock}
                  onValueChange={() => toggleStock(item.id)}
                  trackColor={{ false: '#D1D5DB', true: Colors.primary }}
                />
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.headingBold,
    fontSize: Typography.fontSize.xl,
    color: Colors.textPrimary,
  },
  headerSub: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.fontSize.xs,
    color: Colors.secondary,
    marginTop: 2,
  },
  scroll: {
    padding: Spacing.base,
  },
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Shadows.light,
  },
  outOfStockCard: {
    opacity: 0.6,
  },
  infoCol: {
    flex: 1,
  },
  itemName: {
    fontFamily: Typography.fontFamily.headingBold,
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
  },
  itemVernacular: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  itemUnit: {
    fontFamily: Typography.fontFamily.body,
    fontSize: 11,
    color: Colors.secondary,
    marginTop: 2,
  },
  mandiBox: {
    backgroundColor: '#FAF5FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  mandiText: {
    color: '#7E22CE',
    fontSize: 10,
    fontFamily: Typography.fontFamily.heading,
  },
  actionCol: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontFamily: Typography.fontFamily.headingBold,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  switchRow: {
    alignItems: 'center',
  },
  statusText: {
    fontFamily: Typography.fontFamily.headingBold,
    fontSize: 9,
    marginBottom: 2,
  },
});
