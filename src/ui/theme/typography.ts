/**
 * Dusmint Design System - Typography
 * Poppins for headings, Noto Sans for clean multilingual body copy.
 */
export const Typography = {
  fontFamily: {
    heading: 'Poppins-SemiBold',
    headingBold: 'Poppins-Bold',
    body: 'NotoSans-Regular',
    bodyMedium: 'NotoSans-Medium',
    bodyBold: 'NotoSans-Bold',
  },
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    xxl: 28,
    display: 34,
  },
  lineHeight: {
    xs: 15,
    sm: 18,
    base: 22,
    md: 24,
    lg: 28,
    xl: 32,
    xxl: 36,
    display: 42,
  },
} as const;

export type TypographyType = typeof Typography;
