import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { dusmintApi } from '../../api-client/client';
import { useVendorAuthStore } from '../../state/useVendorAuthStore';
import { OtpInputBoxes } from './widgets/OtpInputBoxes';

export const VendorOtpScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { phone } = route.params || { phone: '+91 8010939887' };
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(28);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');

  const setAuth = useVendorAuthStore((s) => s.setAuth);

  // Timer countdown
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

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
          navigation.replace('VendorOnboarding', { phone: fullPhone, authUserId: res.user?.id });
        } else {
          navigation.replace('Tabs');
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
            <Text style={styles.title}>Verify Mobile</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit verification code sent to
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
    marginBottom: 16,
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
    color: '#047A36',
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
    fontFamily: 'Metropolis-Bold',
    color: '#047A36',
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
    fontFamily: 'Metropolis-Bold',
    letterSpacing: 0.5,
  },
});
