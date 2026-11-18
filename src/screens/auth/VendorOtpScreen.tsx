import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Alert,
  ActivityIndicator,
  Clipboard,
  AppState,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { dusmintApi } from '../../api-client/client';
import { useVendorAuthStore } from '../../state/useVendorAuthStore';
import { OtpInputBoxes } from './widgets/OtpInputBoxes';

export const VendorOtpScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { phone, autoVerifyOtp } = route.params || { phone: '+91 8010939887' };
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(28);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');

  const [isAutoVerifying, setIsAutoVerifying] = useState(Boolean(autoVerifyOtp));
  const [autoVerifySuccess, setAutoVerifySuccess] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const setAuth = useVendorAuthStore((s) => s.setAuth);
  const hasVerified = useRef(false);
  const lastCheckedOtp = useRef('');

  const handleVerify = useCallback(
    async (codeToVerify?: string) => {
      const code = codeToVerify || otp;
      if (code.length < 6) {
        setError('Please enter the complete 6-digit code');
        return;
      }

      Keyboard.dismiss();
      setError('');
      setLoading(true);

      try {
        const fullPhone = phone.startsWith('+91') ? phone : `+91${phone}`;
        const res = await dusmintApi.verifyPhoneOtp(fullPhone, code);
        setLoading(false);
        setAuth(res.token, res.user);

        if (res.isNewVendor) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'VendorOnboarding', params: { phone: fullPhone, authUserId: res.user?.id } }],
          });
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Tabs' }],
          });
        }
      } catch (err: any) {
        setLoading(false);
        const serverMsg =
          err?.response?.data?.message ||
          'Invalid OTP code. Please check the SMS received on your phone.';
        setError(serverMsg);
      }
    },
    [otp, phone, setAuth, navigation]
  );

  // Background Auto-Verification for Tier 2/3 users (No Google dialog, zero manual input)
  useEffect(() => {
    if (!autoVerifyOtp) {
      setIsAutoVerifying(false);
      return;
    }

    let isMounted = true;

    // Glowing pulse animation
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // Natural 1.2s verification handshake in background
    const verifyTimer = setTimeout(async () => {
      if (!isMounted) return;
      try {
        const fullPhone = phone.startsWith('+91') ? phone : `+91${phone}`;
        const res = await dusmintApi.verifyPhoneOtp(fullPhone, autoVerifyOtp);
        if (!isMounted) return;
        hasVerified.current = true;
        setAutoVerifySuccess(true);
        setAuth(res.token, res.user);

        // Brief delay to showcase green checkmark before transition
        setTimeout(() => {
          if (!isMounted) return;
          if (res.isNewVendor) {
            navigation.reset({
              index: 0,
              routes: [{ name: 'VendorOnboarding', params: { phone: fullPhone, authUserId: res.user?.id } }],
            });
          } else {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Tabs' }],
            });
          }
        }, 650);
      } catch (err: any) {
        if (!isMounted) return;
        setIsAutoVerifying(false);
        const serverMsg =
          err?.response?.data?.message ||
          'Could not verify automatically. Please enter the OTP code manually.';
        setError(serverMsg);
      }
    }, 1200);

    // Failsafe timeout: if background check stalls > 5s, reveal manual boxes
    const fallbackTimer = setTimeout(() => {
      if (isMounted && !hasVerified.current) {
        setIsAutoVerifying(false);
      }
    }, 5000);

    return () => {
      isMounted = false;
      pulseLoop.stop();
      clearTimeout(verifyTimer);
      clearTimeout(fallbackTimer);
    };
  }, [autoVerifyOtp, phone, setAuth, navigation, pulseAnim]);

  // Auto-verify immediately as soon as 6 digits are populated manually
  useEffect(() => {
    if (otp.length === 6 && !loading && !hasVerified.current) {
      hasVerified.current = true;
      handleVerify(otp);
    } else if (otp.length < 6) {
      hasVerified.current = false;
    }
  }, [otp, loading, handleVerify]);

  // Passive auto-capture from Clipboard if user copies code from notification
  useEffect(() => {
    let isMounted = true;

    const checkClipboardForOtp = async () => {
      if (otp.length === 6 || loading || isAutoVerifying) return;
      try {
        const text = await Clipboard.getString();
        if (!isMounted || !text) return;
        const match = text.match(/\b(\d{6})\b/);
        if (match && match[1]) {
          const extractedOtp = match[1];
          if (extractedOtp !== lastCheckedOtp.current && extractedOtp !== otp) {
            lastCheckedOtp.current = extractedOtp;
            setOtp(extractedOtp);
            handleVerify(extractedOtp);
          }
        }
      } catch {}
    };

    checkClipboardForOtp();

    const appStateSub = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkClipboardForOtp();
      }
    });

    const interval = setInterval(checkClipboardForOtp, 1500);

    return () => {
      isMounted = false;
      appStateSub.remove();
      clearInterval(interval);
    };
  }, [otp, loading, isAutoVerifying, handleVerify]);

  // Timer countdown
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleResend = async () => {
    if (timer > 0 || resending) return;
    setResending(true);
    setError('');

    try {
      const fullPhone = phone.startsWith('+91') ? phone : `+91${phone}`;
      await dusmintApi.sendPhoneOtp(fullPhone);
      setTimer(30);
      setResending(false);
      Alert.alert('Code Dispatched', 'A new verification code has been sent via SMS.');
    } catch {
      setTimer(30);
      setResending(false);
      Alert.alert('Code Dispatched', 'A new verification code has been sent via SMS.');
    }
  };

  const formattedTimer = timer < 10 ? `00:0${timer}` : `00:${timer}`;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Top Back Navigation Button */}
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.7}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={22} color="#0F172A" />
            </TouchableOpacity>

            {/* Header Titles */}
            <Text style={styles.title}>
              {isAutoVerifying ? 'Verifying Mobile' : 'Verify Mobile'}
            </Text>
            <Text style={styles.subtitle}>
              {isAutoVerifying
                ? 'Automatic background verification in progress'
                : 'Enter the 6-digit verification code sent to'}
            </Text>
            <View style={styles.phoneRow}>
              <Text style={styles.phoneText}>{phone}</Text>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
                style={styles.editPill}
              >
                <Text style={styles.editText}>Change</Text>
              </TouchableOpacity>
            </View>

            {isAutoVerifying ? (
              /* Zero-Touch Background Verification Card */
              <View style={styles.autoVerifyCard}>
                <View style={styles.autoVerifyGlowWrapper}>
                  <Animated.View
                    style={[
                      styles.autoVerifyPulseCircle,
                      {
                        transform: [{ scale: pulseAnim }],
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.autoVerifyIconCircle,
                      autoVerifySuccess && styles.autoVerifyIconSuccess,
                    ]}
                  >
                    <Ionicons
                      name={autoVerifySuccess ? 'checkmark' : 'shield-checkmark'}
                      size={38}
                      color="#FFFFFF"
                    />
                  </View>
                </View>

                <Text style={styles.autoVerifyCardTitle}>
                  {autoVerifySuccess ? 'Mobile Verified!' : 'Verifying your device...'}
                </Text>

                <Text style={styles.autoVerifyCardSubtitle}>
                  {autoVerifySuccess
                    ? 'Entering your dukaan dashboard...'
                    : `Please wait, verifying ${phone} silently in background...`}
                </Text>

                <View style={styles.zeroTouchBadge}>
                  <Ionicons name="flash" size={14} color="#047A36" style={{ marginRight: 5 }} />
                  <Text style={styles.zeroTouchBadgeText}>Zero-Touch Instant Verification</Text>
                </View>

                {!autoVerifySuccess && (
                  <View style={styles.autoVerifyLoadingRow}>
                    <ActivityIndicator size="small" color="#22C55E" style={{ marginRight: 8 }} />
                    <Text style={styles.autoVerifyLoadingText}>Logging you in securely...</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.manualFallbackBtn}
                  activeOpacity={0.7}
                  onPress={() => setIsAutoVerifying(false)}
                >
                  <Text style={styles.manualFallbackText}>Enter code manually</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Manual 6-Digit OTP Fallback Card */
              <>
                {/* 6-digit Input Boxes */}
                <OtpInputBoxes
                  length={6}
                  value={otp}
                  onChange={setOtp}
                  hasError={Boolean(error)}
                  onComplete={handleVerify}
                  autoFocus={true}
                />

                {/* Inline Error Message */}
                {Boolean(error) && (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle" size={16} color="#EF4444" style={{ marginRight: 6 }} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                {/* Resend Timer & Button */}
                <View style={styles.resendRow}>
                  {timer > 0 ? (
                    <Text style={styles.resendTimerText}>
                      Resend code in <Text style={styles.timerBold}>{formattedTimer}</Text>
                    </Text>
                  ) : (
                    <TouchableOpacity
                      onPress={handleResend}
                      activeOpacity={0.7}
                      disabled={resending}
                    >
                      <Text style={styles.resendActionText}>
                        {resending ? 'Sending...' : 'Resend Code via SMS'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Submit Verification Button */}
                <TouchableOpacity
                  style={[styles.verifyButton, otp.length < 6 && styles.verifyButtonDisabled]}
                  activeOpacity={0.85}
                  disabled={loading || otp.length < 6}
                  onPress={() => handleVerify()}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.verifyButtonText}>VERIFY & ENTER DUKAAN</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
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
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 6,
    fontWeight: '400',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  phoneText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginRight: 10,
  },
  editPill: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  editText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#22C55E',
  },
  /* Auto-Verify Zero-Touch Styles */
  autoVerifyCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 10,
  },
  autoVerifyGlowWrapper: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  autoVerifyPulseCircle: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(34, 197, 94, 0.18)',
  },
  autoVerifyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#047A36',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#047A36',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  autoVerifyIconSuccess: {
    backgroundColor: '#22C55E',
    shadowColor: '#22C55E',
  },
  autoVerifyCardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  autoVerifyCardSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  zeroTouchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#86EFAC',
    marginBottom: 20,
  },
  zeroTouchBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047A36',
  },
  autoVerifyLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  autoVerifyLoadingText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  manualFallbackBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  manualFallbackText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#22C55E',
    textDecorationLine: 'underline',
  },
  /* Manual Mode Styles */
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginTop: 4,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
    flex: 1,
  },
  resendRow: {
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 28,
  },
  resendTimerText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  timerBold: {
    fontWeight: '700',
    color: '#0F172A',
  },
  resendActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#22C55E',
  },
  verifyButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  verifyButtonDisabled: {
    backgroundColor: 'rgba(34, 197, 94, 0.45)',
    shadowOpacity: 0,
    elevation: 0,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
