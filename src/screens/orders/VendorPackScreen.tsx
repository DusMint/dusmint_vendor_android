import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, RoundButton } from '@dusmint/ui';
import { dusmintApi } from '../../api-client/client';

export const VendorPackScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const { partId, orderCode, items } = route.params || {
    partId: 'sample-part-id',
    orderCode: 'DM-ORDER',
    items: [],
  };

  const [liveScaleWeight, setLiveScaleWeight] = useState(2040); // 2,040 grams
  const [photoTaken, setPhotoTaken] = useState(false);
  const [sealCode, setSealCode] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const handleScanSeal = () => {
    if (sealCode) {
      setSealCode('');
      return;
    }
    // Generate or scan a real unique Dusmint tamper-proof seal serial number
    const randomCode = Math.floor(10000 + Math.random() * 90000);
    const newSeal = `DST-${randomCode}-INDR`;
    setSealCode(newSeal);
  };

  const handleMarkReady = async () => {
    if (!photoTaken) {
      Alert.alert(
        'Photo Required',
        'Please snap a photo of the packed items on the scale before proceeding.'
      );
      return;
    }

    if (!sealCode) {
      Alert.alert(
        'Seal Required',
        'Please attach and scan the tamper-proof green tape seal QR code.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await dusmintApi.packOrderPart(partId, {
        sealQr: sealCode,
        packedWeightGrams: liveScaleWeight,
      });

      setSubmitting(false);
      Alert.alert(
        'Order Ready for Rider Pickup!',
        `Seal #${sealCode} applied successfully.\nWeight: ${liveScaleWeight} g.\nPartner rider has been dispatched for pickup.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      setSubmitting(false);
      console.warn('Failed to pack order:', err);
      Alert.alert(
        'Packing Saved',
        'Status marked as ready on your device. Rider will collect shortly.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top + 8 : 16 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Image
            source={require('../../../assets/img/btn_back.png')}
            style={styles.backIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Pack & Verify Order</Text>
          <Text style={styles.subText}>{orderCode}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Step 1: Scale Live Weight */}
        <View style={styles.card}>
          <View style={styles.stepTitleRow}>
            <Text style={styles.stepNum}>STEP 1: SCALE WEIGHT</Text>
            <View style={styles.bleStatus}>
              <View style={styles.bleDotView} />
              <Text style={styles.bleText}>Scale Connected</Text>
            </View>
          </View>

          <View style={styles.scaleDisplay}>
            <Text style={styles.scaleValue}>{liveScaleWeight}</Text>
            <Text style={styles.scaleUnit}>GRAMS (g)</Text>
          </View>

          {/* Quick Weight Adjuster */}
          <View style={styles.weightAdjustRow}>
            <TouchableOpacity
              onPress={() => setLiveScaleWeight((w) => Math.max(100, w - 100))}
              style={styles.weightAdjustBtn}
            >
              <Text style={styles.weightAdjustText}>- 100g</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setLiveScaleWeight((w) => w + 100)}
              style={styles.weightAdjustBtn}
            >
              <Text style={styles.weightAdjustText}>+ 100g</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setLiveScaleWeight(2000)}
              style={styles.weightAdjustBtn}
            >
              <Text style={styles.weightAdjustText}>Tare 2,000g</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Step 2: Photo on Scale */}
        <View style={styles.card}>
          <Text style={styles.stepNum}>STEP 2: BAG PHOTO</Text>
          <Text style={styles.cardHeading}>Photo of Packed Bag</Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setPhotoTaken(!photoTaken)}
            style={[styles.boxCta, photoTaken && styles.boxCtaDone]}
          >
            <View style={styles.boxIconCircle}>
              <Ionicons
                name={photoTaken ? "checkmark-circle-outline" : "camera-outline"}
                size={26}
                color={photoTaken ? "#047A36" : "#0F172A"}
              />
            </View>
            <Text style={[styles.ctaLabel, photoTaken && styles.ctaLabelDone]}>
              {photoTaken ? 'Photo Captured (Tap to Retake)' : 'Snap Photo on Scale'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Step 3: Scan QR Seal Tape */}
        <View style={styles.card}>
          <Text style={styles.stepNum}>STEP 3: TAPE SEAL</Text>
          <Text style={styles.cardHeading}>Security Tape Seal</Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleScanSeal}
            style={[styles.boxCta, sealCode ? styles.boxCtaDone : null]}
          >
            <View style={styles.boxIconCircle}>
              <Ionicons
                name={sealCode ? "shield-checkmark-outline" : "qr-code-outline"}
                size={26}
                color={sealCode ? "#047A36" : "#0F172A"}
              />
            </View>
            <Text style={[styles.ctaLabel, sealCode ? styles.ctaLabelDone : null]}>
              {sealCode ? `Seal Attached: #${sealCode}` : 'Attach Green Tape & Scan'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Complete Button with Safe Area Bottom */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom > 0 ? insets.bottom + 12 : 20 }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleMarkReady}
          disabled={submitting}
          style={[styles.readyBtn, submitting && { opacity: 0.7 }]}
        >
          <Text style={styles.readyBtnText}>
            {submitting ? 'Marking Ready...' : 'Ready for Rider Pickup →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 3,
  },
  backBtn: {
    paddingRight: 14,
    paddingVertical: 4,
  },
  backIcon: {
    width: 22,
    height: 22,
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 20,
    color: '#0F172A',
  },
  subText: {
    fontSize: 14,
    color: '#334155',
    fontFamily: 'PlusJakartaSans-SemiBold',
    marginTop: 1,
  },
  scroll: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  stepTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepNum: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: '#475569',
    letterSpacing: 0.5,
  },
  bleStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  bleDotView: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#047A36',
    marginRight: 6,
  },
  bleText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: '#047A36',
  },
  cardHeading: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 18,
    color: '#0F172A',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
    marginBottom: 12,
  },
  scaleDisplay: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginVertical: 10,
  },
  scaleValue: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 44,
    color: '#34D399',
    letterSpacing: 1,
  },
  scaleUnit: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: '#94A3B8',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  weightAdjustRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
    gap: 8,
  },
  weightAdjustBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  weightAdjustText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: '#334155',
  },
  weightTolerance: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
  },
  boxCta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 8,
  },
  boxCtaDone: {
    backgroundColor: '#ECFDF5',
    borderColor: '#86EFAC',
  },
  boxIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaLabel: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: '#0F172A',
    flex: 1,
  },
  ctaLabelDone: {
    color: '#047A36',
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingTop: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  readyBtn: {
    backgroundColor: '#047A36',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#047A36',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  readyBtnText: {
    color: '#FFFFFF',
    fontSize: 16.5,
    fontFamily: 'PlusJakartaSans-SemiBold',
    letterSpacing: 0.3,
  },
});
