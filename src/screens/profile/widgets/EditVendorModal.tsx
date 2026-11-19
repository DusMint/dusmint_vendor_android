import React, { useState, useEffect } from 'react';
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

  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [bankOrUpi, setBankOrUpi] = useState('');
  const [category, setCategory] = useState('groceries');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible && vendor) {
      setShopName(vendor.name || '');
      setOwnerName(vendor.owner_name || '');
      setBankOrUpi(vendor.bank_or_upi || '');
      setCategory(vendor.category || 'groceries');
      setError('');
    }
  }, [visible, vendor]);

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
        onClose();
      } else {
        setError('Failed to update dukaan profile. Please try again.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error while saving profile');
    } finally {
      setIsSaving(false);
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
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.sheetContainer}
            >
              <View style={[styles.sheet, { paddingBottom: bottomInset }]}>
                {/* Header */}
                <View style={styles.header}>
                  <Text style={styles.title}>Edit Dukaan Profile</Text>
                  <TouchableOpacity
                    onPress={onClose}
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
              </View>
            </KeyboardAvoidingView>
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
  sheetContainer: {
    width: '100%',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: '85%',
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
