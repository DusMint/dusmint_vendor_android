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
    marginVertical: 8,
  },
  container: {
    height: 56,
    backgroundColor: Colors.textfield,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  containerError: {
    borderWidth: 1,
    borderColor: Colors.error,
  },
  iconContainer: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primaryText,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
    marginLeft: 20,
  },
});
