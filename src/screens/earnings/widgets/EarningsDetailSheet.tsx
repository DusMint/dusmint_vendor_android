import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Linking,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { VendorProfileInfo } from '../../../api-client/types';

interface Props {
  visible: boolean;
  optionId: string | null;
  vendor: VendorProfileInfo | null;
  payoutUpi: string;
  onClose: () => void;
  onOpenEditUpi: () => void;
  onShowToast: (msg: string) => void;
}

export const EarningsDetailSheet: React.FC<Props> = ({
  visible,
  optionId,
  vendor,
  payoutUpi,
  onClose,
  onOpenEditUpi,
  onShowToast,
}) => {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 16);

  const [showModal, setShowModal] = useState(visible);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    if (visible) {
      setShowModal(true);
      fadeAnim.setValue(0);
      slideAnim.setValue(600);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 600,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowModal(false);
      });
    }
  }, [visible, fadeAnim, slideAnim]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 600,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowModal(false);
      onClose();
    });
  };

  const handleCallSupport = () => {
    Linking.openURL('tel:18008896468').catch(() => {
      onShowToast('Dialing 1800-889-6468');
    });
  };

  if (!showModal && !visible) return null;

  const renderContent = () => {
    switch (optionId) {
      // 1. Settlement UPI Account
      case 'opt-upi':
        return (
          <View>
            <View style={styles.sheetHeader}>
              <View style={styles.titleRow}>
                <View style={styles.headerIconCircle}>
                  <Ionicons name="card" size={20} color="#047A36" />
                </View>
                <Text style={styles.sheetTitle}>Settlement UPI Account</Text>
              </View>
              <TouchableOpacity onPress={handleDismiss} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Active UPI ID</Text>
                <Text style={[styles.infoValue, { color: '#047A36', fontFamily: 'PlusJakartaSans-Medium' }]}>
                  {payoutUpi}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Account Status</Text>
                <Text style={[styles.infoValue, { color: '#059669' }]}>
                  ● Verified & Active
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Settlement Speed</Text>
                <Text style={styles.infoValue}>Same-Day T+0 Auto Payout</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Transfer Gateway</Text>
                <Text style={styles.infoValue}>Direct UPI Bank Transfer (IMPS)</Text>
              </View>
            </View>

            <View style={styles.tipBox}>
              <Ionicons name="shield-checkmark" size={18} color="#047A36" style={{ marginRight: 8 }} />
              <Text style={styles.tipText}>
                Daily earnings are credited directly to this UPI ID upon rider order collection. No manual withdrawal request is required.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.85}
              onPress={() => {
                handleDismiss();
                onOpenEditUpi();
              }}
            >
              <Ionicons name="create-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.actionBtnText}>Update Payout UPI ID</Text>
            </TouchableOpacity>
          </View>
        );

      // 2. T+0 Daily Settlement Cycle
      case 'opt-cycle':
        return (
          <View>
            <View style={styles.sheetHeader}>
              <View style={styles.titleRow}>
                <View style={styles.headerIconCircle}>
                  <Ionicons name="time" size={20} color="#047A36" />
                </View>
                <Text style={styles.sheetTitle}>T+0 Settlement Cycle</Text>
              </View>
              <TouchableOpacity onPress={handleDismiss} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.stepCard}>
              <View style={styles.stepNumberCircle}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Order Packed by Dukaan</Text>
                <Text style={styles.stepSub}>
                  Accept the order on DusMint Partner, pack fresh items, and affix the security seal.
                </Text>
              </View>
            </View>

            <View style={[styles.stepCard, { marginTop: 10 }]}>
              <View style={styles.stepNumberCircle}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Rider Pickup & Verification</Text>
                <Text style={styles.stepSub}>
                  Delivery rider scans the package and collects it from your counter.
                </Text>
              </View>
            </View>

            <View style={[styles.stepCard, { marginTop: 10 }]}>
              <View style={[styles.stepNumberCircle, { backgroundColor: '#DCFCE7' }]}>
                <Text style={[styles.stepNumberText, { color: '#15803D' }]}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Instant Direct Settlement</Text>
                <Text style={styles.stepSub}>
                  Funds are batched and transferred automatically directly to your UPI ID ({payoutUpi}).
                </Text>
              </View>
            </View>

            <View style={styles.tipBox}>
              <Ionicons name="calendar-outline" size={18} color="#047A36" style={{ marginRight: 8 }} />
              <Text style={styles.tipText}>
                Settlements operate 365 days a year without delays on Sundays, public holidays, or festival peak days.
              </Text>
            </View>
          </View>
        );

      // 3. Commission & Fee Structure
      case 'opt-commission':
        return (
          <View>
            <View style={styles.sheetHeader}>
              <View style={styles.titleRow}>
                <View style={styles.headerIconCircle}>
                  <Ionicons name="pricetag" size={20} color="#047A36" />
                </View>
                <Text style={styles.sheetTitle}>Commission & Rates</Text>
              </View>
              <TouchableOpacity onPress={handleDismiss} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Platform Commission</Text>
                <Text style={[styles.infoValue, { color: '#047A36', fontFamily: 'PlusJakartaSans-Medium' }]}>
                  0% Launch Offer
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Payment Gateway Charges</Text>
                <Text style={styles.infoValue}>₹0.00 (Free)</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Delivery Surcharge</Text>
                <Text style={styles.infoValue}>Paid by Customer</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Merchant Payout Share</Text>
                <Text style={[styles.infoValue, { color: '#059669', fontFamily: 'PlusJakartaSans-Medium' }]}>
                  100% of Product Value
                </Text>
              </View>
            </View>

            <Text style={styles.hintText}>
              During the initial launch period, DusMint does not deduct any platform commission. Every rupee of your product sales price goes directly to your shop.
            </Text>
          </View>
        );

      // 4. Statements & Invoices
      case 'opt-invoices':
        return (
          <View>
            <View style={styles.sheetHeader}>
              <View style={styles.titleRow}>
                <View style={styles.headerIconCircle}>
                  <Ionicons name="document-text" size={20} color="#047A36" />
                </View>
                <Text style={styles.sheetTitle}>Statements & Invoices</Text>
              </View>
              <TouchableOpacity onPress={handleDismiss} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Registered Dukaan</Text>
                <Text style={styles.infoValue}>{vendor?.name || 'Gupta Traders'}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>GST Registration</Text>
                <Text style={styles.infoValue}>Exempt / Composite</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Current Billing Cycle</Text>
                <Text style={styles.infoValue}>November 2026</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.actionBtn, { marginTop: 14 }]}
              activeOpacity={0.85}
              onPress={() => onShowToast('Monthly payout statement downloaded')}
            >
              <Ionicons name="download-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.actionBtnText}>Download Monthly Statement (PDF)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnOutline, { marginTop: 10 }]}
              activeOpacity={0.85}
              onPress={() => onShowToast('GST summary exported')}
            >
              <Ionicons name="receipt-outline" size={18} color="#047A36" style={{ marginRight: 8 }} />
              <Text style={[styles.actionBtnText, { color: '#047A36' }]}>Export GST Summary</Text>
            </TouchableOpacity>
          </View>
        );

      // 5. Payment Support Desk
      case 'opt-support':
        return (
          <View>
            <View style={styles.sheetHeader}>
              <View style={styles.titleRow}>
                <View style={styles.headerIconCircle}>
                  <Ionicons name="headset" size={20} color="#047A36" />
                </View>
                <Text style={styles.sheetTitle}>Payment Support Desk</Text>
              </View>
              <TouchableOpacity onPress={handleDismiss} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Toll-Free Helpline</Text>
                <Text style={[styles.infoValue, { color: '#047A36', fontFamily: 'PlusJakartaSans-Medium' }]}>
                  1800-889-6468
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Support Email</Text>
                <Text style={styles.infoValue}>settlements@dusmint.com</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Operating Hours</Text>
                <Text style={styles.infoValue}>06:00 AM – 11:00 PM (Daily)</Text>
              </View>
            </View>

            <Text style={styles.hintText}>
              Reach our dedicated partner settlement desk immediately if your daily bank credit is delayed or if you changed your UPI account.
            </Text>

            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.85}
              onPress={handleCallSupport}
            >
              <Ionicons name="call" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.actionBtnText}>Call Helpline Now</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      visible={showModal}
      transparent
      animationType="none"
      onRequestClose={handleDismiss}
      statusBarTranslucent
    >
      <View style={styles.modalRoot}>
        {/* Full-screen stationary dark backdrop that ONLY smoothly fades in */}
        <TouchableWithoutFeedback onPress={handleDismiss}>
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>

        {/* Sliding Bottom Sheet */}
        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: bottomInset,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.dragHandle} />
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {renderContent()}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E8F5EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  infoLabel: {
    fontSize: 12.5,
    color: '#64748B',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  infoValue: {
    fontSize: 13.5,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#0F172A',
    maxWidth: '60%',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 14,
  },
  tipText: {
    fontSize: 12,
    color: '#15803D',
    fontFamily: 'PlusJakartaSans-Medium',
    flex: 1,
    lineHeight: 17,
  },
  hintText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 12,
    lineHeight: 18,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 12,
  },
  stepNumberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#0F172A',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 13.5,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#0F172A',
    marginBottom: 2,
  },
  stepSub: {
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 16,
  },
  actionBtn: {
    backgroundColor: '#047A36',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    shadowColor: '#047A36',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  actionBtnOutline: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#047A36',
    shadowOpacity: 0,
    elevation: 0,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Medium',
    letterSpacing: 0.2,
  },
});
