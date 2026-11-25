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
  Vibration,
  Platform,
  Animated,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { VendorProfileInfo } from '../../../api-client/types';
import { useVendorAuthStore } from '../../../state/useVendorAuthStore';

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

  const [showModal, setShowModal] = useState(visible);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(600)).current;

  const localStorePhoto = useVendorAuthStore((s) => s.storePhotoUri);
  const activeVendorFromStore = useVendorAuthStore((s) => s.activeVendor);
  const photoUrl =
    (vendor?.shop_photo_urls && vendor.shop_photo_urls.length > 0
      ? vendor.shop_photo_urls[0]
      : null) ||
    (activeVendorFromStore?.shop_photo_urls && activeVendorFromStore.shop_photo_urls.length > 0
      ? activeVendorFromStore.shop_photo_urls[0]
      : null) ||
    localStorePhoto;

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

  const handleTestChime = () => {
    Vibration.vibrate([0, 400, 150, 400]);
    onShowToast('Order alert ringtone tested');
  };

  const handleCallSupport = () => {
    Linking.openURL('tel:18008896468').catch(() => {
      onShowToast('Dialing 1800-889-6468');
    });
  };

  if (!showModal && !visible) return null;

  const renderContent = () => {
    switch (optionId) {
      // 1. Shop Details
      case 'opt-shop':
        return (
          <View>
            <View style={styles.sheetHeader}>
              <View style={styles.titleRow}>
                <View style={styles.headerIconCircle}>
                  <Ionicons name="storefront-outline" size={20} color="#0F172A" />
                </View>
                <Text style={styles.sheetTitle}>Shop Details</Text>
              </View>
              <TouchableOpacity onPress={handleDismiss} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Shop Name</Text>
                <Text style={styles.infoValue}>{vendor?.name || 'My Dukaan'}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Owner Name</Text>
                <Text style={styles.infoValue}>{vendor?.owner_name || 'Partner'}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Registered Mobile</Text>
                <Text style={styles.infoValue}>{vendor?.owner_phone || 'Not available'}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Category</Text>
                <Text style={[styles.infoValue, { textTransform: 'capitalize' }]}>
                  {vendor?.category || 'Groceries'}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Status</Text>
                <Text style={[styles.infoValue, { color: vendor?.is_open ? '#15803D' : '#DC2626' }]}>
                  {vendor?.is_open ? '● Online & Accepting Orders' : '● Closed'}
                </Text>
              </View>
              {photoUrl ? (
                <>
                  <View style={styles.divider} />
                  <View style={styles.infoRowVertical}>
                    <Text style={styles.infoLabel}>Shop Picture</Text>
                    <Image
                      source={{ uri: photoUrl }}
                      style={styles.shopPhotoThumb}
                      resizeMode="cover"
                    />
                  </View>
                </>
              ) : null}
            </View>

            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.85}
              onPress={() => {
                handleDismiss();
                onOpenEdit();
              }}
            >
              <Ionicons name="create-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.actionBtnText}>Edit Shop Details</Text>
            </TouchableOpacity>
          </View>
        );

      // 2. Shop Address & Location
      case 'opt-location':
        return (
          <View>
            <View style={styles.sheetHeader}>
              <View style={styles.titleRow}>
                <View style={styles.headerIconCircle}>
                  <Ionicons name="location-outline" size={20} color="#0F172A" />
                </View>
                <Text style={styles.sheetTitle}>Shop Address</Text>
              </View>
              <TouchableOpacity onPress={handleDismiss} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoRowVertical}>
                <Text style={styles.infoLabel}>Full Street Address</Text>
                <Text style={styles.addressValue}>
                  {vendor?.address || 'Address provided during onboarding'}
                </Text>
              </View>
              {Boolean(vendor?.cluster_city) && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>City / Area</Text>
                    <Text style={styles.infoValue}>{vendor?.cluster_city}</Text>
                  </View>
                </>
              )}
              {Boolean(vendor?.lat && vendor?.lng) && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>GPS Pin</Text>
                    <Text style={styles.infoValue}>
                      {Number(vendor?.lat).toFixed(4)}, {Number(vendor?.lng).toFixed(4)}
                    </Text>
                  </View>
                </>
              )}
            </View>

            <View style={styles.tipBox}>
              <Ionicons name="bicycle-outline" size={18} color="#0F172A" style={{ marginRight: 8 }} />
              <Text style={styles.tipText}>
                Delivery riders will come to this shop address to pick up packed customer orders.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.85}
              onPress={() => {
                handleDismiss();
                onOpenEdit();
              }}
            >
              <Ionicons name="create-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.actionBtnText}>Update Address</Text>
            </TouchableOpacity>
          </View>
        );

      // 3. Payment UPI Account
      case 'opt-settlement':
        return (
          <View>
            <View style={styles.sheetHeader}>
              <View style={styles.titleRow}>
                <View style={styles.headerIconCircle}>
                  <Ionicons name="card-outline" size={20} color="#0F172A" />
                </View>
                <Text style={styles.sheetTitle}>Payment UPI Account</Text>
              </View>
              <TouchableOpacity onPress={handleDismiss} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Daily Settlement UPI ID</Text>
                <Text style={[styles.infoValue, { color: '#047A36', fontFamily: 'PlusJakartaSans-SemiBold' }]}>
                  {vendor?.bank_or_upi || 'Not linked'}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Payout Schedule</Text>
                <Text style={styles.infoValue}>Daily (T+0)</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Payout Mode</Text>
                <Text style={styles.infoValue}>Direct UPI Bank Transfer</Text>
              </View>
            </View>

            <View style={styles.tipBox}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#0F172A" style={{ marginRight: 8 }} />
              <Text style={styles.tipText}>
                Daily sales earnings are auto-transferred directly to this UPI account upon rider order pickup.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.85}
              onPress={() => {
                handleDismiss();
                onOpenEdit();
              }}
            >
              <Ionicons name="pencil" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.actionBtnText}>Change UPI ID</Text>
            </TouchableOpacity>
          </View>
        );

      // 4. Delivery Slot Timings
      case 'opt-slots':
        return (
          <View>
            <View style={styles.sheetHeader}>
              <View style={styles.titleRow}>
                <View style={styles.headerIconCircle}>
                  <Ionicons name="time-outline" size={20} color="#0F172A" />
                </View>
                <Text style={styles.sheetTitle}>Delivery Slot Timings</Text>
              </View>
              <TouchableOpacity onPress={handleDismiss} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.slotCard}>
              <View style={styles.slotHeader}>
                <Text style={styles.slotBadgeMorning}>MORNING BATCH</Text>
                <Text style={styles.slotTiming}>06:00 AM – 11:00 AM</Text>
              </View>
              <Text style={styles.slotSub}>
                Customer orders start at 06:00 AM. Please keep fresh inventory packed and ready.
              </Text>
            </View>

            <View style={[styles.slotCard, { marginTop: 12 }]}>
              <View style={styles.slotHeader}>
                <Text style={styles.slotBadgeEvening}>EVENING BATCH</Text>
                <Text style={styles.slotTiming}>04:00 PM – 09:00 PM</Text>
              </View>
              <Text style={styles.slotSub}>
                Evening customer orders start at 04:00 PM. Hand over packets to delivery riders upon arrival.
              </Text>
            </View>

            <View style={[styles.tipBox, { marginTop: 14 }]}>
              <Ionicons name="cube-outline" size={18} color="#0F172A" style={{ marginRight: 8 }} />
              <Text style={styles.tipText}>
                Pack orders promptly so riders can collect and deliver without delays.
              </Text>
            </View>
          </View>
        );

      // 5. Order Alert Ringtone
      case 'opt-alarm':
        return (
          <View>
            <View style={styles.sheetHeader}>
              <View style={styles.titleRow}>
                <View style={styles.headerIconCircle}>
                  <Ionicons name="notifications-outline" size={20} color="#0F172A" />
                </View>
                <Text style={styles.sheetTitle}>Order Alert Ringtone</Text>
              </View>
              <TouchableOpacity onPress={handleDismiss} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Order Alert</Text>
                <Text style={[styles.infoValue, { color: '#047A36', fontFamily: 'PlusJakartaSans-SemiBold' }]}>Active</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Volume & Vibration</Text>
                <Text style={styles.infoValue}>Maximum Volume + Haptic</Text>
              </View>
            </View>

            <Text style={styles.hintText}>
              Plays a loud ringtone and vibration pattern on every new order so you never miss a customer request, even on silent.
            </Text>

            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.85}
              onPress={handleTestChime}
            >
              <Ionicons name="volume-high" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.actionBtnText}>Test Ringtone & Sound</Text>
            </TouchableOpacity>
          </View>
        );

      // 6. App Language
      case 'opt-lang':
        return (
          <View>
            <View style={styles.sheetHeader}>
              <View style={styles.titleRow}>
                <View style={styles.headerIconCircle}>
                  <Ionicons name="globe-outline" size={20} color="#0F172A" />
                </View>
                <Text style={styles.sheetTitle}>App Language</Text>
              </View>
              <TouchableOpacity onPress={handleDismiss} style={styles.closeBtn}>
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
                handleDismiss();
              }}
              activeOpacity={0.8}
            >
              <View>
                <Text style={styles.langOptionTitle}>English</Text>
                <Text style={styles.langOptionSub}>Standard English interface</Text>
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
                onShowToast('Language switched to Hindi');
                handleDismiss();
              }}
              activeOpacity={0.8}
            >
              <View>
                <Text style={styles.langOptionTitle}>Hindi</Text>
                <Text style={styles.langOptionSub}>Orders and store in Hindi</Text>
              </View>
              {selectedLanguage === 'hi' ? (
                <Ionicons name="checkmark-circle" size={22} color="#047A36" />
              ) : (
                <View style={styles.radioEmpty} />
              )}
            </TouchableOpacity>
          </View>
        );

      // 7. Help & Support
      case 'opt-support':
        return (
          <View>
            <View style={styles.sheetHeader}>
              <View style={styles.titleRow}>
                <View style={styles.headerIconCircle}>
                  <Ionicons name="headset-outline" size={20} color="#0F172A" />
                </View>
                <Text style={styles.sheetTitle}>Help & Support</Text>
              </View>
              <TouchableOpacity onPress={handleDismiss} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Toll-Free Helpline</Text>
                <Text style={styles.phoneHighlightValue}>
                  1800-889-6468
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Support Email</Text>
                <Text style={styles.infoValue}>partners@dusmint.com</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Operating Hours</Text>
                <Text style={styles.infoValue}>06:00 AM – 11:00 PM</Text>
              </View>
            </View>

            <Text style={styles.hintText}>
              Call our partner desk directly for assistance with incoming orders, payment settlements, or technical issues.
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

      // 8. Partner Terms & Policy
      case 'opt-terms':
        return (
          <View>
            <View style={styles.sheetHeader}>
              <View style={styles.titleRow}>
                <View style={styles.headerIconCircle}>
                  <Ionicons name="shield-checkmark-outline" size={20} color="#0F172A" />
                </View>
                <Text style={styles.sheetTitle}>Partner Terms & Policy</Text>
              </View>
              <TouchableOpacity onPress={handleDismiss} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Commission Rate</Text>
                <Text style={[styles.infoValue, { color: '#047A36', fontFamily: 'PlusJakartaSans-SemiBold' }]}>
                  {vendor?.commission_pct ?? 10}% Flat Rate
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Quality Standard</Text>
                <Text style={styles.infoValue}>Pack fresh, verified items</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Packaging Protocol</Text>
                <Text style={styles.infoValue}>Tamper-proof QR tape required</Text>
              </View>
            </View>

            <Text style={styles.hintText}>
              DusMint merchant partner rules are straightforward and transparent. Keep your store online during active delivery slots and receive daily settlements.
            </Text>
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
        {/* Full-screen static dark backdrop that ONLY smoothly fades in */}
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
          <ScrollView showsVerticalScrollIndicator={false}>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: '82%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
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
    flex: 1,
  },
  headerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 20,
    color: '#0F172A',
    letterSpacing: -0.4,
    flex: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  infoCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoRowVertical: {
    paddingVertical: 10,
  },
  infoLabel: {
    fontSize: 14.5,
    color: '#334155',
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  infoValue: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: '#0F172A',
    maxWidth: '55%',
    textAlign: 'right',
  },
  phoneHighlightValue: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 20,
    color: '#047A36',
    textAlign: 'right',
  },
  addressValue: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#0F172A',
    marginTop: 4,
    lineHeight: 22,
  },
  shopPhotoThumb: {
    width: '100%',
    height: 130,
    borderRadius: 12,
    marginTop: 8,
    backgroundColor: '#F1F5F9',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginTop: 14,
  },
  tipText: {
    fontSize: 14,
    color: '#047A36',
    fontFamily: 'PlusJakartaSans-Medium',
    flex: 1,
    lineHeight: 20,
  },
  hintText: {
    fontSize: 14,
    color: '#334155',
    marginTop: 14,
    lineHeight: 20,
    fontFamily: 'PlusJakartaSans-Medium',
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
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  slotCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  slotBadgeMorning: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: '#047A36',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  slotBadgeEvening: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: '#047A36',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  slotTiming: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 18,
    color: '#0F172A',
  },
  slotSub: {
    fontSize: 14.5,
    color: '#334155',
    lineHeight: 20,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  langOptionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  langOptionCardActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  langOptionTitle: {
    fontSize: 16.5,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: '#0F172A',
    marginBottom: 2,
  },
  langOptionSub: {
    fontSize: 14,
    color: '#334155',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  radioEmpty: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
  },
});
