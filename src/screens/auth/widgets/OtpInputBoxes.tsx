import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Platform,
} from 'react-native';

interface OtpInputBoxesProps {
  length?: number;
  value: string;
  onChange: (otp: string) => void;
  hasError?: boolean;
  onComplete?: (otp: string) => void;
  autoFocus?: boolean;
}

export const OtpInputBoxes: React.FC<OtpInputBoxesProps> = ({
  length = 4,
  value,
  onChange,
  hasError = false,
  onComplete,
  autoFocus = true,
}) => {
  const inputsRef = useRef<any[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);

  const digits = Array.from({ length }, (_, i) => value[i] || '');

  useEffect(() => {
    if (autoFocus && inputsRef.current[0]) {
      const timeout = setTimeout(() => {
        inputsRef.current[0]?.focus();
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [autoFocus]);

  const handleDigitChange = (text: string, index: number) => {
    const clean = text.replace(/[^0-9]/g, '');

    // Handle full paste
    if (clean.length > 1) {
      const pasted = clean.slice(0, length);
      onChange(pasted);
      if (pasted.length === length) {
        inputsRef.current[length - 1]?.focus();
        onComplete?.(pasted);
      } else {
        inputsRef.current[pasted.length]?.focus();
      }
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = clean;
    const newOtp = newDigits.join('');
    onChange(newOtp);

    if (clean && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }

    if (newOtp.length === length && !newDigits.includes('')) {
      onComplete?.(newOtp);
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace') {
      if (!digits[index] && index > 0) {
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        onChange(newDigits.join(''));
        inputsRef.current[index - 1]?.focus();
      }
    }
  };

  return (
    <View style={styles.container}>
      {Array.from({ length }).map((_, index) => {
        const digit = digits[index] || '';
        const isFocused = focusedIndex === index;
        const isFilled = Boolean(digit);

        return (
          <View
            key={index}
            style={[
              styles.box,
              isFilled && styles.boxFilled,
              isFocused && styles.boxFocused,
              hasError && styles.boxError,
            ]}
          >
            <TextInput
              ref={(ref) => {
                inputsRef.current[index] = ref;
              }}
              style={styles.input}
              value={digit}
              onChangeText={(text) => handleDigitChange(text, index)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
              keyboardType="number-pad"
              maxLength={index === 0 ? length : 1}
              selectTextOnFocus={true}
              selectionColor="#FC6011"
              onFocus={() => setFocusedIndex(index)}
              onBlur={() => setFocusedIndex(-1)}
              accessibilityLabel={`OTP digit ${index + 1}`}
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
            />
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 12,
    marginVertical: 18,
  },
  box: {
    width: 62,
    height: 66,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  boxFilled: {
    borderColor: '#94A3B8',
    backgroundColor: '#FFFFFF',
  },
  boxFocused: {
    borderColor: '#FF2D6C',
    borderWidth: 2,
    backgroundColor: '#FFF1F5',
  },
  boxError: {
    borderColor: '#EF4444',
    borderWidth: 2,
    backgroundColor: '#FEF2F2',
  },
  input: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    padding: 0,
  },
});
