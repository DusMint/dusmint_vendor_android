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
import { Typography } from '../theme/typography';
import { BorderRadius } from '../theme/spacing';

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
  fontSize = Typography.fontSize.base,
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const isOutline = type === 'outline';
  const isText = type === 'textPrimary';
  const isOrange = type === 'orange';

  const getBackgroundColor = () => {
    if (disabled) return Colors.placeholder;
    if (isOutline || isText) return 'transparent';
    if (isOrange) return Colors.orange;
    return Colors.primary;
  };

  const getTextColor = () => {
    if (disabled) return Colors.textWhite;
    if (isOutline) return Colors.primary;
    if (isText) return Colors.primary;
    return Colors.textWhite;
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
    borderRadius: BorderRadius.roundButton,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    width: '100%',
  },
  text: {
    fontFamily: Typography.fontFamily.heading,
    textAlign: 'center',
  },
});
