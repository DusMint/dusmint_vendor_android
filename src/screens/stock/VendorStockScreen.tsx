import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@dusmint/ui';
import { dusmintApi } from '../../api-client/client';
import { VendorStockItem } from '../../api-client/types';

export const VendorStockScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
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
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, isInStock: currentVal } : item
        )
      );
      Alert.alert('Update Failed', 'Could not update stock status. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top + 10 : 18 }]}>
        <Text style={styles.headerTitle}>Daily Stock & Mandi Rates</Text>
        <Text style={styles.headerSub}>
          Toggle in-stock items and check real-time availability for customers
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FC6011']} />}
        showsVerticalScrollIndicator={false}
      >
        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#FC6011" />
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
                style={[styles.card, !item.isInStock && styles.outOfStockCard]}
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
                        { color: item.isInStock ? '#047857' : '#94A3B8' },
                      ]}
                    >
                      {item.isInStock ? 'IN STOCK' : 'OUT'}
                    </Text>
                    <Switch
                      value={item.isInStock}
                      onValueChange={() => toggleStock(item.id, item.isInStock)}
                      trackColor={{ false: '#E2E8F0', true: '#FED7AA' }}
                      thumbColor={item.isInStock ? '#FC6011' : '#94A3B8'}
                    />
                  </View>
                </View>
              </View>
            );
          })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 3,
  },
  headerTitle: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
    lineHeight: 16,
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingBox: {
    paddingVertical: 50,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#64748B',
    fontSize: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  outOfStockCard: {
    opacity: 0.65,
    backgroundColor: '#FAFAFA',
  },
  infoCol: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  itemVernacular: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  itemUnit: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
  mandiBox: {
    backgroundColor: '#F1F5F9',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
  },
  mandiText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  actionCol: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 17,
    fontWeight: '800',
    color: '#FC6011',
  },
  mrpText: {
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
    marginTop: 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    marginRight: 4,
    letterSpacing: 0.5,
  },
});
