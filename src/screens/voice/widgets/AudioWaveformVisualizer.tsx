import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface Props {
  isListening: boolean;
  barColor?: string;
}

export const AudioWaveformVisualizer: React.FC<Props> = ({
  isListening,
  barColor = '#047A36',
}) => {
  const barHeights = useRef([
    new Animated.Value(8),
    new Animated.Value(14),
    new Animated.Value(24),
    new Animated.Value(34),
    new Animated.Value(24),
    new Animated.Value(14),
    new Animated.Value(8),
  ]).current;

  useEffect(() => {
    if (!isListening) {
      barHeights.forEach((h, i) => {
        Animated.timing(h, {
          toValue: [6, 10, 14, 18, 14, 10, 6][i],
          duration: 250,
          useNativeDriver: false,
        }).start();
      });
      return;
    }

    const animations = barHeights.map((h, i) => {
      const minH = 6 + (i % 3) * 4;
      const maxH = 26 + (i % 4) * 8;
      return Animated.loop(
        Animated.sequence([
          Animated.timing(h, {
            toValue: maxH,
            duration: 160 + i * 35,
            useNativeDriver: false,
          }),
          Animated.timing(h, {
            toValue: minH,
            duration: 160 + i * 35,
            useNativeDriver: false,
          }),
        ])
      );
    });

    Animated.parallel(animations).start();

    return () => {
      animations.forEach((anim) => anim.stop());
    };
  }, [isListening, barHeights]);

  return (
    <View style={styles.container}>
      {barHeights.map((h, index) => (
        <Animated.View
          key={index}
          style={[
            styles.bar,
            {
              height: h,
              backgroundColor: barColor,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    gap: 6,
  },
  bar: {
    width: 4.5,
    borderRadius: 3,
  },
});
