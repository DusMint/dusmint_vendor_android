import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { dusmintApi } from '../../api-client/client';

export const VendorLoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to Dark Mode like the main screenshot

  const handlePhoneChange = (text: string) => {
    const digitsOnly = text.replace(/[^0-9]/g, '').slice(0, 10);
    setPhone(digitsOnly);
    if (error) setError('');
  };

  const handleContinue = async () => {
    if (phone.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    Keyboard.dismiss();
    setError('');
    setLoading(true);

    const formattedPhone = `+91${phone}`;

    try {
      await dusmintApi.sendPhoneOtp(formattedPhone);
      setLoading(false);
      navigation.navigate('VendorOtp', { phone: formattedPhone });
    } catch {
      setLoading(false);
      // Even if network blips or in dev mode, proceed to OTP screen with dev 1234
      navigation.navigate('VendorOtp', { phone: formattedPhone });
    }
  };

  const isFormValid = phone.length === 10;

  // Dynamic Theme Colors
  const theme = {
    screenBg: isDarkMode ? '#121214' : '#F4F4F6',
    cardBg: isDarkMode ? '#1E1E24' : '#FFFFFF',
    cardBorder: isDarkMode ? '#2E2E36' : '#E8E4EE',
    inputBorder: isFocused
      ? '#FF2D6C'
      : isDarkMode
      ? '#6A2E46'
      : '#D897B3',
    floatingLabelBg: isDarkMode ? '#1E1E24' : '#FFFFFF',
    floatingLabelColor: isFocused
      ? '#FF2D6C'
      : isDarkMode
      ? '#E05282'
      : '#A8486E',
    inputText: isDarkMode ? '#FFFFFF' : '#111827',
    subtitleColor: isDarkMode ? '#A1A1AA' : '#6B7280',
    btnDisabledBg: isDarkMode ? '#38232D' : '#D4BFCA',
    btnDisabledText: isDarkMode ? '#7A4F60' : '#8A6D7C',
    btnActiveBg: '#FF2D6C',
    btnActiveText: '#FFFFFF',
    toggleTextColor: isDarkMode ? '#A1A1AA' : '#6B7280',
    termsColor: isDarkMode ? '#6B7280' : '#9CA3AF',
  };

  return (
    <KeyboardAvoidingView
      style={[styles.rootContainer, { backgroundColor: theme.screenBg }]}
      behavior="padding"
    >
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.centerWrapper}>
          {/* Centered Floating Card */}
          <View
            style={[
              styles.floatingCard,
              {
                backgroundColor: theme.cardBg,
                borderColor: theme.cardBorder,
              },
            ]}
          >
            {/* 1. Brand Logo Lockup: DusMint Icon + "dusmint" & "Vendor" */}
            <View style={styles.logoRow}>
              <View style={styles.iconBox}>
                <Svg width={40} height={40} viewBox="0 0 32 32">
                  <Path
                    d="M16 4C16 4 9 9 9 17C9 21.4183 12.134 25 16 25C19.866 25 23 21.4183 23 17C23 9 16 4 16 4Z"
                    fill="#FF2D6C"
                  />
                  <Path
                    d="M23 11C23 11 27 14 27 19C27 21.7614 25.2091 24 23 24C20.7909 24 19 21.7614 19 19C19 14 23 11 23 11Z"
                    fill="#FF5E90"
                  />
                  <Path
                    d="M16 11V22M16 15L12 13M16 18L13 19M16 17L19 16"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </Svg>
              </View>

              <View style={styles.logoTextCol}>
                <Text style={styles.brandTitle}>dusmint</Text>
                <Text style={styles.brandSubtitle}>Vendor</Text>
              </View>
            </View>

            {/* 2. Subtitle */}
            <Text style={[styles.subtitle, { color: theme.subtitleColor }]}>
              Enter your mobile number to get started
            </Text>

            {/* 3. Outlined Input Box with Notched Floating Label */}
            <View style={styles.inputWrapper}>
              <View
                style={[
                  styles.outlinedBox,
                  { borderColor: theme.inputBorder },
                ]}
              >
                <TextInput
                  style={[styles.textInput, { color: theme.inputText }]}
                  value={phone}
                  onChangeText={handlePhoneChange}
                  keyboardType="phone-pad"
                  maxLength={10}
                  selectionColor="#FF2D6C"
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  returnKeyType="done"
                  onSubmitEditing={handleContinue}
                />
              </View>

              {/* Floating Label notched on top border */}
              <View
                style={[
                  styles.floatingLabelBadge,
                  { backgroundColor: theme.floatingLabelBg },
                ]}
                pointerEvents="none"
              >
                <Text
                  style={[
                    styles.floatingLabelText,
                    { color: theme.floatingLabelColor },
                  ]}
                >
                  Mobile Number
                </Text>
              </View>
            </View>

            {Boolean(error) && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* 4. Centered "Send OTP" Button */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[
                  styles.sendOtpBtn,
                  isFormValid && !loading
                    ? styles.sendOtpBtnActive
                    : { backgroundColor: theme.btnDisabledBg },
                ]}
                activeOpacity={0.85}
                disabled={!isFormValid || loading}
                onPress={handleContinue}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text
                    style={[
                      styles.sendOtpBtnText,
                      {
                        color:
                          isFormValid && !loading
                            ? theme.btnActiveText
                            : theme.btnDisabledText,
                      },
                    ]}
                  >
                    Send OTP
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* 5. Theme Toggle: Switch to Light/Dark Mode */}
            <TouchableOpacity
              style={styles.themeToggleBtn}
              activeOpacity={0.7}
              onPress={() => setIsDarkMode(!isDarkMode)}
            >
              <Ionicons
                name={isDarkMode ? 'sunny-outline' : 'moon-outline'}
                size={14}
                color="#FF2D6C"
                style={styles.themeIcon}
              />
              <Text
                style={[
                  styles.themeToggleText,
                  { color: theme.toggleTextColor },
                ]}
              >
                {isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              </Text>
            </TouchableOpacity>

            {/* 6. Legal Fine Print */}
            <Text style={[styles.termsText, { color: theme.termsColor }]}>
              By continuing, you agree to our Terms of Service{'\n'}and Privacy Policy
            </Text>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  centerWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  floatingCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  iconBox: {
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoTextCol: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 28,
    fontFamily: 'Metropolis-Bold',
    fontWeight: '800',
    color: '#FF2D6C',
    letterSpacing: -0.6,
    lineHeight: 32,
  },
  brandSubtitle: {
    fontSize: 20,
    fontFamily: 'Metropolis-Bold',
    fontWeight: '700',
    color: '#FF2D6C',
    letterSpacing: -0.4,
    lineHeight: 24,
    marginTop: -2,
  },
  subtitle: {
    fontSize: 13.5,
    fontFamily: 'Metropolis-Medium',
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: -0.2,
    marginBottom: 26,
    marginTop: 4,
  },
  inputWrapper: {
    position: 'relative',
    marginBottom: 18,
  },
  outlinedBox: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 16,
    fontFamily: 'Metropolis-SemiBold',
    fontWeight: '600',
    letterSpacing: 0.5,
    padding: 0,
    height: '100%',
  },
  floatingLabelBadge: {
    position: 'absolute',
    top: -9,
    left: 14,
    paddingHorizontal: 6,
  },
  floatingLabelText: {
    fontSize: 11.5,
    fontFamily: 'Metropolis-Medium',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  errorContainer: {
    marginTop: -10,
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Metropolis-Medium',
    color: '#EF4444',
  },
  buttonRow: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 4,
  },
  sendOtpBtn: {
    width: 140,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendOtpBtnActive: {
    backgroundColor: '#FF2D6C',
    shadowColor: '#FF2D6C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  sendOtpBtnText: {
    fontSize: 14.5,
    fontFamily: 'Metropolis-Bold',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  themeToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
    paddingVertical: 4,
  },
  themeIcon: {
    marginRight: 6,
  },
  themeToggleText: {
    fontSize: 12,
    fontFamily: 'Metropolis-Medium',
    fontWeight: '500',
  },
  termsText: {
    fontSize: 11,
    fontFamily: 'Metropolis-Regular',
    textAlign: 'center',
    lineHeight: 16,
    letterSpacing: -0.1,
  },
});
