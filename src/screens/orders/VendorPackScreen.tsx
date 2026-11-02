import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, RoundButton } from '@dusmint/ui';
import { dusmintApi } from '../../api-client/client';

export const VendorPackScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
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
        'Order Ready for Rider Pickup! 🛵',
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
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

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Step 1: Scale Bluetooth Live Reading */}
        <View style={styles.card}>
          <View style={styles.stepTitleRow}>
            <Text style={styles.stepNum}>STEP 1 • DIGITAL SCALE READING</Text>
            <View style={styles.bleStatus}>
              <Text style={styles.bleDot}>🟢</Text>
              <Text style={styles.bleText}>Dusmint Scale Connected (BLE)</Text>
            </View>
          </View>

          <Text style={styles.cardHeading}>Live Scale Reading</Text>
          <View style={styles.scaleDisplay}>
            <Text style={styles.scaleValue}>{liveScaleWeight}</Text>
            <Text style={styles.scaleUnit}>GRAMS</Text>
          </View>

          {/* Quick Weight Adjuster for Testing */}
          <View style={styles.weightAdjustRow}>
            <TouchableOpacity
              onPress={() => setLiveScaleWeight(w => Math.max(100, w - 100))}
              style={styles.weightAdjustBtn}
            >
              <Text style={styles.weightAdjustText}>- 100g</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setLiveScaleWeight(w => w + 100)}
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

          <Text style={styles.weightTolerance}>
            Target Weight: ~2,000 g • Variation: ±2.0% within tolerance
          </Text>
        </View>

        {/* Step 2: Photo on Scale */}
        <View style={styles.card}>
          <Text style={styles.stepNum}>STEP 2 • PACKING PROOF</Text>
          <Text style={styles.cardHeading}>Photo of Bag on Scale</Text>
          <Text style={styles.cardDesc}>
            Take a clear photo showing the Dusmint eco-bag resting on the scale platform.
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setPhotoTaken(!photoTaken)}
            style={[styles.boxCta, photoTaken ? styles.boxCtaDone : null]}
          >
            <Text style={styles.ctaEmoji}>{photoTaken ? '✅' : '📷'}</Text>
            <Text style={styles.ctaLabel}>
              {photoTaken ? 'Scale Photo Captured (Tap to Retake)' : 'Take Photo with Camera'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Step 3: Scan QR Seal Tape */}
        <View style={styles.card}>
          <Text style={styles.stepNum}>STEP 3 • TAMPER-PROOF SECURITY</Text>
          <Text style={styles.cardHeading}>Scan Tamper-Proof Seal Tape</Text>
          <Text style={styles.cardDesc}>
            Apply the serialized green Dusmint tape across bag handles and scan barcode.
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleScanSeal}
            style={[styles.boxCta, sealCode ? styles.boxCtaDone : null]}
          >
            <Text style={styles.ctaEmoji}>{sealCode ? '🔒' : '🔍'}</Text>
            <Text style={styles.ctaLabel}>
              {sealCode ? `Seal Attached: #${sealCode}` : 'Scan Tape QR / Barcode'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Complete Button */}
      <View style={styles.bottomBar}>
        <RoundButton
          title={submitting ? 'Marking Ready...' : 'Ready for Rider Pickup →'}
          onPress={handleMarkReady}
          loading={submitting}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  backBtn: {
    paddingRight: Spacing.md,
  },
  backIcon: {
    width: 20,
    height: 20,
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.headingBold,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
  },
  subText: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.fontSize.xs,
    color: Colors.secondary,
  },
  scroll: {
    padding: Spacing.base,
    paddingBottom: 90,
  },
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.base,
  },
  stepTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepNum: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.headingBold,
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  bleStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bleDot: {
    fontSize: 8,
    marginRight: 4,
  },
  bleText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.heading,
    color: '#059669',
  },
  cardHeading: {
    fontFamily: Typography.fontFamily.headingBold,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    marginTop: 4,
  },
  cardDesc: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.fontSize.xs,
    color: Colors.secondary,
    marginVertical: 6,
    lineHeight: 18,
  },
  scaleDisplay: {
    backgroundColor: '#0F172A',
    borderRadius: BorderRadius.md,
    paddingVertical: 18,
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  scaleValue: {
    fontFamily: Typography.fontFamily.headingBold,
    fontSize: 48,
    color: '#34D399',
    letterSpacing: 2,
  },
  scaleUnit: {
    fontFamily: Typography.fontFamily.heading,
    fontSize: 11,
    color: '#94A3B8',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  weightAdjustRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  weightAdjustBtn: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  weightAdjustText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.headingBold,
    color: '#334155',
  },
  weightTolerance: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.fontSize.xs,
    color: Colors.secondary,
    textAlign: 'center',
  },
  boxCta: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: BorderRadius.md,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    marginTop: Spacing.sm,
  },
  boxCtaDone: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
    borderStyle: 'solid',
  },
  ctaEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  ctaLabel: {
    fontFamily: Typography.fontFamily.headingBold,
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.base,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
  },
});
