import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  Vibration,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient as SvgGradient, Stop, Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  visible: boolean;
  onClose: () => void;
  payoutUpi: string;
  remainingSettlement: number;
  onSettlementRequested?: (amount: number) => void;
}

interface SettlementRecord {
  id: string;
  dateStr: string;
  amount: number;
  refId: string;
  status: string;
  upiId: string;
}

const INITIAL_SETTLEMENTS: SettlementRecord[] = [
  {
    id: 'st-1',
    dateStr: 'Yesterday, 09:30 PM',
    amount: 5120.0,
    refId: 'UPI-98412',
    status: 'Credited',
    upiId: 'sumit@hdfc',
  },
  {
    id: 'st-2',
    dateStr: '28 Oct, 09:30 PM',
    amount: 4890.0,
    refId: 'UPI-98103',
    status: 'Credited',
    upiId: 'sumit@hdfc',
  },
  {
    id: 'st-3',
    dateStr: '27 Oct, 09:30 PM',
    amount: 3650.0,
    refId: 'UPI-98075',
    status: 'Credited',
    upiId: 'sumit@hdfc',
  },
  {
    id: 'st-4',
    dateStr: '26 Oct, 09:30 PM',
    amount: 4200.0,
    refId: 'UPI-97992',
    status: 'Credited',
    upiId: 'sumit@hdfc',
  },
  {
    id: 'st-5',
    dateStr: '25 Oct, 09:30 PM',
    amount: 5580.0,
    refId: 'UPI-97840',
    status: 'Credited',
    upiId: 'sumit@hdfc',
  },
];

export const VendorPayoutScreen: React.FC<Props> = ({
  visible,
  onClose,
  payoutUpi,
  remainingSettlement,
  onSettlementRequested,
}) => {
  const insets = useSafeAreaInsets();
  const [balance, setBalance] = useState(remainingSettlement > 0 ? remainingSettlement : 3825.0);
  const [settlementList, setSettlementList] = useState<SettlementRecord[]>(INITIAL_SETTLEMENTS);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleRequestPayoutPress = () => {
    try {
      Vibration.vibrate(20);
    } catch {}
    setConfirmModalVisible(true);
  };

  const handleConfirmTransfer = () => {
    setConfirmModalVisible(false);
    try {
      Vibration.vibrate([10, 30, 20]);
    } catch {}

    const transferAmount = balance;
    const newRecord: SettlementRecord = {
      id: `st-${Date.now()}`,
      dateStr: 'Just now, Instant',
      amount: transferAmount,
      refId: `UPI-${Math.floor(10000 + Math.random() * 90000)}`,
      status: 'Processing',
      upiId: payoutUpi || 'sumit@hdfc',
    };

    setSettlementList([newRecord, ...settlementList]);
    setBalance(0);

    if (onSettlementRequested) {
      onSettlementRequested(transferAmount);
    }

    setSuccessToast(`Instant payout of ₹${transferAmount.toFixed(2)} initiated to ${payoutUpi}!`);
    setTimeout(() => {
      setSuccessToast(null);
    }, 3200);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" />

        {/* Soft Green Gradient Accent Header Background */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Svg width="100%" height={260}>
            <Defs>
              <SvgGradient id="payoutAccentGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#E8F5EC" />
                <Stop offset="100%" stopColor="#FFFFFF" />
              </SvgGradient>
            </Defs>
            <Rect width="100%" height={260} fill="url(#payoutAccentGrad)" />
          </Svg>
        </View>

        {/* Header Row - Aligned to exact vertical position & typography of Earnings */}
        <View style={styles.headerRow}>
          <Text style={styles.screenTitle}>Payouts</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={20} color="#0F172A" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Card 1: Available Remaining Settlement Card */}
          <View style={styles.balanceCard}>
            <View style={styles.balanceTopRow}>
              <Text style={styles.balanceLabel}>REMAINING SETTLEMENT BALANCE</Text>
              <View style={styles.verifiedTag}>
                <Ionicons name="checkmark-circle" size={12} color="#047A36" style={{ marginRight: 4 }} />
                <Text style={styles.verifiedTagText}>Verified UPI</Text>
              </View>
            </View>

            <Text style={styles.balanceAmountText}>₹{balance.toFixed(2)}</Text>
            <Text style={styles.balanceSubText}>
              Direct store earnings ready for transfer into {payoutUpi || 'sumit@hdfc'}
            </Text>

            {/* Standard Daily Batch Settlement Notice */}
            <View style={styles.infoBanner}>
              <Ionicons name="time-outline" size={16} color="#0F172A" style={{ marginRight: 8, marginTop: 1 }} />
              <Text style={styles.infoBannerText}>
                Standard daily settlement triggers automatically every evening at 09:30 PM (Daily Batch) directly to your linked UPI.
              </Text>
            </View>
          </View>

          {/* Card 2: Instant Payout Action */}
          <View style={styles.actionCard}>
            <View style={styles.actionHeaderRow}>
              <View>
                <Text style={styles.actionTitle}>Need Instant Settlement?</Text>
                <Text style={styles.actionSubtitle}>
                  Request early payout anytime without waiting for the 09:30 PM batch
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.instantPayoutBtn, balance <= 0 && styles.instantPayoutBtnDisabled]}
              onPress={handleRequestPayoutPress}
              disabled={balance <= 0}
              activeOpacity={0.85}
            >
              <Ionicons name="flash" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.instantPayoutBtnText}>
                {balance > 0 ? `Request Instant Payout (₹${balance.toFixed(2)})` : 'All Earnings Settled'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Card 3: Settlement History Ledger */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Settlement History</Text>
            <Text style={styles.sectionCountText}>Showing {settlementList.length} settlements</Text>
          </View>

          <View style={styles.unifiedCard}>
            {settlementList.map((st, idx) => (
              <View key={st.id}>
                <View style={styles.settlementRow}>
                  <View style={styles.txTopRow}>
                    <Text style={styles.txDate}>{st.dateStr}</Text>
                    <Text style={styles.txAmount}>+₹{st.amount.toFixed(2)}</Text>
                  </View>

                  <View style={styles.txBottomRow}>
                    <View style={styles.txUpiInfo}>
                      <View style={[styles.statusDot, st.status === 'Processing' && styles.statusDotProcessing]} />
                      <Text style={styles.txUpiText} numberOfLines={1}>
                        Direct UPI Auto-Credit ({st.upiId})
                      </Text>
                    </View>
                    <View style={[styles.txStatusPill, st.status === 'Processing' && styles.txStatusPillProcessing]}>
                      <Text style={[styles.txStatusText, st.status === 'Processing' && styles.txStatusTextProcessing]}>
                        {st.status} ({st.refId})
                      </Text>
                    </View>
                  </View>
                </View>
                {idx < settlementList.length - 1 && <View style={styles.rowDivider} />}
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Floating Toast Message */}
        {successToast && (
          <View style={styles.toastContainer}>
            <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.toastText}>{successToast}</Text>
          </View>
        )}

        {/* Confirmation Modal for Instant Payout */}
        <Modal visible={confirmModalVisible} transparent animationType="fade" onRequestClose={() => setConfirmModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setConfirmModalVisible(false)} />
            <View style={styles.modalContent}>
              <View style={styles.modalIconCircle}>
                <Ionicons name="card-outline" size={26} color="#0F172A" />
              </View>

              <Text style={styles.modalTitle}>Confirm Instant Payout</Text>
              <Text style={styles.modalSub}>
                Funds will be transferred directly to your verified UPI account via IMPS within 15 minutes.
              </Text>

              <View style={styles.modalSummaryBox}>
                <View style={styles.modalSummaryRow}>
                  <Text style={styles.modalSummaryLabel}>Transfer Amount</Text>
                  <Text style={styles.modalSummaryVal}>₹{balance.toFixed(2)}</Text>
                </View>
                <View style={styles.modalSummaryRow}>
                  <Text style={styles.modalSummaryLabel}>Linked Account</Text>
                  <Text style={styles.modalSummaryValUpi}>{payoutUpi || 'sumit@hdfc'}</Text>
                </View>
                <View style={styles.modalSummaryRow}>
                  <Text style={styles.modalSummaryLabel}>Processing Fee</Text>
                  <Text style={styles.modalSummaryFree}>₹0.00 (Free)</Text>
                </View>
              </View>

              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setConfirmModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalConfirmBtn}
                  onPress={handleConfirmTransfer}
                  activeOpacity={0.85}
                >
                  <Text style={styles.modalConfirmText}>Confirm & Transfer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
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
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  balanceCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#047A36',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  balanceTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#047A36',
    letterSpacing: 0.8,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  verifiedTagText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#047A36',
  },
  balanceAmountText: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 36,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -1,
  },
  balanceSubText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
    marginTop: 6,
    marginBottom: 16,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  infoBannerText: {
    fontSize: 13,
    color: '#047A36',
    lineHeight: 18,
    flex: 1,
    fontWeight: '600',
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  actionHeaderRow: {
    marginBottom: 12,
  },
  actionTitle: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  instantPayoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#047A36',
    borderRadius: 14,
    height: 48,
    shadowColor: '#047A36',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  instantPayoutBtnDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  instantPayoutBtnText: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
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
  settlementRow: {
    paddingVertical: 14,
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  txTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  txDate: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  txAmount: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 15.5,
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
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
    marginRight: 6,
  },
  statusDotProcessing: {
    backgroundColor: '#D97706',
  },
  txUpiText: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
  },
  txStatusPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  txStatusPillProcessing: {
    backgroundColor: '#FEF3C7',
  },
  txStatusText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#059669',
  },
  txStatusTextProcessing: {
    color: '#B45309',
  },
  toastContainer: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 999,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  // Modal Confirmation Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  modalIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  modalSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  modalSummaryBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  modalSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  modalSummaryLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  modalSummaryVal: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSummaryValUpi: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#047A36',
  },
  modalSummaryFree: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  modalConfirmBtn: {
    flex: 1.6,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#047A36',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
