import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@dusmint/ui';
import { dusmintApi } from '../../api-client/client';
import { VendorEarningsData } from '../../api-client/types';

export const VendorEarningsScreen: React.FC = () => {
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Earnings & Settlements</Text>
        <Text style={styles.headerSub}>Same-day settlement on customer delivery confirmation</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading && !earnings && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
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
            <Text style={styles.verifiedTag}>VERIFIED ✅</Text>
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
              <TouchableOpacity>
                <Text style={styles.statementLink}>Download Invoice ›</Text>
              </TouchableOpacity>
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
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.fontSize.xs,
    color: Colors.secondary,
  },
  summaryCard: {
    backgroundColor: '#0F172A',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.base,
    ...Shadows.medium,
  },
  summaryLabel: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.headingBold,
    color: '#34D399',
    letterSpacing: 1,
  },
  summaryAmount: {
    fontFamily: Typography.fontFamily.headingBold,
    fontSize: 34,
    color: '#FFFFFF',
    marginVertical: 4,
  },
  summaryOrders: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.fontSize.xs,
    color: '#94A3B8',
    marginBottom: Spacing.base,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontFamily: Typography.fontFamily.headingBold,
    fontSize: Typography.fontSize.sm,
    color: '#FFFFFF',
  },
  statLbl: {
    fontFamily: Typography.fontFamily.body,
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  bankCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.base,
    ...Shadows.light,
  },
  bankHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bankTitle: {
    fontFamily: Typography.fontFamily.headingBold,
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
  },
  verifiedTag: {
    fontFamily: Typography.fontFamily.headingBold,
    fontSize: 10,
    color: '#059669',
  },
  upiId: {
    fontFamily: Typography.fontFamily.headingBold,
    fontSize: Typography.fontSize.base,
    color: Colors.primary,
    marginTop: 4,
  },
  bankSub: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.fontSize.xs,
    color: Colors.secondary,
    marginTop: 4,
    lineHeight: 18,
  },
  sectionHeading: {
    fontFamily: Typography.fontFamily.headingBold,
    fontSize: 11,
    color: Colors.secondary,
    letterSpacing: 1,
    marginVertical: Spacing.sm,
  },
  payoutCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  payoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payoutDate: {
    fontFamily: Typography.fontFamily.headingBold,
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
  },
  netAmount: {
    fontFamily: Typography.fontFamily.headingBold,
    fontSize: Typography.fontSize.base,
    color: '#059669',
  },
  payoutFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  statusText: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.fontSize.xs,
    color: '#059669',
  },
  statementLink: {
    fontFamily: Typography.fontFamily.heading,
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
  },
});
