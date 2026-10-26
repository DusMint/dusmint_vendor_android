import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, RoundButton, TrustBadge } from '@dusmint/ui';

export const VendorOrdersScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'new' | 'packing' | 'ready' | 'done'>('new');

  const orders = [
    {
      id: 'part-1',
      orderCode: 'ORD-261026-0042',
      customerSlot: 'Evening Slot (5:00 PM - 8:00 PM)',
      items: [
        { name: 'Fresh Desi Tomato', unit: '1 kg', qty: 1, price: '₹32' },
        { name: 'Indore Jyoti Potato', unit: '1 kg', qty: 1, price: '₹28' },
        { name: 'Fresh Palak Bunch', unit: '250 g', qty: 2, price: '₹30' },
      ],
      totalItems: 4,
      expectedWeight: '2,500 g',
      payoutAmount: '₹81.00',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header with Shop Open Toggle */}
      <View style={styles.header}>
        <View>
          <Text style={styles.shopName}>Patidar Fresh Sabzi Mandi</Text>
          <Text style={styles.clusterText}>Indore Vijay Nagar Cluster</Text>
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
        {(['new', 'packing', 'ready', 'done'] as const).map((tab) => {
          const isChosen = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tabBtn, isChosen ? styles.tabBtnActive : null]}
            >
              <Text style={[styles.tabText, isChosen ? styles.tabTextActive : null]}>
                {tab === 'new'
                  ? 'New (1)'
                  : tab === 'packing'
                  ? 'Packing (0)'
                  : tab === 'ready'
                  ? 'Ready (0)'
                  : 'Done'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {orders.map((order) => (
          <View key={order.id} style={styles.orderCard}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.orderCode}>{order.orderCode}</Text>
                <Text style={styles.slotTime}>{order.customerSlot}</Text>
              </View>
              <View style={styles.newAlertBadge}>
                <Text style={styles.newAlertText}>🔔 NEW ORDER</Text>
              </View>
            </View>

            {/* Checklist */}
            <View style={styles.checklist}>
              <Text style={styles.checkTitle}>Items to Pack ({order.totalItems}):</Text>
              {order.items.map((i, idx) => (
                <View key={idx} style={styles.checkItem}>
                  <Text style={styles.itemBullet}>•</Text>
                  <Text style={styles.itemName}>
                    {i.name} ({i.unit}) × {i.qty}
                  </Text>
                  <Text style={styles.itemPrice}>{i.price}</Text>
                </View>
              ))}
            </View>

            <View style={styles.scaleInfo}>
              <Text style={styles.scaleTarget}>
                Target Scale Weight: <Text style={styles.weightBold}>{order.expectedWeight}</Text>
              </Text>
              <Text style={styles.payout}>Net Payout: {order.payoutAmount}</Text>
            </View>

            {/* Actions */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={() => Alert.alert('Order Rejected', 'Specify shortage reason.')}
                style={styles.rejectBtn}
              >
                <Text style={styles.rejectText}>Reject</Text>
              </TouchableOpacity>

              <RoundButton
                title="⚖️ Pack & Weigh on Scale"
                onPress={() => navigation.navigate('VendorPack', { orderId: order.id })}
                style={styles.packBtn}
              />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  shopName: {
    fontFamily: Typography.fontFamily.headingBold,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
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
  },
  orderCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    marginBottom: Spacing.base,
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
  weightBold: {
    fontFamily: Typography.fontFamily.headingBold,
    color: Colors.primary,
  },
  payout: {
    fontFamily: Typography.fontFamily.headingBold,
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  rejectBtn: {
    paddingHorizontal: 16,
    paddingVertical: 14,
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
