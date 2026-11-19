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

  const handleTestChime = () => {
    Vibration.vibrate([0, 400, 150, 400]);
    onShowToast('🔔 घंटी बज रही है (Order Alarm Tested)');
  };

  const handleCallSupport = () => {
    Linking.openURL('tel:18008896468').catch(() => {
      onShowToast('डायल करें: 1800-889-MINT');
    });
  };

  if (!showModal && !visible) return null;

  const renderContent = () => {
    switch (optionId) {
      // 1. दुकान की जानकारी (Shop Details)
      case 'opt-shop':
        return (
          <View>
            <View style={styles.sheetHeader}>
              <View style={styles.titleRow}>
                <View style={styles.headerIconCircle}>
                  <Ionicons name="storefront" size={20} color="#047A36" />
                </View>
                <Text style={styles.sheetTitle}>दुकान की जानकारी (Shop Details)</Text>
              </View>
              <TouchableOpacity onPress={handleDismiss} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>दुकान का नाम</Text>
                <Text style={styles.infoValue}>{vendor?.name || 'My Dukaan'}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>मालिक का नाम</Text>
                <Text style={styles.infoValue}>{vendor?.owner_name || 'Partner'}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>रजिस्टर मोबाइल</Text>
                <Text style={styles.infoValue}>{vendor?.owner_phone || 'Not available'}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>सामान का प्रकार</Text>
                <Text style={[styles.infoValue, { textTransform: 'capitalize' }]}>
                  {vendor?.category || 'किराना'}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>दुकान का स्टेटस</Text>
                <Text style={[styles.infoValue, { color: vendor?.is_open ? '#15803D' : '#DC2626' }]}>
                  {vendor?.is_open ? '● दुकान खुली है (Online)' : '● दुकान बंद है (Closed)'}
                </Text>
              </View>
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
              <Text style={styles.actionBtnText}>✏️ दुकान की जानकारी बदलें (Edit)</Text>
            </TouchableOpacity>
          </View>
        );

      // 2. दुकान का पता (Shop Address & Location)
      case 'opt-location':
        return (
          <View>
            <View style={styles.sheetHeader}>
              <View style={styles.titleRow}>
                <View style={styles.headerIconCircle}>
                  <Ionicons name="location" size={20} color="#047A36" />
                </View>
                <Text style={styles.sheetTitle}>दुकान का पता (Shop Address)</Text>
              </View>
              <TouchableOpacity onPress={handleDismiss} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoRowVertical}>
                <Text style={styles.infoLabel}>दुकान का पूरा पता</Text>
                <Text style={styles.addressValue}>
                  {vendor?.address || 'ऑनबोर्डिंग में दर्ज किया गया पता'}
                </Text>
              </View>
              {Boolean(vendor?.cluster_city) && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>शहर / इलाका</Text>
                    <Text style={styles.infoValue}>{vendor?.cluster_city}</Text>
                  </View>
                </>
              )}
              {Boolean(vendor?.lat && vendor?.lng) && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>लोकेशन पिन (GPS)</Text>
                    <Text style={styles.infoValue}>
                      {Number(vendor?.lat).toFixed(4)}, {Number(vendor?.lng).toFixed(4)}
                    </Text>
                  </View>
                </>
              )}
            </View>

            <View style={styles.tipBox}>
              <Ionicons name="bicycle" size={18} color="#047A36" style={{ marginRight: 8 }} />
              <Text style={styles.tipText}>
                डिलीवरी पार्टनर (राइडर) इसी पते पर आकर आपके पैक किए हुए आर्डर कलेक्ट करेगा।
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
              <Text style={styles.actionBtnText}>✏️ पता अपडेट करें (Change Address)</Text>
            </TouchableOpacity>
          </View>
        );

      // 3. पैसे आने का UPI (Payment UPI Account)
      case 'opt-settlement':
        return (
          <View>
            <View style={styles.sheetHeader}>
              <View style={styles.titleRow}>
                <View style={styles.headerIconCircle}>
                  <Ionicons name="card" size={20} color="#047A36" />
                </View>
                <Text style={styles.sheetTitle}>पैसे आने का UPI (Payment)</Text>
              </View>
              <TouchableOpacity onPress={handleDismiss} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>दुकान की UPI ID</Text>
                <Text style={[styles.infoValue, { color: '#047A36', fontWeight: '800' }]}>
                  {vendor?.bank_or_upi || 'सेट नहीं है'}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>पैसे आने का समय</Text>
                <Text style={styles.infoValue}>रोजाना (Daily T+0)</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>पेमेंट का तरीका</Text>
                <Text style={styles.infoValue}>सीधा बैंक / UPI ट्रांसफर</Text>
              </View>
            </View>

            <View style={styles.tipBox}>
              <Ionicons name="shield-checkmark" size={18} color="#047A36" style={{ marginRight: 8 }} />
              <Text style={styles.tipText}>
                रोज की बिक्री का पैसा डिलीवरी पार्टनर द्वारा आर्डर पिक करने के बाद सीधे आपके इसी UPI खाते में आ जाएगा।
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
              <Text style={styles.actionBtnText}>✏️ UPI ID बदलें (Change UPI)</Text>
            </TouchableOpacity>
          </View>
        );

      // 4. दुकान और आर्डर का समय (Store Timings & Orders)
      case 'opt-slots':
        return (
          <View>
            <View style={styles.sheetHeader}>
              <View style={styles.titleRow}>
                <View style={styles.headerIconCircle}>
                  <Ionicons name="time" size={20} color="#047A36" />
                </View>
                <Text style={styles.sheetTitle}>दुकान और आर्डर का समय</Text>
              </View>
              <TouchableOpacity onPress={handleDismiss} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.slotCard}>
              <View style={styles.slotHeader}>
                <Text style={styles.slotBadgeMorning}>🌅 सुबह का समय</Text>
                <Text style={styles.slotTiming}>06:00 AM – 11:00 AM</Text>
              </View>
              <Text style={styles.slotSub}>
                सुबह 6:00 बजे से आर्डर आना शुरू होंगे। सामान पहले से ताज़ा और तैयार रखें।
              </Text>
            </View>

            <View style={[styles.slotCard, { marginTop: 12 }]}>
              <View style={styles.slotHeader}>
                <Text style={styles.slotBadgeEvening}>🌆 शाम का समय</Text>
                <Text style={styles.slotTiming}>04:00 PM – 09:00 PM</Text>
              </View>
              <Text style={styles.slotSub}>
                शाम 4:00 बजे से आर्डर आएंगे। राइडर आते ही पैकेट तुरंत हैंडओवर करें।
              </Text>
            </View>

            <View style={[styles.tipBox, { marginTop: 14 }]}>
              <Ionicons name="cube-outline" size={18} color="#047A36" style={{ marginRight: 8 }} />
              <Text style={styles.tipText}>
                आर्डर आते ही सामान पैक करके रखें ताकि राइडर बिना देर किए सीधे लेकर निकल सके।
              </Text>
            </View>
          </View>
        );

      // 5. आर्डर की घंटी (Order Ringtone / Alarm)
      case 'opt-alarm':
        return (
          <View>
            <View style={styles.sheetHeader}>
              <View style={styles.titleRow}>
                <View style={styles.headerIconCircle}>
                  <Ionicons name="notifications" size={20} color="#047A36" />
                </View>
                <Text style={styles.sheetTitle}>आर्डर की घंटी (Order Ringtone)</Text>
              </View>
              <TouchableOpacity onPress={handleDismiss} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>आर्डर अलार्म</Text>
                <Text style={[styles.infoValue, { color: '#047A36', fontWeight: '700' }]}>चालू है (Active)</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>आवाज़</Text>
                <Text style={styles.infoValue}>फुल वॉल्यूम + वाइब्रेशन</Text>
              </View>
            </View>

            <Text style={styles.hintText}>
              नया आर्डर आते ही फोन साइलेंट होने पर भी ज़ोरदार घंटी बजेगी ताकि आपका कोई भी आर्डर छूटे नहीं।
            </Text>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#EA580C' }]}
              activeOpacity={0.85}
              onPress={handleTestChime}
            >
              <Ionicons name="volume-high" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.actionBtnText}>🔔 घंटी बजाकर चेक करें (Test Sound)</Text>
            </TouchableOpacity>
          </View>
        );

      // 6. ऐप की भाषा (App Language)
      case 'opt-lang':
        return (
          <View>
            <View style={styles.sheetHeader}>
              <View style={styles.titleRow}>
                <View style={styles.headerIconCircle}>
                  <Ionicons name="globe" size={20} color="#047A36" />
                </View>
                <Text style={styles.sheetTitle}>भाषा चुनें (Choose Language)</Text>
              </View>
              <TouchableOpacity onPress={handleDismiss} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.langOptionCard,
                selectedLanguage === 'hi' && styles.langOptionCardActive,
              ]}
              onPress={() => {
                onSetLanguage('hi');
                onShowToast('भाषा हिंदी में सेट की गई');
                handleDismiss();
              }}
              activeOpacity={0.8}
            >
              <View>
                <Text style={styles.langOptionTitle}>हिंदी (Hindi)</Text>
                <Text style={styles.langOptionSub}>आर्डर और दुकान की सारी जानकारी हिंदी में</Text>
              </View>
              {selectedLanguage === 'hi' ? (
                <Ionicons name="checkmark-circle" size={22} color="#047A36" />
              ) : (
                <View style={styles.radioEmpty} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.langOptionCard,
                selectedLanguage === 'en' && styles.langOptionCardActive,
                { marginTop: 12 },
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
          </View>
        );

      // 7. मदद और सपोर्ट (Help & Support)
      case 'opt-support':
        return (
          <View>
            <View style={styles.sheetHeader}>
              <View style={styles.titleRow}>
                <View style={styles.headerIconCircle}>
                  <Ionicons name="headset" size={20} color="#047A36" />
                </View>
                <Text style={styles.sheetTitle}>मदद और सपोर्ट (Helpline)</Text>
              </View>
              <TouchableOpacity onPress={handleDismiss} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>टोल-फ्री हेल्पलाइन</Text>
                <Text style={[styles.infoValue, { color: '#047A36', fontWeight: '800' }]}>
                  1800-889-6468
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>सपोर्ट ईमेल</Text>
                <Text style={styles.infoValue}>partners@dusmint.com</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>सपोर्ट का समय</Text>
                <Text style={styles.infoValue}>सुबह 6:00 से रात 11:00 तक</Text>
              </View>
            </View>

            <Text style={styles.hintText}>
              आर्डर, पेमेंट या ऐप से जुड़ी किसी भी समस्या के लिए हमारे पार्टनर हेल्पलाइन पर सीधे कॉल करें।
            </Text>

            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.85}
              onPress={handleCallSupport}
            >
              <Ionicons name="call" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.actionBtnText}>📞 हेल्पलाइन पर कॉल करें (Call Helpline)</Text>
            </TouchableOpacity>
          </View>
        );

      // 8. पार्टनर नियम (Partner Rules)
      case 'opt-terms':
        return (
          <View>
            <View style={styles.sheetHeader}>
              <View style={styles.titleRow}>
                <View style={styles.headerIconCircle}>
                  <Ionicons name="shield-checkmark" size={20} color="#047A36" />
                </View>
                <Text style={styles.sheetTitle}>पार्टनर नियम (Partner Rules)</Text>
              </View>
              <TouchableOpacity onPress={handleDismiss} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>कमीशन रेट</Text>
                <Text style={[styles.infoValue, { color: '#047A36', fontWeight: '800' }]}>
                  {vendor?.commission_pct ?? 10}% (बाकी सारा पैसा आपका)
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>सामान की क्वालिटी</Text>
                <Text style={styles.infoValue}>साफ और ताज़ा सामान ही पैक करें</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>पैकिंग सील</Text>
                <Text style={styles.infoValue}>QR सील टेप लगाना अनिवार्य है</Text>
              </View>
            </View>

            <Text style={styles.hintText}>
              DusMint पार्टनर बनने के नियम आसान और पारदर्शी हैं। समय पर सामान पैक करें और रोज़ाना कमाई पाएं।
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
    backgroundColor: '#E8F5EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
    flex: 1,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
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
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  infoRowVertical: {
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
    maxWidth: '55%',
    textAlign: 'right',
  },
  addressValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 4,
    lineHeight: 20,
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
    fontWeight: '600',
    flex: 1,
    lineHeight: 17,
  },
  hintText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 12,
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
