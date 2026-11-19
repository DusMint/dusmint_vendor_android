import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { VendorProfileInfo } from '../../../api-client/types';
import { dusmintApi } from '../../../api-client/client';

interface Props {
  visible: boolean;
  vendor: VendorProfileInfo | null;
  onClose: () => void;
  onProfileUpdated: (updatedVendor: VendorProfileInfo) => void;
}

const CATEGORIES = [
  { id: 'groceries', label: 'Groceries' },
  { id: 'vegetables', label: 'Vegetables' },
  { id: 'fruits', label: 'Fruits' },
  { id: 'dairy', label: 'Dairy' },
  { id: 'bakery', label: 'Bakery' },
];

export const EditVendorModal: React.FC<Props> = ({
  visible,
  vendor,
  onClose,
  onProfileUpdated,
}) => {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 16);

  const [showModal, setShowModal] = useState(visible);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(600)).current;

  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [bankOrUpi, setBankOrUpi] = useState('');
  const [category, setCategory] = useState('groceries');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

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

      if (vendor) {
        setShopName(vendor.name || '');
        setOwnerName(vendor.owner_name || '');
        setBankOrUpi(vendor.bank_or_upi || '');
        setCategory(vendor.category || 'groceries');
        setError('');
      }
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
  }, [visible, vendor, fadeAnim, slideAnim]);

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

  const handleSave = async () => {
    if (!shopName.trim()) {
      setError('Please enter your dukaan/shop name');
      return;
    }
    if (!ownerName.trim()) {
      setError('Please enter owner name');
      return;
    }
    if (!bankOrUpi.trim()) {
      setError('Please enter your settlement UPI ID');
      return;
    }

    if (!vendor?.id) {
      Alert.alert('Error', 'Vendor record not loaded');
      return;
    }

    try {
      setIsSaving(true);
      setError('');
      const res = await dusmintApi.updateVendorProfile(vendor.id, {
        shopName: shopName.trim(),
        ownerName: ownerName.trim(),
        bankOrUpi: bankOrUpi.trim(),
        category,
      });

      if (res.success && res.vendor) {
        onProfileUpdated({
          ...vendor,
          ...res.vendor,
        });
        handleDismiss();
      } else {
        setError('Failed to update dukaan profile. Please try again.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error while saving profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (!showModal && !visible) return null;

  return (
    <Modal
      visible={showModal}
      transparent
      animationType="none"
      onRequestClose={handleDismiss}
      statusBarTranslucent
    >
      <View style={styles.modalRoot}>
        {/* Full-screen static dark backdrop that ONLY smoothly fades in, NEVER moves */}
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
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Edit Dukaan Profile</Text>
              <TouchableOpacity
                onPress={handleDismiss}
                style={styles.closeBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={22} color="#0F172A" />
              </TouchableOpacity>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Shop Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>DUKAAN / SHOP NAME</Text>
                <TextInput
                  style={styles.input}
                  value={shopName}
                  onChangeText={(t) => {
                    setShopName(t);
                    setError('');
                  }}
                  placeholder="e.g. Mandi Fresh Kirana"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* Owner Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>OWNER FULL NAME</Text>
                <TextInput
                  style={styles.input}
                  value={ownerName}
                  onChangeText={(t) => {
                    setOwnerName(t);
                    setError('');
                  }}
                  placeholder="e.g. Ramesh Sharma"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* Category Pills */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>STORE CATEGORY</Text>
                <View style={styles.categoryRow}>
                  {CATEGORIES.map((cat) => {
                    const isSelected = category.toLowerCase() === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.catChip,
                          isSelected && styles.catChipActive,
                        ]}
                        onPress={() => setCategory(cat.id)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.catChipText,
                            isSelected && styles.catChipTextActive,
                          ]}
                        >
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* UPI ID */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>SETTLEMENT UPI ID (DAILY T+0)</Text>
                <TextInput
                  style={styles.input}
                  value={bankOrUpi}
                  onChangeText={(t) => {
                    setBankOrUpi(t);
                    setError('');
                  }}
                  placeholder="e.g. shopowner@okhdfcbank"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                />
                <Text style={styles.fieldHint}>
                  Daily sales earnings are auto-settled to this VPA upon rider pickup.
                </Text>
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={isSaving}
                activeOpacity={0.85}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Profile Changes</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
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
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 14,
    gap: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  fieldHint: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catChipActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  catChipTextActive: {
    color: '#15803D',
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: '#047A36',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#047A36',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
