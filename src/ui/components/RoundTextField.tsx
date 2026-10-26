import React from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { BorderRadius, Spacing } from '../theme/spacing';

export interface RoundTextFieldProps extends TextInputProps {
  hintText: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  errorMessage?: string;
  containerStyle?: ViewStyle;
}

export const RoundTextField: React.FC<RoundTextFieldProps> = ({
  hintText,
  leftIcon,
  rightIcon,
  errorMessage,
  containerStyle,
  style,
  ...rest
}) => {
  return (
    <View style={[styles.wrapper, containerStyle]}>
      <View
        style={[
          styles.container,
          errorMessage ? styles.containerError : null,
        ]}
      >
        {leftIcon ? <View style={styles.iconContainer}>{leftIcon}</View> : null}
        
        <TextInput
          placeholder={hintText}
          placeholderTextColor={Colors.placeholder}
          style={[styles.input, style]}
          {...rest}
        />

        {rightIcon ? <View style={styles.iconContainer}>{rightIcon}</View> : null}
      </View>

      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginVertical: Spacing.sm,
  },
  container: {
    height: 56,
    backgroundColor: Colors.surfaceLightGrey,
    borderRadius: BorderRadius.roundButton,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  containerError: {
    borderColor: Colors.error,
    backgroundColor: '#FEF2F2',
  },
  iconContainer: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  errorText: {
    fontFamily: Typography.fontFamily.body,
    fontSize: Typography.fontSize.xs,
    color: Colors.error,
    marginTop: 4,
    marginLeft: Spacing.base,
  },
});
