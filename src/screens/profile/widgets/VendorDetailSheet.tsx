import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Linking,
  Vibration,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { VendorProfileInfo } from '../../../api-client/types';

interface Props {
  visible: boolean;
  optionId: string | null;
  vendor: VendorProfileInfo | null;
  selectedLanguage: 'en' | 'hi';
  onClose: () => void;
  onOpenEdit: () => void;
  onSetLanguage: (lang: 'en' | 'hi') => void;
  onShowToast: (msg: string) => void;
}

export const VendorDetailSheet: React.FC<Props> = ({
  visible,
  optionId,
  vendor,
  selectedLanguage,
  onClose,
  onOpenEdit,
  onSetLanguage,
  onShowToast,
}) => {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 16);

  if (!visible || !optionId) return null;

  const handleTestChime = () => {
    Vibration.vibrate([0, 400, 150, 400]);
    onShowToast('🔔 Loud Mandi alert chime tested!');
  };

  const handleCallSupport = () => {
    Linking.openURL('tel:18008896468').catch(() => {
      onShowToast('Dialing 1800-889-MINT');
    });
  };

  const renderContent = () => {
    switch (optionId) {
      case 'opt-shop':
        return (
          <View>
            <View style={styles.sheetHeader}>
              <View style={styles.titleRow}>
                <View style={styles.headerIconCircle}>
                  <Ionicons name="storefront" size={20} color="#047A36" />
                </View>
                <Text style={styles.sheetTitle}>Shop Details & Category</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Dukaan Name</Text>
                <Text style={styles.infoValue}>{vendor?.name || 'My Dukaan'}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Owner Name</Text>
                <Text style={styles.infoValue}>{vendor?.owner_name || 'Partner'}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Registered Phone</Text>
                <Text style={styles.infoValue}>{vendor?.owner_phone || 'Not available'}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Store Category</Text>
                <Text style={[styles.infoValue, { textTransform: 'capitalize' }]}>
                  {vendor?.category || 'General'}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Store Status</Text>
                <Text style={[styles.infoValue, { color: vendor?.is_open ? '#15803D' : '#DC2626' }]}>
                  {vendor?.is_open ? '● Online & Accepting Orders' : '● Closed'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.85}
              onPress={() => {
                onClose();
                onOpenEdit();
              }}
            >
              <Ionicons name="create-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.actionBtnText}>Edit Shop Profile</Text>
            </TouchableOpacity>
          </View>
        );

      case 'opt-location':
        return (
          <View>
            <View style={styles.sheetHeader}>
              <View style={styles.titleRow}>
                <View style={styles.headerIconCircle}>
                  <Ionicons name="location" size={20} color="#047A36" />
                </View>
                <Text style={styles.sheetTitle}>Mandi Location & Cluster</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Assigned Cluster</Text>
                <Text style={styles.infoValue}>{vendor?.cluster_name || 'Mandi Cluster'}</Text>
              </View>
              {Boolean(vendor?.cluster_city) && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Cluster City</Text>
                    <Text style={styles.infoValue}>{vendor?.cluster_city}</Text>
                  </View>
                </>
              )}
              {Boolean(vendor?.lat && vendor?.lng) && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>GPS Coordinates</Text>
                    <Text style={styles.infoValue}>
                      {Number(vendor?.lat).toFixed(4)}, {Number(vendor?.lng).toFixed(4)}
                    </Text>
                  </View>
                </>
              )}
            </View>

            <Text style={styles.hintText}>
              Your shop coordinates define which hyperlocal delivery orders are assigned to you. Contact your cluster manager to change location.
            </Text>
          </View>
        );

      case 'opt-settlement':
        return (
          <View>
            <View style={styles.sheetHeader}>
              <View style={styles.titleRow}>
                <View style={styles.headerIconCircle}>
                  <Ionicons name="card" size={20} color="#047A36" />
                </View>
                <Text style={styles.sheetTitle}>Settlement UPI Account</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Settlement UPI ID</Text>
                <Text style={[styles.infoValue, { color: '#047A36', fontWeight: '700' }]}>
                  {vendor?.bank_or_upi || 'Not configured'}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Settlement Cycle</Text>
                <Text style={styles.infoValue}>T+0 Daily Auto-Payout</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Payout Trigger</Text>
                <Text style={styles.infoValue}>On Rider Order Collection</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.85}
              onPress={() => {
                onClose();
                onOpenEdit();
              }}
            >
              <Ionicons name="pencil" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.actionBtnText}>Change UPI Settlement ID</Text>
            </TouchableOpacity>
          </View>
        );

      case 'opt-slots':
        return (
          <View>
            <View style={styles.sheetHeader}>
              <View style={styles.titleRow}>
                <View style={styles.headerIconCircle}>
                  <Ionicons name="time" size={20} color="#047A36" />
                </View>
                <Text style={styles.sheetTitle}>Delivery Slot Timings</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.slotCard}>
              <View style={styles.slotHeader}>
                <Text style={styles.slotBadgeMorning}>MORNING BATCH</Text>
                <Text style={styles.slotTiming}>06:00 AM – 11:00 AM</Text>
              </View>
              <Text style={styles.slotSub}>
                Cutoff for morning customer orders closes at 05:00 AM. Packing starts at 05:30 AM.
              </Text>
            </View>

            <View style={[styles.slotCard, { marginTop: 12 }]}>
              <View style={styles.slotHeader}>
                <Text style={styles.slotBadgeEvening}>EVENING BATCH</Text>
                <Text style={styles.slotTiming}>04:00 PM – 09:00 PM</Text>
              </View>
              <Text style={styles.slotSub}>
                Cutoff for evening customer orders closes at 03:00 PM. Packing starts at 03:30 PM.
              </Text>
            </View>
          </View>
        );

      case 'opt-alarm':
        return (
          <View>
            <View style={styles.sheetHeader}>
              <View style={styles.titleRow}>
                <View style={styles.headerIconCircle}>
                  <Ionicons name="notifications" size={20} color="#047A36" />
                </View>
                <Text style={styles.sheetTitle}>Mandi Order Alarm</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Order Chime</Text>
                <Text style={styles.infoValue}>Enabled (High Volume)</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Vibration Pattern</Text>
                <Text style={styles.infoValue}>Repeated Mandi Alert</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#EA580C' }]}
              activeOpacity={0.85}
              onPress={handleTestChime}
            >
              <Ionicons name="volume-high" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.actionBtnText}>Test Chime & Vibration Now</Text>
            </TouchableOpacity>
          </View>
        );

      case 'opt-lang':
        return (
          <View>
            <View style={styles.sheetHeader}>
              <View style={styles.titleRow}>
                <View style={styles.headerIconCircle}>
                  <Ionicons name="globe" size={20} color="#047A36" />
                </View>
                <Text style={styles.sheetTitle}>Language / भाषा</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.langOptionCard,
                selectedLanguage === 'en' && styles.langOptionCardActive,
              ]}
              onPress={() => {
                onSetLanguage('en');
                onShowToast('Language set to English');
                onClose();
              }}
              activeOpacity={0.8}
            >
              <View>
                <Text style={styles.langOptionTitle}>English</Text>
                <Text style={styles.langOptionSub}>Default app interface</Text>
              </View>
              {selectedLanguage === 'en' ? (
                <Ionicons name="checkmark-circle" size={22} color="#047A36" />
              ) : (
                <View style={styles.radioEmpty} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.langOptionCard,
                selectedLanguage === 'hi' && styles.langOptionCardActive,
                { marginTop: 12 },
              ]}
              onPress={() => {
                onSetLanguage('hi');
                onShowToast('भाषा हिंदी में सेट की गई');
                onClose();
              }}
              activeOpacity={0.8}
            >
              <View>
                <Text style={styles.langOptionTitle}>हिंदी (Hindi)</Text>
                <Text style={styles.langOptionSub}>मंडी और आर्डर हिंदी में</Text>
              </View>
              {selectedLanguage === 'hi' ? (
                <Ionicons name="checkmark-circle" size={22} color="#047A36" />
              ) : (
                <View style={styles.radioEmpty} />
              )}
            </TouchableOpacity>
          </View>
        );

      case 'opt-support':
        return (
          <View>
            <View style={styles.sheetHeader}>
              <View style={styles.titleRow}>
                <View style={styles.headerIconCircle}>
                  <Ionicons name="headset" size={20} color="#047A36" />
                </View>
                <Text style={styles.sheetTitle}>Partner Support Desk</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Toll Free Helpline</Text>
                <Text style={[styles.infoValue, { color: '#047A36', fontWeight: '700' }]}>
                  1800-889-MINT
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Direct Phone</Text>
                <Text style={styles.infoValue}>1800-889-6468</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Partner Support Email</Text>
                <Text style={styles.infoValue}>partners@dusmint.com</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Support Hours</Text>
                <Text style={styles.infoValue}>06:00 AM – 11:00 PM</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.85}
              onPress={handleCallSupport}
            >
              <Ionicons name="call" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.actionBtnText}>Call Partner Support Now</Text>
            </TouchableOpacity>
          </View>
        );

      case 'opt-terms':
        return (
          <View>
            <View style={styles.sheetHeader}>
              <View style={styles.titleRow}>
                <View style={styles.headerIconCircle}>
                  <Ionicons name="shield-checkmark" size={20} color="#047A36" />
                </View>
                <Text style={styles.sheetTitle}>Compliance & Terms</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Merchant Partner Tier</Text>
                <Text style={styles.infoValue}>Tier-1 Mandi Dukaan</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Commission Rate</Text>
                <Text style={styles.infoValue}>{vendor?.commission_pct ?? 10}% Flat Rate</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>FSSAI Status</Text>
                <Text style={[styles.infoValue, { color: '#15803D', fontWeight: '700' }]}>
                  Verified Partner ✓
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>QR Sealing Protocol</Text>
                <Text style={styles.infoValue}>100% Tamper-Proof Tape</Text>
              </View>
            </View>

            <Text style={styles.hintText}>
              All vendor partner payouts and order batch allocations adhere to standard Mandi Trade compliance and food safety policies.
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={[styles.sheet, { paddingBottom: bottomInset }]}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {renderContent()}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: '80%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#0F172A',
    maxWidth: '55%',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  hintText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 14,
    lineHeight: 18,
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
    elevation: 4,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
  slotCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  slotBadgeMorning: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  slotBadgeEvening: {
    fontSize: 11,
    fontWeight: '800',
    color: '#C2410C',
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  slotTiming: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  slotSub: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },
  langOptionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  langOptionCardActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  langOptionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  langOptionSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  radioEmpty: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
  },
});
