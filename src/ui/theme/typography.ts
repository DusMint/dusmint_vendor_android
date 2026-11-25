/**
 * DusMint Partner Design System — Android-Safe Typography Hierarchy
 *
 * IMPORTANT FOR ANDROID:
 * Never combine `fontWeight: '700' | '800' | 'bold'` with a static `.ttf` `fontFamily`.
 * Android synthesizes fake double-bolding or falls back to the OEM system font.
 * Instead, always pick the exact static `fontFamily` weight below with NO `fontWeight`.
 *
 * Hierarchy:
 * - Regular  (`PlusJakartaSans-Regular`)  -> Body text, dates, subtitles, item names, labels
 * - Medium   (`PlusJakartaSans-Medium`)   -> Tabs, filter chips, secondary metrics, buttons
 * - SemiBold (`PlusJakartaSans-SemiBold`) -> Screen headers, section headers, card titles, prices
 * - Bold     (`PlusJakartaSans-Bold`)     -> Hero display numbers only
 */
export const Typography = {
  fontFamily: {
    regular: 'PlusJakartaSans-Regular',
    medium: 'PlusJakartaSans-Medium',
    semiBold: 'PlusJakartaSans-SemiBold',
    bold: 'PlusJakartaSans-Bold',

    // Semantic aliases
    heading: 'PlusJakartaSans-SemiBold',
    headingBold: 'PlusJakartaSans-SemiBold',
    body: 'PlusJakartaSans-Regular',
    bodyMedium: 'PlusJakartaSans-Medium',
    bodyBold: 'PlusJakartaSans-SemiBold',
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
