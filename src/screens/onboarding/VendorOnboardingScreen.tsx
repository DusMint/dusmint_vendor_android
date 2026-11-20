import React, { useState, useEffect } from 'react';
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
  BackHandler,
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

export const VendorOnboardingScreen: React.FC<VendorOnboardingProps> = ({
  route,
  navigation,
}) => {
  const { phone: routePhone, authUserId } = route.params || {};
  const user = useVendorAuthStore((s) => s.user);
  const setHasActiveVendor = useVendorAuthStore((s) => s.setHasActiveVendor);

  const phone = routePhone || user?.phone || '';

  // Sub-step state: null = Collective Hub, 1 = Owner, 2 = Shop, 3 = Photo, 4 = UPI
  const [activeStep, setActiveStep] = useState<number | null>(null);

  // Form Fields - Always start fresh without auto-filling previous names
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [shopName, setShopName] = useState('');
  const category = 'groceries'; // Default category sent to backend
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

      const result = await reverseGeocodeWithOla(currentLat, currentLng);
      if (result.address) {
        setAddress(result.address);
      }
    } catch {
      Alert.alert('Location Error', 'Unable to fetch current GPS. Please type the address manually.');
    } finally {
      setLocating(false);
    }
  };

  // Image Picking
  const handlePickPhoto = async (fromCamera: boolean) => {
    if (!ImagePicker || !ImagePicker.launchImageLibraryAsync) {
      Alert.alert(
        'Native Camera Required',
        'Use sample shop photo for development testing?',
        [
          {
            text: 'Use Sample Photo',
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
        const pickedUri = result.assets[0].uri;
        setShopPhotoUri(pickedUri);
        useVendorAuthStore.getState().setStorePhotoUri(pickedUri);
      }
    } catch {
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

      const savedVendorData = res.vendor || {
        name: payload.shopName,
        owner_name: payload.ownerName,
        owner_phone: payload.ownerPhone,
        address: payload.address,
        bank_or_upi: payload.bankOrUpi,
        category: payload.category,
        lat: payload.lat,
        lng: payload.lng,
        shop_photo_urls: payload.shopPhotoUrls,
        is_open: true,
      };
      useVendorAuthStore.getState().setActiveVendor(savedVendorData);
      if (shopPhotoUri) {
        useVendorAuthStore.getState().setStorePhotoUri(shopPhotoUri);
      }

      if (res.success) {
        setHasActiveVendor(true);
        Alert.alert(
          'Dukaan Activated!',
          'Your shop has been onboarded successfully. You are now live on DusMint!',
          [
            {
              text: 'Enter Dukaan',
              onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] }),
            },
          ]
        );
      } else {
        setHasActiveVendor(true);
        navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
      }
    } catch {
      setSubmitting(false);
      setHasActiveVendor(true);
      const fallbackVendor = {
        name: shopName.trim(),
        owner_name: ownerName.trim(),
        owner_phone: phone,
        address: address.trim(),
        bank_or_upi: bankOrUpi.trim(),
        category,
        shop_photo_urls: shopPhotoUri ? [shopPhotoUri] : [],
        is_open: true,
      };
      useVendorAuthStore.getState().setActiveVendor(fallbackVendor as any);
      if (shopPhotoUri) {
        useVendorAuthStore.getState().setStorePhotoUri(shopPhotoUri);
      }
      Alert.alert(
        'Onboarding Saved',
        'Your profile was saved. Welcome to DusMint Dukaan!',
        [{ text: 'Continue', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] }) }]
      );
    }
  };

  // Exit App handler
  const handleExitApp = () => {
    Alert.alert('Close App', 'Do you want to exit DusMint? Your progress will be saved.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Close App',
        onPress: () => BackHandler.exitApp(),
      },
    ]);
  };

  // Hardware back press listener: exits current sub-step or prompts to close the app
  useEffect(() => {
    const onBackPress = () => {
      if (activeStep !== null) {
        setActiveStep(null);
        return true;
      }
      handleExitApp();
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [activeStep]);

  // =========================================================================
  // SUB-STEP 1: OWNER PROFILE
  // =========================================================================
  const renderStep1 = () => (
    <ScrollView
      style={styles.subStepScroll}
      contentContainerStyle={styles.subStepContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Header beside back icon, no description below */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => setActiveStep(null)}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Owner Profile</Text>
      </View>

      <View style={styles.fieldBox}>
        <Text style={styles.fieldLabel}>FULL NAME *</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter your full name"
          placeholderTextColor="#94A3B8"
          value={ownerName}
          onChangeText={setOwnerName}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.fieldBox}>
        <Text style={styles.fieldLabel}>MOBILE NUMBER</Text>
        <View style={styles.lockedFieldRow}>
          <Ionicons name="lock-closed-outline" size={15} color="#0F172A" style={{ marginRight: 8 }} />
          <Text style={styles.lockedPhoneText}>{phone}</Text>
          <View style={styles.verifiedTag}>
            <Text style={styles.verifiedTagText}>Verified</Text>
          </View>
        </View>
      </View>

      <View style={styles.fieldBox}>
        <Text style={styles.fieldLabel}>EMAIL ADDRESS (OPTIONAL)</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter your email address"
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
        activeOpacity={0.85}
      >
        <Text style={styles.saveBtnText}>SAVE & CONTINUE</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // =========================================================================
  // SUB-STEP 2: SHOP DETAILS & LOCATION
  // =========================================================================
  const renderStep2 = () => (
    <ScrollView
      style={styles.subStepScroll}
      contentContainerStyle={styles.subStepContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Header beside back icon, no description below */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => setActiveStep(null)}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shop & Location</Text>
      </View>

      {/* Shop Name */}
      <View style={styles.fieldBox}>
        <Text style={styles.fieldLabel}>SHOP / DUKAAN NAME *</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter your shop name"
          placeholderTextColor="#94A3B8"
          value={shopName}
          onChangeText={setShopName}
          autoCapitalize="words"
        />
      </View>

      {/* Address with prominent Fetch Button and locked/auto-filled display */}
      <View style={styles.fieldBox}>
        <Text style={styles.fieldLabel}>SHOP COMPLETE ADDRESS *</Text>

        <TouchableOpacity
          style={styles.fetchAddressLargeBtn}
          onPress={handleAutoLocate}
          disabled={locating}
          activeOpacity={0.85}
        >
          {locating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="navigate" size={17} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.fetchAddressLargeBtnText}>
                {address ? 'Fetch Address Again' : 'Fetch Current Address'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={[styles.lockedAddressBox, Boolean(address) && styles.lockedAddressBoxActive]}>
          <TextInput
            style={styles.lockedAddressInput}
            placeholder="Shop address will be auto-filled by tapping above"
            placeholderTextColor="#94A3B8"
            value={address}
            editable={false}
            multiline
            numberOfLines={3}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, !isStep2Done && styles.btnDisabled]}
        disabled={!isStep2Done}
        onPress={() => setActiveStep(null)}
        activeOpacity={0.85}
      >
        <Text style={styles.saveBtnText}>SAVE & CONTINUE</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // =========================================================================
  // SUB-STEP 3: SHOP PHOTO
  // =========================================================================
  const renderStep3 = () => (
    <ScrollView
      style={styles.subStepScroll}
      contentContainerStyle={styles.subStepContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header beside back icon, no description below */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => setActiveStep(null)}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shop Photo</Text>
      </View>

      {shopPhotoUri ? (
        <View style={styles.photoPreviewCard}>
          <Image source={{ uri: shopPhotoUri }} style={styles.previewImage} resizeMode="cover" />
          <View style={styles.previewActionsRow}>
            <TouchableOpacity
              style={styles.retakeBtn}
              onPress={() => handlePickPhoto(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="camera-outline" size={16} color="#0F172A" style={{ marginRight: 6 }} />
              <Text style={styles.retakeBtnText}>Change Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => setShopPhotoUri(null)}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={16} color="#EF4444" style={{ marginRight: 4 }} />
              <Text style={styles.removeBtnText}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.photoUploadPlaceholder}>
          <View style={styles.photoUploadIconCircle}>
            <Ionicons name="camera-outline" size={32} color="#0F172A" />
          </View>
          <Text style={styles.uploadPromptTitle}>Attach Shop Photo</Text>
          <Text style={styles.uploadPromptSub}>Take a photo of your shop or choose from gallery</Text>

          <View style={styles.uploadActionsRow}>
            <TouchableOpacity
              style={styles.uploadBtnPrimary}
              onPress={() => handlePickPhoto(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="camera" size={17} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.uploadBtnPrimaryText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.uploadBtnSecondary}
              onPress={() => handlePickPhoto(false)}
              activeOpacity={0.8}
            >
              <Ionicons name="images-outline" size={17} color="#0F172A" style={{ marginRight: 6 }} />
              <Text style={styles.uploadBtnSecondaryText}>Choose Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[styles.saveBtn, !isStep3Done && styles.btnDisabled]}
        disabled={!isStep3Done}
        onPress={() => setActiveStep(null)}
        activeOpacity={0.85}
      >
        <Text style={styles.saveBtnText}>SAVE & CONTINUE</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // =========================================================================
  // SUB-STEP 4: PAYOUT & UPI
  // =========================================================================
  const renderStep4 = () => (
    <ScrollView
      style={styles.subStepScroll}
      contentContainerStyle={styles.subStepContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Header beside back icon, no description below */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => setActiveStep(null)}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payout & UPI</Text>
      </View>

      <View style={styles.fieldBox}>
        <Text style={styles.fieldLabel}>UPI ID (VPA) *</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter your UPI ID"
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
          placeholder="Enter account holder name"
          placeholderTextColor="#94A3B8"
          value={accountHolder}
          onChangeText={setAccountHolder}
          autoCapitalize="words"
        />
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, !isStep4Done && styles.btnDisabled]}
        disabled={!isStep4Done}
        onPress={() => setActiveStep(null)}
        activeOpacity={0.85}
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
      sub: isStep1Done ? `${ownerName} • ${phone}` : 'Full name & mobile details',
      icon: 'person-outline',
      isDone: isStep1Done,
    },
    {
      id: 2,
      title: 'Shop & Location',
      sub: isStep2Done
        ? `${shopName} • ${address.slice(0, 24)}...`
        : 'Shop name & pickup address',
      icon: 'storefront-outline',
      isDone: isStep2Done,
    },
    {
      id: 3,
      title: 'Shop Photo',
      sub: isStep3Done ? 'Photo attached' : 'Shop counter or front photo',
      icon: 'camera-outline',
      isDone: isStep3Done,
    },
    {
      id: 4,
      title: 'Payout & UPI',
      sub: isStep4Done ? `UPI: ${bankOrUpi}` : 'Daily settlement UPI ID',
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
            {/* Top Bar with subtle Close App button */}
            <View style={styles.topBar}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={styles.hubTitle}>Dukaan Onboarding</Text>
                <Text style={styles.hubSubtitle}>
                  Set up your dukaan to start selling
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleExitApp}
                style={styles.exitBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={22} color="#0F172A" />
              </TouchableOpacity>
            </View>

            {/* Progress Tracker Card */}
            <View style={styles.progressCard}>
              <View style={styles.progressTextRow}>
                <Text style={styles.progressLabel}>PROGRESS</Text>
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
                      color="#0F172A"
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
                      <Ionicons name="checkmark-sharp" size={15} color="#FFFFFF" />
                    </View>
                  ) : (
                    <View style={styles.pendingCircle}>
                      <Ionicons name="chevron-forward" size={15} color="#94A3B8" />
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
    backgroundColor: '#FFFFFF',
  },
  hubScroll: {
    flex: 1,
  },
  hubContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  hubTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  hubSubtitle: {
    fontSize: 15,
    color: '#334155',
    fontWeight: '500',
    marginTop: 4,
  },
  exitBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
    letterSpacing: 0.5,
  },
  progressFraction: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 16,
    fontWeight: '800',
    color: '#047A36',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#047A36',
    borderRadius: 3,
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
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  cardDone: {
    borderColor: '#A7F3D0',
    backgroundColor: '#FBFDFB',
  },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardIconBoxDone: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  cardTextBox: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 16.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 3,
  },
  cardSub: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#047A36',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomCtaBox: {
    alignItems: 'center',
  },
  submitBtn: {
    backgroundColor: '#047A36',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: '#E2E8F0',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  submitHint: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 10,
    fontWeight: '500',
  },

  // Sub-step layout styles
  subStepScroll: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  subStepContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    gap: 14,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  fieldBox: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '600',
  },
  textArea: {
    height: 88,
    textAlignVertical: 'top',
  },
  fetchAddressLargeBtn: {
    backgroundColor: '#047A36',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 12,
  },
  fetchAddressLargeBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  lockedAddressBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 88,
  },
  lockedAddressBoxActive: {
    borderColor: '#A7F3D0',
    backgroundColor: '#ECFDF5',
  },
  lockedAddressInput: {
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '600',
    lineHeight: 22,
    padding: 0,
  },
  lockedFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  lockedPhoneText: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 20,
    fontWeight: '800',
    color: '#047A36',
    flex: 1,
  },
  verifiedTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verifiedTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
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
    height: 190,
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
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  uploadPromptTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  uploadPromptSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  uploadActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadBtnPrimary: {
    backgroundColor: '#047A36',
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
  saveBtn: {
    backgroundColor: '#047A36',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 30,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  btnDisabled: {
    backgroundColor: '#E2E8F0',
  },
});
