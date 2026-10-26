import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows, TrustBadge } from '@dusmint/ui';

export const VendorEarningsScreen: React.FC = () => {
  const payoutHistory = [
    {
      id: 'pay-1',
      date: 'Today, 26 Oct',
      ordersCount: 14,
      gross: '₹2,480.00',
      commission: '₹248.00 (10%)',
      netPayout: '₹2,232.00',
      status: 'Settled to Bank (UPI)',
      isPaid: true,
    },
    {
      id: 'pay-2',
      date: 'Yesterday, 25 Oct',
      ordersCount: 22,
      gross: '₹3,950.00',
      commission: '₹395.00 (10%)',
      netPayout: '₹3,555.00',
      status: 'Settled to Bank (UPI)',
      isPaid: true,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Earnings & Settlements</Text>
        <Text style={styles.headerSub}>Same-day settlement on customer delivery confirmation</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Today's Stats Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>TODAY'S NET EARNINGS</Text>
          <Text style={styles.summaryAmount}>₹2,232.00</Text>
          <Text style={styles.summaryOrders}>From 14 delivered slot orders</Text>

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
          <Text style={styles.upiId}>UPI ID: patidar.mandi@sbi</Text>
          <Text style={styles.bankSub}>
            Settlement is triggered automatically by Cashfree Payouts once delivery OTP is confirmed.
          </Text>
        </View>

        {/* Settlement History */}
        <Text style={styles.sectionHeading}>RECENT SETTLEMENTS</Text>
        {payoutHistory.map((p) => (
          <View key={p.id} style={styles.payoutCard}>
            <View style={styles.payoutHeader}>
              <Text style={styles.payoutDate}>{p.date}</Text>
              <Text style={styles.netAmount}>{p.netPayout}</Text>
            </View>
            <Text style={styles.payoutSub}>
              {p.ordersCount} orders • Gross {p.gross} − Commission {p.commission}
            </Text>
            <View style={styles.payoutFooter}>
              <Text style={styles.statusText}>{p.status}</Text>
              <TouchableOpacity>
                <Text style={styles.statementLink}>Download GST Invoice ›</Text>
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
  summaryCard: {
    backgroundColor: Colors.primaryDark,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.base,
    ...Shadows.medium,
  },
  summaryLabel: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.headingBold,
    color: Colors.accentMint,
    letterSpacing: 1,
  },
  summaryAmount: {
    fontFamily: Typography.fontFamily.headingBold,
    fontSize: 34,
    color: Colors.textWhite,
    marginVertical: 4,
  },
  summaryOrders: {
    fontFamily: Typography.fontFamily.body,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statVal: {
    fontFamily: Typography.fontFamily.headingBold,
    fontSize: Typography.fontSize.sm,
    color: Colors.textWhite,
  },
  statLbl: {
    fontFamily: Typography.fontFamily.body,
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  bankCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.base,
  },
  bankHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bankTitle: {
    fontFamily: Typography.fontFamily.headingBold,
    fontSize: Typography.fontSize.xs,
    color: Colors.textPrimary,
  },
  verifiedTag: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.headingBold,
    color: Colors.primary,
  },
  upiId: {
    fontFamily: Typography.fontFamily.heading,
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    marginTop: 4,
  },
  bankSub: {
    fontFamily: Typography.fontFamily.body,
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  sectionHeading: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.headingBold,
    color: Colors.secondary,
    letterSpacing: 0.5,
    marginVertical: Spacing.sm,
  },
  payoutCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
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
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
  },
  payoutSub: {
    fontFamily: Typography.fontFamily.body,
    fontSize: 11,
    color: Colors.secondary,
    marginTop: 2,
  },
  payoutFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
  statusText: {
    fontFamily: Typography.fontFamily.bodyMedium,
    fontSize: 10,
    color: '#059669',
  },
  statementLink: {
    fontFamily: Typography.fontFamily.heading,
    fontSize: 10,
    color: Colors.primary,
  },
});
