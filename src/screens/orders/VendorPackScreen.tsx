import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, RoundButton, TrustBadge } from '@dusmint/ui';

export const VendorPackScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const [scaleConnected, setScaleConnected] = useState(true);
  const [liveScaleWeight, setLiveScaleWeight] = useState(2040); // 2,040 grams
  const [photoTaken, setPhotoTaken] = useState(false);
  const [sealScanned, setSealScanned] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleMarkReady = () => {
    if (!photoTaken || !sealScanned) {
      Alert.alert(
        'Missing Verification',
        'Please snap a photo of the bag on the scale and scan the tamper-proof seal QR before completing.'
      );
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      Alert.alert(
        'Order Ready for Pickup! 🛵',
        'Partner rider has been dispatched for pickup. Payout will be scheduled upon customer delivery.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Pack & Verify Order</Text>
          <Text style={styles.subText}>ORD-261026-0042</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Step 1: Scale Bluetooth Live Reading */}
        <View style={styles.card}>
          <View style={styles.stepTitleRow}>
            <Text style={styles.stepNum}>STEP 1</Text>
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
          <Text style={styles.weightTolerance}>
            Target: 2,000 g • Variation: +40 g (+2.0% within tolerance)
          </Text>
        </View>

        {/* Step 2: Photo on Scale */}
        <View style={styles.card}>
          <Text style={styles.stepNum}>STEP 2</Text>
          <Text style={styles.cardHeading}>Photo of Bag on Scale</Text>
          <Text style={styles.cardDesc}>
            Take a clear photo showing the bag resting on the scale platform.
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setPhotoTaken(!photoTaken)}
            style={[styles.boxCta, photoTaken ? styles.boxCtaDone : null]}
          >
            <Text style={styles.ctaEmoji}>{photoTaken ? '✅' : '📷'}</Text>
            <Text style={styles.ctaLabel}>
              {photoTaken ? 'Scale Photo Captured' : 'Take Photo with Camera'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Step 3: Scan QR Seal Tape */}
        <View style={styles.card}>
          <Text style={styles.stepNum}>STEP 3</Text>
          <Text style={styles.cardHeading}>Scan Tamper-Proof Seal Tape</Text>
          <Text style={styles.cardDesc}>
            Apply the green Dusmint seal tape to the bag top and scan its QR barcode.
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setSealScanned(!sealScanned)}
            style={[styles.boxCta, sealScanned ? styles.boxCtaDone : null]}
          >
            <Text style={styles.ctaEmoji}>{sealScanned ? '✅' : '🔍'}</Text>
            <Text style={styles.ctaLabel}>
              {sealScanned ? 'Seal Verified (#DST-78923-INDR)' : 'Scan Tape QR Code'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Complete Button */}
      <View style={styles.bottomBar}>
        <RoundButton
          title="Ready for Rider Pickup →"
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
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  backBtn: {
    paddingRight: Spacing.md,
  },
  backArrow: {
    fontSize: 22,
    color: Colors.textPrimary,
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
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  cardDesc: {
    fontFamily: Typography.fontFamily.body,
    fontSize: 11,
    color: Colors.textSecondary,
    marginVertical: 4,
  },
  scaleDisplay: {
    backgroundColor: '#1E293B',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  scaleValue: {
    fontFamily: Typography.fontFamily.headingBold,
    fontSize: 42,
    color: '#4ADE80',
    letterSpacing: 2,
  },
  scaleUnit: {
    fontFamily: Typography.fontFamily.heading,
    fontSize: 10,
    color: '#94A3B8',
    letterSpacing: 1,
  },
  weightTolerance: {
    fontFamily: Typography.fontFamily.body,
    fontSize: 11,
    color: '#059669',
    textAlign: 'center',
  },
  boxCta: {
    height: 72,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.placeholder,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLightGrey,
    marginTop: Spacing.sm,
  },
  boxCtaDone: {
    borderColor: Colors.primary,
    backgroundColor: '#F0FDF4',
    borderStyle: 'solid',
  },
  ctaEmoji: {
    fontSize: 22,
    marginRight: 8,
  },
  ctaLabel: {
    fontFamily: Typography.fontFamily.heading,
    fontSize: Typography.fontSize.xs,
    color: Colors.textPrimary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.cardBackground,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    padding: Spacing.base,
  },
});
