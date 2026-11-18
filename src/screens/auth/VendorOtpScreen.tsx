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

  // Background auto-verification (straight to the point, no popups)
  useEffect(() => {
    if (!autoVerifyOtp) {
      setIsAutoVerifying(false);
      return;
    }

    let isMounted = true;

    const verifyTimer = setTimeout(async () => {
      if (!isMounted) return;
      try {
        const fullPhone = phone.startsWith('+91') ? phone : `+91${phone}`;
        const res = await dusmintApi.verifyPhoneOtp(fullPhone, autoVerifyOtp);
        if (!isMounted) return;
        hasVerified.current = true;
        setAutoVerifySuccess(true);
        setAuth(res.token, res.user);

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
        }, 500);
      } catch (err: any) {
        if (!isMounted) return;
        setIsAutoVerifying(false);
        const serverMsg =
          err?.response?.data?.message ||
          'Could not verify automatically. Please enter the OTP code manually.';
        setError(serverMsg);
      }
    }, 1000);

    const fallbackTimer = setTimeout(() => {
      if (isMounted && !hasVerified.current) {
        setIsAutoVerifying(false);
      }
    }, 4500);

    return () => {
      isMounted = false;
      clearTimeout(verifyTimer);
      clearTimeout(fallbackTimer);
    };
  }, [autoVerifyOtp, phone, setAuth, navigation]);

  // Auto-verify as soon as 6 digits are typed
  useEffect(() => {
    if (otp.length === 6 && !loading && !hasVerified.current) {
      hasVerified.current = true;
      handleVerify(otp);
    } else if (otp.length < 6) {
      hasVerified.current = false;
    }
  }, [otp, loading, handleVerify]);

  // Passive clipboard capture if user copies SMS code
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
      Alert.alert('Code Sent', 'A verification code has been sent via SMS.');
    } catch {
      setTimer(30);
      setResending(false);
      Alert.alert('Code Sent', 'A verification code has been sent via SMS.');
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
            {/* Top Back Navigation */}
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.7}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={22} color="#0F172A" />
            </TouchableOpacity>

            {isAutoVerifying ? (
              /* Minimal, Straight-to-Point Auto-Verifying View */
              <View style={styles.verifyingContainer}>
                {autoVerifySuccess ? (
                  <View style={styles.successCircle}>
                    <Ionicons name="checkmark" size={28} color="#FFFFFF" />
                  </View>
                ) : (
                  <ActivityIndicator size="large" color="#047A36" style={styles.spinner} />
                )}

                <Text style={styles.title}>
                  {autoVerifySuccess ? 'Verified' : 'Verifying Mobile'}
                </Text>

                <Text style={styles.subtitle}>
                  {autoVerifySuccess
                    ? 'Entering dukaan...'
                    : `Please wait, verifying ${phone}`}
                </Text>

                {!autoVerifySuccess && (
                  <TouchableOpacity
                    style={styles.manualLinkBtn}
                    activeOpacity={0.7}
                    onPress={() => setIsAutoVerifying(false)}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Text style={styles.manualLinkText}>Enter code manually</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              /* Minimal Manual OTP Input View */
              <>
                <Text style={styles.title}>Verify Mobile</Text>
                <View style={styles.subtitleRow}>
                  <Text style={styles.subtitle}>
                    Code sent to <Text style={styles.phoneHighlight}>{phone}</Text>
                  </Text>
                  <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.editText}>Edit</Text>
                  </TouchableOpacity>
                </View>

                {/* 6-digit Input Boxes */}
                <View style={styles.otpBoxWrapper}>
                  <OtpInputBoxes
                    length={6}
                    value={otp}
                    onChange={setOtp}
                    hasError={Boolean(error)}
                    onComplete={handleVerify}
                    autoFocus={true}
                  />
                </View>

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
                        {resending ? 'Sending...' : 'Resend Code'}
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
                    <Text style={styles.verifyButtonText}>CONTINUE</Text>
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
    marginBottom: 28,
  },
  /* Minimal Auto-Verifying View */
  verifyingContainer: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 24,
  },
  spinner: {
    marginBottom: 24,
  },
  successCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#047A36',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
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
  manualLinkBtn: {
    marginTop: 28,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  manualLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#047A36',
    textDecorationLine: 'underline',
  },
  /* Manual Mode Styles */
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 24,
    gap: 8,
  },
  phoneHighlight: {
    color: '#0F172A',
    fontWeight: '700',
  },
  editText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#047A36',
  },
  otpBoxWrapper: {
    marginBottom: 12,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
    flex: 1,
  },
  resendRow: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
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
    color: '#047A36',
  },
  verifyButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#047A36',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyButtonDisabled: {
    backgroundColor: 'rgba(4, 122, 54, 0.4)',
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
