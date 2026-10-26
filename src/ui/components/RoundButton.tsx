import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors } from '../theme/colors';

export type RoundButtonType = 'bgPrimary' | 'textPrimary' | 'outline' | 'orange';

export interface RoundButtonProps {
  title: string;
  onPress: () => void;
  type?: RoundButtonType;
  fontSize?: number;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const RoundButton: React.FC<RoundButtonProps> = ({
  title,
  onPress,
  type = 'bgPrimary',
  fontSize = 16,
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const isOutline = type === 'outline' || type === 'textPrimary';

  const getBackgroundColor = () => {
    if (disabled) return Colors.placeholder;
    if (isOutline) return Colors.white;
    return Colors.primary;
  };

  const getTextColor = () => {
    if (disabled) return Colors.white;
    if (isOutline) return Colors.primary;
    return Colors.white;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderWidth: isOutline ? 1 : 0,
          borderColor: isOutline ? Colors.primary : 'transparent',
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <Text
          style={[
            styles.text,
            {
              color: getTextColor(),
              fontSize,
            },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    width: '100%',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
});
