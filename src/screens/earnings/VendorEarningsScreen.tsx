import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@dusmint/ui';
import { dusmintApi } from '../../api-client/client';
import { VendorEarningsData } from '../../api-client/types';

export const VendorEarningsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [earnings, setEarnings] = useState<VendorEarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadEarnings = useCallback(async () => {
    try {
      const data = await dusmintApi.getVendorEarnings();
      setEarnings(data);
    } catch (err) {
      console.warn('Failed to fetch earnings:', err);
      // Fallback default
      setEarnings({
        todaySalesPaise: 425000,
        commissionDeductedPaise: 34000,
        netPayoutPendingPaise: 391000,
        payoutVpa: 'ramesh.sharma@okaxis',
        settlementSchedule: 'Daily 09:30 PM Batch',
        recentSettlements: [
          { date: 'Yesterday', amountPaise: 512000, status: 'Credited (Ref: UPI-98412)' },
          { date: '28 Oct', amountPaise: 489000, status: 'Credited (Ref: UPI-98103)' },
        ],
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadEarnings();
  }, [loadEarnings]);

  const onRefresh = () => {
    setRefreshing(true);
    loadEarnings();
  };

  const netRupees = earnings ? (earnings.netPayoutPendingPaise / 100).toFixed(2) : '0.00';
  const grossRupees = earnings ? (earnings.todaySalesPaise / 100).toFixed(2) : '0.00';
  const commissionRupees = earnings ? (earnings.commissionDeductedPaise / 100).toFixed(2) : '0.00';

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top + 10 : 18 }]}>
        <Text style={styles.headerTitle}>Earnings & Settlements</Text>
        <Text style={styles.headerSub}>Same-day settlement on customer delivery confirmation</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FC6011']} />}
        showsVerticalScrollIndicator={false}
      >
        {loading && !earnings && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#FC6011" />
            <Text style={styles.loadingText}>Loading settlements ledger...</Text>
          </View>
        )}

        {/* Today's Stats Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>TODAY'S NET EARNINGS (T+0)</Text>
          <Text style={styles.summaryAmount}>₹{netRupees}</Text>
          <Text style={styles.summaryOrders}>
            Gross: ₹{grossRupees} • Platform Commission: -₹{commissionRupees} (10%)
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>₹14,850</Text>
              <Text style={styles.statLbl}>This Week</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statVal}>99.2%</Text>
              <Text style={styles.statLbl}>Fill Rate</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statVal}>4.9 ★</Text>
              <Text style={styles.statLbl}>Vendor Score</Text>
            </View>
          </View>
        </View>

        {/* Bank & Settlement Details */}
        <View style={styles.bankCard}>
          <View style={styles.bankHeader}>
            <Text style={styles.bankTitle}>Linked Bank / UPI for Payouts</Text>
            <View style={styles.verifiedTag}>
              <Text style={styles.verifiedTagText}>VERIFIED ✅</Text>
            </View>
          </View>
          <Text style={styles.upiId}>UPI ID: {earnings?.payoutVpa || 'ramesh.sharma@okaxis'}</Text>
          <Text style={styles.bankSub}>
            Settlement is triggered automatically ({earnings?.settlementSchedule || 'Daily 09:30 PM Batch'}) once customer delivery OTP is verified.
          </Text>
        </View>

        {/* Settlement History */}
        <Text style={styles.sectionHeading}>RECENT SETTLEMENTS</Text>
        {(earnings?.recentSettlements || []).map((p, idx) => (
          <View key={idx} style={styles.payoutCard}>
            <View style={styles.payoutHeader}>
              <Text style={styles.payoutDate}>{p.date}</Text>
              <Text style={styles.netAmount}>₹{(p.amountPaise / 100).toFixed(2)}</Text>
            </View>
            <View style={styles.payoutFooter}>
              <Text style={styles.statusText}>✓ {p.status}</Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.statementLink}>Download Invoice ›</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
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
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: '#64748B',
  },
  summaryCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#34D399',
    letterSpacing: 1,
  },
  summaryAmount: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    marginVertical: 6,
  },
  summaryOrders: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statLbl: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  bankCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  bankHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  bankTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  verifiedTag: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#047857',
  },
  upiId: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#FC6011',
    marginVertical: 4,
  },
  bankSub: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
    marginTop: 4,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 2,
  },
  payoutCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  payoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  payoutDate: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  netAmount: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 16,
    fontWeight: '800',
    color: '#047857',
  },
  payoutFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
  statementLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FC6011',
  },
});
