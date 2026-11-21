import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';

interface Props {
  isListening: boolean;
  size?: 'normal' | 'large';
}

export const GoogleColors = {
  blue: '#4285F4',
  red: '#EA4335',
  yellow: '#FBBC05',
  green: '#34A853',
};

export const GoogleVoiceWaveform: React.FC<Props> = ({ isListening, size = 'normal' }) => {
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;
  const dot4Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isListening) {
      dot1Anim.setValue(0);
      dot2Anim.setValue(0);
      dot3Anim.setValue(0);
      dot4Anim.setValue(0);
      return;
    }

    const createBounceAnim = (anim: Animated.Value, delayMs: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delayMs),
          Animated.timing(anim, {
            toValue: 1,
            duration: 320,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: -1,
            duration: 320,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
    };

    const a1 = createBounceAnim(dot1Anim, 0);
    const a2 = createBounceAnim(dot2Anim, 140);
    const a3 = createBounceAnim(dot3Anim, 280);
    const a4 = createBounceAnim(dot4Anim, 420);

    a1.start();
    a2.start();
    a3.start();
    a4.start();

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
      a4.stop();
    };
  }, [isListening, dot1Anim, dot2Anim, dot3Anim, dot4Anim]);

  const dotSize = size === 'large' ? 14 : 11;
  const maxBounce = size === 'large' ? 14 : 10;

  return (
    <View style={styles.container}>
      {/* 1. Google Blue Dot */}
      <Animated.View
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: GoogleColors.blue,
            transform: [
              {
                translateY: dot1Anim.interpolate({
                  inputRange: [-1, 0, 1],
                  outputRange: [-maxBounce, 0, maxBounce * 0.4],
                }),
              },
              {
                scaleY: isListening
                  ? dot1Anim.interpolate({
                      inputRange: [-1, 0, 1],
                      outputRange: [1.35, 1, 0.85],
                    })
                  : 1,
              },
            ],
          },
        ]}
      />

      {/* 2. Google Red Dot */}
      <Animated.View
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: GoogleColors.red,
            transform: [
              {
                translateY: dot2Anim.interpolate({
                  inputRange: [-1, 0, 1],
                  outputRange: [-maxBounce, 0, maxBounce * 0.4],
                }),
              },
              {
                scaleY: isListening
                  ? dot2Anim.interpolate({
                      inputRange: [-1, 0, 1],
                      outputRange: [1.35, 1, 0.85],
                    })
                  : 1,
              },
            ],
          },
        ]}
      />

      {/* 3. Google Yellow Dot */}
      <Animated.View
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: GoogleColors.yellow,
            transform: [
              {
                translateY: dot3Anim.interpolate({
                  inputRange: [-1, 0, 1],
                  outputRange: [-maxBounce, 0, maxBounce * 0.4],
                }),
              },
              {
                scaleY: isListening
                  ? dot3Anim.interpolate({
                      inputRange: [-1, 0, 1],
                      outputRange: [1.35, 1, 0.85],
                    })
                  : 1,
              },
            ],
          },
        ]}
      />

      {/* 4. Google Green Dot */}
      <Animated.View
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: GoogleColors.green,
            transform: [
              {
                translateY: dot4Anim.interpolate({
                  inputRange: [-1, 0, 1],
                  outputRange: [-maxBounce, 0, maxBounce * 0.4],
                }),
              },
              {
                scaleY: isListening
                  ? dot4Anim.interpolate({
                      inputRange: [-1, 0, 1],
                      outputRange: [1.35, 1, 0.85],
                    })
                  : 1,
              },
            ],
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    height: 40,
  },
  dot: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
});
