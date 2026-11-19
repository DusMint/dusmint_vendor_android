import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient as SvgGradient, Stop, Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { VendorProfileInfo } from '../../../api-client/types';

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

  const phoneDigits = phone ? phone.replace(/[^0-9]/g, '') : '';
  const cleanPhone = phoneDigits.length >= 10 ? `+91 ${phoneDigits.slice(-10)}` : phone;

  return (
    <View style={[styles.container, { paddingTop: statusBarHeight + 12 }]}>
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

      {/* Top Action Row */}
      <View style={styles.topRow}>
        <View style={styles.brandBadge}>
          <Text style={styles.brandBadgeIcon}>🏪</Text>
          <Text style={styles.brandBadgeText}>PARTNER TERMINAL</Text>
        </View>

        <View style={styles.rightActions}>
          {/* Change Language Pill */}
          <TouchableOpacity
            style={styles.langPill}
            onPress={onToggleLanguage}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Change language"
          >
            <Ionicons name="language-outline" size={15} color="#22C55E" style={{ marginRight: 5 }} />
            <Text style={styles.langText}>
              {selectedLanguage === 'hi' ? 'हिंदी (HI)' : 'English (EN)'}
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

      {/* Vendor Dukaan Details Area */}
      <TouchableOpacity
        style={styles.userDetails}
        onPress={onEditProfilePress}
        activeOpacity={0.85}
      >
        <View style={styles.nameRow}>
          <Text style={styles.userName} numberOfLines={1}>
            {vendor?.name || 'My Dukaan'}
          </Text>
          <View style={styles.editBadge}>
            <Ionicons name="pencil-sharp" size={10} color="#15803D" style={{ marginRight: 3 }} />
            <Text style={styles.editText}>EDIT</Text>
          </View>
        </View>

        <Text style={styles.ownerText}>
          Owner: <Text style={styles.ownerBold}>{vendor?.owner_name || 'Dukaan Partner'}</Text>
          {Boolean(cleanPhone) && ` • ${cleanPhone}`}
        </Text>

        {/* Badges Row */}
        <View style={styles.metaRow}>
          <View style={styles.verifiedMiniBadge}>
            <Ionicons name="checkmark-circle" size={12} color="#059669" />
            <Text style={styles.verifiedMiniText}>Verified Partner</Text>
          </View>

          <View style={styles.categoryPill}>
            <Text style={styles.categoryText}>
              {vendor?.category ? vendor.category.toUpperCase() : 'GROCERIES'}
            </Text>
          </View>

          <View style={styles.clusterPill}>
            <Ionicons name="location-sharp" size={10} color="#64748B" style={{ marginRight: 2 }} />
            <Text style={styles.clusterText}>
              {vendor?.cluster_city || 'Indore'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

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
                  <Text style={[styles.menuItemText, { color: '#22C55E', fontWeight: '600' }]}>Edit Profile</Text>
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
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#E8F5EC',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  brandBadgeIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  brandBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047A36',
    letterSpacing: 0.6,
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
    fontWeight: '600',
    color: '#0F172A',
  },
  moreButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDetails: {
    paddingHorizontal: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
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
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  ownerText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 4,
  },
  ownerBold: {
    fontWeight: '700',
    color: '#0F172A',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  verifiedMiniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#A7F3D0',
    gap: 3,
  },
  verifiedMiniText: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '600',
  },
  categoryPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  clusterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
  },
  clusterText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
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
    fontSize: 13,
    color: '#111827',
  },
  logoutText: {
    fontSize: 13,
    color: '#D32F2F',
    fontWeight: '600',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
});
