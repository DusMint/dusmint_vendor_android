import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { BorderRadius, Spacing, Shadows } from '../theme/spacing';

export interface ItemCardProps {
  id: string;
  nameEn: string;
  nameHi?: string;
  unit: string;
  pricePaise: number;
  mandiBandMinPaise?: number;
  mandiBandMaxPaise?: number;
  photoUrl?: string;
  isInStock?: boolean;
  quantityInCart?: number;
  onAdd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  onPressCard?: () => void;
  style?: ViewStyle;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  nameEn,
  nameHi,
  unit,
  pricePaise,
  mandiBandMinPaise,
  mandiBandMaxPaise,
  photoUrl,
  isInStock = true,
  quantityInCart = 0,
  onAdd,
  onIncrement,
  onDecrement,
  onPressCard,
  style,
}) => {
  const priceRupees = (pricePaise / 100).toFixed(0);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPressCard}
      disabled={!isInStock}
      style={[styles.card, style, !isInStock ? styles.outOfStockCard : null]}
    >
      {/* Product Image */}
      <View style={styles.imageContainer}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderEmoji}>🥗</Text>
          </View>
        )}
        
        {/* Mandi Verified Tag */}
        {mandiBandMinPaise && mandiBandMaxPaise ? (
          <View style={styles.mandiTag}>
            <Text style={styles.mandiTagText}>Mandi Verified</Text>
          </View>
        ) : null}
      </View>

      {/* Details */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {nameEn}
        </Text>
        <Text style={styles.unitText}>{unit}</Text>

        {/* Price & Action Row */}
        <View style={styles.priceRow}>
          <View>
            <Text style={styles.price}>₹{priceRupees}</Text>
            {mandiBandMaxPaise && mandiBandMaxPaise > pricePaise ? (
              <Text style={styles.mandiRef}>
                Mandi: ₹{(mandiBandMaxPaise / 100).toFixed(0)}
              </Text>
            ) : null}
          </View>

          {/* Stepper or Add Button */}
          {!isInStock ? (
            <View style={styles.outOfStockBadge}>
              <Text style={styles.outOfStockText}>Out of Stock</Text>
            </View>
          ) : quantityInCart > 0 ? (
            <View style={styles.stepperContainer}>
              <TouchableOpacity
                onPress={onDecrement}
                style={styles.stepperBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.stepperBtnText}>−</Text>
              </TouchableOpacity>
              
              <Text style={styles.stepperValue}>{quantityInCart}</Text>
              
              <TouchableOpacity
                onPress={onIncrement}
                style={styles.stepperBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.stepperBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={onAdd}
              activeOpacity={0.8}
              style={styles.addButton}
            >
              <Text style={styles.addButtonText}>ADD</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: BorderRadius.lg,
    marginVertical: Spacing.xs,
    marginHorizontal: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadows.light,
  },
  outOfStockCard: {
    opacity: 0.6,
  },
  imageContainer: {
    width: '100%',
    height: 120,
    backgroundColor: Colors.surfaceCream,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 42,
  },
  mandiTag: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  mandiTagText: {
    color: Colors.textWhite,
    fontSize: 10,
    fontFamily: Typography.fontFamily.heading,
  },
  content: {
    padding: Spacing.sm,
  },
  title: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.heading,
    color: Colors.textPrimary,
  },
  vernacularTitle: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.body,
    color: Colors.textSecondary,
  },
  unitText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.body,
    color: Colors.secondary,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  price: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.headingBold,
    color: Colors.textPrimary,
  },
  mandiRef: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.body,
    color: Colors.secondary,
    textDecorationLine: 'line-through',
  },
  addButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: BorderRadius.roundButton,
    minWidth: 64,
    alignItems: 'center',
  },
  addButtonText: {
    color: Colors.textWhite,
    fontFamily: Typography.fontFamily.heading,
    fontSize: Typography.fontSize.xs,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.roundButton,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  stepperBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  stepperBtnText: {
    color: Colors.textWhite,
    fontSize: 16,
    fontFamily: Typography.fontFamily.headingBold,
  },
  stepperValue: {
    color: Colors.textWhite,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.heading,
    paddingHorizontal: 6,
  },
  outOfStockBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  outOfStockText: {
    color: Colors.secondary,
    fontSize: 10,
    fontFamily: Typography.fontFamily.bodyMedium,
  },
});
