import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  Modal,
  TouchableWithoutFeedback,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient as SvgGradient, Stop, Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { VendorProfileInfo } from '../../../api-client/types';
import { useVendorAuthStore } from '../../../state/useVendorAuthStore';

interface Props {
  vendor: VendorProfileInfo | null;
  phone: string;
  selectedLanguage: 'en' | 'hi';
  onToggleLanguage: () => void;
  onHelpPress: () => void;
  onLogoutPress: () => void;
  onEditProfilePress: () => void;
  onSwitchStore?: () => void;
}

export const VendorProfileHeader: React.FC<Props> = ({
  vendor,
  phone,
  selectedLanguage,
  onToggleLanguage,
  onHelpPress,
  onLogoutPress,
  onEditProfilePress,
  onSwitchStore,
}) => {
  const insets = useSafeAreaInsets();
  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : insets.top;
  const [menuVisible, setMenuVisible] = useState(false);
  const [isPhotoViewerOpen, setIsPhotoViewerOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  const localStorePhoto = useVendorAuthStore((s) => s.storePhotoUri);
  const activeVendorFromStore = useVendorAuthStore((s) => s.activeVendor);

  // Check if store has a valid uploaded photo (from backend or local onboarding cache)
  const photoUrl =
    (vendor?.shop_photo_urls && vendor.shop_photo_urls.length > 0
      ? vendor.shop_photo_urls[0]
      : null) ||
    (activeVendorFromStore?.shop_photo_urls && activeVendorFromStore.shop_photo_urls.length > 0
      ? activeVendorFromStore.shop_photo_urls[0]
      : null) ||
    localStorePhoto;

  useEffect(() => {
    setImageError(false);
  }, [photoUrl]);

  // Prefer vendor's owner_phone if present, otherwise logged-in phone
  const rawPhone = vendor?.owner_phone || phone;
  const phoneDigits = rawPhone ? rawPhone.replace(/[^0-9]/g, '') : '';
  const cleanPhone = phoneDigits.length >= 10 ? `+91 ${phoneDigits.slice(-10)}` : rawPhone;

  return (
    <View style={[styles.container, { paddingTop: statusBarHeight + 18 }]}>
      {/* Background Gradient */}
      <View style={StyleSheet.absoluteFill}>
        <Svg width="100%" height="100%">
          <Defs>
            <SvgGradient id="vendorProfileGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#E8F5EC" />
              <Stop offset="100%" stopColor="#FFFFFF" />
            </SvgGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#vendorProfileGrad)" rx="0" />
        </Svg>
      </View>

      {/* Top Action Row: Profile Title on Left + Language Pill & Menu on Right */}
      <View style={styles.topRow}>
        <Text style={styles.screenTitle}>Profile</Text>

        <View style={styles.rightActions}>
          {/* Change Language Pill */}
          <TouchableOpacity
            style={styles.langPill}
            onPress={onToggleLanguage}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Change language"
          >
            <Ionicons name="language-outline" size={15} color="#047A36" style={{ marginRight: 5 }} />
            <Text style={styles.langText}>
              {selectedLanguage === 'hi' ? 'Hindi (HI)' : 'English (EN)'}
            </Text>
          </TouchableOpacity>

          {/* 3-Dot Menu Button */}
          <TouchableOpacity
            style={styles.moreButton}
            onPress={() => setMenuVisible(true)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#0F172A" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Vendor Dukaan Details Area with Store Photo Avatar on the Left */}
      <View style={styles.storeCardRow}>
        {/* Profile Picture / Store Avatar on the Left */}
        <TouchableOpacity
          style={styles.avatarWrapper}
          onPress={() => {
            if (photoUrl && !imageError) {
              setIsPhotoViewerOpen(true);
            } else {
              onEditProfilePress();
            }
          }}
          activeOpacity={0.8}
        >
          {photoUrl && !imageError ? (
            <Image
              source={{ uri: photoUrl }}
              style={styles.avatarImg}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="storefront-outline" size={24} color="#047A36" />
              <Text style={styles.placeholderLabel}>Store</Text>
            </View>
          )}

          {/* Zoom badge indicator */}
          {Boolean(photoUrl && !imageError) && (
            <View style={styles.zoomBadge}>
              <Ionicons name="scan-outline" size={10} color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>

        {/* Store Info on the Right (No Edit Badge, No Verified Partner Tag) */}
        <TouchableOpacity
          style={styles.userDetails}
          onPress={onEditProfilePress}
          activeOpacity={0.85}
        >
          <View style={styles.nameRow}>
            <Text style={styles.userName} numberOfLines={1}>
              {vendor?.name || 'My Dukaan'}
            </Text>
          </View>

          <Text style={styles.ownerText} numberOfLines={1}>
            Owner: <Text style={styles.ownerBold}>{vendor?.owner_name || 'Partner'}</Text>
            {Boolean(cleanPhone) && ` • ${cleanPhone}`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Full-Screen Store Photo Preview Modal */}
      <Modal
        visible={isPhotoViewerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsPhotoViewerOpen(false)}
        statusBarTranslucent
      >
        <TouchableWithoutFeedback onPress={() => setIsPhotoViewerOpen(false)}>
          <View style={styles.photoModalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.photoModalContent}>
                {/* Close Button */}
                <TouchableOpacity
                  style={styles.photoCloseBtn}
                  onPress={() => setIsPhotoViewerOpen(false)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>

                {photoUrl ? (
                  <Image
                    source={{ uri: photoUrl }}
                    style={styles.fullPhoto}
                    resizeMode="contain"
                  />
                ) : null}

                <View style={styles.photoCaptionBox}>
                  <Text style={styles.photoShopTitle}>{vendor?.name || 'My Dukaan'}</Text>
                  <Text style={styles.photoSub}>Store Picture</Text>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 3-Dot Popup Menu Modal */}
      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={styles.menuOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.menuPopup, { top: statusBarHeight + 50 }]}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuVisible(false);
                    onEditProfilePress();
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="create-outline" size={18} color="#22C55E" style={{ marginRight: 10 }} />
                  <Text style={[styles.menuItemText, { color: '#22C55E', fontFamily: 'PlusJakartaSans-Medium' }]}>Edit Profile</Text>
                </TouchableOpacity>

                <View style={styles.menuDivider} />

                {onSwitchStore && (
                  <>
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => {
                        setMenuVisible(false);
                        onSwitchStore();
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="swap-horizontal-outline" size={18} color="#0284C7" style={{ marginRight: 10 }} />
                      <Text style={styles.menuItemText}>Switch Dukaan</Text>
                    </TouchableOpacity>
                    <View style={styles.menuDivider} />
                  </>
                )}

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuVisible(false);
                    onHelpPress();
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="headset-outline" size={18} color="#0F172A" style={{ marginRight: 10 }} />
                  <Text style={styles.menuItemText}>Partner Helpline</Text>
                </TouchableOpacity>

                <View style={styles.menuDivider} />

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setMenuVisible(false);
                    onLogoutPress();
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="log-out-outline" size={18} color="#D32F2F" style={{ marginRight: 10 }} />
                  <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#E8F5EC',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 24,
  },
  screenTitle: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 26,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: '#111117',
    letterSpacing: -0.5,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  langText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#0F172A',
  },
  moreButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 14,
  },
  avatarImg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#10B981',
    backgroundColor: '#F1F5F9',
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#DCFCE7',
    borderWidth: 2,
    borderColor: '#86EFAC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderLabel: {
    fontSize: 8,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: '#047A36',
    marginTop: 1,
  },
  zoomBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    backgroundColor: '#047A36',
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: '#0F172A',
    flexShrink: 1,
  },
  editBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  editText: {
    fontSize: 10,
    color: '#15803D',
    fontFamily: 'PlusJakartaSans-SemiBold',
    letterSpacing: 0.5,
  },
  ownerText: {
    fontSize: 14.5,
    color: '#334155',
    marginTop: 4,
  },
  ownerBold: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: '#0F172A',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  verifiedMiniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#86EFAC',
    gap: 4,
  },
  verifiedMiniText: {
    fontSize: 12,
    color: '#047A36',
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  photoModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  photoModalContent: {
    width: '100%',
    alignItems: 'center',
  },
  photoCloseBtn: {
    position: 'absolute',
    top: -50,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  fullPhoto: {
    width: '100%',
    height: 320,
    borderRadius: 20,
    backgroundColor: '#0F172A',
  },
  photoCaptionBox: {
    marginTop: 16,
    alignItems: 'center',
  },
  photoShopTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'PlusJakartaSans-SemiBold',
    letterSpacing: -0.3,
  },
  photoSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 3,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  menuPopup: {
    position: 'absolute',
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 6,
    width: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItemText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: '#0F172A',
  },
  logoutText: {
    fontSize: 15,
    color: '#DC2626',
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
});
