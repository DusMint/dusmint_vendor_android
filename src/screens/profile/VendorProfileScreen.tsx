import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  RefreshControl,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVendorAuthStore } from '../../state/useVendorAuthStore';
import { dusmintApi } from '../../api-client/client';
import { VendorProfileInfo } from '../../api-client/types';

// Widgets
import { VendorProfileHeader } from './widgets/VendorProfileHeader';
import { VendorStatusCard } from './widgets/VendorStatusCard';
import { VendorOptionsCard, VendorOptionItem } from './widgets/VendorOptionsCard';
import { VendorDetailSheet } from './widgets/VendorDetailSheet';
import { VendorAppFooter } from './widgets/VendorAppFooter';
import { EditVendorModal } from './widgets/EditVendorModal';

interface Props {
  navigation: any;
}

export const VendorProfileScreen: React.FC<Props> = ({ navigation }) => {
  const user = useVendorAuthStore((s) => s.user);
  const persistedVendor = useVendorAuthStore((s) => s.activeVendor);
  const setActiveVendorInStore = useVendorAuthStore((s) => s.setActiveVendor);
  const selectedLanguage = (useVendorAuthStore((s) => s.selectedLanguage) as 'en' | 'hi') || 'en';
  const setLanguage = useVendorAuthStore((s) => s.setLanguage);
  const logout = useVendorAuthStore((s) => s.logout);

  const [vendors, setVendors] = useState<VendorProfileInfo[]>([]);
  const [activeVendor, setActiveVendor] = useState<VendorProfileInfo | null>(persistedVendor);
  const [isOpen, setIsOpen] = useState(persistedVendor?.is_open ?? true);
  const [refreshing, setRefreshing] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  // Detail Sheet State (opened when menu option is pressed)
  const [activeDetailOptionId, setActiveDetailOptionId] = useState<string | null>(null);

  // Floating Toast Animation
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastAnim = useRef(new Animated.Value(40)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    Animated.parallel([
      Animated.spring(toastAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 9,
      }),
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(toastAnim, {
          toValue: 40,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setToastMessage(null);
      });
    }, 2400);
  }, [toastAnim, toastOpacity]);

  // Load real vendor details strictly for the currently logged-in merchant!
  const loadVendorProfile = useCallback(async () => {
    try {
      const currentPhone = user?.phone || activeVendor?.owner_phone || persistedVendor?.owner_phone || '';
      const userPhoneClean = currentPhone.replace(/\D/g, '').slice(-10);

      // 1. Try getMyVendorProfile directly first (queries Supabase with full columns)
      let matched: VendorProfileInfo | null = null;
      if (userPhoneClean) {
        matched = await dusmintApi.getMyVendorProfile(userPhoneClean);
      }

      // 2. Also load vendor list
      const list = await dusmintApi.getVendorList();
      setVendors(list || []);

      // 3. Fallback match in list if not directly fetched
      if (!matched && userPhoneClean && list && list.length > 0) {
        matched = list.find((v) => {
          const vPhoneClean = (v.owner_phone || '').replace(/\D/g, '').slice(-10);
          return vPhoneClean === userPhoneClean;
        }) || null;
      }

      // 4. Match by auth_user_id
      if (!matched && user?.id && list && list.length > 0) {
        matched = list.find((v) => v.auth_user_id === user.id) || null;
      }

      // 5. Merge matched data with local state so no rich fields (address/photo) are wiped
      if (matched) {
        const base = useVendorAuthStore.getState().activeVendor || persistedVendor;
        const merged: VendorProfileInfo = {
          ...base,
          ...matched,
          address: matched.address || base?.address,
          bank_or_upi: matched.bank_or_upi || base?.bank_or_upi,
          shop_photo_urls:
            matched.shop_photo_urls && matched.shop_photo_urls.length > 0
              ? matched.shop_photo_urls
              : base?.shop_photo_urls,
          is_open: base?.is_open !== undefined ? base.is_open : matched.is_open,
        };
        setActiveVendor(merged);
        setActiveVendorInStore(merged);
        if (merged.shop_photo_urls && merged.shop_photo_urls.length > 0) {
          useVendorAuthStore.getState().setStorePhotoUri(merged.shop_photo_urls[0]);
        }
        if (merged.is_open !== undefined) {
          setIsOpen(merged.is_open);
        }
      } else if (persistedVendor) {
        // Keep persisted vendor if server list doesn't match
        setActiveVendor(persistedVendor);
        if (persistedVendor.is_open !== undefined) {
          setIsOpen(persistedVendor.is_open);
        }
      }
    } catch (err) {
      console.warn('Failed to load vendor profile:', err);
    } finally {
      setRefreshing(false);
    }
  }, [user?.phone, user?.id, persistedVendor, setActiveVendorInStore]);

  useEffect(() => {
    loadVendorProfile();
  }, [loadVendorProfile]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadVendorProfile();
  }, [loadVendorProfile]);

  // Toggle Live Store Status
  const handleToggleStatus = async (newVal: boolean) => {
    setIsOpen(newVal);
    const cur = activeVendor || persistedVendor || useVendorAuthStore.getState().activeVendor;
    if (cur) {
      const updated: VendorProfileInfo = { ...cur, is_open: newVal };
      setActiveVendor(updated);
      setActiveVendorInStore(updated);
    }
    showToast(newVal ? 'Store is Online & Accepting Orders' : 'Store is Closed');

    if (!cur?.id) return;

    try {
      setIsTogglingStatus(true);
      await dusmintApi.toggleVendorStatus(cur.id, newVal);
    } catch (err: any) {
      console.warn('Backend toggle vendor status warning:', err);
    } finally {
      setIsTogglingStatus(false);
    }
  };

  // Switch Dukaan (if partner has multiple outlets)
  const handleSwitchStore = () => {
    if (vendors.length <= 1) {
      Alert.alert('Single Dukaan Registered', 'You currently manage 1 active vendor outlet.');
      return;
    }
    const options = vendors.map((v) => ({
      text: v.name,
      onPress: () => {
        setActiveVendor(v);
        setIsOpen(v.is_open ?? true);
        showToast(`Switched to ${v.name}`);
      },
    }));
    Alert.alert('Switch Active Dukaan', 'Select which store outlet you are managing:', [
      ...options,
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // Toggle App Language
  const handleToggleLanguage = () => {
    const nextLang = selectedLanguage === 'hi' ? 'en' : 'hi';
    setLanguage(nextLang);
    showToast(nextLang === 'hi' ? 'Language switched to Hindi' : 'Language switched to English');
  };

  // Log Out Confirmation
  const handleLogout = () => {
    Alert.alert(
      'Log Out from Terminal',
      'Are you sure you want to log out of DusMint Partner Terminal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            logout();
            if (navigation?.reset) {
              navigation.reset({
                index: 0,
                routes: [{ name: 'VendorLogin' }],
              });
            }
          },
        },
      ]
    );
  };

  // Clean, straightforward menu items in plain English
  const optionsData: VendorOptionItem[] = useMemo(() => {
    return [
      {
        id: 'opt-shop',
        label: 'Shop Details',
        iconName: 'storefront-outline',
      },
      {
        id: 'opt-location',
        label: 'Shop Address',
        iconName: 'location-outline',
      },
      {
        id: 'opt-settlement',
        label: 'Payment UPI Account',
        iconName: 'card-outline',
      },
      {
        id: 'opt-slots',
        label: 'Delivery Slot Timings',
        iconName: 'time-outline',
      },
      {
        id: 'opt-alarm',
        label: 'Order Alert Ringtone',
        iconName: 'notifications-outline',
      },
      {
        id: 'opt-lang',
        label: 'App Language',
        iconName: 'globe-outline',
      },
      {
        id: 'opt-support',
        label: 'Help & Support',
        iconName: 'headset-outline',
      },
      {
        id: 'opt-terms',
        label: 'Partner Terms & Policy',
        iconName: 'shield-checkmark-outline',
      },
    ];
  }, []);

  // When any menu item is pressed, open its dedicated information sheet/page!
  const handleOptionPress = (option: VendorOptionItem) => {
    setActiveDetailOptionId(option.id);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#047A36']}
          />
        }
      >
        {/* 1. Header with Gradient, Dukaan info, Language Pill & 3-dot Menu */}
        <VendorProfileHeader
          vendor={activeVendor}
          phone={user?.phone || activeVendor?.owner_phone || ''}
          selectedLanguage={selectedLanguage}
          onToggleLanguage={handleToggleLanguage}
          onHelpPress={() => setActiveDetailOptionId('opt-support')}
          onLogoutPress={handleLogout}
          onEditProfilePress={() => setIsEditModalOpen(true)}
          onSwitchStore={vendors.length > 1 ? handleSwitchStore : undefined}
        />

        {/* 2. Live Store Online / Offline Toggle Card */}
        <VendorStatusCard
          isOpen={isOpen}
          onToggle={handleToggleStatus}
          isLoading={isTogglingStatus}
        />

        {/* 3. Minimalist Options List Card (Clean, no colorful badges) */}
        <VendorOptionsCard
          options={optionsData}
          onOptionPress={handleOptionPress}
        />

        {/* 4. App Version Footer */}
        <VendorAppFooter version="1.0.0" build="42" />

        {/* Bottom padding to clear floating tab bar */}
        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Information Detail Sheet (Opens when menu items are clicked) */}
      <VendorDetailSheet
        visible={Boolean(activeDetailOptionId)}
        optionId={activeDetailOptionId}
        vendor={activeVendor}
        selectedLanguage={selectedLanguage}
        onClose={() => setActiveDetailOptionId(null)}
        onOpenEdit={() => setIsEditModalOpen(true)}
        onSetLanguage={(lang) => {
          setLanguage(lang);
        }}
        onShowToast={showToast}
      />

      {/* Edit Dukaan Profile Modal Sheet */}
      <EditVendorModal
        visible={isEditModalOpen}
        vendor={activeVendor}
        onClose={() => setIsEditModalOpen(false)}
        onProfileUpdated={(updated) => {
          setActiveVendor(updated);
          showToast('Dukaan profile updated successfully');
        }}
      />

      {/* Sleek Floating Toast Pill */}
      {toastMessage && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              transform: [{ translateY: toastAnim }],
              opacity: toastOpacity,
            },
          ]}
        >
          <Ionicons name="checkmark-circle" size={18} color="#10B981" style={{ marginRight: 8 }} />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  toastContainer: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: '#1E293B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
