import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient as SvgGradient, Stop, Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useVendorAuthStore } from '../../state/useVendorAuthStore';
import { dusmintApi } from '../../api-client/client';
import { VendorEarningsData, VendorProfileInfo } from '../../api-client/types';

const ITEMS_PER_PAGE = 5;

interface SettlementTransaction {
  id: string;
  dateStr: string;
  timestamp: number;
  amount: number;
  refId: string;
  status: string;
  upiId: string;
}

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
  const [showPolicyModal, setShowPolicyModal] = useState(false);

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

  // Base mock settlement transaction dataset tailored to Gupta Traders
  const allTransactions: SettlementTransaction[] = useMemo(() => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    return [
      {
        id: 'tx-1',
        dateStr: 'Today, 01:15 PM',
        timestamp: now - 2 * 60 * 60 * 1000,
        amount: 1240.0,
        refId: 'UPI-98441',
        status: 'Credited',
        upiId: payoutUpi,
      },
      {
        id: 'tx-2',
        dateStr: 'Yesterday, 09:30 PM',
        timestamp: now - 1 * dayMs,
        amount: 5120.0,
        refId: 'UPI-98412',
        status: 'Credited',
        upiId: payoutUpi,
      },
      {
        id: 'tx-3',
        dateStr: '28 Oct, 09:30 PM',
        timestamp: now - 2 * dayMs,
        amount: 4890.0,
        refId: 'UPI-98103',
        status: 'Credited',
        upiId: payoutUpi,
      },
      {
        id: 'tx-4',
        dateStr: '27 Oct, 09:30 PM',
        timestamp: now - 3 * dayMs,
        amount: 3650.0,
        refId: 'UPI-98075',
        status: 'Credited',
        upiId: payoutUpi,
      },
      {
        id: 'tx-5',
        dateStr: '26 Oct, 09:30 PM',
        timestamp: now - 4 * dayMs,
        amount: 4200.0,
        refId: 'UPI-97992',
        status: 'Credited',
        upiId: payoutUpi,
      },
      {
        id: 'tx-6',
        dateStr: '25 Oct, 09:30 PM',
        timestamp: now - 5 * dayMs,
        amount: 5580.0,
        refId: 'UPI-97840',
        status: 'Credited',
        upiId: payoutUpi,
      },
      {
        id: 'tx-7',
        dateStr: '24 Oct, 09:30 PM',
        timestamp: now - 6 * dayMs,
        amount: 4100.0,
        refId: 'UPI-97712',
        status: 'Credited',
        upiId: payoutUpi,
      },
      {
        id: 'tx-8',
        dateStr: '20 Oct, 09:30 PM',
        timestamp: now - 10 * dayMs,
        amount: 6300.0,
        refId: 'UPI-97210',
        status: 'Credited',
        upiId: payoutUpi,
      },
    ];
  }, [payoutUpi]);

  // Filter transactions based on selected range
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    if (range === 'today') {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      return allTransactions.filter((t) => t.timestamp >= startOfToday);
    } else if (range === 'week') {
      const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).getTime();
      return allTransactions.filter((t) => t.timestamp >= weekAgo);
    } else if (range === 'month') {
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).getTime();
      return allTransactions.filter((t) => t.timestamp >= monthAgo);
    }
    return allTransactions;
  }, [allTransactions, range]);

  // Aggregated metrics for selected range
  const rangeMetrics = useMemo(() => {
    if (range === 'today') {
      const todayLive = earningsData ? earningsData.todaySalesPaise / 100 : 0;
      const amount = todayLive > 0 ? todayLive : 1240.0;
      const orderCount = todayLive > 0 ? 3 : 2;
      const avg = orderCount > 0 ? (amount / orderCount).toFixed(0) : '0';
      return {
        amount,
        orderCount,
        avgOrderValue: avg,
        label: 'Today',
      };
    } else if (range === 'week') {
      const totalAmount = filteredTransactions.reduce((acc, t) => acc + t.amount, 0);
      const orderCount = 34;
      const avg = (totalAmount / orderCount).toFixed(0);
      return {
        amount: totalAmount > 0 ? totalAmount : 28780.0,
        orderCount,
        avgOrderValue: avg,
        label: 'This Week',
      };
    } else {
      const totalAmount = filteredTransactions.reduce((acc, t) => acc + t.amount, 0);
      const orderCount = 138;
      const avg = (totalAmount / orderCount).toFixed(0);
      return {
        amount: totalAmount > 0 ? totalAmount : 65200.0,
        orderCount,
        avgOrderValue: avg,
        label: 'This Month',
      };
    }
  }, [range, earningsData, filteredTransactions]);

  // Pagination for transaction ledger (5 items per page)
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE));
  const paginatedTransactions = filteredTransactions.slice(
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

        {/* Range Filter Segment - [ Today | This Week | This Month ] */}
        <View style={styles.rangeFilterContainer}>
          {(['today', 'week', 'month'] as const).map((r) => {
            const isSelected = range === r;
            const label = r === 'today' ? 'Today' : r === 'week' ? 'This Week' : 'This Month';
            return (
              <TouchableOpacity
                key={r}
                onPress={() => {
                  setRange(r);
                  setPage(1);
                }}
                activeOpacity={0.7}
                style={[styles.rangeTab, isSelected && styles.rangeTabActive]}
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
            {/* 1. Hero Earnings Card */}
            <View style={styles.heroCard}>
              <View style={styles.heroTopRow}>
                {/* 0% Platform Commission Tag */}
                <View style={styles.commissionTag}>
                  <Text style={styles.commissionTagText}>0% Platform Commission</Text>
                </View>
                <Text style={styles.rangeLabelText}>{rangeMetrics.label}</Text>
              </View>

              <Text style={styles.heroAmountText}>₹{rangeMetrics.amount.toFixed(2)}</Text>
              <Text style={styles.heroSubText}>Direct Store Payouts Settled (T+0)</Text>
            </View>

            {/* 2. Two-Card Performance Metric Row */}
            <View style={styles.metricRow}>
              {/* Card 1: Orders Delivered */}
              <View style={styles.metricCard}>
                <View style={styles.metricIconBox}>
                  <Ionicons name="bag-check-outline" size={20} color="#047A36" />
                </View>
                <Text style={styles.metricLabel}>Orders Delivered</Text>
                <Text style={styles.metricValue}>{rangeMetrics.orderCount}</Text>
              </View>

              {/* Card 2: Average Order Value */}
              <View style={styles.metricCard}>
                <View style={styles.metricIconBox}>
                  <Ionicons name="trending-up-outline" size={20} color="#047A36" />
                </View>
                <Text style={styles.metricLabel}>Avg Order Value</Text>
                <Text style={styles.metricValue}>₹{rangeMetrics.avgOrderValue}</Text>
              </View>
            </View>

            {/* 3. Recent Settlements Ledger */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Recent Settlements</Text>
              {filteredTransactions.length > 0 && (
                <Text style={styles.sectionCountText}>
                  {filteredTransactions.length}{' '}
                  {filteredTransactions.length === 1 ? 'settlement' : 'settlements'}
                </Text>
              )}
            </View>

            {filteredTransactions.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="receipt-outline" size={28} color="#94A3B8" style={{ marginBottom: 8 }} />
                <Text style={styles.emptyTitle}>No Settlements {rangeMetrics.label}</Text>
                <Text style={styles.emptySub}>
                  Completed customer deliveries settled in this period will appear here.
                </Text>
              </View>
            ) : (
              <View>
                {paginatedTransactions.map((tx) => (
                  <View key={tx.id} style={styles.transactionCard}>
                    <View style={styles.txTopRow}>
                      <Text style={styles.txDate}>{tx.dateStr}</Text>
                      <Text style={styles.txAmount}>+₹{tx.amount.toFixed(2)}</Text>
                    </View>

                    <View style={styles.txBottomRow}>
                      <View style={styles.txUpiInfo}>
                        <View style={styles.greenDot} />
                        <Text style={styles.txUpiText} numberOfLines={1}>
                          Direct UPI Auto-Credit ({tx.upiId})
                        </Text>
                      </View>
                      <View style={styles.txStatusPill}>
                        <Text style={styles.txStatusText}>
                          {tx.status} ({tx.refId})
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <View style={styles.paginationRow}>
                    <TouchableOpacity
                      onPress={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      activeOpacity={0.7}
                      style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
                    >
                      <Text style={styles.pageBtnText}>Previous</Text>
                    </TouchableOpacity>

                    <Text style={styles.pageIndicatorText}>
                      Page {page} of {totalPages}
                    </Text>

                    <TouchableOpacity
                      onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      activeOpacity={0.7}
                      style={[styles.pageBtn, page === totalPages && styles.pageBtnDisabled]}
                    >
                      <Text style={styles.pageBtnText}>Next</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* 4. Bottom Policy Link Bar */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setShowPolicyModal(true)}
              style={styles.policyBar}
            >
              <View style={styles.policyBarLeft}>
                <View style={styles.policyIconCircle}>
                  <Ionicons name="shield-checkmark-outline" size={16} color="#111117" />
                </View>
                <Text style={styles.policyBarText} numberOfLines={1}>
                  Read about our 0% commission & T+0 settlement policy
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={15} color="#111117" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Policy Modal Dialogue */}
      <Modal
        visible={showPolicyModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPolicyModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.modalIconBox}>
                  <Ionicons name="shield-checkmark-outline" size={22} color="#047A36" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>0% Commission Policy</Text>
                  <Text style={styles.modalSub}>Direct Partner Settlement Model</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setShowPolicyModal(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Policy Points */}
            <View style={styles.policyPointsContainer}>
              <View style={styles.policyPointCard}>
                <Text style={styles.policyPointTitle}>• 0% Platform Commission</Text>
                <Text style={styles.policyPointDesc}>
                  You keep 100% of your retail sales value. DusMint charges ₹0 platform commission during our promotional launch.
                </Text>
              </View>

              <View style={styles.policyPointCard}>
                <Text style={styles.policyPointTitle}>• Direct UPI Transfers</Text>
                <Text style={styles.policyPointDesc}>
                  Funds are credited automatically to your verified UPI account ({payoutUpi}) upon rider delivery confirmation.
                </Text>
              </View>

              <View style={styles.policyPointCard}>
                <Text style={styles.policyPointTitle}>• Same-Day T+0 Auto Payout</Text>
                <Text style={styles.policyPointDesc}>
                  No manual withdrawal requests or waiting for weekly payouts. Settlements run 365 days a year without delay.
                </Text>
              </View>
            </View>

            {/* Got It Button */}
            <TouchableOpacity
              onPress={() => setShowPolicyModal(false)}
              activeOpacity={0.85}
              style={styles.modalActionBtn}
            >
              <Text style={styles.modalActionBtnText}>Got It</Text>
            </TouchableOpacity>
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
  screenTitle: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 26,
    fontWeight: '800',
    color: '#111117',
    marginVertical: 16,
    letterSpacing: -0.5,
  },
  rangeFilterContainer: {
    flexDirection: 'row',
    backgroundColor: '#E8F5EC',
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  rangeTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  rangeTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  rangeTabText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#6B7280',
  },
  rangeTabTextActive: {
    fontWeight: '800',
    color: '#047A36',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 12,
    color: '#64748B',
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#047A36',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  commissionTag: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  commissionTagText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#047A36',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  rangeLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  heroAmountText: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 36,
    fontWeight: '900',
    color: '#111117',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  heroSubText: {
    fontSize: 12,
    color: '#047A36',
    fontWeight: '600',
  },
  metricRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8F5EC',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#047A36',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  metricIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
    textAlign: 'center',
  },
  metricValue: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 22,
    fontWeight: '800',
    color: '#111117',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 17,
    fontWeight: '800',
    color: '#111117',
    letterSpacing: -0.2,
  },
  sectionCountText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  emptyCard: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 20,
    padding: 28,
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
  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  txTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  txDate: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  txAmount: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 16,
    fontWeight: '800',
    color: '#059669',
  },
  txBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txUpiInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  txUpiText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#374151',
  },
  txStatusPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  txStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  pageBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  pageBtnDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
    opacity: 0.5,
  },
  pageBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  pageIndicatorText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  policyBar: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
    marginTop: 10,
  },
  policyBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  policyIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(4, 122, 54, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  policyBarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111117',
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(4, 122, 54, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 16,
    fontWeight: '800',
    color: '#111117',
  },
  modalSub: {
    fontSize: 11.5,
    color: '#6B7280',
    marginTop: 1,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  policyPointsContainer: {
    gap: 10,
    marginBottom: 20,
  },
  policyPointCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  policyPointTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111117',
    marginBottom: 4,
  },
  policyPointDesc: {
    fontSize: 11.5,
    color: '#4B5563',
    lineHeight: 16,
  },
  modalActionBtn: {
    backgroundColor: '#047A36',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#047A36',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  modalActionBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Metropolis-Bold',
    fontSize: 14,
    fontWeight: '800',
  },
});
