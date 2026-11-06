import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Vibration,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '@dusmint/ui';
import { dusmintApi } from '../../api-client/client';
import { VendorOrderPart, VendorProfileInfo } from '../../api-client/types';

export const VendorOrdersScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
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
        Alert.alert('NEW ORDER RECEIVED', 'Customer has placed a new order. Please pack items.');
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
    <View style={styles.container}>
      {/* Premium Top Bar with Safe Area Inset Protection */}
      <View style={[styles.headerContainer, { paddingTop: insets.top > 0 ? insets.top + 8 : 16 }]}>
        <View style={styles.headerTopRow}>
          {/* Shop Avatar & Info */}
          <View style={styles.shopSection}>
            <View style={styles.shopAvatar}>
              <Ionicons name="storefront" size={20} color="#FC6011" />
            </View>
            <View style={styles.shopDetails}>
              <View style={styles.shopNameRow}>
                <Text style={styles.shopName} numberOfLines={1}>
                  {selectedVendor ? selectedVendor.name : 'Mandi Fresh Sabzi'}
                </Text>
                {vendors.length > 1 && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                      const nextIdx = (vendors.findIndex(v => v.id === selectedVendorId) + 1) % vendors.length;
                      setSelectedVendorId(vendors[nextIdx].id);
                    }}
                    style={styles.switchChip}
                  >
                    <Text style={styles.switchChipText}>⇄ Switch</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.clusterRow}>
                <View style={[styles.statusDot, { backgroundColor: isOpen ? '#10B981' : '#EF4444' }]} />
                <Text style={styles.clusterText}>
                  {selectedVendor?.category ? `${selectedVendor.category} Dukaan` : 'Vegetables & Greens'} • Vijay Nagar
                </Text>
              </View>
            </View>
          </View>

          {/* Online / Offline Pill */}
          <View
            style={[
              styles.onlinePill,
              {
                backgroundColor: isOpen ? '#ECFDF5' : '#FEF2F2',
                borderColor: isOpen ? '#A7F3D0' : '#FECACA',
              },
            ]}
          >
            <Text
              style={[
                styles.onlineText,
                { color: isOpen ? '#047857' : '#DC2626' },
              ]}
            >
              {isOpen ? 'OPEN' : 'CLOSED'}
            </Text>
            <Switch
              value={isOpen}
              onValueChange={setIsOpen}
              trackColor={{ false: '#FECACA', true: '#A7F3D0' }}
              thumbColor={isOpen ? '#10B981' : '#EF4444'}
              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }], marginLeft: 2 }}
            />
          </View>
        </View>

        {/* Segmented Status Tabs */}
        <View style={styles.segmentContainer}>
          {(
            [
              { key: 'new', label: 'New', count: newOrders.length },
              { key: 'packing', label: 'Packing', count: packingOrders.length },
              { key: 'ready', label: 'Ready', count: readyOrders.length },
              { key: 'done', label: 'Done', count: doneOrders.length },
            ] as const
          ).map((tab) => {
            const isSelected = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                activeOpacity={0.8}
                onPress={() => setActiveTab(tab.key)}
                style={[
                  styles.segmentTab,
                  isSelected && styles.segmentTabActive,
                ]}
              >
                <Text
                  style={[
                    styles.segmentLabel,
                    isSelected && styles.segmentLabelActive,
                  ]}
                >
                  {tab.label}
                </Text>
                <View
                  style={[
                    styles.segmentBadge,
                    isSelected
                      ? styles.segmentBadgeActive
                      : tab.key === 'new' && tab.count > 0
                      ? styles.segmentBadgeAlert
                      : styles.segmentBadgeInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentBadgeText,
                      isSelected
                        ? styles.segmentBadgeTextActive
                        : tab.key === 'new' && tab.count > 0
                        ? styles.segmentBadgeTextAlert
                        : styles.segmentBadgeTextInactive,
                    ]}
                  >
                    {tab.count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Orders ScrollView */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FC6011']} />}
        showsVerticalScrollIndicator={false}
      >
        {loading && !refreshing && (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color="#FC6011" />
            <Text style={styles.emptySubtitle}>Syncing live store orders...</Text>
          </View>
        )}

        {!loading && displayedOrders.length === 0 && (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="cube-outline" size={32} color="#94A3B8" />
            </View>
            <Text style={styles.emptyTitle}>No {activeTab} orders right now</Text>
            <Text style={styles.emptySubtitle}>
              New customer orders assigned to your shop will alert and show up here instantly.
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
                isReady && styles.orderCardReady,
              ]}
            >
              {/* Order Card Top Header */}
              <View style={styles.cardHeader}>
                <View>
                  <View style={styles.orderIdRow}>
                    <Text style={styles.orderIdLabel}>ORDER</Text>
                    <Text style={styles.orderIdCode}>{order.orderCode}</Text>
                  </View>
                  <View style={styles.slotRow}>
                    <Ionicons name="time-outline" size={13} color="#64748B" style={{ marginRight: 4 }} />
                    <Text style={styles.slotText}>{order.slotTime || 'Morning Slot • 07:00 - 10:00 AM'}</Text>
                  </View>
                </View>

                {isReady ? (
                  <View style={styles.readyBadge}>
                    <Ionicons name="checkmark-circle" size={13} color="#047857" style={{ marginRight: 4 }} />
                    <Text style={styles.readyBadgeText}>SEALED & READY</Text>
                  </View>
                ) : (
                  <View style={styles.actionRequiredBadge}>
                    <Ionicons name="flash" size={12} color="#B45309" style={{ marginRight: 4 }} />
                    <Text style={styles.actionRequiredText}>ACTION REQUIRED</Text>
                  </View>
                )}
              </View>

              {/* Items List Box */}
              <View style={styles.itemsBox}>
                <View style={styles.itemsBoxHeader}>
                  <Text style={styles.itemsBoxTitle}>Items to Pack ({itemCount} total)</Text>
                  <Text style={styles.itemsBoxSub}>Weigh before packing</Text>
                </View>

                {order.items.map((item, idx) => (
                  <View key={idx} style={styles.itemRow}>
                    <View style={styles.itemQtyBadge}>
                      <Text style={styles.itemQtyText}>{item.quantity}x</Text>
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemUnit}>{item.unit}</Text>
                    </View>
                    <Text style={styles.itemPrice}>
                      ₹{((item.pricePaise * item.quantity) / 100).toFixed(0)}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Financial & Net Payout Strip */}
              <View style={styles.payoutStrip}>
                <View style={styles.payoutLeft}>
                  <Text style={styles.subtotalLabel}>Customer Subtotal</Text>
                  <Text style={styles.subtotalValue}>
                    ₹{(order.subtotalPaise / 100).toFixed(0)}
                  </Text>
                </View>
                <View style={styles.payoutDivider} />
                <View style={styles.payoutRight}>
                  <View style={styles.payoutLabelRow}>
                    <Text style={styles.payoutLabel}>Your Net Payout</Text>
                    <View style={styles.instantPill}>
                      <Text style={styles.instantPillText}>Instant T+0</Text>
                    </View>
                  </View>
                  <Text style={styles.payoutValue}>
                    ₹{((order.subtotalPaise * 0.9) / 100).toFixed(0)}
                  </Text>
                </View>
              </View>

              {/* Tamper Proof Seal Badge if Ready */}
              {isReady && order.sealQr && (
                <View style={styles.sealStrip}>
                  <Ionicons name="shield-checkmark" size={18} color="#166534" style={{ marginRight: 8 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sealTitle}>Tamper-Proof Green Seal Tape</Text>
                    <Text style={styles.sealCode}>Barcode Serial: {order.sealQr}</Text>
                  </View>
                  <View style={styles.verifiedChip}>
                    <Text style={styles.verifiedChipText}>VERIFIED</Text>
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              {!isReady && (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() =>
                      Alert.alert(
                        'Mark Item Shortage',
                        'Customer will be refunded and central operations alerted. Are you sure?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Confirm Shortage',
                            style: 'destructive',
                            onPress: () => Alert.alert('Shortage Reported', 'Operations team has been updated.'),
                          },
                        ]
                      )
                    }
                    style={styles.itemShortBtn}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="warning-outline" size={13} color="#DC2626" style={{ marginRight: 4 }} />
                      <Text style={styles.itemShortBtnText}>Item Short</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() =>
                      navigation.navigate('VendorPack', {
                        partId: order.partId,
                        orderCode: order.orderCode,
                        items: order.items,
                        subtotalPaise: order.subtotalPaise,
                      })
                    }
                    style={styles.packBtn}
                  >
                    <MaterialCommunityIcons name="scale-balance" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.packBtnText}>Pack & Weigh on Scale</Text>
                  </TouchableOpacity>
                </View>
              )}
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
  headerContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 3,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  shopSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  shopAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF5F0',
    borderWidth: 1,
    borderColor: '#FFE4D6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  shopAvatarEmoji: {
    fontSize: 22,
  },
  shopDetails: {
    flex: 1,
  },
  shopNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shopName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: 'Metropolis-Bold',
    flexShrink: 1,
  },
  switchChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 6,
  },
  switchChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  clusterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  clusterText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 4,
    paddingVertical: 4,
    borderRadius: 22,
    borderWidth: 1,
  },
  onlineText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 4,
  },
  segmentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 9,
  },
  segmentTabActive: {
    backgroundColor: '#FC6011',
    shadowColor: '#FC6011',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  segmentLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  segmentBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    marginLeft: 4,
  },
  segmentBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  segmentBadgeInactive: {
    backgroundColor: '#E2E8F0',
  },
  segmentBadgeAlert: {
    backgroundColor: '#EF4444',
  },
  segmentBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  segmentBadgeTextActive: {
    color: '#FFFFFF',
  },
  segmentBadgeTextInactive: {
    color: '#475569',
  },
  segmentBadgeTextAlert: {
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyEmoji: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  orderCardReady: {
    borderColor: '#A7F3D0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderIdLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginRight: 6,
  },
  orderIdCode: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: 'Metropolis-Bold',
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  slotIcon: {
    fontSize: 11,
    marginRight: 4,
  },
  slotText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  actionRequiredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  actionRequiredIcon: {
    fontSize: 11,
    marginRight: 4,
    color: '#B45309',
  },
  actionRequiredText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.3,
  },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  readyBadgeIcon: {
    fontSize: 11,
    fontWeight: '800',
    marginRight: 4,
    color: '#047857',
  },
  readyBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857',
    letterSpacing: 0.3,
  },
  itemsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 12,
  },
  itemsBoxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  itemsBoxTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  itemsBoxSub: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  itemQtyBadge: {
    backgroundColor: '#FFF5F0',
    borderWidth: 1,
    borderColor: '#FFE4D6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 8,
  },
  itemQtyText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FC6011',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  itemUnit: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  payoutStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 14,
  },
  payoutLeft: {
    flex: 1,
  },
  subtotalLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  subtotalValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginTop: 2,
  },
  payoutDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 12,
  },
  payoutRight: {
    flex: 1.2,
  },
  payoutLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  payoutLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#047857',
  },
  instantPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
    marginLeft: 5,
  },
  instantPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#047857',
  },
  payoutValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#047857',
    marginTop: 2,
  },
  sealStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  sealIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  sealTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  sealCode: {
    fontSize: 10,
    color: '#15803D',
    marginTop: 1,
  },
  verifiedChip: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedChipText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803D',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemShortBtn: {
    flex: 0.38,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemShortBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  packBtn: {
    flex: 0.62,
    flexDirection: 'row',
    backgroundColor: '#FC6011',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FC6011',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  packBtnIcon: {
    fontSize: 15,
    marginRight: 6,
  },
  packBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
