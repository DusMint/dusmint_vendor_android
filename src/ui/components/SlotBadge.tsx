import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { BorderRadius, Spacing } from '../theme/spacing';

export interface SlotBadgeProps {
  slotType: 'morning' | 'evening';
  timeWindow: string; // e.g. "7:00 AM - 10:00 AM"
  isSelected?: boolean;
  style?: ViewStyle;
}

export const SlotBadge: React.FC<SlotBadgeProps> = ({
  slotType,
  timeWindow,
  isSelected = false,
  style,
}) => {
  const isMorning = slotType === 'morning';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: isSelected
            ? Colors.primary
            : isMorning
            ? Colors.slotBadgeMorningBg
            : Colors.slotBadgeEveningBg,
          borderColor: isSelected ? Colors.primaryDark : 'transparent',
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.icon,
          { color: isSelected ? Colors.textWhite : isMorning ? '#B45309' : '#4338CA' },
        ]}
      >
        {isMorning ? '☀️' : '🌙'}
      </Text>
      <View style={styles.textCol}>
        <Text
          style={[
            styles.title,
            {
              color: isSelected
                ? Colors.textWhite
                : isMorning
                ? Colors.slotBadgeMorningText
                : Colors.slotBadgeEveningText,
            },
          ]}
        >
          {isMorning ? 'Morning Slot' : 'Evening Slot'}
        </Text>
        <Text
          style={[
            styles.time,
            {
              color: isSelected
                ? 'rgba(255,255,255,0.85)'
                : isMorning
                ? Colors.slotBadgeMorningText
                : Colors.slotBadgeEveningText,
            },
          ]}
        >
          {timeWindow}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
  },
  icon: {
    fontSize: 18,
    marginRight: Spacing.sm,
  },
  textCol: {
    flexDirection: 'column',
  },
  title: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.heading,
  },
  time: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.body,
    marginTop: 1,
  },
});
