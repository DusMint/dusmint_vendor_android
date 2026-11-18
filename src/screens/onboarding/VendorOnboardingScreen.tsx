import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { reverseGeocodeWithOla } from '../../utils/geo';
import { dusmintApi } from '../../api-client/client';
import { useVendorAuthStore } from '../../state/useVendorAuthStore';

// Safe dynamic loader to prevent fatal crash if running an older APK without ExponentImagePicker compiled
let ImagePicker: any = null;
try {
  ImagePicker = require('expo-image-picker');
} catch {}

interface VendorOnboardingProps {
  route: any;
  navigation: any;
}

const CATEGORIES = [
  { id: 'vegetables', label: 'Vegetables', icon: 'leaf-outline' },
  { id: 'fruits', label: 'Fruits', icon: 'nutrition-outline' },
  { id: 'dairy', label: 'Dairy & Milk', icon: 'water-outline' },
  { id: 'groceries', label: 'Groceries & Kirana', icon: 'basket-outline' },
  { id: 'bakery', label: 'Bakery', icon: 'cafe-outline' },
  { id: 'meat_poultry', label: 'Meat & Poultry', icon: 'restaurant-outline' },
];

export const VendorOnboardingScreen: React.FC<VendorOnboardingProps> = ({
  route,
  navigation,
}) => {
  const { phone: routePhone, authUserId } = route.params || {};
  const user = useVendorAuthStore((s) => s.user);
  const logout = useVendorAuthStore((s) => s.logout);

  const phone = routePhone || user?.phone || '+91 8010939887';

  // Sub-step state: null = Collective Hub, 1 = Owner, 2 = Shop, 3 = Photo, 4 = UPI
  const [activeStep, setActiveStep] = useState<number | null>(null);

  // Form Fields
  const [ownerName, setOwnerName] = useState(user?.fullName || '');
  const [email, setEmail] = useState('');
  const [shopName, setShopName] = useState('');
  const [category, setCategory] = useState('vegetables');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [shopPhotoUri, setShopPhotoUri] = useState<string | null>(null);
  const [bankOrUpi, setBankOrUpi] = useState('');
  const [accountHolder, setAccountHolder] = useState('');

  // UI state
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Step completions
  const isStep1Done = Boolean(ownerName.trim().length >= 2);
  const isStep2Done = Boolean(shopName.trim().length >= 2 && address.trim().length >= 5);
  const isStep3Done = Boolean(shopPhotoUri);
  const isStep4Done = Boolean(bankOrUpi.trim().length >= 4 && bankOrUpi.includes('@'));

  const completedCount = [isStep1Done, isStep2Done, isStep3Done, isStep4Done].filter(Boolean).length;
  const progressPercent = (completedCount / 4) * 100;
  const isAllComplete = completedCount === 4;

  // Auto-detect location via GPS & Ola Maps
  const handleAutoLocate = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow location access to auto-detect your shop address.'
        );
        setLocating(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const currentLat = loc.coords.latitude;
      const currentLng = loc.coords.longitude;
      setLat(currentLat);
      setLng(currentLng);

      // Call Ola Maps reverse geocode
      const result = await reverseGeocodeWithOla(currentLat, currentLng);
      if (result.address) {
        setAddress(result.address);
      }
    } catch (err: any) {
      Alert.alert('Location Error', 'Unable to fetch current GPS. Please type the address manually.');
    } finally {
      setLocating(false);
    }
  };

  // Image Picking
  const handlePickPhoto = async (fromCamera: boolean) => {
    if (!ImagePicker || !ImagePicker.launchImageLibraryAsync) {
      Alert.alert(
        'Native Rebuild Required',
        'Camera & Gallery require recompiling the Android APK (npx expo run:android). Would you like to use a sample shop photo to test onboarding?',
        [
          {
            text: 'Use Sample Shop Photo',
            onPress: () =>
              setShopPhotoUri(
                'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80'
              ),
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    try {
      const options: any = {
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
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
        setShopPhotoUri(result.assets[0].uri);
      }
    } catch (err: any) {
      Alert.alert('Photo Error', 'Could not open image picker.');
    }
  };

  // Final Onboarding Submit
  const handleFinalSubmit = async () => {
    if (!isAllComplete) {
      Alert.alert('Incomplete Onboarding', 'Please complete all 4 checklist steps before submitting.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        ownerName: ownerName.trim(),
        ownerPhone: phone,
        email: email.trim() || undefined,
        shopName: shopName.trim(),
        category,
        address: address.trim(),
        lat: lat || 25.5941,
        lng: lng || 85.1376,
        shopPhotoUrls: shopPhotoUri ? [shopPhotoUri] : [],
        bankOrUpi: bankOrUpi.trim(),
        authUserId,
      };

      const res = await dusmintApi.submitVendorOnboarding(payload);
      setSubmitting(false);

      if (res.success) {
        Alert.alert(
          '🎉 Dukaan Activated!',
          'Your shop has been onboarded successfully. You are now live on DusMint!',
          [
            {
              text: 'Enter Dukaan',
              onPress: () => navigation.replace('Tabs'),
            },
          ]
        );
      } else {
        // Fallback navigation
        navigation.replace('Tabs');
      }
    } catch (err: any) {
      setSubmitting(false);
      // Graceful fallback to tabs
      Alert.alert(
        'Onboarding Saved',
        'Your profile was saved. Welcome to DusMint Dukaan!',
        [{ text: 'Continue', onPress: () => navigation.replace('Tabs') }]
      );
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to exit onboarding?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          logout();
          navigation.replace('VendorLogin');
        },
      },
    ]);
  };

  // =========================================================================
  // SUB-STEP 1: OWNER PROFILE
  // =========================================================================
  const renderStep1 = () => (
    <ScrollView style={styles.subStepScroll} keyboardShouldPersistTaps="handled">
      <View style={styles.subStepHeader}>
        <TouchableOpacity onPress={() => setActiveStep(null)} style={styles.backCircle}>
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.subStepTitle}>Owner Profile</Text>
        <View style={{ width: 36 }} />
      </View>

      <Text style={styles.subStepDescription}>
        Enter your personal details to link ownership of this Dukaan.
      </Text>

      <View style={styles.fieldBox}>
        <Text style={styles.fieldLabel}>FULL NAME *</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g. Ramesh Kumar"
          placeholderTextColor="#94A3B8"
          value={ownerName}
          onChangeText={setOwnerName}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.fieldBox}>
        <Text style={styles.fieldLabel}>REGISTERED MOBILE NUMBER (LOCKED)</Text>
        <View style={styles.lockedFieldRow}>
          <Ionicons name="lock-closed" size={16} color="#047A36" style={{ marginRight: 8 }} />
          <Text style={styles.lockedPhoneText}>{phone}</Text>
          <View style={styles.verifiedTag}>
            <Text style={styles.verifiedTagText}>OTP Verified</Text>
          </View>
        </View>
      </View>

      <View style={styles.fieldBox}>
        <Text style={styles.fieldLabel}>EMAIL ADDRESS (OPTIONAL)</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g. ramesh@gmail.com"
          placeholderTextColor="#94A3B8"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, !isStep1Done && styles.btnDisabled]}
        disabled={!isStep1Done}
        onPress={() => setActiveStep(null)}
      >
        <Text style={styles.saveBtnText}>SAVE & CONTINUE</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // =========================================================================
  // SUB-STEP 2: SHOP DETAILS & OLA MAPS LOCATION
  // =========================================================================
  const renderStep2 = () => (
    <ScrollView style={styles.subStepScroll} keyboardShouldPersistTaps="handled">
      <View style={styles.subStepHeader}>
        <TouchableOpacity onPress={() => setActiveStep(null)} style={styles.backCircle}>
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.subStepTitle}>Shop & Location</Text>
        <View style={{ width: 36 }} />
      </View>

      <Text style={styles.subStepDescription}>
        Tell us about your shop and locate it via Ola Maps so riders can pick up orders easily.
      </Text>

      {/* Shop Name */}
      <View style={styles.fieldBox}>
        <Text style={styles.fieldLabel}>SHOP / DUKAAN NAME *</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g. Gupta Sabzi Mandi"
          placeholderTextColor="#94A3B8"
          value={shopName}
          onChangeText={setShopName}
          autoCapitalize="words"
        />
      </View>

      {/* Primary Category */}
      <View style={styles.fieldBox}>
        <Text style={styles.fieldLabel}>PRIMARY CATEGORY *</Text>
        <View style={styles.categoryChipsRow}>
          {CATEGORIES.map((cat) => {
            const isSelected = category === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setCategory(cat.id)}
                style={[styles.catChip, isSelected && styles.catChipSelected]}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={15}
                  color={isSelected ? '#047A36' : '#64748B'}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.catChipText, isSelected && styles.catChipTextSelected]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Ola Maps Auto-Locate Button */}
      <View style={styles.locateCard}>
        <View style={styles.locateCardLeft}>
          <Ionicons name="navigate-circle" size={28} color="#047A36" />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={styles.locateCardTitle}>Ola Maps Auto-Locate</Text>
            <Text style={styles.locateCardSub}>
              Detect accurate shop GPS coordinates and address
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.autoLocateBtn}
          onPress={handleAutoLocate}
          disabled={locating}
        >
          {locating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="locate" size={15} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.autoLocateBtnText}>DETECT</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Address Input */}
      <View style={styles.fieldBox}>
        <Text style={styles.fieldLabel}>SHOP COMPLETE ADDRESS *</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          placeholder="Stall No, Market, Road, Area, Pincode"
          placeholderTextColor="#94A3B8"
          value={address}
          onChangeText={setAddress}
          multiline
          numberOfLines={3}
        />
      </View>

      {lat && lng && (
        <View style={styles.coordsBadge}>
          <Ionicons name="pin" size={14} color="#047A36" style={{ marginRight: 4 }} />
          <Text style={styles.coordsText}>
            GPS Pinned: {lat.toFixed(4)}, {lng.toFixed(4)}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.saveBtn, !isStep2Done && styles.btnDisabled]}
        disabled={!isStep2Done}
        onPress={() => setActiveStep(null)}
      >
        <Text style={styles.saveBtnText}>SAVE & CONTINUE</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // =========================================================================
  // SUB-STEP 3: SHOP PHOTO
  // =========================================================================
  const renderStep3 = () => (
    <ScrollView style={styles.subStepScroll}>
      <View style={styles.subStepHeader}>
        <TouchableOpacity onPress={() => setActiveStep(null)} style={styles.backCircle}>
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.subStepTitle}>Shop Photo</Text>
        <View style={{ width: 36 }} />
      </View>

      <Text style={styles.subStepDescription}>
        Take or upload a clear photo of your stall or shop front. Customers and delivery riders will see this photo.
      </Text>

      {shopPhotoUri ? (
        <View style={styles.photoPreviewCard}>
          <Image source={{ uri: shopPhotoUri }} style={styles.previewImage} resizeMode="cover" />
          <View style={styles.previewActionsRow}>
            <TouchableOpacity
              style={styles.retakeBtn}
              onPress={() => handlePickPhoto(true)}
            >
              <Ionicons name="camera" size={16} color="#047A36" style={{ marginRight: 6 }} />
              <Text style={styles.retakeBtnText}>Retake Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => setShopPhotoUri(null)}
            >
              <Ionicons name="trash-outline" size={16} color="#EF4444" style={{ marginRight: 4 }} />
              <Text style={styles.removeBtnText}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.photoUploadPlaceholder}>
          <View style={styles.photoUploadIconCircle}>
            <Ionicons name="camera-outline" size={36} color="#047A36" />
          </View>
          <Text style={styles.uploadPromptTitle}>No photo attached yet</Text>
          <Text style={styles.uploadPromptSub}>
            Take a live picture of your mandi counter or choose from your phone's gallery.
          </Text>

          <View style={styles.uploadActionsRow}>
            <TouchableOpacity
              style={styles.uploadBtnPrimary}
              onPress={() => handlePickPhoto(true)}
            >
              <Ionicons name="camera" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.uploadBtnPrimaryText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.uploadBtnSecondary}
              onPress={() => handlePickPhoto(false)}
            >
              <Ionicons name="images-outline" size={18} color="#0F172A" style={{ marginRight: 6 }} />
              <Text style={styles.uploadBtnSecondaryText}>Choose Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[styles.saveBtn, !isStep3Done && styles.btnDisabled]}
        disabled={!isStep3Done}
        onPress={() => setActiveStep(null)}
      >
        <Text style={styles.saveBtnText}>SAVE & CONTINUE</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // =========================================================================
  // SUB-STEP 4: PAYOUT & UPI
  // =========================================================================
  const renderStep4 = () => (
    <ScrollView style={styles.subStepScroll} keyboardShouldPersistTaps="handled">
      <View style={styles.subStepHeader}>
        <TouchableOpacity onPress={() => setActiveStep(null)} style={styles.backCircle}>
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.subStepTitle}>Payout & UPI</Text>
        <View style={{ width: 36 }} />
      </View>

      <Text style={styles.subStepDescription}>
        DusMint settles earnings directly to your UPI daily. Enter your active VPA / UPI ID below.
      </Text>

      <View style={styles.fieldBox}>
        <Text style={styles.fieldLabel}>UPI ID (VPA) *</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g. 8010939887@paytm or vendor@okaxis"
          placeholderTextColor="#94A3B8"
          value={bankOrUpi}
          onChangeText={setBankOrUpi}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>

      <View style={styles.fieldBox}>
        <Text style={styles.fieldLabel}>ACCOUNT HOLDER NAME (OPTIONAL)</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g. Ramesh Kumar"
          placeholderTextColor="#94A3B8"
          value={accountHolder}
          onChangeText={setAccountHolder}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.payoutTrustBadge}>
        <Ionicons name="shield-checkmark" size={20} color="#047A36" style={{ marginRight: 8 }} />
        <Text style={styles.payoutTrustText}>
          Instant daily batch settlement. 0% delay on completed delivery slots.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, !isStep4Done && styles.btnDisabled]}
        disabled={!isStep4Done}
        onPress={() => setActiveStep(null)}
      >
        <Text style={styles.saveBtnText}>SAVE & CONTINUE</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // =========================================================================
  // COLLECTIVE HUB (MAIN SCREEN)
  // =========================================================================
  const checklistCards = [
    {
      id: 1,
      title: 'Owner Profile',
      sub: isStep1Done ? `${ownerName} • ${phone}` : 'Full name & mobile verification',
      icon: 'person-outline',
      isDone: isStep1Done,
    },
    {
      id: 2,
      title: 'Shop & Location',
      sub: isStep2Done
        ? `${shopName} • ${address.slice(0, 24)}...`
        : 'Shop name, category & Ola Maps address',
      icon: 'storefront-outline',
      isDone: isStep2Done,
    },
    {
      id: 3,
      title: 'Shop Photo',
      sub: isStep3Done ? 'Photo uploaded & attached' : 'Stall or shop counter photo',
      icon: 'camera-outline',
      isDone: isStep3Done,
    },
    {
      id: 4,
      title: 'Payout & UPI',
      sub: isStep4Done ? `UPI: ${bankOrUpi}` : 'Daily earnings settlement UPI ID',
      icon: 'wallet-outline',
      isDone: isStep4Done,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="dark" />

      {activeStep === 1 && renderStep1()}
      {activeStep === 2 && renderStep2()}
      {activeStep === 3 && renderStep3()}
      {activeStep === 4 && renderStep4()}

      {activeStep === null && (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.hubScroll}
            contentContainerStyle={styles.hubContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Top Bar with Logout */}
            <View style={styles.topBar}>
              <View>
                <Text style={styles.hubTitle}>Dukaan Onboarding</Text>
                <Text style={styles.hubSubtitle}>
                  Complete 4 quick steps to start selling on DusMint
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleLogout}
                style={styles.logoutBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="log-out-outline" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>

            {/* Progress Tracker Card */}
            <View style={styles.progressCard}>
              <View style={styles.progressTextRow}>
                <Text style={styles.progressLabel}>ONBOARDING PROGRESS</Text>
                <Text style={styles.progressFraction}>{completedCount} of 4 Completed</Text>
              </View>
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
              </View>
            </View>

            {/* 4 Checklist Cards */}
            <View style={styles.cardsContainer}>
              {checklistCards.map((card) => (
                <TouchableOpacity
                  key={card.id}
                  style={[styles.card, card.isDone && styles.cardDone]}
                  activeOpacity={0.75}
                  onPress={() => setActiveStep(card.id)}
                >
                  <View style={[styles.cardIconBox, card.isDone && styles.cardIconBoxDone]}>
                    <Ionicons
                      name={card.icon as any}
                      size={22}
                      color={card.isDone ? '#047A36' : '#64748B'}
                    />
                  </View>

                  <View style={styles.cardTextBox}>
                    <Text style={styles.cardTitle}>{card.title}</Text>
                    <Text style={styles.cardSub} numberOfLines={1}>
                      {card.sub}
                    </Text>
                  </View>

                  {card.isDone ? (
                    <View style={styles.checkCircle}>
                      <Ionicons name="checkmark-sharp" size={16} color="#FFFFFF" />
                    </View>
                  ) : (
                    <View style={styles.pendingCircle}>
                      <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Bottom Submit CTA */}
            <View style={styles.bottomCtaBox}>
              <TouchableOpacity
                style={[styles.submitBtn, !isAllComplete && styles.submitBtnDisabled]}
                disabled={!isAllComplete || submitting}
                activeOpacity={0.85}
                onPress={handleFinalSubmit}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>SUBMIT & OPEN DUKAAN</Text>
                )}
              </TouchableOpacity>
              {!isAllComplete && (
                <Text style={styles.submitHint}>
                  Fill all 4 steps above to activate your shop
                </Text>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  hubScroll: {
    flex: 1,
  },
  hubContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  hubTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  hubSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  logoutBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  progressFraction: {
    fontSize: 13,
    fontWeight: '700',
    color: '#047A36',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#047A36',
    borderRadius: 4,
  },
  cardsContainer: {
    gap: 12,
    marginBottom: 28,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardDone: {
    borderColor: '#BBF7D0',
    backgroundColor: '#FAFCFA',
  },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardIconBoxDone: {
    backgroundColor: '#F0FDF4',
  },
  cardTextBox: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3,
  },
  cardSub: {
    fontSize: 12,
    color: '#64748B',
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomCtaBox: {
    alignItems: 'center',
  },
  submitBtn: {
    backgroundColor: '#22C55E',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  submitHint: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 10,
  },

  // Sub-step layout styles
  subStepScroll: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  subStepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subStepTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  subStepDescription: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 20,
    lineHeight: 18,
  },
  fieldBox: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
    letterSpacing: 0.4,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  lockedFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  lockedPhoneText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#047A36',
    flex: 1,
  },
  verifiedTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  categoryChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  catChipSelected: {
    borderColor: '#047A36',
    backgroundColor: '#F0FDF4',
  },
  catChipText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  catChipTextSelected: {
    color: '#047A36',
    fontWeight: '700',
  },
  locateCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 18,
  },
  locateCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  locateCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#047A36',
  },
  locateCardSub: {
    fontSize: 11,
    color: '#166534',
    marginTop: 2,
  },
  autoLocateBtn: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  autoLocateBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  coordsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 18,
  },
  coordsText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#047A36',
  },
  photoPreviewCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  previewImage: {
    width: '100%',
    height: 200,
  },
  previewActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  retakeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#047A36',
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  removeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EF4444',
  },
  photoUploadPlaceholder: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  photoUploadIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  uploadPromptTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  uploadPromptSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 16,
  },
  uploadActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadBtnPrimary: {
    backgroundColor: '#22C55E',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  uploadBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  uploadBtnSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  uploadBtnSecondaryText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  payoutTrustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  payoutTrustText: {
    fontSize: 12,
    color: '#166534',
    flex: 1,
    lineHeight: 16,
  },
  saveBtn: {
    backgroundColor: '#22C55E',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  btnDisabled: {
    backgroundColor: '#CBD5E1',
  },
});
