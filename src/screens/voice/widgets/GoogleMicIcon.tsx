import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

interface Props {
  size?: number;
}

/**
 * Authentic 4-color Google Microphone Icon
 * matching Google Voice Search & Google Assistant.
 * Blue Capsule (#4285F4), Red U-Cradle (#EA4335), Yellow Stem (#FBBC05), Green Base (#34A853)
 */
export const GoogleMicIcon: React.FC<Props> = ({ size = 32 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* 1. Google Blue Capsule */}
      <Path
        d="M12 14C13.66 14 15 12.66 15 11V5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14Z"
        fill="#4285F4"
      />
      {/* 2. Google Red U-Cradle */}
      <Path
        d="M17.3 11C17.3 13.93 14.93 16.3 12 16.3C9.07 16.3 6.7 13.93 6.7 11H5C5 14.53 7.61 17.43 11 17.93V21H13V17.93C16.39 17.43 19 14.53 19 11H17.3Z"
        fill="#EA4335"
      />
      {/* 3. Google Yellow Stem Accent */}
      <Rect x="11" y="17.5" width="2" height="3" rx="0.5" fill="#FBBC05" />
      {/* 4. Google Green Base */}
      <Path
        d="M8 21H16V22.5C16 22.78 15.78 23 15.5 23H8.5C8.22 23 8 22.78 8 22.5V21Z"
        fill="#34A853"
      />
    </Svg>
  );
};
