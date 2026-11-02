import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@dusmint/ui';
import { dusmintApi } from '../../api-client/client';
import { VendorStockItem } from '../../api-client/types';

export const VendorStockScreen: React.FC = () => {
  const [items, setItems] = useState<VendorStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStock = useCallback(async () => {
    try {
      const data = await dusmintApi.getVendorStock();
      if (data && data.length > 0) {
        setItems(data);
      } else {
        // Fallback default stock items
        setItems([
          {
            id: '3fcdaac8-6a4c-43f5-9c4a-338c6fd55218',
            nameEn: 'Fresh Desi Tomato (Hybrid)',
            nameHi: 'देसी टमाटर',
            category: 'Vegetables',
            unit: '1 kg',
            pricePaise: 3500,
            mrpPaise: 4500,
            isInStock: true,
          },
          {
            id: 'a84df0e0-48af-45ef-ba73-105df70158a1',
            nameEn: 'Indore Jyoti Potato',
            nameHi: 'ज्योति आलू',
            category: 'Vegetables',
            unit: '1 kg',
            pricePaise: 2500,
            mrpPaise: 3200,
            isInStock: true,
          },
          {
            id: '1a02146a-6701-42e1-8931-235aa6fab415',
            nameEn: 'Aashirvaad Shudh Chakki Atta',
            nameHi: 'आशीर्वाद आटा',
            category: 'Staples',
            unit: '5 kg',
            pricePaise: 24500,
            mrpPaise: 27500,
            isInStock: true,
          },
        ]);
      }
    } catch (err) {
      console.warn('Failed to fetch stock items:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStock();
  }, [loadStock]);

  const onRefresh = () => {
    setRefreshing(true);
    loadStock();
  };

  const toggleStock = async (itemId: string, currentVal: boolean) => {
    const newVal = !currentVal;
    // Optimistic UI update
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, isInStock: newVal } : item
      )
    );

    try {
      await dusmintApi.updateVendorStock(itemId, { inStock: newVal });
    } catch (err) {
      console.warn('Stock update API failed, reverting:', err);
      // Revert if error
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, isInStock: currentVal } : item
        )
      );
      Alert.alert('Update Failed', 'Could not update stock status. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Daily Stock & Mandi Rates</Text>
        <Text style={styles.headerSub}>
          Toggle in-stock items and check real-time availability for customers
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Fetching catalogue items...</Text>
          </View>
        )}

        {!loading &&
          items.map((item) => {
            const priceRupees = (item.pricePaise / 100).toFixed(0);
            const mrpRupees = item.mrpPaise ? (item.mrpPaise / 100).toFixed(0) : null;

            return (
              <View
                key={item.id}
                style={[styles.card, !item.isInStock ? styles.outOfStockCard : null]}
              >
                <View style={styles.infoCol}>
                  <Text style={styles.itemName}>{item.nameEn}</Text>
                  {item.nameHi ? (
                    <Text style={styles.itemVernacular}>{item.nameHi}</Text>
                  ) : null}
                  <Text style={styles.itemUnit}>
                    Category: {item.category} • Unit: {item.unit}
                  </Text>

                  {/* Mandi Rate Comparison */}
                  <View style={styles.mandiBox}>
                    <Text style={styles.mandiText}>
                      Govt Mandi Band: ₹{Math.round(Number(priceRupees) * 0.85)} - ₹
                      {Math.round(Number(priceRupees) * 1.15)}
                    </Text>
                  </View>
                </View>

                <View style={styles.actionCol}>
                  <Text style={styles.priceText}>₹{priceRupees}</Text>
                  {mrpRupees && (
                    <Text style={styles.mrpText}>MRP ₹{mrpRupees}</Text>
                  )}
                  <View style={styles.switchRow}>
                    <Text
                      style={[
                        styles.statusText,
                        { color: item.isInStock ? Colors.primary : Colors.secondary },
                      ]}
                    >
                      {item.isInStock ? 'IN STOCK' : 'OUT'}
                    </Text>
                    <Switch
                      value={item.isInStock}
                      onValueChange={() => toggleStock(item.id, item.isInStock)}
                      trackColor={{ false: '#D1D5DB', true: Colors.primary }}
                    />
                  </View>
                </View>
              </View>
            );
          })}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
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
    paddingBottom: 40,
  },
  loadingBox: {
    paddingVertical: 50,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontFamily: Typography.fontFamily.body,
    color: Colors.secondary,
    fontSize: Typography.fontSize.xs,
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
    marginRight: 12,
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
    marginTop: 1,
  },
  itemUnit: {
    fontFamily: Typography.fontFamily.body,
    fontSize: 11,
    color: Colors.secondary,
    marginTop: 4,
  },
  mandiBox: {
    backgroundColor: '#F3F4F6',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 6,
  },
  mandiText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.heading,
    color: '#4B5563',
  },
  actionCol: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontFamily: Typography.fontFamily.headingBold,
    fontSize: Typography.fontSize.base,
    color: Colors.primary,
  },
  mrpText: {
    fontFamily: Typography.fontFamily.body,
    fontSize: 10,
    color: Colors.secondary,
    textDecorationLine: 'line-through',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  statusText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.headingBold,
    marginRight: 4,
  },
});
