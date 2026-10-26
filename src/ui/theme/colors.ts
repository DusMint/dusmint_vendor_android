/**
 * Dusmint Design System - Color Palette
 * Defined in design.md & tech.md
 * Tailored for clarity, high contrast, and trust on budget Android screens.
 */
export const Colors = {
  // Brand Primaries
  primary: '#0D6938',         // Dusmint Forest Green (Primary Brand)
  primaryLight: '#1B824C',    // Vibrant Leaf Green
  primaryDark: '#074824',     // Deep Spruce
  accentMint: '#2ECC71',      // Fresh Mint Accent

  // High-Energy Action Color (inherited from sample_app & design.md)
  orange: '#FC6011',          // Warm Amber Orange (CTAs, Discounts, Alerts)
  orangeLight: '#FF7A38',

  // Secondary & Functional
  secondary: '#7C7D7E',       // Cool Grey
  placeholder: '#B6B7B7',     // Text placeholder
  border: '#E8E8E8',          // Clean border line
  divider: '#F2F2F2',

  // Semantic
  success: '#10B981',         // Verified badge, completed order
  warning: '#F59E0B',         // Pending verification, low stock
  error: '#EF4444',           // Validation error, rejection
  info: '#3B82F6',

  // Surfaces & Backgrounds
  background: '#FFFFFF',      // App background
  surfaceCream: '#FBF9F5',    // Warm organic cream
  cardBackground: '#FFFFFF',
  surfaceLightGrey: '#F6F6F6',

  // Typography
  textPrimary: '#1F2937',     // Charcoal heading/body
  textSecondary: '#6B7280',   // Subtitle, muted descriptions
  textWhite: '#FFFFFF',

  // Badge Specifics
  trustBadgeBg: '#E8F5E9',
  trustBadgeText: '#1B5E20',
  slotBadgeMorningBg: '#FEF3C7',
  slotBadgeMorningText: '#92400E',
  slotBadgeEveningBg: '#E0E7FF',
  slotBadgeEveningText: '#3730A3',
} as const;

export type ColorType = typeof Colors;
