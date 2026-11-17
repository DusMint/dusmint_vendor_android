import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect, Circle, Line } from 'react-native-svg';

interface Props {
  width?: number;
  height?: number;
}

export const IndiaFlag: React.FC<Props> = ({ width = 24, height = 17 }) => {
  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height} viewBox="0 0 24 17">
        {/* Top Band: Saffron */}
        <Rect x="0" y="0" width="24" height="5.67" fill="#FF9933" />
        {/* Middle Band: White */}
        <Rect x="0" y="5.67" width="24" height="5.67" fill="#FFFFFF" />
        {/* Bottom Band: Green */}
        <Rect x="0" y="11.34" width="24" height="5.66" fill="#138808" />
        {/* Ashoka Chakra */}
        <Circle cx="12" cy="8.5" r="2.2" stroke="#000080" strokeWidth="0.5" fill="none" />
        <Circle cx="12" cy="8.5" r="0.6" fill="#000080" />
        {/* Spokes */}
        <Line x1="12" y1="6.5" x2="12" y2="10.5" stroke="#000080" strokeWidth="0.3" />
        <Line x1="10" y1="8.5" x2="14" y2="8.5" stroke="#000080" strokeWidth="0.3" />
        <Line x1="10.6" y1="7.1" x2="13.4" y2="9.9" stroke="#000080" strokeWidth="0.3" />
        <Line x1="10.6" y1="9.9" x2="13.4" y2="7.1" stroke="#000080" strokeWidth="0.3" />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 2,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
