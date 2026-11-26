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
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { VendorProfileInfo } from '../../../api-client/types';
import { dusmintApi } from '../../../api-client/client';
import { useVendorAuthStore } from '../../../state/useVendorAuthStore';

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
  { id: 'dairy', label: 'Dairy & Milk' },
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
  const wasVisibleRef = useRef(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(600)).current;

  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [bankOrUpi, setBankOrUpi] = useState('');
  const [address, setAddress] = useState('');
  const [category, setCategory] = useState('groceries');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible && !wasVisibleRef.current) {
      wasVisibleRef.current = true;
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
        setAddress(vendor.address || '');
        setCategory(vendor.category || 'groceries');
        const existingPhoto =
          (vendor.shop_photo_urls && vendor.shop_photo_urls.length > 0
            ? vendor.shop_photo_urls[0]
            : null) ||
          useVendorAuthStore.getState().storePhotoUri ||
          null;
        setPhotoUri(existingPhoto);
        setError('');
      }
    } else if (!visible && wasVisibleRef.current) {
      wasVisibleRef.current = false;
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

  const handlePickPhoto = async (fromCamera: boolean) => {
    try {
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      };

      let result;
      if (fromCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Camera Permission', 'Please allow camera access to take shop photos.');
          return;
        }
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Gallery Permission', 'Please allow media library access to pick photos.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const picked = result.assets[0].uri;
        setPhotoUri(picked);
      }
    } catch {
      Alert.alert('Photo Error', 'Could not open image picker.');
    }
  };

  const handleSave = async () => {
    if (!shopName.trim()) {
      setError('Please enter shop name');
      return;
    }
    if (!ownerName.trim()) {
      setError('Please enter owner name');
      return;
    }
    if (!bankOrUpi.trim()) {
      setError('Please enter payment UPI ID');
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
        address: address.trim() || undefined,
        shopPhotoUrls: photoUri ? [photoUri] : undefined,
      });

      if (photoUri) {
        useVendorAuthStore.getState().setStorePhotoUri(photoUri);
      }

      const updatedVendor: VendorProfileInfo = {
        ...vendor,
        ...(res.vendor || {}),
        name: shopName.trim(),
        owner_name: ownerName.trim(),
        bank_or_upi: bankOrUpi.trim(),
        category,
        address: address.trim() || vendor.address,
        shop_photo_urls: photoUri ? [photoUri] : vendor.shop_photo_urls,
      };

      onProfileUpdated(updatedVendor);
      useVendorAuthStore.getState().setActiveVendor(updatedVendor);
      handleDismiss();
    } catch (err: any) {
      setError(err?.message || 'Network error, could not save profile');
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
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Edit Shop Details</Text>
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
                <Text style={styles.label}>Shop Name</Text>
                <TextInput
                  style={styles.input}
                  value={shopName}
                  onChangeText={(t) => {
                    setShopName(t);
                    setError('');
                  }}
                  placeholder="e.g. Gupta Traders"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* Owner Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Owner Name</Text>
                <TextInput
                  style={styles.input}
                  value={ownerName}
                  onChangeText={(t) => {
                    setOwnerName(t);
                    setError('');
                  }}
                  placeholder="e.g. Sumit Shaw"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* Shop Address */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Shop Address</Text>
                <TextInput
                  style={[styles.input, { minHeight: 60, textAlignVertical: 'top' }]}
                  value={address}
                  onChangeText={(t) => {
                    setAddress(t);
                    setError('');
                  }}
                  placeholder="e.g. Shop 4, Main Market, Kalkaji"
                  placeholderTextColor="#94A3B8"
                  multiline
                />
              </View>

              {/* Category Pills */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Category</Text>
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

              {/* Shop Picture */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Shop Picture</Text>
                {photoUri ? (
                  <View style={styles.photoPreviewBox}>
                    <Image source={{ uri: photoUri }} style={styles.editPhotoPreview} resizeMode="cover" />
                    <View style={styles.photoBtnRow}>
                      <TouchableOpacity
                        style={styles.photoActionBtn}
                        onPress={() => handlePickPhoto(true)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="camera-outline" size={14} color="#0F172A" style={{ marginRight: 4 }} />
                        <Text style={styles.photoActionText}>Take New</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.photoActionBtn}
                        onPress={() => handlePickPhoto(false)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="images" size={14} color="#0F172A" style={{ marginRight: 4 }} />
                        <Text style={styles.photoActionText}>From Gallery</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.noPhotoBox}>
                    <TouchableOpacity
                      style={styles.attachBtn}
                      onPress={() => handlePickPhoto(true)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="camera-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.attachBtnText}>Take Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.attachBtn, styles.attachBtnSecondary]}
                      onPress={() => handlePickPhoto(false)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="images-outline" size={16} color="#0F172A" style={{ marginRight: 6 }} />
                      <Text style={styles.attachBtnSecondaryText}>Gallery</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* UPI ID */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Payment UPI ID</Text>
                <TextInput
                  style={styles.input}
                  value={bankOrUpi}
                  onChangeText={(t) => {
                    setBankOrUpi(t);
                    setError('');
                  }}
                  placeholder="e.g. sumit@okhdfcbank"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                />
                <Text style={styles.fieldHint}>
                  Daily sales payouts will be transferred directly to this UPI account.
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
                  <Text style={styles.saveBtnText}>Save Changes</Text>
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
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 20,
    color: '#0F172A',
    letterSpacing: -0.4,
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
    fontFamily: 'PlusJakartaSans-Medium',
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#334155',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: '#0F172A',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  fieldHint: {
    fontSize: 13,
    color: '#475569',
    marginTop: 4,
    lineHeight: 18,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catChipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  catChipText: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#334155',
  },
  catChipTextActive: {
    color: '#047A36',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  photoPreviewBox: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 8,
  },
  editPhotoPreview: {
    width: '100%',
    height: 120,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
  photoBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  photoActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingVertical: 7,
  },
  photoActionText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#0F172A',
  },
  noPhotoBox: {
    flexDirection: 'row',
    gap: 10,
  },
  attachBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#047A36',
    borderRadius: 12,
    paddingVertical: 12,
  },
  attachBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  attachBtnSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  attachBtnSecondaryText: {
    color: '#0F172A',
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Medium',
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
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Medium',
  },
});
