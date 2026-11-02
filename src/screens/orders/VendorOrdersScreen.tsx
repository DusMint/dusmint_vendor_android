import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Vibration,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, RoundButton } from '@dusmint/ui';
import { dusmintApi } from '../../api-client/client';
import { VendorOrderPart, VendorProfileInfo } from '../../api-client/types';

export const VendorOrdersScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'new' | 'packing' | 'ready' | 'done'>('new');
  const [vendors, setVendors] = useState<VendorProfileInfo[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [orders, setOrders] = useState<VendorOrderPart[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const previousOrderCountRef = useRef<number>(0);

  // 1. Fetch vendor list
  useEffect(() => {
    async function loadVendors() {
      try {
        const list = await dusmintApi.getVendorList();
        if (list && list.length > 0) {
          setVendors(list);
          setSelectedVendorId(list[0].id);
        }
      } catch (err) {
        console.warn('Failed to load vendors list:', err);
      }
    }
    loadVendors();
  }, []);

  // 2. Fetch vendor orders
  const fetchOrders = useCallback(async (isPolling = false) => {
    if (!isPolling) setLoading(true);
    try {
      const data = await dusmintApi.getVendorOrders(selectedVendorId || undefined);
      setOrders(data || []);

      // Check for newly arrived orders to alert the merchant
      const pendingCount = (data || []).filter(o => o.status === 'pending').length;
      if (previousOrderCountRef.current > 0 && pendingCount > previousOrderCountRef.current) {
        Vibration.vibrate([0, 500, 200, 500]);
        Alert.alert('🔔 NAYI ORDER AAYI HAI!', 'Customer ne naya order place kiya hai. Kripya saman pack karein.');
      }
      previousOrderCountRef.current = pendingCount;
    } catch (err) {
      console.warn('Failed to fetch vendor orders:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedVendorId]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => {
      fetchOrders(true);
    }, 6000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const selectedVendor = vendors.find(v => v.id === selectedVendorId);

  // Filter orders by tab
  const newOrders = orders.filter(o => o.status === 'pending' || o.status === 'accepted');
  const packingOrders = orders.filter(o => o.status === 'packing');
  const readyOrders = orders.filter(o => o.status === 'ready');
  const doneOrders = orders.filter(o => o.status === 'picked_up' || o.status === 'delivered');

  const displayedOrders =
    activeTab === 'new'
      ? newOrders
      : activeTab === 'packing'
      ? packingOrders
      : activeTab === 'ready'
      ? readyOrders
      : doneOrders;

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header with Shop Switcher & Open Toggle */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              if (vendors.length > 1) {
                const nextIdx = (vendors.findIndex(v => v.id === selectedVendorId) + 1) % vendors.length;
                setSelectedVendorId(vendors[nextIdx].id);
              }
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.shopName}>
                {selectedVendor ? selectedVendor.name : 'Dukaan Orders'}
              </Text>
              {vendors.length > 1 && (
                <Text style={styles.switchPill}>Switch ⇄</Text>
              )}
            </View>
            <Text style={styles.clusterText}>
              {selectedVendor?.category ? `Category: ${selectedVendor.category}` : 'Vijay Nagar Cluster'} • Tap to switch
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.toggleBox}>
          <Text style={[styles.toggleText, { color: isOpen ? Colors.primary : Colors.error }]}>
            {isOpen ? 'SHOP OPEN' : 'CLOSED'}
          </Text>
          <Switch
            value={isOpen}
            onValueChange={setIsOpen}
            trackColor={{ false: '#D1D5DB', true: Colors.primary }}
          />
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsRow}>
        {(
          [
            { key: 'new', label: `New (${newOrders.length})` },
            { key: 'packing', label: `Packing (${packingOrders.length})` },
            { key: 'ready', label: `Ready (${readyOrders.length})` },
            { key: 'done', label: `Done (${doneOrders.length})` },
          ] as const
        ).map((tab) => {
          const isChosen = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tabBtn, isChosen ? styles.tabBtnActive : null]}
            >
              <Text style={[styles.tabText, isChosen ? styles.tabTextActive : null]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading && !refreshing && (
          <View style={styles.emptyBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.emptyText}>Loading vendor orders...</Text>
          </View>
        )}

        {!loading && displayedOrders.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyHeading}>No {activeTab} orders right now</Text>
            <Text style={styles.emptyText}>
              New customer orders assigned to your shop will chime and show up here instantly.
            </Text>
          </View>
        )}

        {displayedOrders.map((order) => {
          const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
          const isReady = order.status === 'ready';

          return (
            <View
              key={order.partId}
              style={[
                styles.orderCard,
                isReady ? styles.readyBorder : null,
              ]}
            >
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.orderCode}>{order.orderCode}</Text>
                  <Text style={styles.slotTime}>{order.slotTime}</Text>
                </View>

                {isReady ? (
                  <View style={styles.readyBadge}>
                    <Text style={styles.readyBadgeText}>SEALED & READY</Text>
                  </View>
                ) : (
                  <View style={styles.newAlertBadge}>
                    <Text style={styles.newAlertText}>🔔 ACTION REQUIRED</Text>
                  </View>
                )}
              </View>

              {/* Items Checklist */}
              <View style={styles.checklist}>
                <Text style={styles.checkTitle}>Items to Pack ({itemCount} total items):</Text>
                {order.items.map((i, idx) => (
                  <View key={idx} style={styles.checkItem}>
                    <Text style={styles.itemBullet}>•</Text>
                    <Text style={styles.itemName}>
                      {i.name} ({i.unit}) × {i.quantity}
                    </Text>
                    <Text style={styles.itemPrice}>₹{(i.pricePaise * i.quantity / 100).toFixed(0)}</Text>
                  </View>
                ))}
              </View>

              {/* Scale & Seal Details */}
              <View style={styles.scaleInfo}>
                <Text style={styles.scaleTarget}>
                  {isReady && order.packedWeightGrams
                    ? `Packed Weight: ${order.packedWeightGrams} g`
                    : `Est. Items Subtotal: ₹${(order.subtotalPaise / 100).toFixed(0)}`}
                </Text>
                <Text style={styles.payout}>
                  Net Payout: ₹{(order.subtotalPaise * 0.9 / 100).toFixed(0)}
                </Text>
              </View>

              {isReady && order.sealQr && (
                <View style={styles.sealInfoRow}>
                  <Text style={styles.sealLabel}>Tamper-Proof Tape Seal:</Text>
                  <Text style={styles.sealCode}>{order.sealQr}</Text>
                </View>
              )}

              {/* Actions */}
              {!isReady && (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    onPress={() => Alert.alert('Shortage Notice', 'Item shortage has been marked. Operations team notified.')}
                    style={styles.rejectBtn}
                  >
                    <Text style={styles.rejectText}>Item Short</Text>
                  </TouchableOpacity>

                  <RoundButton
                    title="⚖️ Pack & Weigh on Scale"
                    onPress={() =>
                      navigation.navigate('VendorPack', {
                        partId: order.partId,
                        orderCode: order.orderCode,
                        items: order.items,
                        subtotalPaise: order.subtotalPaise,
                      })
                    }
                    style={styles.packBtn}
                  />
                </View>
              )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  shopName: {
    fontFamily: Typography.fontFamily.headingBold,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  switchPill: {
    fontSize: 10,
    color: Colors.primary,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
    fontWeight: '700',
  },
  clusterText: {
    fontFamily: Typography.fontFamily.body,
    fontSize: 11,
    color: Colors.secondary,
    marginTop: 2,
  },
  toggleBox: {
    alignItems: 'center',
  },
  toggleText: {
    fontFamily: Typography.fontFamily.headingBold,
    fontSize: 9,
    marginBottom: 2,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    fontFamily: Typography.fontFamily.headingBold,
    color: Colors.primary,
  },
  scroll: {
    padding: Spacing.base,
    paddingBottom: 40,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyHeading: {
    fontFamily: Typography.fontFamily.headingBold,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  emptyText: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.fontSize.sm,
    color: Colors.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  orderCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    marginBottom: Spacing.base,
  },
  readyBorder: {
    borderColor: '#10B981',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderCode: {
    fontFamily: Typography.fontFamily.headingBold,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  slotTime: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.fontSize.xs,
    color: Colors.secondary,
    marginTop: 2,
  },
  newAlertBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  newAlertText: {
    color: '#B45309',
    fontSize: 10,
    fontFamily: Typography.fontFamily.headingBold,
  },
  readyBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  readyBadgeText: {
    color: '#065F46',
    fontSize: 10,
    fontFamily: Typography.fontFamily.headingBold,
  },
  checklist: {
    backgroundColor: Colors.surfaceCream,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginVertical: Spacing.md,
  },
  checkTitle: {
    fontFamily: Typography.fontFamily.heading,
    fontSize: Typography.fontSize.xs,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  itemBullet: {
    marginRight: 6,
    color: Colors.primary,
  },
  itemName: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.fontSize.xs,
    color: Colors.textPrimary,
    flex: 1,
  },
  itemPrice: {
    fontFamily: Typography.fontFamily.bodyBold,
    fontSize: Typography.fontSize.xs,
    color: Colors.textPrimary,
  },
  scaleInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: Spacing.xs,
  },
  scaleTarget: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.fontSize.xs,
    color: Colors.secondary,
  },
  payout: {
    fontFamily: Typography.fontFamily.headingBold,
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
  },
  sealInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
  },
  sealLabel: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.body,
    color: Colors.secondary,
  },
  sealCode: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.headingBold,
    color: '#111827',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  rejectBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: BorderRadius.roundButton,
    backgroundColor: '#FEE2E2',
    marginRight: 10,
  },
  rejectText: {
    color: Colors.error,
    fontFamily: Typography.fontFamily.headingBold,
    fontSize: Typography.fontSize.xs,
  },
  packBtn: {
    flex: 1,
  },
});
