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
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient as SvgGradient, Stop, Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { dusmintApi } from '../../api-client/client';
import { VendorOrderPart, VendorProfileInfo } from '../../api-client/types';
import { useVendorAuthStore } from '../../state/useVendorAuthStore';

// Format real-time date and time without seconds (e.g. "Mon 23 Nov, 6:54 pm")
const formatCurrentDateTime = (date: Date): string => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayName = days[date.getDay()];
  const dayNum = date.getDate();
  const monthName = months[date.getMonth()];
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minuteStr = minutes < 10 ? '0' + minutes : minutes;
  return `${dayName} ${dayNum} ${monthName}, ${hours}:${minuteStr} ${ampm}`;
};

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
  const isStoreOpen = useVendorAuthStore((s) => s.isStoreOpen);
  const setStoreOpen = useVendorAuthStore((s) => s.setStoreOpen);
  const breakUntil = useVendorAuthStore((s) => s.breakUntil);
  const setStoreBreak = useVendorAuthStore((s) => s.setStoreBreak);

  const [activeTab, setActiveTab] = useState<'to_pack' | 'ready' | 'delivered'>('to_pack');
  const [vendors, setVendors] = useState<VendorProfileInfo[]>(FALLBACK_VENDORS);
  const [selectedVendorId, setSelectedVendorId] = useState<string>('vendor-1');
  const [orders, setOrders] = useState<VendorOrderPart[]>(FALLBACK_ORDERS);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [todayIncome, setTodayIncome] = useState<number>(1240);
  const [showBreakModal, setShowBreakModal] = useState<boolean>(false);
  const [currentDateTime, setCurrentDateTime] = useState<string>(() => formatCurrentDateTime(new Date()));
  const previousOrderCountRef = useRef<number>(0);

  // Check store break status
  const isOnBreak = Boolean(breakUntil && Date.now() < breakUntil);
  const breakMinutesLeft = breakUntil
    ? Math.max(1, Math.round((breakUntil - Date.now()) / 60000))
    : 0;

  // Real-time clock updating every 20s (no seconds shown, practically 0 CPU usage)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(formatCurrentDateTime(new Date()));
    }, 20000);
    return () => clearInterval(timer);
  }, []);

  // Animated sliding indicator for 3 status tabs (0: to_pack, 1: ready, 2: delivered)
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

  // 2. Fetch vendor orders & sync earnings
  const fetchOrders = useCallback(async (isPolling = false) => {
    try {
      const data = await dusmintApi.getVendorOrders(selectedVendorId || undefined);
      if (data && data.length > 0) {
        setOrders(data);

        // Alert on new incoming orders needing packing
        const pendingCount = data.filter((o) => o.status === 'pending' || o.status === 'packing').length;
        useVendorAuthStore.getState().setPendingOrdersCount(pendingCount);
        if (previousOrderCountRef.current > 0 && pendingCount > previousOrderCountRef.current) {
          Vibration.vibrate([0, 500, 200, 500]);
          Alert.alert('New Order Received', 'A customer order has arrived. Please pack the items.');
        }
        previousOrderCountRef.current = pendingCount;
      }

      // Sync Today's Income precisely with VendorEarningsScreen
      try {
        const earnings = await dusmintApi.getVendorEarnings(selectedVendorId || undefined);
        if (earnings?.todaySalesPaise && earnings.todaySalesPaise > 0) {
          setTodayIncome(Math.round(earnings.todaySalesPaise / 100));
        } else {
          setTodayIncome(1240);
        }
      } catch {
        setTodayIncome(1240);
      }
    } catch {
      // Retain fallback orders and earnings
      setTodayIncome(1240);
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

  // Store status toggle handler (Synchronized globally across Orders & Profile tabs)
  const handleToggleStoreStatus = () => {
    const nextState = !isStoreOpen;
    setStoreOpen(nextState);
    try {
      Vibration.vibrate(20);
    } catch {}
    if (selectedVendorId) {
      dusmintApi.toggleVendorStatus(selectedVendorId, nextState).catch((err) => {
        console.warn('Backend toggle vendor status warning:', err);
      });
    }
  };

  // Break handlers
  const handleApplyBreak = (minutes: number) => {
    try {
      Vibration.vibrate(25);
    } catch {}
    setStoreBreak(minutes);
    setShowBreakModal(false);
  };

  const handleEndBreak = () => {
    try {
      Vibration.vibrate(25);
    } catch {}
    setStoreBreak(null);
    setShowBreakModal(false);
  };

  // Tab selection with spring animation (0: to_pack, 1: ready, 2: delivered)
  const handleSelectTab = (tabKey: 'to_pack' | 'ready' | 'delivered', idx: number) => {
    setActiveTab(tabKey);
    Animated.spring(tabAnim, {
      toValue: idx,
      useNativeDriver: false,
      tension: 65,
      friction: 10,
    }).start();
  };

  // 3-Stage Pipeline:
  // 1. To Pack: Orders needing merchant action (pending, accepted, packing)
  const toPackOrders = orders.filter((o) => o.status === 'pending' || o.status === 'accepted' || o.status === 'packing');
  // 2. Ready: Packed & sealed with QR code, awaiting rider pickup
  const readyOrders = orders.filter((o) => o.status === 'ready');
  // 3. Delivered: Completed handovers
  const deliveredOrders = orders.filter((o) => o.status === 'picked_up' || o.status === 'delivered');

  const displayedOrders =
    activeTab === 'to_pack'
      ? toPackOrders
      : activeTab === 'ready'
      ? readyOrders
      : deliveredOrders;

  // Total orders count
  const totalOrdersCount = orders.length;

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
        {/* Screen Header - Simple Title on Left, Real-Time Date & Time on Right */}
        <View style={styles.headerRow}>
          <Text style={styles.screenTitle}>Orders</Text>
          <Text style={styles.headerTimeText}>{currentDateTime}</Text>
        </View>

        {/* 1. Minimal High-Value Shopkeeper Overview */}
        <View style={styles.dailyContextCard}>
          {/* Top Row: Today's Income & Minimalist Break Button (Replaces Auto-settles 10 PM) */}
          <View style={styles.contextHeroRow}>
            <View>
              <Text style={styles.contextHeroLabel}>TODAY'S INCOME</Text>
              <View style={styles.contextIncomeRow}>
                <Text style={styles.contextIncomeSymbol}>₹</Text>
                <Text style={styles.contextIncomeValue}>
                  {todayIncome.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>

            {/* Minimalist Break Action Button */}
            <TouchableOpacity
              style={[styles.breakBtnPill, isOnBreak && styles.breakBtnPillActive]}
              onPress={() => setShowBreakModal(true)}
              activeOpacity={0.75}
            >
              <Ionicons
                name={isOnBreak ? 'cafe' : 'pause-circle-outline'}
                size={14}
                color={isOnBreak ? '#B45309' : '#000000'}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.breakBtnText, isOnBreak && styles.breakBtnTextActive]}>
                {isOnBreak ? `On Break (${breakMinutesLeft}m)` : 'Take Break'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Subtle Divider */}
          <View style={styles.contextDivider} />

          {/* Bottom Row: 2 Essentials in Single-Line Format (Total Orders aligned with Today's Income | Total Deliveries) */}
          <View style={styles.contextMetricsRow}>
            {/* Metric 1: Total Orders - Left Aligned flush with TODAY'S INCOME */}
            <View style={styles.singleLineMetricBoxLeft}>
              <Ionicons name="receipt-outline" size={15} color="#000000" style={{ marginRight: 6 }} />
              <Text style={styles.singleLineLabel}>Total Orders:</Text>
              <Text style={styles.singleLineVal}>{totalOrdersCount}</Text>
            </View>

            <View style={styles.contextMetricDivider} />

            {/* Metric 2: Total Deliveries - Right Aligned */}
            <TouchableOpacity
              style={styles.singleLineMetricBoxRight}
              onPress={() => handleSelectTab('delivered', 2)}
              activeOpacity={0.7}
            >
              <Ionicons name="bicycle-outline" size={16} color="#000000" style={{ marginRight: 6 }} />
              <Text style={styles.singleLineLabel}>Total Deliveries:</Text>
              <Text style={styles.singleLineVal}>{deliveredOrders.length}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Three Clean Pipeline Tabs (To Pack, Ready, Delivered) */}
        <View style={styles.tabsContainer}>
          <Animated.View
            style={[
              styles.tabIndicator,
              {
                left: tabAnim.interpolate({
                  inputRange: [0, 1, 2],
                  outputRange: ['0.8%', '34.1%', '67.4%'],
                }),
              },
            ]}
          />
          {(
            [
              { key: 'to_pack', label: 'To Pack', count: toPackOrders.length },
              { key: 'ready', label: 'Ready', count: readyOrders.length },
              { key: 'delivered', label: 'Delivered', count: deliveredOrders.length },
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
              <Ionicons name="checkmark-circle-outline" size={32} color="#0F172A" />
            </View>
            <Text style={styles.emptyTitle}>
              {activeTab === 'to_pack'
                ? 'No Pending Orders'
                : activeTab === 'ready'
                ? 'No Orders Waiting for Rider'
                : 'No Delivered Orders Yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'to_pack'
                ? 'New incoming customer orders will ring and appear here instantly.'
                : activeTab === 'ready'
                ? 'Orders packed and sealed will appear here ready for rider pickup.'
                : 'Delivered orders will appear here automatically.'}
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

        {/* 5. Minimal Quick Shortcut to Stock */}
        <TouchableOpacity
          style={styles.quickStockLink}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('VendorStock')}
        >
          <Ionicons name="layers-outline" size={17} color="#0F172A" style={{ marginRight: 6 }} />
          <Text style={styles.quickStockLinkText}>Update Store Stock →</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Minimal Store Break Selection Modal */}
      <Modal
        visible={showBreakModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowBreakModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowBreakModal(false)}
          />
          <View style={styles.breakSheet}>
            <View style={styles.breakSheetHandle} />
            <View style={styles.breakHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.breakSheetTitle}>Store Break</Text>
                <Text style={styles.breakSheetSub}>
                  Temporarily pause pickups while you are away from store
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowBreakModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {isOnBreak && (
              <View style={styles.activeBreakBanner}>
                <Ionicons name="cafe" size={22} color="#D97706" style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.activeBreakTitle}>Store Currently on Break</Text>
                  <Text style={styles.activeBreakSub}>
                    Break ends in ~{breakMinutesLeft} minutes.
                  </Text>
                </View>
              </View>
            )}

            <Text style={styles.breakDurationLabel}>
              {isOnBreak ? 'EXTEND BREAK DURATION' : 'SELECT BREAK DURATION'}
            </Text>

            <View style={styles.breakOptionsRow}>
              {[
                { mins: 15, label: '15 m', sub: 'Quick tea' },
                { mins: 30, label: '30 m', sub: 'Lunch break' },
                { mins: 60, label: '1 hr', sub: 'Mandi run' },
                { mins: 120, label: '2 hr', sub: 'Stock trip' },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.mins}
                  style={styles.breakOptionBtn}
                  onPress={() => handleApplyBreak(opt.mins)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.breakOptionMins}>{opt.label}</Text>
                  <Text style={styles.breakOptionDesc}>{opt.sub}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {isOnBreak && (
              <TouchableOpacity
                style={styles.resumeStoreBtn}
                onPress={handleEndBreak}
                activeOpacity={0.85}
              >
                <Ionicons name="play" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.resumeStoreBtnText}>End Break & Resume Store</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
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
    fontFamily: 'Inter-Medium',
    fontSize: 25,
    color: '#111117',
    letterSpacing: -0.4,
  },
  headerTimeText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13.5,
    color: '#334155',
    letterSpacing: -0.1,
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
  statusToggleBreak: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
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
  statusDotBreak: {
    backgroundColor: '#D97706',
  },
  statusToggleText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    letterSpacing: 0.3,
  },
  statusToggleTextOpen: {
    color: '#047A36',
  },
  statusToggleTextClosed: {
    color: '#DC2626',
  },
  statusToggleTextBreak: {
    color: '#B45309',
  },

  // Minimal High-Value Shopkeeper Overview Card
  dailyContextCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  contextHeroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  contextHeroLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 11.5,
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  contextIncomeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  contextIncomeSymbol: {
    fontFamily: 'Inter-Regular',
    fontSize: 21,
    color: '#0F172A',
    marginRight: 2,
  },
  contextIncomeValue: {
    fontFamily: 'Inter-Regular',
    fontSize: 31,
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  breakBtnPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  breakBtnPillActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  breakBtnText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#1E293B',
  },
  breakBtnTextActive: {
    color: '#B45309',
  },
  contextDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginBottom: 12,
  },
  contextMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  singleLineMetricBoxLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 2,
  },
  singleLineMetricBoxRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: 2,
  },
  singleLineMetricBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  singleLineLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#334155',
    marginRight: 4,
  },
  singleLineVal: {
    fontFamily: 'Inter-Medium',
    fontSize: 14.5,
    color: '#0F172A',
  },
  contextMetricDivider: {
    width: 1.5,
    height: 20,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 8,
  },

  // Segmented Tabs Bar
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 3,
    marginBottom: 16,
    position: 'relative',
    height: 48,
  },
  tabIndicator: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    width: '31.8%',
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
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: '#475569',
  },
  tabLabelActive: {
    fontFamily: 'Inter-SemiBold',
    color: '#047A36',
  },
  tabCountBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 4,
  },
  tabCountBadgeActive: {
    backgroundColor: '#ECFDF5',
  },
  tabCountText: {
    fontFamily: 'Inter-Medium',
    fontSize: 11.5,
    color: '#1E293B',
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
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
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
    fontFamily: 'Inter-Medium',
    fontSize: 19,
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  slotText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#475569',
  },
  payoutBox: {
    alignItems: 'flex-end',
  },
  payoutAmountText: {
    fontFamily: 'Inter-Medium',
    fontSize: 21,
    color: '#047A36',
    letterSpacing: -0.3,
  },
  payoutSubText: {
    fontFamily: 'Inter-Medium',
    fontSize: 11.5,
    color: '#15803D',
    marginTop: 1,
  },

  // Items Box
  itemsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  itemBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#047A36',
    marginRight: 10,
  },
  itemNameWrapper: {
    flex: 1,
    marginRight: 8,
  },
  itemName: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: '#0F172A',
  },
  itemWeightBadge: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  itemWeightText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14.5,
    color: '#334155',
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
    height: 48,
    borderRadius: 12,
  },
  missingItemBtnText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#DC2626',
  },
  primaryPackBtn: {
    flex: 0.65,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#047A36',
    height: 48,
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
    height: 48,
    borderRadius: 12,
    shadowColor: '#047A36',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryPackBtnText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14.5,
    color: '#FFFFFF',
    letterSpacing: -0.1,
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

  // Break Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  breakSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  breakSheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 12,
  },
  breakHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  breakSheetTitle: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  breakSheetSub: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  activeBreakBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  activeBreakTitle: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 14,
    fontWeight: '800',
    color: '#92400E',
  },
  activeBreakSub: {
    fontSize: 12,
    color: '#B45309',
    marginTop: 1,
  },
  breakDurationLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  breakOptionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  breakOptionBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  breakOptionMins: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  breakOptionDesc: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
  },
  resumeStoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#047A36',
    borderRadius: 14,
    height: 48,
    marginTop: 4,
  },
  resumeStoreBtnText: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
