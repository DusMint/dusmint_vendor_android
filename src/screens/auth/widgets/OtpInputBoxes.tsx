import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Platform,
  Pressable,
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
  length = 6,
  value,
  onChange,
  hasError = false,
  onComplete,
  autoFocus = true,
}) => {
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [showCursor, setShowCursor] = useState(true);

  // Blinking cursor timer
  useEffect(() => {
    if (!isFocused) return;
    const interval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 550);
    return () => clearInterval(interval);
  }, [isFocused]);

  // Auto-focus on mount
  useEffect(() => {
    if (autoFocus) {
      const timeout = setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [autoFocus]);

  const handleChange = (text: string) => {
    // Strip non-digits and cap at max length
    const clean = text.replace(/[^0-9]/g, '').slice(0, length);
    onChange(clean);

    if (clean.length === length) {
      onComplete?.(clean);
    }
  };

  const handlePressContainer = () => {
    inputRef.current?.focus();
  };

  const digits = Array.from({ length }, (_, i) => value[i] || '');

  return (
    <Pressable
      onPress={handlePressContainer}
      style={styles.container}
      accessible={true}
      accessibilityRole="none"
      accessibilityLabel="6-digit verification code input"
    >
      {/* 
        Single hidden native TextInput overlay:
        Guarantees 100% reliable paste of full 6 digits, smooth backspace across boxes,
        and flawless SMS autofill on all Android and iOS keyboards.
      */}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        maxLength={length}
        keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        importantForAutofill="yes"
        autoFocus={autoFocus}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={styles.hiddenInput}
        caretHidden={true}
      />

      {/* Visual digit boxes */}
      {digits.map((digit, index) => {
        const isCurrentActive =
          isFocused &&
          (index === value.length || (index === length - 1 && value.length === length));
        const isFilled = Boolean(digit);

        return (
          <View
            key={index}
            style={[
              styles.box,
              isFilled && styles.boxFilled,
              isCurrentActive && styles.boxFocused,
              hasError && styles.boxError,
            ]}
          >
            {digit ? (
              <Text style={styles.digitText}>{digit}</Text>
            ) : isCurrentActive && showCursor ? (
              <View style={styles.cursor} />
            ) : null}
          </View>
        );
      })}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 4,
    marginVertical: 18,
    position: 'relative',
  },
  hiddenInput: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.02,
    zIndex: 10,
    fontSize: 20,
    color: 'transparent',
    backgroundColor: 'transparent',
  },
  box: {
    width: 48,
    height: 56,
    borderRadius: 14,
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
    borderColor: '#22C55E',
    borderWidth: 2,
    backgroundColor: '#F0FDF4',
  },
  boxError: {
    borderColor: '#EF4444',
    borderWidth: 2,
    backgroundColor: '#FEF2F2',
  },
  digitText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  cursor: {
    width: 2,
    height: 24,
    backgroundColor: '#22C55E',
    borderRadius: 1,
  },
});
