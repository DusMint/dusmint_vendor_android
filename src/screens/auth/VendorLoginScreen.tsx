import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { dusmintApi } from '../../api-client/client';
import { IndiaFlag } from './widgets/IndiaFlag';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const VendorLoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const submitPhone = async (phoneDigits: string) => {
    if (phoneDigits.length < 10 || loading) return;

    Keyboard.dismiss();
    setError('');
    setLoading(true);

    const formattedPhone = `+91${phoneDigits}`;

    try {
      await dusmintApi.sendPhoneOtp(formattedPhone);
      setLoading(false);
      navigation.navigate('VendorOtp', { phone: formattedPhone });
    } catch {
      setLoading(false);
      navigation.navigate('VendorOtp', { phone: formattedPhone });
    }
  };

  const handlePhoneChange = (text: string) => {
    const digitsOnly = text.replace(/[^0-9]/g, '').slice(0, 10);
    setPhone(digitsOnly);
    if (error) setError('');
    // Auto-continue as soon as 10 digits are entered
    if (digitsOnly.length === 10) {
      submitPhone(digitsOnly);
    }
  };

  const handleContinue = () => {
    if (phone.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    submitPhone(phone);
  };

  // Riksho-style bottom padding with negative margin to ensure continuous backdrop
  // when lifted smoothly above the software keyboard
  const bottomSheetPadding =
    (Platform.OS === 'ios'
      ? insets.bottom || 24
      : insets.bottom > 0
      ? insets.bottom + 8
      : 16) + 120;

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidRoot}
      behavior="padding"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.screenContainer}>
          <StatusBar style="dark" />

          {/* 1. Full-bleed background image with fresh groceries (Clean, no shadows, no overlays) */}
          <Image
            source={require('../../../assets/images/login_bg.jpg')}
            style={styles.bgImage}
            resizeMode="cover"
          />

          {/* 2. Top Flexible Spacer (Collapses smoothly when keyboard pushes sheet upward) */}
          <View style={styles.topSpacer} />

          {/* 3. Bottom Sheet Drawer Pinned Above Keypad */}
          <View
            style={[
              styles.sheetCard,
              {
                paddingBottom: bottomSheetPadding,
                marginBottom: -120,
              },
            ]}
          >
            {/* 1. DusMint Word Logo */}
            <View style={styles.wordLogoRow}>
              <Text style={styles.brandWordLogo}>
                <Text style={styles.brandDus}>dus</Text>
                <Text style={styles.brandMint}>mint</Text>
              </Text>
            </View>

            {/* 2. Unbolded single-line subtext */}
            <Text style={styles.sheetSubtitle} numberOfLines={1} adjustsFontSizeToFit>
              Enter your mobile number to get started
            </Text>

            <Text style={styles.inputCaption}>MOBILE NUMBER</Text>

            {/* Phone Input with +91 and India Flag */}
            <View
              style={[
                styles.inputBox,
                isFocused && styles.inputBoxFocused,
                Boolean(error) && styles.inputBoxError,
              ]}
            >
              <View style={styles.countryPrefix}>
                <IndiaFlag width={24} height={17} />
                <Text style={styles.countryCode}>+91</Text>
              </View>

              <View style={styles.verticalDivider} />

              <TextInput
                style={styles.phoneInput}
                value={phone}
                onChangeText={handlePhoneChange}
                placeholder="Enter 10-digit number"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                maxLength={10}
                selectionColor="#22C55E"
                returnKeyType="done"
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onSubmitEditing={handleContinue}
              />
            </View>

            {Boolean(error) && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Continue Button */}
            <TouchableOpacity
              style={[
                styles.continueBtn,
                (phone.length < 10 || loading) && styles.continueBtnDisabled,
              ]}
              activeOpacity={0.85}
              disabled={loading || phone.length < 10}
              onPress={handleContinue}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.continueBtnText}>CONTINUE</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.termsNote}>
              By continuing, you agree to DusMint's Partner Terms of Agreement
            </Text>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidRoot: {
    flex: 1,
    backgroundColor: '#F6EFDD',
  },
  screenContainer: {
    flex: 1,
    position: 'relative',
  },
  bgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  topSpacer: {
    flex: 1,
  },
  sheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 28,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 12,
  },
  wordLogoRow: {
    marginBottom: 4,
  },
  brandWordLogo: {
    fontSize: 27,
    fontFamily: 'PlusJakartaSans-SemiBold',
    letterSpacing: -0.6,
  },
  brandDus: {
    color: '#0F172A',
  },
  brandMint: {
    color: '#047A36',
  },
  sheetSubtitle: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans-Regular',
    color: '#334155',
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  inputCaption: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-SemiBold',
    letterSpacing: 0.8,
    color: '#334155',
    marginTop: 20,
    marginBottom: 8,
  },
  inputBox: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputBoxFocused: {
    borderColor: '#047A36',
    backgroundColor: '#FFFFFF',
  },
  inputBoxError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  countryPrefix: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCode: {
    fontSize: 18,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: '#0F172A',
    marginLeft: 8,
  },
  verticalDivider: {
    width: 1,
    height: 26,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 12,
  },
  phoneInput: {
    flex: 1,
    height: '100%',
    fontSize: 20,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: '#0F172A',
    padding: 0,
  },
  errorBox: {
    marginTop: 6,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#EF4444',
  },
  continueBtn: {
    height: 54,
    borderRadius: 16,
    backgroundColor: '#047A36',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#047A36',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  continueBtnDisabled: {
    backgroundColor: 'rgba(4, 122, 54, 0.45)',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 16.5,
    fontFamily: 'PlusJakartaSans-SemiBold',
    letterSpacing: 1,
  },
  termsNote: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Regular',
    color: '#475569',
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 18,
  },
});
