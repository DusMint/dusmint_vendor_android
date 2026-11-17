import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  RefreshControl,
  Vibration,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { dusmintApi } from '../../api-client/client';
import { VendorProfileInfo } from '../../api-client/types';
import { useVendorAuthStore } from '../../state/useVendorAuthStore';

export const VendorProfileScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [vendors, setVendors] = useState<VendorProfileInfo[]>([]);
  const [activeVendor, setActiveVendor] = useState<VendorProfileInfo | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Operational toggles
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [autoAcceptOrders, setAutoAcceptOrders] = useState(true);
  const [loudAlertsEnabled, setLoudAlertsEnabled] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hi'>('en');

  // Load merchant & vendor details
  const loadVendorData = useCallback(async () => {
    try {
      const list = await dusmintApi.getVendorList();
      if (list && list.length > 0) {
        setVendors(list);
        setActiveVendor(list[0]);
        if (list[0].is_open !== undefined) {
          setIsStoreOpen(list[0].is_open);
        }
      } else {
        // Fallback default vendor profile
        setActiveVendor({
          id: 'vnd-indore-54',
          name: 'Mandi Fresh Sabzi & Fruits',
          owner_name: 'Ramesh Sharma',
          owner_phone: '+91 8010939887',
          category: 'Vegetables & Fruits',
          cluster_id: 'Indore Vijay Nagar Cluster',
          is_open: true,
          score: 4.8,
          commission_pct: 8.0,
        });
      }
    } catch {
      setActiveVendor({
        id: 'vnd-indore-54',
        name: 'Mandi Fresh Sabzi & Fruits',
        owner_name: 'Ramesh Sharma',
        owner_phone: '+91 8010939887',
        category: 'Vegetables & Fruits',
        cluster_id: 'Indore Vijay Nagar Cluster',
        is_open: true,
        score: 4.8,
        commission_pct: 8.0,
      });
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadVendorData();
  }, [loadVendorData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadVendorData();
  };

  const handleToggleStore = (val: boolean) => {
    setIsStoreOpen(val);
    Vibration.vibrate(50);
    Alert.alert(
      val ? 'Dukaan is Online' : 'Dukaan is Offline',
      val
        ? 'Your store is now LIVE. Customers can place grocery orders for incoming delivery slots.'
        : 'Your store is now CLOSED. Incoming customer orders are paused.'
    );
  };

  const handleTestChime = () => {
    Vibration.vibrate([0, 400, 150, 400]);
    Alert.alert('🔔 Order Chime Tested', 'Loud Mandi Alarm is active and working at maximum ringer volume.');
  };

  const handleSwitchStore = () => {
    if (vendors.length <= 1) {
      Alert.alert('Single Dukaan Registered', 'You currently manage 1 active vendor outlet in Indore.');
      return;
    }
    const otherVendors = vendors.map((v) => ({
      text: v.name,
      onPress: () => {
        setActiveVendor(v);
        setIsStoreOpen(v.is_open ?? true);
      },
    }));
    Alert.alert('Switch Active Dukaan', 'Select which store outlet you are managing:', [
      ...otherVendors,
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleCallSupport = () => {
    Linking.openURL('tel:18008896468').catch(() => {
      Alert.alert('Partner Helpline', 'DusMint Merchant Helpline: 1800-889-MINT (Toll Free)');
    });
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top + 8 : 16 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Dukaan Profile</Text>
            <Text style={styles.headerSubtitle}>Merchant Operations & Store Settings</Text>
          </View>
          <TouchableOpacity style={styles.helpButton} onPress={handleCallSupport} activeOpacity={0.8}>
            <Ionicons name="headset-outline" size={18} color="#FC6011" />
            <Text style={styles.helpText}>Help</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FC6011']} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Merchant Card */}
        <View style={styles.merchantCard}>
          <View style={styles.storeAvatarBox}>
            <Text style={styles.storeEmoji}>🏪</Text>
            <View style={[styles.onlineDot, { backgroundColor: isStoreOpen ? '#16A34A' : '#EF4444' }]} />
          </View>
          <View style={styles.merchantInfo}>
            <View style={styles.verifiedRow}>
              <Text style={styles.storeName}>{activeVendor?.name || 'Mandi Fresh Sabzi'}</Text>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            </View>
            <Text style={styles.ownerText}>
              Owner: <Text style={styles.boldText}>{activeVendor?.owner_name || 'Ramesh Sharma'}</Text> •{' '}
              {activeVendor?.owner_phone || '+91 8010939887'}
            </Text>
            <View style={styles.metaRow}>
              <View style={styles.scorePill}>
                <Text style={styles.scoreText}>⭐ {activeVendor?.score || 4.8}</Text>
              </View>
              <View style={styles.categoryPill}>
                <Text style={styles.categoryText}>{activeVendor?.category || 'Vegetables & Fruits'}</Text>
              </View>
              <TouchableOpacity onPress={handleSwitchStore} style={styles.switchPill}>
                <Text style={styles.switchPillText}>⇄ Switch</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Live Store Online / Offline Toggle Banner */}
        <View style={[styles.statusBanner, { borderColor: isStoreOpen ? '#BBF7D0' : '#FECACA' }]}>
          <View style={styles.statusBannerLeft}>
            <View style={[styles.statusIconCircle, { backgroundColor: isStoreOpen ? '#DCFCE7' : '#FEE2E2' }]}>
              <MaterialCommunityIcons
                name={isStoreOpen ? 'store-check' : 'store-remove'}
                size={22}
                color={isStoreOpen ? '#16A34A' : '#EF4444'}
              />
            </View>
            <View>
              <Text style={styles.statusTitle}>
                {isStoreOpen ? 'Store is Accepting Orders' : 'Store is Closed'}
              </Text>
              <Text style={styles.statusSub}>
                {isStoreOpen ? 'Active on customer apps • Ready for slots' : 'Paused from incoming order pipeline'}
              </Text>
            </View>
          </View>
          <Switch
            value={isStoreOpen}
            onValueChange={handleToggleStore}
            trackColor={{ false: '#CBD5E1', true: '#FED7AA' }}
            thumbColor={isStoreOpen ? '#FC6011' : '#94A3B8'}
          />
        </View>

        {/* SECTION: Dukaan Operations */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>DUKAAN CONTROLS</Text>
        </View>

        <View style={styles.cardContainer}>
          {/* Auto Accept */}
          <View style={styles.settingRow}>
            <View style={styles.settingTextCol}>
              <Text style={styles.settingLabel}>Auto-Accept New Orders</Text>
              <Text style={styles.settingHint}>Instantly assign to packing without manual tap</Text>
            </View>
            <Switch
              value={autoAcceptOrders}
              onValueChange={setAutoAcceptOrders}
              trackColor={{ false: '#CBD5E1', true: '#FED7AA' }}
              thumbColor={autoAcceptOrders ? '#FC6011' : '#94A3B8'}
            />
          </View>

          <View style={styles.divider} />

          {/* Loud Order Chime */}
          <View style={styles.settingRow}>
            <View style={styles.settingTextCol}>
              <View style={styles.rowInline}>
                <Text style={styles.settingLabel}>Mandi Loud Order Alarm</Text>
                <TouchableOpacity onPress={handleTestChime} style={styles.testBadge}>
                  <Text style={styles.testBadgeText}>Test Chime</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.settingHint}>Plays loud alert chime + vibration even on silent</Text>
            </View>
            <Switch
              value={loudAlertsEnabled}
              onValueChange={setLoudAlertsEnabled}
              trackColor={{ false: '#CBD5E1', true: '#FED7AA' }}
              thumbColor={loudAlertsEnabled ? '#FC6011' : '#94A3B8'}
            />
          </View>

          <View style={styles.divider} />

          {/* Operating Hours */}
          <TouchableOpacity
            style={styles.clickableRow}
            activeOpacity={0.7}
            onPress={() =>
              Alert.alert(
                'Operating Delivery Batches',
                '• Morning Slot: 06:00 AM – 11:00 AM\n• Evening Slot: 04:00 PM – 09:00 PM\n\nCut-off orders close 1 hour before batch delivery window.'
              )
            }
          >
            <View style={styles.settingTextCol}>
              <Text style={styles.settingLabel}>Operating Slot Timings</Text>
              <Text style={styles.settingHint}>Morning (06:00 - 11:00) • Evening (16:00 - 21:00)</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* SECTION: Bank Account & Payouts */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>SETTLEMENT & BANKING</Text>
        </View>

        <View style={styles.cardContainer}>
          <View style={styles.bankingRow}>
            <View style={styles.bankIconCircle}>
              <Ionicons name="card" size={20} color="#16A34A" />
            </View>
            <View style={styles.bankInfoCol}>
              <View style={styles.rowInline}>
                <Text style={styles.bankName}>Direct UPI Payout Account</Text>
                <View style={styles.instantPill}>
                  <Text style={styles.instantPillText}>T+0 Daily</Text>
                </View>
              </View>
              <Text style={styles.vpaText}>ramesh.sharma@okaxis</Text>
              <Text style={styles.bankHint}>Settled automatically on rider delivery completion</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.clickableRow}
            activeOpacity={0.7}
            onPress={() =>
              Alert.alert(
                'Update Payout VPA',
                'To change your bank account or UPI VPA, please contact your DusMint Cluster Manager with passbook proof.'
              )
            }
          >
            <Text style={styles.linkText}>Change UPI Settlement ID</Text>
            <Ionicons name="chevron-forward" size={16} color="#FC6011" />
          </TouchableOpacity>
        </View>

        {/* SECTION: Hardware & Packaging */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>HARDWARE & SCALE SETUP</Text>
        </View>

        <View style={styles.cardContainer}>
          <View style={styles.hardwareRow}>
            <View style={[styles.hwIconBox, { backgroundColor: '#EFF6FF' }]}>
              <MaterialCommunityIcons name="scale" size={20} color="#2563EB" />
            </View>
            <View style={styles.hwInfoCol}>
              <Text style={styles.hwTitle}>Digital Bluetooth Scale</Text>
              <Text style={styles.hwStatusActive}>🟢 Paired (Essae Teraoka BLE-920)</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.hardwareRow}>
            <View style={[styles.hwIconBox, { backgroundColor: '#FDF4FF' }]}>
              <Ionicons name="barcode-outline" size={20} color="#A855F7" />
            </View>
            <View style={styles.hwInfoCol}>
              <Text style={styles.hwTitle}>Tamper-Proof Seal Tape</Text>
              <Text style={styles.hwStatusMuted}>Roll #IND-240 • Approx 180 seals remaining</Text>
            </View>
          </View>
        </View>

        {/* SECTION: Store Compliance */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>LEGAL & COMPLIANCE</Text>
        </View>

        <View style={styles.cardContainer}>
          <View style={styles.complianceRow}>
            <Text style={styles.complianceLabel}>FSSAI License No.</Text>
            <Text style={styles.complianceValue}>11422850000124 (Verified ✓)</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.complianceRow}>
            <Text style={styles.complianceLabel}>Mandi Commission Rate</Text>
            <Text style={styles.complianceValue}>{activeVendor?.commission_pct ?? 8.0}% Flat Tier-1</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.complianceRow}>
            <Text style={styles.complianceLabel}>Assigned Cluster</Text>
            <Text style={styles.complianceValue}>{activeVendor?.cluster_id || 'Vijay Nagar, Indore'}</Text>
          </View>
        </View>

        {/* SECTION: App Preferences & Language */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>APP PREFERENCES</Text>
        </View>

        <View style={styles.cardContainer}>
          <View style={styles.settingRow}>
            <View style={styles.settingTextCol}>
              <Text style={styles.settingLabel}>Language / भाषा</Text>
              <Text style={styles.settingHint}>Choose English or Hindi for order audio and labels</Text>
            </View>
            <View style={styles.langSelector}>
              <TouchableOpacity
                onPress={() => setSelectedLanguage('en')}
                style={[styles.langBtn, selectedLanguage === 'en' && styles.langBtnActive]}
              >
                <Text style={[styles.langBtnText, selectedLanguage === 'en' && styles.langBtnTextActive]}>EN</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSelectedLanguage('hi')}
                style={[styles.langBtn, selectedLanguage === 'hi' && styles.langBtnActive]}
              >
                <Text style={[styles.langBtnText, selectedLanguage === 'hi' && styles.langBtnTextActive]}>हिंदी</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Partner Hotline */}
          <TouchableOpacity style={styles.clickableRow} activeOpacity={0.7} onPress={handleCallSupport}>
            <View style={styles.rowInline}>
              <Ionicons name="call-outline" size={18} color="#FC6011" style={{ marginRight: 8 }} />
              <Text style={styles.settingLabel}>Rider Dispatch & Support Hotline</Text>
            </View>
            <Text style={styles.phoneText}>1800-889-MINT</Text>
          </TouchableOpacity>
        </View>

        {/* App Version & Log Out */}
        <View style={styles.footerContainer}>
          <TouchableOpacity
            style={styles.logoutButton}
            activeOpacity={0.8}
            onPress={() => {
              Alert.alert('Log Out', 'Are you sure you want to log out of DusMint Partner Terminal?', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Log Out',
                  style: 'destructive',
                  onPress: () => {
                    useVendorAuthStore.getState().logout();
                    if (navigation?.reset) {
                      navigation.reset({
                        index: 0,
                        routes: [{ name: 'VendorLogin' }],
                      });
                    }
                  },
                },
              ]);
            }}
          >
            <Ionicons name="log-out-outline" size={18} color="#EF4444" />
            <Text style={styles.logoutText}>Log Out from Terminal</Text>
          </TouchableOpacity>
          <Text style={styles.versionText}>DusMint Vendor Terminal v1.2.0 • Unified Riksho Fleet</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  helpText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FC6011',
    marginLeft: 4,
  },
  scrollContent: {
    padding: 16,
  },
  merchantCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 12,
  },
  storeAvatarBox: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginRight: 14,
  },
  storeEmoji: {
    fontSize: 28,
  },
  onlineDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  merchantInfo: {
    flex: 1,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  storeName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginRight: 6,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16A34A',
    marginLeft: 2,
  },
  ownerText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
  },
  boldText: {
    fontWeight: '700',
    color: '#1E293B',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
    gap: 6,
  },
  scorePill: {
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  scoreText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#854D0E',
  },
  categoryPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  switchPill: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  switchPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FC6011',
  },
  statusBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  statusBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  statusIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  statusSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  sectionHeader: {
    marginBottom: 8,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  settingTextCol: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  settingHint: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  rowInline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  testBadge: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  testBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FC6011',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  clickableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FC6011',
  },
  bankingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bankIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bankInfoCol: {
    flex: 1,
  },
  bankName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  instantPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  instantPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#16A34A',
  },
  vpaText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
    marginTop: 2,
  },
  bankHint: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  hardwareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  hwIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  hwInfoCol: {
    flex: 1,
  },
  hwTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  hwStatusActive: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16A34A',
    marginTop: 2,
  },
  hwStatusMuted: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  complianceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  complianceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  complianceValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  langSelector: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 2,
  },
  langBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  langBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  langBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  langBtnTextActive: {
    color: '#FC6011',
  },
  phoneText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FC6011',
  },
  footerContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EF4444',
    marginLeft: 6,
  },
  versionText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
});
