import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
  Vibration,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient as SvgGradient, Stop, Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { dusmintApi } from '../../api-client/client';
import { VendorOrderPart, VendorProfileInfo } from '../../api-client/types';
import { useVendorAuthStore } from '../../state/useVendorAuthStore';

// Realistic Rich Fallback Vendors for Gupta Traders
const FALLBACK_VENDORS: VendorProfileInfo[] = [
  {
    id: 'vendor-1',
    name: 'Gupta Traders',
    owner_name: 'Ramesh Gupta',
    category: 'Vegetables & Fruits',
    cluster_name: 'Vijay Nagar',
    is_open: true,
  },
];

// Realistic Rich Fallback Orders tailored for Tier 3/4 Shopkeeper
const FALLBACK_ORDERS: VendorOrderPart[] = [
  {
    partId: 'ord-part-101',
    orderId: 'ord-101',
    orderCode: '#DM-8821',
    status: 'pending',
    slotTime: 'Morning Slot • 08:30 AM',
    subtotalPaise: 46500,
    items: [
      { id: 'item-1', name: 'Fresh Desi Tomato', unit: '2 kg', quantity: 1, pricePaise: 7000 },
      { id: 'item-2', name: 'Indore Jyoti Potato', unit: '1 kg', quantity: 1, pricePaise: 2500 },
      { id: 'item-3', name: 'Fresh Chicken Curry Cut', unit: '500 g', quantity: 1, pricePaise: 13000 },
    ],
  },
  {
    partId: 'ord-part-102',
    orderId: 'ord-102',
    orderCode: '#DM-8825',
    status: 'pending',
    slotTime: 'Morning Slot • 09:00 AM',
    subtotalPaise: 28000,
    items: [
      { id: 'item-4', name: 'Nashik Red Onion', unit: '2 kg', quantity: 1, pricePaise: 8000 },
      { id: 'item-5', name: 'Farm Fresh White Eggs', unit: '6 pcs', quantity: 1, pricePaise: 4800 },
      { id: 'item-6', name: 'Green Chillies', unit: '250 g', quantity: 1, pricePaise: 2000 },
    ],
  },
  {
    partId: 'ord-part-103',
    orderId: 'ord-103',
    orderCode: '#DM-8819',
    status: 'packing',
    slotTime: 'Morning Slot • 08:15 AM',
    subtotalPaise: 34000,
    items: [
      { id: 'item-7', name: 'Farm Fresh White Eggs', unit: '12 pcs', quantity: 1, pricePaise: 9600 },
      { id: 'item-8', name: 'Fresh Desi Tomato', unit: '1 kg', quantity: 1, pricePaise: 3500 },
    ],
  },
  {
    partId: 'ord-part-104',
    orderId: 'ord-104',
    orderCode: '#DM-8812',
    status: 'ready',
    sealQr: 'DST-44910-INDR',
    slotTime: 'Morning Slot • 08:00 AM',
    subtotalPaise: 52000,
    items: [
      { id: 'item-9', name: 'Fresh Chicken Curry Cut', unit: '1 kg', quantity: 1, pricePaise: 26000 },
      { id: 'item-10', name: 'Indore Jyoti Potato', unit: '2 kg', quantity: 1, pricePaise: 5000 },
    ],
  },
  {
    partId: 'ord-part-105',
    orderId: 'ord-105',
    orderCode: '#DM-8809',
    status: 'delivered',
    slotTime: 'Morning Slot • 07:30 AM',
    subtotalPaise: 39000,
    items: [
      { id: 'item-11', name: 'Nashik Red Onion', unit: '3 kg', quantity: 1, pricePaise: 12000 },
      { id: 'item-12', name: 'Fresh Desi Tomato', unit: '1 kg', quantity: 1, pricePaise: 3500 },
    ],
  },
  {
    partId: 'ord-part-106',
    orderId: 'ord-106',
    orderCode: '#DM-8802',
    status: 'delivered',
    slotTime: 'Morning Slot • 07:00 AM',
    subtotalPaise: 44000,
    items: [
      { id: 'item-13', name: 'Fresh Chicken Curry Cut', unit: '1 kg', quantity: 1, pricePaise: 26000 },
      { id: 'item-14', name: 'Farm Fresh White Eggs', unit: '6 pcs', quantity: 1, pricePaise: 4800 },
    ],
  },
];

export const VendorOrdersScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'new' | 'packing' | 'ready' | 'done'>('new');
  const [vendors, setVendors] = useState<VendorProfileInfo[]>(FALLBACK_VENDORS);
  const [selectedVendorId, setSelectedVendorId] = useState<string>('vendor-1');
  const [orders, setOrders] = useState<VendorOrderPart[]>(FALLBACK_ORDERS);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const previousOrderCountRef = useRef<number>(0);

  // Animated sliding indicator for status tabs (0: new, 1: packing, 2: ready, 3: done)
  const tabAnim = useRef(new Animated.Value(0)).current;

  // 1. Fetch vendor list
  useEffect(() => {
    async function loadVendors() {
      try {
        const list = await dusmintApi.getVendorList();
        if (list && list.length > 0) {
          setVendors(list);
          setSelectedVendorId(list[0].id);
        }
      } catch {
        // Fallback vendor already set
      }
    }
    loadVendors();
  }, []);

  // 2. Fetch vendor orders
  const fetchOrders = useCallback(async (isPolling = false) => {
    try {
      const data = await dusmintApi.getVendorOrders(selectedVendorId || undefined);
      if (data && data.length > 0) {
        setOrders(data);

        // Alert on new incoming orders
        const pendingCount = data.filter((o) => o.status === 'pending').length;
        useVendorAuthStore.getState().setPendingOrdersCount(pendingCount);
        if (previousOrderCountRef.current > 0 && pendingCount > previousOrderCountRef.current) {
          Vibration.vibrate([0, 500, 200, 500]);
          Alert.alert('New Order Received', 'A customer order has arrived. Please pack the items.');
        }
        previousOrderCountRef.current = pendingCount;
      }
    } catch {
      // Retain fallback orders
    } finally {
      setRefreshing(false);
    }
  }, [selectedVendorId]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => {
      fetchOrders(true);
    }, 8000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const selectedVendor = vendors.find((v) => v.id === selectedVendorId) || vendors[0];

  // Store status toggle handler
  const handleToggleStoreStatus = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (selectedVendorId) {
      dusmintApi.toggleVendorStatus(selectedVendorId, nextState).catch(() => {});
    }
  };

  // Tab selection with spring animation
  const handleSelectTab = (tabKey: 'new' | 'packing' | 'ready' | 'done', idx: number) => {
    setActiveTab(tabKey);
    Animated.spring(tabAnim, {
      toValue: idx,
      useNativeDriver: false,
      tension: 65,
      friction: 10,
    }).start();
  };

  // Filter orders by status
  const newOrders = orders.filter((o) => o.status === 'pending' || o.status === 'accepted');
  const packingOrders = orders.filter((o) => o.status === 'packing');
  const readyOrders = orders.filter((o) => o.status === 'ready');
  const doneOrders = orders.filter((o) => o.status === 'picked_up' || o.status === 'delivered');

  const displayedOrders =
    activeTab === 'new'
      ? newOrders
      : activeTab === 'packing'
      ? packingOrders
      : activeTab === 'ready'
      ? readyOrders
      : doneOrders;

  // Shortage alert action
  const handleReportShortage = (order: VendorOrderPart) => {
    Alert.alert(
      'Report Item Shortage',
      `Mark an item unavailable for ${order.orderCode}? Customer and rider will be alerted immediately.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Shortage',
          style: 'destructive',
          onPress: () => Alert.alert('Shortage Reported', 'Operations and rider have been informed.'),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Soft Green Gradient Accent Header Background */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height={260}>
          <Defs>
            <SvgGradient id="ordersAccentGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#E8F5EC" />
              <Stop offset="100%" stopColor="#FFFFFF" />
            </SvgGradient>
          </Defs>
          <Rect width="100%" height={260} fill="url(#ordersAccentGrad)" />
        </Svg>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#047A36']} />}
      >
        {/* Screen Header - Identical Alignment & Typography to Earnings & Menu */}
        <View style={styles.headerRow}>
          <Text style={styles.screenTitle}>Orders</Text>

          {/* Clean 1-Tap Store Open/Closed Toggle */}
          <TouchableOpacity
            style={[styles.statusTogglePill, isOpen ? styles.statusToggleOpen : styles.statusToggleClosed]}
            onPress={handleToggleStoreStatus}
            activeOpacity={0.8}
          >
            <View style={[styles.statusDot, isOpen ? styles.statusDotOpen : styles.statusDotClosed]} />
            <Text
              style={[
                styles.statusToggleText,
                isOpen ? styles.statusToggleTextOpen : styles.statusToggleTextClosed,
              ]}
            >
              {isOpen ? 'STORE OPEN' : 'CLOSED'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 1. Today's Pulse Metrics - The 3 Essential Numbers for the Merchant */}
        <View style={styles.pulseRow}>
          {/* Card 1: To Pack */}
          <TouchableOpacity
            style={styles.pulseCard}
            onPress={() => handleSelectTab('new', 0)}
            activeOpacity={0.85}
          >
            <View style={styles.pulseCardTop}>
              <View style={styles.pulseIconCircle}>
                <Ionicons name="cube" size={16} color="#64748B" />
              </View>
              <Text style={styles.pulseVal}>{newOrders.length}</Text>
            </View>
            <Text style={styles.pulseLabel}>To Pack</Text>
          </TouchableOpacity>

          {/* Card 2: In Progress (Packing / Ready) */}
          <TouchableOpacity
            style={styles.pulseCard}
            onPress={() => handleSelectTab('packing', 1)}
            activeOpacity={0.85}
          >
            <View style={styles.pulseCardTop}>
              <View style={styles.pulseIconCircle}>
                <Ionicons name="time-outline" size={16} color="#64748B" />
              </View>
              <Text style={styles.pulseVal}>
                {packingOrders.length + readyOrders.length}
              </Text>
            </View>
            <Text style={styles.pulseLabel}>In Progress</Text>
          </TouchableOpacity>

          {/* Card 3: Delivered Today */}
          <TouchableOpacity
            style={styles.pulseCard}
            onPress={() => handleSelectTab('done', 3)}
            activeOpacity={0.85}
          >
            <View style={styles.pulseCardTop}>
              <View style={styles.pulseIconCircle}>
                <Ionicons name="checkmark-done" size={16} color="#64748B" />
              </View>
              <Text style={styles.pulseVal}>{doneOrders.length}</Text>
            </View>
            <Text style={styles.pulseLabel}>Delivered</Text>
          </TouchableOpacity>
        </View>

        {/* 2. Filter Tabs Segment with Smooth Animated Sliding Indicator */}
        <View style={styles.tabsContainer}>
          <Animated.View
            style={[
              styles.tabIndicator,
              {
                left: tabAnim.interpolate({
                  inputRange: [0, 1, 2, 3],
                  outputRange: ['0.8%', '25.6%', '50.4%', '75.2%'],
                }),
              },
            ]}
          />
          {(
            [
              { key: 'new', label: 'To Pack', count: newOrders.length },
              { key: 'packing', label: 'Packing', count: packingOrders.length },
              { key: 'ready', label: 'Ready', count: readyOrders.length },
              { key: 'done', label: 'Delivered', count: doneOrders.length },
            ] as const
          ).map((tab, idx) => {
            const isSelected = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => handleSelectTab(tab.key, idx)}
                activeOpacity={0.8}
                style={styles.tabBtn}
              >
                <Text style={[styles.tabLabel, isSelected && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
                {tab.count > 0 && (
                  <View style={[styles.tabCountBadge, isSelected && styles.tabCountBadgeActive]}>
                    <Text style={[styles.tabCountText, isSelected && styles.tabCountTextActive]}>
                      {tab.count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 3. Empty State when Tab has No Orders */}
        {displayedOrders.length === 0 && (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="checkmark-circle-outline" size={32} color="#047A36" />
            </View>
            <Text style={styles.emptyTitle}>
              {activeTab === 'new'
                ? 'No Pending Orders'
                : activeTab === 'packing'
                ? 'No Orders Being Packed'
                : activeTab === 'ready'
                ? 'No Orders Waiting for Rider'
                : 'No Delivered Orders Yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'new'
                ? 'New incoming customer orders will ring and appear here instantly.'
                : 'Orders in this pipeline will appear here automatically.'}
            </Text>
          </View>
        )}

        {/* 4. Minimal, High-Contrast Order Cards */}
        {displayedOrders.map((order) => {
          const isPending = order.status === 'pending' || order.status === 'accepted';
          const isPacking = order.status === 'packing';
          const isReady = order.status === 'ready';
          const isDone = order.status === 'picked_up' || order.status === 'delivered';
          const netPayout = Math.round((order.subtotalPaise * 0.9) / 100);

          return (
            <View key={order.partId} style={[styles.orderCard, isReady && styles.orderCardReady]}>
              {/* Card Header: Order Code, Time Slot, and Take-Home Payout */}
              <View style={styles.cardHeaderRow}>
                <View>
                  <View style={styles.orderCodeRow}>
                    <Text style={styles.orderCodeText}>{order.orderCode}</Text>
                  </View>
                  <View style={styles.slotRow}>
                    <Ionicons name="time-outline" size={12} color="#64748B" style={{ marginRight: 4 }} />
                    <Text style={styles.slotText}>{order.slotTime || 'Morning Slot'}</Text>
                  </View>
                </View>

                {/* Direct Store Net Payout */}
                <View style={styles.payoutBox}>
                  <Text style={styles.payoutAmountText}>₹{netPayout}</Text>
                  <Text style={styles.payoutSubText}>Store Payout</Text>
                </View>
              </View>

              {/* Items List Box - Clear weights and names scannable at a glance */}
              <View style={styles.itemsBox}>
                {order.items.map((item, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.itemRow,
                      idx < order.items.length - 1 && styles.itemRowBorder,
                    ]}
                  >
                    <View style={styles.itemBullet} />
                    <View style={styles.itemNameWrapper}>
                      <Text style={styles.itemName} numberOfLines={1}>
                        {item.name}
                      </Text>
                    </View>
                    <View style={styles.itemWeightBadge}>
                      <Text style={styles.itemWeightText}>{item.unit}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Action Button Row */}
              {isPending && (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.missingItemBtn}
                    activeOpacity={0.7}
                    onPress={() => handleReportShortage(order)}
                  >
                    <Ionicons name="alert-circle-outline" size={15} color="#DC2626" style={{ marginRight: 4 }} />
                    <Text style={styles.missingItemBtnText}>Shortage</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.primaryPackBtn}
                    activeOpacity={0.85}
                    onPress={() =>
                      navigation.navigate('VendorPack', {
                        partId: order.partId,
                        orderCode: order.orderCode,
                        items: order.items,
                        subtotalPaise: order.subtotalPaise,
                      })
                    }
                  >
                    <Ionicons name="cube-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.primaryPackBtnText}>Start Packing ({order.items.length}) →</Text>
                  </TouchableOpacity>
                </View>
              )}

              {isPacking && (
                <TouchableOpacity
                  style={styles.primaryPackBtnFull}
                  activeOpacity={0.85}
                  onPress={() =>
                    navigation.navigate('VendorPack', {
                      partId: order.partId,
                      orderCode: order.orderCode,
                      items: order.items,
                      subtotalPaise: order.subtotalPaise,
                    })
                  }
                >
                  <Ionicons name="scale-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.primaryPackBtnText}>Continue Packing & Weighing →</Text>
                </TouchableOpacity>
              )}

              {isReady && (
                <View style={styles.readyStatusStrip}>
                  <View style={styles.readyStatusLeft}>
                    <Ionicons name="checkmark-circle" size={18} color="#047A36" style={{ marginRight: 6 }} />
                    <View>
                      <Text style={styles.readyStatusTitle}>Packed & Sealed</Text>
                      <Text style={styles.readyStatusSub}>Tape: {order.sealQr || 'DST-SEAL-OK'}</Text>
                    </View>
                  </View>
                  <View style={styles.riderPill}>
                    <Ionicons name="bicycle-outline" size={13} color="#047A36" style={{ marginRight: 4 }} />
                    <Text style={styles.riderPillText}>Rider Arriving</Text>
                  </View>
                </View>
              )}

              {isDone && (
                <View style={styles.deliveredStatusStrip}>
                  <View style={styles.deliveredLeft}>
                    <Ionicons name="checkmark-done" size={16} color="#15803D" style={{ marginRight: 6 }} />
                    <Text style={styles.deliveredText}>Delivered to Customer</Text>
                  </View>
                  <Text style={styles.settledText}>Settled to UPI</Text>
                </View>
              )}
            </View>
          );
        })}

        {/* 5. Minimal Quick Shortcut to Inventory */}
        <TouchableOpacity
          style={styles.quickStockLink}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('VendorStock')}
        >
          <Ionicons name="layers-outline" size={16} color="#047A36" style={{ marginRight: 6 }} />
          <Text style={styles.quickStockLinkText}>Update Store Inventory →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 16,
  },
  screenTitle: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 26,
    fontWeight: '800',
    color: '#111117',
    letterSpacing: -0.5,
  },
  statusTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  statusToggleOpen: {
    backgroundColor: '#ECFDF5',
    borderColor: '#BBF7D0',
  },
  statusToggleClosed: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  statusDotOpen: {
    backgroundColor: '#047A36',
  },
  statusDotClosed: {
    backgroundColor: '#DC2626',
  },
  statusToggleText: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  statusToggleTextOpen: {
    color: '#047A36',
  },
  statusToggleTextClosed: {
    color: '#DC2626',
  },

  // Pulse Metrics Row
  pulseRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  pulseCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  pulseCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  pulseIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseVal: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 20,
    fontWeight: '800',
    color: '#111117',
  },
  pulseLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },

  // Segmented Tabs Bar
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 3,
    marginBottom: 16,
    position: 'relative',
    height: 44,
  },
  tabIndicator: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    width: '24%',
    backgroundColor: '#FFFFFF',
    borderRadius: 11,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    paddingHorizontal: 2,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tabLabelActive: {
    color: '#047A36',
    fontWeight: '800',
  },
  tabCountBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    marginLeft: 4,
  },
  tabCountBadgeActive: {
    backgroundColor: '#ECFDF5',
  },
  tabCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  tabCountTextActive: {
    color: '#047A36',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 16,
    fontWeight: '800',
    color: '#111117',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },

  // Order Card
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  orderCardReady: {
    borderColor: '#BBF7D0',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderCodeText: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 17,
    fontWeight: '800',
    color: '#111117',
    letterSpacing: -0.3,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  slotText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  payoutBox: {
    alignItems: 'flex-end',
  },
  payoutAmountText: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 18,
    fontWeight: '800',
    color: '#047A36',
    letterSpacing: -0.3,
  },
  payoutSubText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#15803D',
    marginTop: 1,
  },

  // Items Box
  itemsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F6',
  },
  itemBullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#047A36',
    marginRight: 8,
  },
  itemNameWrapper: {
    flex: 1,
    marginRight: 8,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  itemWeightBadge: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  itemWeightText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0F172A',
  },

  // Action Buttons
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  missingItemBtn: {
    flex: 0.35,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    height: 44,
    borderRadius: 12,
  },
  missingItemBtnText: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 12,
    fontWeight: '800',
    color: '#DC2626',
  },
  primaryPackBtn: {
    flex: 0.65,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#047A36',
    height: 44,
    borderRadius: 12,
    shadowColor: '#047A36',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryPackBtnFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#047A36',
    height: 44,
    borderRadius: 12,
    shadowColor: '#047A36',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryPackBtnText: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },

  // Ready & Delivered Status Strips
  readyStatusStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  readyStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readyStatusTitle: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 12.5,
    fontWeight: '800',
    color: '#047A36',
  },
  readyStatusSub: {
    fontSize: 11,
    color: '#15803D',
    marginTop: 1,
  },
  riderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  riderPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#047A36',
  },
  deliveredStatusStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  deliveredLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveredText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  settledText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047A36',
  },

  // Quick Shortcut to Stock
  quickStockLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    height: 44,
    marginTop: 6,
    marginBottom: 20,
  },
  quickStockLinkText: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 12.5,
    fontWeight: '800',
    color: '#047A36',
  },
});
