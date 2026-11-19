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
  Vibration,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVendorAuthStore } from '../../state/useVendorAuthStore';
import { dusmintApi } from '../../api-client/client';
import { VendorProfileInfo } from '../../api-client/types';

// Widgets
import { VendorProfileHeader } from './widgets/VendorProfileHeader';
import { VendorStatusCard } from './widgets/VendorStatusCard';
import { VendorPartnerBanner } from './widgets/VendorPartnerBanner';
import { VendorOptionsCard, VendorOptionItem } from './widgets/VendorOptionsCard';
import { VendorAppFooter } from './widgets/VendorAppFooter';
import { EditVendorModal } from './widgets/EditVendorModal';

interface Props {
  navigation: any;
}

export const VendorProfileScreen: React.FC<Props> = ({ navigation }) => {
  const user = useVendorAuthStore((s) => s.user);
  const selectedLanguage = (useVendorAuthStore((s) => s.selectedLanguage) as 'en' | 'hi') || 'en';
  const setLanguage = useVendorAuthStore((s) => s.setLanguage);
  const logout = useVendorAuthStore((s) => s.logout);

  const [vendors, setVendors] = useState<VendorProfileInfo[]>([]);
  const [activeVendor, setActiveVendor] = useState<VendorProfileInfo | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

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

  // Load real vendor details from backend API
  const loadVendorProfile = useCallback(async () => {
    try {
      const list = await dusmintApi.getVendorList();
      if (list && list.length > 0) {
        setVendors(list);
        setActiveVendor((prev) => {
          if (prev) {
            const found = list.find((v) => v.id === prev.id);
            if (found) {
              if (found.is_open !== undefined) setIsOpen(found.is_open);
              return found;
            }
          }
          if (list[0].is_open !== undefined) setIsOpen(list[0].is_open);
          return list[0];
        });
      } else {
        setVendors([]);
        setActiveVendor(null);
      }
    } catch (err) {
      console.warn('Failed to load vendor profile:', err);
    } finally {
      setRefreshing(false);
    }
  }, []);

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
    if (!activeVendor?.id) return;

    try {
      setIsTogglingStatus(true);
      await dusmintApi.toggleVendorStatus(activeVendor.id, newVal);
      setActiveVendor((prev) => (prev ? { ...prev, is_open: newVal } : null));
      showToast(newVal ? 'Dukaan is Online & Accepting Orders' : 'Dukaan is Offline / Closed');
    } catch (err: any) {
      // Revert if failed
      setIsOpen(!newVal);
      Alert.alert('Status Update Failed', err?.message || 'Could not update store status.');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  // Switch Dukaan
  const handleSwitchStore = () => {
    if (vendors.length <= 1) {
      Alert.alert('Single Dukaan Registered', 'You currently manage 1 active vendor outlet in Indore.');
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

  // Partner Helpline
  const handleCallSupport = () => {
    Linking.openURL('tel:18008896468').catch(() => {
      Alert.alert(
        'DusMint Partner Helpline',
        'Toll Free: 1800-889-MINT (1800-889-6468)\nEmail: partners@dusmint.com\nWorking Hours: 06:00 AM – 11:00 PM',
        [{ text: 'OK' }]
      );
    });
  };

  // Toggle App Language
  const handleToggleLanguage = () => {
    const nextLang = selectedLanguage === 'hi' ? 'en' : 'hi';
    setLanguage(nextLang);
    showToast(nextLang === 'hi' ? 'भाषा हिंदी में बदली गई' : 'Language switched to English');
  };

  // Test Chime Sound
  const handleTestChime = () => {
    Vibration.vibrate([0, 400, 150, 400]);
    Alert.alert(
      '🔔 Mandi Loud Order Alarm',
      'Alert chime and vibration pattern tested successfully. Incoming batch orders will trigger this alarm.',
      [{ text: 'OK' }]
    );
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

  // Options Data for ProfileOptionsCard
  const optionsData: VendorOptionItem[] = useMemo(() => {
    const categoryLabel = activeVendor?.category ? activeVendor.category.toUpperCase() : 'GROCERIES';
    const clusterLabel = activeVendor?.cluster_city || 'Indore';
    const upiLabel = activeVendor?.bank_or_upi || 'Setup UPI';

    return [
      {
        id: 'opt-shop',
        label: 'Shop Details & Category',
        iconName: 'storefront-outline',
        badgeText: categoryLabel,
        badgeType: 'green',
      },
      {
        id: 'opt-location',
        label: 'Mandi Location & Cluster',
        iconName: 'location-outline',
        badgeText: clusterLabel,
        badgeType: 'neutral',
      },
      {
        id: 'opt-settlement',
        label: 'Settlement UPI Account',
        iconName: 'card-outline',
        badgeText: upiLabel,
        badgeType: 'green',
      },
      {
        id: 'opt-slots',
        label: 'Delivery Slot Timings',
        iconName: 'time-outline',
        badgeText: '06:00 - 21:00',
        badgeType: 'neutral',
      },
      {
        id: 'opt-alarm',
        label: 'Mandi Loud Order Alarm',
        iconName: 'notifications-outline',
        badgeText: 'Test Sound',
        badgeType: 'orange',
      },
      {
        id: 'opt-lang',
        label: 'Language / भाषा',
        iconName: 'globe-outline',
        badgeText: selectedLanguage === 'hi' ? 'हिंदी (HI)' : 'English (EN)',
        badgeType: 'neutral',
      },
      {
        id: 'opt-support',
        label: 'Partner Support Helpline',
        iconName: 'headset-outline',
        badgeText: '1800-889-MINT',
        badgeType: 'orange',
      },
      {
        id: 'opt-terms',
        label: 'Partner Compliance & Terms',
        iconName: 'shield-checkmark-outline',
        badgeText: 'Verified ✓',
        badgeType: 'green',
      },
    ];
  }, [activeVendor, selectedLanguage]);

  // Handle Option Clicks
  const handleOptionPress = (option: VendorOptionItem) => {
    switch (option.id) {
      case 'opt-shop':
        setIsEditModalOpen(true);
        break;
      case 'opt-location':
        Alert.alert(
          'Mandi Cluster Location',
          `Assigned Cluster: ${activeVendor?.cluster_name || 'Central Mandi Cluster'}\nCity: ${activeVendor?.cluster_city || 'Indore'}\nCoordinates: ${activeVendor?.lat || 22.7196}, ${activeVendor?.lng || 75.8577}\n\nTo update your store location, please contact your DusMint Cluster Manager.`,
          [{ text: 'Got It' }]
        );
        break;
      case 'opt-settlement':
        Alert.alert(
          'Settlement UPI VPA',
          `Current Daily Settlement ID:\n${activeVendor?.bank_or_upi || 'Not configured'}\n\nPayments are settled daily in the T+0 cycle directly via UPI upon rider order pickups.`,
          [
            { text: 'Edit UPI ID', onPress: () => setIsEditModalOpen(true) },
            { text: 'Close', style: 'cancel' },
          ]
        );
        break;
      case 'opt-slots':
        Alert.alert(
          'Operating Delivery Slot Windows',
          '• Morning Batch: 06:00 AM – 11:00 AM\n• Evening Batch: 04:00 PM – 09:00 PM\n\nCut-off orders close 1 hour prior to rider pickup. Please ensure stock is updated before slot start.',
          [{ text: 'OK' }]
        );
        break;
      case 'opt-alarm':
        handleTestChime();
        break;
      case 'opt-lang':
        handleToggleLanguage();
        break;
      case 'opt-support':
        handleCallSupport();
        break;
      case 'opt-terms':
        Alert.alert(
          'Partner Compliance & License',
          `• DusMint Merchant Terms: Tier-1 Mandi Partner (${activeVendor?.commission_pct ?? 8.0}% Commission)\n• FSSAI Status: Verified Partner Dukaan\n• Weight Tolerance: ±5% standard digital scale check\n• 100% Tamper-proof QR sealing compliant.`,
          [{ text: 'Understood' }]
        );
        break;
      default:
        break;
    }
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
          onHelpPress={handleCallSupport}
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

        {/* 3. DusMint Partner Club Banner */}
        <VendorPartnerBanner
          commissionPct={activeVendor?.commission_pct ?? 8.0}
        />

        {/* 4. Minimalist Options List Card */}
        <VendorOptionsCard
          options={optionsData}
          onOptionPress={handleOptionPress}
        />

        {/* 5. App Version Footer */}
        <VendorAppFooter
          version="1.0.0"
          build="42"
          cluster={activeVendor?.cluster_name || 'Indore Mandi Cluster'}
        />

        {/* Bottom padding to clear tab bar */}
        <View style={{ height: 40 }} />
      </ScrollView>

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
