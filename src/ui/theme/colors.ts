/**
 * Food Delivery / Dusmint Design System - Exact Sample App Color Palette
 * Replicated from sample_app/lib/common/color_extension.dart
 */
export const Colors = {
  // Brand Primary (Orange from sample_app: 0xffFC6011)
  primary: '#FC6011',
  primaryLight: '#FF7A38',
  primaryDark: '#E04E00',
  orange: '#FC6011',
  orangeLight: '#FF7A38',
  accentMint: '#FC6011',

  // Text Colors
  primaryText: '#4A4B4D',
  secondaryText: '#7C7D7E',
  textPrimary: '#4A4B4D',
  textSecondary: '#7C7D7E',
  secondary: '#7C7D7E',
  textWhite: '#FFFFFF',

  // Input Fields & Surfaces
  textfield: '#F2F2F2',
  placeholder: '#B6B7B7',
  white: '#FFFFFF',
  background: '#FFFFFF',
  cardBackground: '#FFFFFF',
  surfaceLightGrey: '#F6F6F6',
  surfaceCream: '#FBF9F5',
  divider: '#F2F2F2',
  border: '#E8E8E8',

  // Social Login Colors
  facebook: '#367FC0',
  google: '#DD4B39',

  // Status & Semantic
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Badge Specifics
  trustBadgeBg: '#FFF3EB',
  trustBadgeText: '#FC6011',
  slotBadgeMorningBg: '#FEF3C7',
  slotBadgeMorningText: '#92400E',
  slotBadgeEveningBg: '#FFF3EB',
  slotBadgeEveningText: '#FC6011',
} as const;

export type ColorType = typeof Colors;
