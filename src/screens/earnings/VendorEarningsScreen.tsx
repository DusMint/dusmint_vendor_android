import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Animated,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient as SvgGradient, Stop, Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useVendorAuthStore } from '../../state/useVendorAuthStore';
import { dusmintApi } from '../../api-client/client';
import { VendorEarningsData, VendorProfileInfo } from '../../api-client/types';
import { VendorPayoutScreen } from './VendorPayoutScreen';

const ITEMS_PER_PAGE = 5;

// Indian Currency Formatter with commas and NO decimals
export const formatRupee = (val: number): string => {
  const rounded = Math.round(val);
  return '₹' + rounded.toLocaleString('en-IN');
};

// Custom hook for comforting, smooth rolling count transitions (Zero blink, 60fps)
function useAnimatedNumber(target: number, durationMs: number = 320): number {
  const [currentVal, setCurrentVal] = useState(target);
  const startValRef = useRef(target);

  useEffect(() => {
    const fromVal = startValRef.current;
    const toVal = target;

    if (fromVal === toVal) {
      setCurrentVal(toVal);
      return;
    }

    let startTime: number | null = null;
    let frameId: number;

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = easeOutCubic(progress);
      const val = fromVal + (toVal - fromVal) * eased;
      setCurrentVal(val);

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      } else {
        startValRef.current = toVal;
        setCurrentVal(toVal);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [target, durationMs]);

  return currentVal;
}

// Completed Order Record for Order History Section
export interface OrderItemDetail {
  name: string;
  qtyText: string;
  rateText: string;
  itemTotal: number;
}

export interface CompletedOrderRecord {
  id: string;
  orderCode: string;
  dateStr: string;
  timestamp: number;
  payoutAmount: number;
  status: 'Delivered' | 'Cancelled';
  items: OrderItemDetail[];
}

const ALL_COMPLETED_ORDERS: CompletedOrderRecord[] = [
  {
    id: 'ord-1',
    orderCode: '#DM-8821',
    dateStr: 'Today, 01:15 PM',
    timestamp: Date.now() - 2 * 60 * 60 * 1000,
    payoutAmount: 420,
    status: 'Delivered',
    items: [
      { name: 'Fresh Desi Tomato', qtyText: '2 kg', rateText: '₹25/kg', itemTotal: 50 },
      { name: 'Indore Jyoti Potato', qtyText: '2 kg', rateText: '₹30/kg', itemTotal: 60 },
      { name: 'Nashik Red Onion', qtyText: '1 kg', rateText: '₹35/kg', itemTotal: 35 },
      { name: 'Fresh Chicken Curry Cut', qtyText: '1 kg', rateText: '₹275/kg', itemTotal: 275 },
    ],
  },
  {
    id: 'ord-2',
    orderCode: '#DM-8814',
    dateStr: 'Today, 11:30 AM',
    timestamp: Date.now() - 4 * 60 * 60 * 1000,
    payoutAmount: 310,
    status: 'Delivered',
    items: [
      { name: 'Shimla Royal Apple', qtyText: '1 kg', rateText: '₹160/kg', itemTotal: 160 },
      { name: 'Fresh Malai Paneer', qtyText: '500 g', rateText: '₹300/kg', itemTotal: 150 },
    ],
  },
  {
    id: 'ord-3',
    orderCode: '#DM-8790',
    dateStr: 'Yesterday, 07:15 PM',
    timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000,
    payoutAmount: 540,
    status: 'Delivered',
    items: [
      { name: 'Indore Jyoti Potato', qtyText: '2 kg', rateText: '₹30/kg', itemTotal: 60 },
      { name: 'Nashik Red Onion', qtyText: '2 kg', rateText: '₹35/kg', itemTotal: 70 },
      { name: 'Farm Fresh White Eggs', qtyText: '12 pcs', rateText: '₹7/pc', itemTotal: 84 },
      { name: 'Fresh Desi Ghee', qtyText: '500 ml', rateText: '₹652/L', itemTotal: 326 },
    ],
  },
  {
    id: 'ord-4',
    orderCode: '#DM-8762',
    dateStr: 'Yesterday, 05:40 PM',
    timestamp: Date.now() - 1.2 * 24 * 60 * 60 * 1000,
    payoutAmount: 185,
    status: 'Delivered',
    items: [
      { name: 'Indore Jyoti Potato', qtyText: '2 kg', rateText: '₹30/kg', itemTotal: 60 },
      { name: 'Full Cream Milk', qtyText: '1 L', rateText: '₹65/L', itemTotal: 65 },
      { name: 'Fresh Green Chillies', qtyText: '250 g', rateText: '₹240/kg', itemTotal: 60 },
    ],
  },
  {
    id: 'ord-5',
    orderCode: '#DM-8745',
    dateStr: 'Yesterday, 03:20 PM',
    timestamp: Date.now() - 1.4 * 24 * 60 * 60 * 1000,
    payoutAmount: 0,
    status: 'Cancelled',
    items: [
      { name: 'Fresh Desi Tomato', qtyText: '1 kg', rateText: '₹25/kg', itemTotal: 25 },
      { name: 'Full Cream Milk', qtyText: '1 L', rateText: '₹65/L', itemTotal: 65 },
    ],
  },
  {
    id: 'ord-6',
    orderCode: '#DM-8740',
    dateStr: '28 Oct, 08:30 PM',
    timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
    payoutAmount: 680,
    status: 'Delivered',
    items: [
      { name: 'Robusta Banana', qtyText: '1 doz', rateText: '₹60/doz', itemTotal: 60 },
      { name: 'Fresh Desi Tomato', qtyText: '2 kg', rateText: '₹25/kg', itemTotal: 50 },
      { name: 'Fresh Chicken Curry Cut', qtyText: '2 kg', rateText: '₹285/kg', itemTotal: 570 },
    ],
  },
  {
    id: 'ord-7',
    orderCode: '#DM-8715',
    dateStr: '27 Oct, 06:10 PM',
    timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000,
    payoutAmount: 490,
    status: 'Delivered',
    items: [
      { name: 'Shimla Royal Apple', qtyText: '2 kg', rateText: '₹160/kg', itemTotal: 320 },
      { name: 'Fresh Malai Paneer', qtyText: '500 g', rateText: '₹300/kg', itemTotal: 150 },
      { name: 'Amul Butter', qtyText: '100 g', rateText: '₹20/pc', itemTotal: 20 },
    ],
  },
  {
    id: 'ord-8',
    orderCode: '#DM-8692',
    dateStr: '26 Oct, 09:00 PM',
    timestamp: Date.now() - 4 * 24 * 60 * 60 * 1000,
    payoutAmount: 240,
    status: 'Delivered',
    items: [
      { name: 'Nashik Red Onion', qtyText: '3 kg', rateText: '₹35/kg', itemTotal: 105 },
      { name: 'Indore Jyoti Potato', qtyText: '4.5 kg', rateText: '₹30/kg', itemTotal: 135 },
    ],
  },
];

export const VendorEarningsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const user = useVendorAuthStore((s) => s.user);
  const persistedVendor = useVendorAuthStore((s) => s.activeVendor);
  const setActiveVendorInStore = useVendorAuthStore((s) => s.setActiveVendor);

  const [activeVendor, setActiveVendor] = useState<VendorProfileInfo | null>(persistedVendor);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [earningsData, setEarningsData] = useState<VendorEarningsData | null>(null);

  // Range filter: "today" | "week" | "month" (Default: "week" matching Riksho Buddy)
  const [range, setRange] = useState<'today' | 'week' | 'month'>('week');
  const [page, setPage] = useState(1);

  // Payout Screen Modal State
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);

  // Smooth tab switching & content animations
  const tabAnim = useRef(new Animated.Value(1)).current; // 0: today, 1: week, 2: month
  const ordersFadeAnim = useRef(new Animated.Value(1)).current;

  const handleSelectRange = (r: 'today' | 'week' | 'month', idx: number) => {
    if (range === r) return;

    // 1. Smooth sliding pill indicator
    Animated.spring(tabAnim, {
      toValue: idx,
      tension: 65,
      friction: 9,
      useNativeDriver: false,
    }).start();

    // 2. Set new data immediately - numbers smoothly count up/down to new targets
    setRange(r);
    setPage(1);

    // 3. Smooth, continuous dissolve on order history rows
    ordersFadeAnim.setValue(0);
    Animated.timing(ordersFadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  // Active verified UPI account
  const payoutUpi = useMemo(() => {
    if (activeVendor?.bank_or_upi && activeVendor.bank_or_upi.trim().length > 0) {
      return activeVendor.bank_or_upi;
    }
    if (persistedVendor?.bank_or_upi && persistedVendor.bank_or_upi.trim().length > 0) {
      return persistedVendor.bank_or_upi;
    }
    return 'sumit@hdfc';
  }, [activeVendor?.bank_or_upi, persistedVendor?.bank_or_upi]);

  // Load Vendor & Earnings
  const loadData = useCallback(async () => {
    try {
      const currentPhone = user?.phone || activeVendor?.owner_phone || persistedVendor?.owner_phone || '';
      const userPhoneClean = currentPhone.replace(/\D/g, '').slice(-10);

      if (userPhoneClean && !activeVendor) {
        try {
          const profile = await dusmintApi.getMyVendorProfile(userPhoneClean);
          if (profile) {
            setActiveVendor(profile);
            setActiveVendorInStore(profile);
          }
        } catch {}
      }

      const currentVendorId = activeVendor?.id || persistedVendor?.id;
      const earnings = await dusmintApi.getVendorEarnings(currentVendorId);
      setEarningsData(earnings);
    } catch {
      setEarningsData({
        todaySalesPaise: 0,
        commissionDeductedPaise: 0,
        netPayoutPendingPaise: 0,
        payoutVpa: payoutUpi,
        settlementSchedule: 'Daily 09:30 PM Batch',
        recentSettlements: [],
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.phone, activeVendor, persistedVendor, payoutUpi, setActiveVendorInStore]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    loadData();
  };

  // Filter completed orders based on selected range
  const filteredOrders = useMemo(() => {
    const now = new Date();
    if (range === 'today') {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      return ALL_COMPLETED_ORDERS.filter((o) => o.timestamp >= startOfToday);
    } else if (range === 'week') {
      const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).getTime();
      return ALL_COMPLETED_ORDERS.filter((o) => o.timestamp >= weekAgo);
    } else if (range === 'month') {
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).getTime();
      return ALL_COMPLETED_ORDERS.filter((o) => o.timestamp >= monthAgo);
    }
    return ALL_COMPLETED_ORDERS;
  }, [range]);

  // Aggregated metrics for selected range
  const rangeMetrics = useMemo(() => {
    if (range === 'today') {
      const todayLive = earningsData ? earningsData.todaySalesPaise / 100 : 0;
      const amount = todayLive > 0 ? todayLive : 1240.0;
      const orderCount = filteredOrders.length > 0 ? filteredOrders.length : 2;
      return {
        amount,
        orderCount,
        remainingSettlement: 1240.0,
        label: 'Today',
      };
    } else if (range === 'week') {
      const totalAmount = 28780.0;
      const orderCount = 34;
      return {
        amount: totalAmount,
        orderCount,
        remainingSettlement: 3825.0,
        label: 'This Week',
      };
    } else {
      const totalAmount = 65200.0;
      const orderCount = 138;
      return {
        amount: totalAmount,
        orderCount,
        remainingSettlement: 8450.0,
        label: 'This Month',
      };
    }
  }, [range, earningsData, filteredOrders]);

  // Comforting smooth rolling numbers (Zero blink)
  const animatedAmount = useAnimatedNumber(rangeMetrics.amount, 320);
  const animatedOrders = useAnimatedNumber(rangeMetrics.orderCount, 320);
  const animatedRemaining = useAnimatedNumber(rangeMetrics.remainingSettlement, 320);

  // Pagination for order ledger (5 items per page)
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ITEMS_PER_PAGE));
  const paginatedOrders = filteredOrders.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Soft Green Gradient Accent Header Background */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height={260}>
          <Defs>
            <SvgGradient id="earningsAccentGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#E8F5EC" />
              <Stop offset="100%" stopColor="#FFFFFF" />
            </SvgGradient>
          </Defs>
          <Rect width="100%" height={260} fill="url(#earningsAccentGrad)" />
        </Svg>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#047A36']} />
        }
      >
        {/* Screen Header - Simple and Bold */}
        <Text style={styles.screenTitle}>Earnings</Text>

        {/* Range Filter Segment with Smooth Animated Sliding Indicator */}
        <View style={styles.rangeFilterContainer}>
          <Animated.View
            style={[
              styles.activeTabIndicator,
              {
                left: tabAnim.interpolate({
                  inputRange: [0, 1, 2],
                  outputRange: ['0.8%', '33.8%', '67%'],
                }),
              },
            ]}
          />
          {(['today', 'week', 'month'] as const).map((r, idx) => {
            const isSelected = range === r;
            const label = r === 'today' ? 'Today' : r === 'week' ? 'This Week' : 'This Month';
            return (
              <TouchableOpacity
                key={r}
                onPress={() => handleSelectRange(r, idx)}
                activeOpacity={0.8}
                style={styles.rangeTab}
              >
                <Text style={[styles.rangeTabText, isSelected && styles.rangeTabTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#047A36" />
            <Text style={styles.loadingText}>Loading earnings ledger...</Text>
          </View>
        ) : (
          <View>
            {/* 1. Hero Earnings Card - Tag and 'Today' removed as requested */}
            <View style={styles.heroCard}>
              <Text style={styles.heroTopLabel}>TOTAL EARNINGS</Text>
              <Text style={styles.heroAmountText}>
                ₹{animatedAmount.toFixed(2)}
              </Text>
              <Text style={styles.heroSubText}>Direct Store Payouts Settled (T+0)</Text>
            </View>

            {/* 2. New Metric Boxes: Total Orders & Remaining Settlement */}
            <View style={styles.metricRow}>
              {/* Card 1: Total Orders */}
              <View style={styles.metricCard}>
                <View style={styles.metricIconBox}>
                  <Ionicons name="bag-check-outline" size={20} color="#0F172A" />
                </View>
                <Text style={styles.metricLabel}>Total Orders</Text>
                <Text style={styles.metricValue}>
                  {Math.round(animatedOrders)}
                </Text>
              </View>

              {/* Card 2: Remaining Settlement */}
              <View style={styles.metricCard}>
                <View style={styles.metricIconBox}>
                  <Ionicons name="wallet-outline" size={20} color="#0F172A" />
                </View>
                <Text style={styles.metricLabel}>Remaining Settlement</Text>
                <Text style={styles.metricValue}>
                  ₹{Math.round(animatedRemaining)}
                </Text>
              </View>
            </View>

            {/* 3. Payout Details & Request Button taking to the Payout page */}
            <TouchableOpacity
              style={styles.payoutActionCard}
              onPress={() => setIsPayoutModalOpen(true)}
              activeOpacity={0.85}
            >
              <View style={styles.payoutActionLeft}>
                <View style={styles.payoutActionIconBox}>
                  <Ionicons name="card-outline" size={20} color="#0F172A" />
                </View>
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.payoutActionTitle}>Payout & Settlement Settings</Text>
                  <Text style={styles.payoutActionSub}>Instant early requests • Linked {payoutUpi}</Text>
                </View>
              </View>
              <View style={styles.payoutActionArrowCircle}>
                <Ionicons name="chevron-forward" size={16} color="#0F172A" />
              </View>
            </TouchableOpacity>

            {/* 4. Order History Ledger (Unified Card) */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Order History</Text>
              {filteredOrders.length > 0 && (
                <Text style={styles.sectionCountText}>
                  Showing {Math.min((page - 1) * ITEMS_PER_PAGE + 1, filteredOrders.length)}–
                  {Math.min(page * ITEMS_PER_PAGE, filteredOrders.length)} of {filteredOrders.length}
                </Text>
              )}
            </View>

            {filteredOrders.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="receipt-outline" size={28} color="#94A3B8" style={{ marginBottom: 8 }} />
                <Text style={styles.emptyTitle}>No Orders {rangeMetrics.label}</Text>
                <Text style={styles.emptySub}>
                  Delivered orders for this period will appear here.
                </Text>
              </View>
            ) : (
              <View style={styles.unifiedCard}>
                <Animated.View
                  style={{
                    opacity: ordersFadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
                  }}
                >
                  {paginatedOrders.map((ord, idx) => (
                    <View key={ord.id}>
                      <View style={styles.orderRow}>
                        <View style={styles.orderTopRow}>
                          <View style={styles.orderCodeBadge}>
                            <Text style={styles.orderCodeText}>{ord.orderCode}</Text>
                          </View>
                          <Text style={styles.orderDate}>{ord.dateStr}</Text>
                          <Text style={styles.orderAmount}>+₹{ord.payoutAmount.toFixed(2)}</Text>
                        </View>

                        <View style={styles.orderBottomRow}>
                          <Text style={styles.orderItemsSummary} numberOfLines={1}>
                            {ord.itemsSummary}
                          </Text>
                          <View style={styles.orderStatusPill}>
                            <View style={styles.greenDot} />
                            <Text style={styles.orderStatusText}>{ord.status}</Text>
                          </View>
                        </View>
                      </View>
                      {idx < paginatedOrders.length - 1 && <View style={styles.rowDivider} />}
                    </View>
                  ))}
                </Animated.View>
              </View>
            )}

            {/* 5-Item Pagination Controls below the unified card */}
            {totalPages > 1 && (
              <View style={styles.paginationRow}>
                <TouchableOpacity
                  onPress={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  activeOpacity={0.7}
                  style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
                >
                  <Ionicons name="chevron-back" size={14} color={page === 1 ? '#9CA3AF' : '#111117'} style={{ marginRight: 2 }} />
                  <Text style={[styles.pageBtnText, page === 1 && styles.pageBtnTextDisabled]}>Previous</Text>
                </TouchableOpacity>

                <View style={styles.pagePillsRow}>
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const pageNum = i + 1;
                    const isCurrent = pageNum === page;
                    return (
                      <TouchableOpacity
                        key={pageNum}
                        onPress={() => setPage(pageNum)}
                        style={[styles.pageNumberPill, isCurrent && styles.pageNumberPillActive]}
                      >
                        <Text style={[styles.pageNumberText, isCurrent && styles.pageNumberTextActive]}>
                          {pageNum}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TouchableOpacity
                  onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  activeOpacity={0.7}
                  style={[styles.pageBtn, page === totalPages && styles.pageBtnDisabled]}
                >
                  <Text style={[styles.pageBtnText, page === totalPages && styles.pageBtnTextDisabled]}>Next</Text>
                  <Ionicons name="chevron-forward" size={14} color={page === totalPages ? '#9CA3AF' : '#111117'} style={{ marginLeft: 2 }} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Payout Details & Early Settlement Screen Modal */}
      <VendorPayoutScreen
        visible={isPayoutModalOpen}
        onClose={() => setIsPayoutModalOpen(false)}
        payoutUpi={payoutUpi}
        remainingSettlement={rangeMetrics.remainingSettlement}
      />
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
  screenTitle: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 26,
    fontWeight: '800',
    color: '#111117',
    marginTop: 16,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  rangeFilterContainer: {
    flexDirection: 'row',
    backgroundColor: '#E8F5EC',
    borderRadius: 14,
    padding: 3,
    marginBottom: 16,
    position: 'relative',
  },
  activeTabIndicator: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    width: '32%',
    backgroundColor: '#FFFFFF',
    borderRadius: 11,
    shadowColor: '#047A36',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  rangeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  rangeTabText: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  rangeTabTextActive: {
    color: '#047A36',
    fontWeight: '800',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#334155',
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#047A36',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  heroTopLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#047A36',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  heroAmountText: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 36,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -1,
  },
  heroSubText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#047A36',
    marginTop: 4,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    padding: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  metricIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 2,
  },
  metricValue: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  payoutActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#A7F3D0',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    shadowColor: '#047A36',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  payoutActionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  payoutActionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payoutActionTitle: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  payoutActionSub: {
    fontSize: 13,
    color: '#334155',
    marginTop: 2,
    fontWeight: '600',
  },
  payoutActionArrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 16,
    fontWeight: '800',
    color: '#111117',
    letterSpacing: -0.2,
  },
  sectionCountText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8ECF2',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#374151',
  },
  emptySub: {
    fontSize: 11.5,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 240,
  },
  unifiedCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8ECF2',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 2,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  orderRow: {
    paddingVertical: 14,
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  orderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderCodeBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  orderCodeText: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  orderDate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginLeft: 8,
    flex: 1,
  },
  orderAmount: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 20,
    fontWeight: '800',
    color: '#047A36',
  },
  orderBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderItemsSummary: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  orderStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#047A36',
    marginRight: 5,
  },
  orderStatusText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#047A36',
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginBottom: 20,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pageBtnDisabled: {
    opacity: 0.4,
    borderColor: '#F1F5F9',
  },
  pageBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#111117',
  },
  pageBtnTextDisabled: {
    color: '#9CA3AF',
  },
  pagePillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  pageNumberPill: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pageNumberPillActive: {
    backgroundColor: '#047A36',
    borderColor: '#047A36',
  },
  pageNumberText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },
  pageNumberTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
