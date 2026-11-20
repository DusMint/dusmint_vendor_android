import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Animated,
  Image,
  Vibration,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient as SvgGradient, Stop, Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { dusmintApi } from '../../api-client/client';
import { VendorStockItem } from '../../api-client/types';
import { AddMasterCatalogueModal } from './widgets/AddMasterCatalogueModal';

// Categories Filter - Limited strictly to Vegetables, Fruits, Poultry or Meat, Dairy
const CATEGORIES = ['All', 'Vegetables', 'Fruits', 'Poultry or Meat', 'Dairy'] as const;
type CategoryType = (typeof CATEGORIES)[number];

// Default Rich Store Inventory for Gupta Traders with live Kilos & Grams
const INITIAL_STORE_STOCK: VendorStockItem[] = [
  {
    id: 'stock-1',
    nameEn: 'Fresh Desi Tomato',
    category: 'Vegetables',
    unit: '1 kg',
    pricePaise: 3500,
    mrpPaise: 4500,
    isInStock: true,
    photoUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=200&q=80',
    stockKg: 18,
    stockGrams: 400,
  },
  {
    id: 'stock-2',
    nameEn: 'Indore Jyoti Potato',
    category: 'Vegetables',
    unit: '1 kg',
    pricePaise: 2500,
    mrpPaise: 3200,
    isInStock: true,
    photoUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=200&q=80',
    stockKg: 25,
    stockGrams: 0,
  },
  {
    id: 'stock-3',
    nameEn: 'Nashik Red Onion',
    category: 'Vegetables',
    unit: '1 kg',
    pricePaise: 3800,
    mrpPaise: 4800,
    isInStock: true,
    photoUrl: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=200&q=80',
    stockKg: 12,
    stockGrams: 800,
  },
  {
    id: 'stock-4',
    nameEn: 'Shimla Royal Apple',
    category: 'Fruits',
    unit: '1 kg',
    pricePaise: 14000,
    mrpPaise: 18000,
    isInStock: true,
    photoUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=200&q=80',
    stockKg: 10,
    stockGrams: 500,
  },
  {
    id: 'stock-5',
    nameEn: 'Robusta Golden Banana',
    category: 'Fruits',
    unit: '1 dozen',
    pricePaise: 4500,
    mrpPaise: 6000,
    isInStock: true,
    photoUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=200&q=80',
    stockKg: 14,
    stockGrams: 0,
  },
  {
    id: 'stock-6',
    nameEn: 'Full Cream Milk Pouch',
    category: 'Dairy',
    unit: '500 ml',
    pricePaise: 3400,
    mrpPaise: 3400,
    isInStock: true,
    photoUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200&q=80',
    stockKg: 30,
    stockGrams: 0,
  },
  {
    id: 'stock-7',
    nameEn: 'Fresh Malai Paneer',
    category: 'Dairy',
    unit: '200 g',
    pricePaise: 8500,
    mrpPaise: 9500,
    isInStock: true,
    photoUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=200&q=80',
    stockKg: 8,
    stockGrams: 200,
  },
  {
    id: 'stock-8',
    nameEn: 'Farm Fresh White Eggs',
    category: 'Poultry or Meat',
    unit: '6 pcs',
    pricePaise: 4800,
    mrpPaise: 5400,
    isInStock: true,
    photoUrl: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=200&q=80',
    stockKg: 20,
    stockGrams: 0,
  },
  {
    id: 'stock-9',
    nameEn: 'Nagpur Sweet Orange',
    category: 'Fruits',
    unit: '1 kg',
    pricePaise: 6500,
    mrpPaise: 8500,
    isInStock: false,
    photoUrl: 'https://images.unsplash.com/photo-1547514701-42782101795e?w=200&q=80',
    stockKg: 0,
    stockGrams: 0,
  },
  {
    id: 'stock-10',
    nameEn: 'Fresh Chicken Curry Cut',
    category: 'Poultry or Meat',
    unit: '500 g',
    pricePaise: 13000,
    mrpPaise: 15000,
    isInStock: true,
    photoUrl: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=200&q=80',
    stockKg: 10,
    stockGrams: 200,
  },
];

// Helper to check if item is unit-based (dozen, piece, etc.) vs weight-based (kg / g)
function isUnitBasedItem(unitStr: string = ''): boolean {
  const u = unitStr.toLowerCase();
  return u.includes('dozen') || u.includes('doz') || u.includes('pc') || u.includes('piece') || u.includes('ml');
}

// Helper to format live total weight badge (e.g. "18 kg 400 g", "25 kg", "400 g", "14 doz", "0 kg")
function formatTotalStockBadge(kg: number, grams: number, unitStr: string = 'kg'): string {
  if (isUnitBasedItem(unitStr)) {
    const label = unitStr.toLowerCase().includes('dozen') ? 'doz' : unitStr.toLowerCase().includes('pc') ? 'pcs' : 'units';
    return `${kg} ${label}`;
  }
  if (kg === 0 && grams === 0) return '0 kg';
  if (kg > 0 && grams > 0) return `${kg} kg ${grams} g`;
  if (kg > 0) return `${kg} kg`;
  return `${grams} g`;
}

// Quick Gram & Weight Adjuster Modal for Granular Orders (e.g. 10 g, 200 g, 1000 g)
interface QuickWeightModalProps {
  item: VendorStockItem | null;
  visible: boolean;
  onClose: () => void;
  onApplyWeightChange: (deltaKg: number, deltaGrams: number) => void;
}

const QuickWeightAdjustModal: React.FC<QuickWeightModalProps> = ({
  item,
  visible,
  onClose,
  onApplyWeightChange,
}) => {
  const [customGramInput, setCustomGramInput] = useState('');

  if (!item) return null;

  const curKg = item.stockKg ?? 0;
  const curGrams = item.stockGrams ?? 0;
  const formattedTotal = formatTotalStockBadge(curKg, curGrams, item.unit);

  const handleApplyCustom = (isAddition: boolean) => {
    const parsed = parseInt(customGramInput, 10);
    if (isNaN(parsed) || parsed <= 0) return;
    const deltaG = isAddition ? parsed : -parsed;
    onApplyWeightChange(0, deltaG);
    setCustomGramInput('');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeaderRow}>
            <View>
              <Text style={styles.modalTitle}>Quick Weight Adjuster</Text>
              <Text style={styles.modalSubtitle}>Granular weight orders & refills</Text>
            </View>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Current Stock Snapshot */}
          <View style={styles.modalItemSnapshot}>
            {item.photoUrl ? (
              <Image source={{ uri: item.photoUrl }} style={styles.modalItemImg} resizeMode="cover" />
            ) : (
              <View style={styles.modalItemPlaceholder}>
                <Ionicons name="basket-outline" size={20} color="#0F172A" />
              </View>
            )}
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.modalItemName} numberOfLines={1}>
                {item.nameEn}
              </Text>
              <Text style={styles.modalItemCat}>{item.category} • {item.unit}</Text>
            </View>
            <View style={styles.modalLiveBadge}>
              <Text style={styles.modalLiveBadgeLabel}>CURRENT</Text>
              <Text style={styles.modalLiveBadgeVal}>{formattedTotal}</Text>
            </View>
          </View>

          {/* Quick Deductions Row (Customer Orders) */}
          <Text style={styles.modalSectionLabel}>Deduct Order (Subtract Weight)</Text>
          <View style={styles.modalChipsGrid}>
            {[
              { label: '-10 g', deltaG: -10 },
              { label: '-50 g', deltaG: -50 },
              { label: '-100 g', deltaG: -100 },
              { label: '-200 g', deltaG: -200 },
              { label: '-500 g', deltaG: -500 },
              { label: '-1 kg', deltaG: -1000 },
            ].map((chip) => (
              <TouchableOpacity
                key={chip.label}
                style={styles.modalDeductChip}
                onPress={() => onApplyWeightChange(0, chip.deltaG)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalDeductChipText}>{chip.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick Additions Row (Inventory Refills & Rollovers) */}
          <Text style={styles.modalSectionLabel}>Add to Stock (Refill)</Text>
          <View style={styles.modalChipsGrid}>
            {[
              { label: '+10 g', deltaG: 10 },
              { label: '+50 g', deltaG: 50 },
              { label: '+100 g', deltaG: 100 },
              { label: '+200 g', deltaG: 200 },
              { label: '+500 g', deltaG: 500 },
              { label: '+1 kg', deltaG: 1000 },
            ].map((chip) => (
              <TouchableOpacity
                key={chip.label}
                style={styles.modalAddChip}
                onPress={() => onApplyWeightChange(0, chip.deltaG)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalAddChipText}>{chip.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom Numeric Gram Input */}
          <Text style={styles.modalSectionLabel}>Enter Exact Grams</Text>
          <View style={styles.modalInputRow}>
            <TextInput
              style={styles.modalGramInput}
              placeholder="e.g. 10, 150, 1200"
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
              value={customGramInput}
              onChangeText={setCustomGramInput}
            />
            <TouchableOpacity
              style={styles.modalDeductActionBtn}
              onPress={() => handleApplyCustom(false)}
              activeOpacity={0.75}
            >
              <Text style={styles.modalDeductActionText}>- Deduct</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalAddActionBtn}
              onPress={() => handleApplyCustom(true)}
              activeOpacity={0.75}
            >
              <Text style={styles.modalAddActionText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {/* Done Button */}
          <TouchableOpacity style={styles.modalDoneBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.modalDoneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// Single Live Inventory Stock Card with Dual Stepper [- 1 +] [- 000 +] and Rollover
const StockInventoryCard: React.FC<{
  item: VendorStockItem;
  onAdjustWeight: (id: string, deltaKg: number, deltaGrams: number) => void;
  onOpenQuickModal: (item: VendorStockItem) => void;
}> = React.memo(({ item, onAdjustWeight, onOpenQuickModal }) => {
  const priceRupees = (item.pricePaise / 100).toFixed(0);
  const curKg = item.stockKg ?? 0;
  const curGrams = item.stockGrams ?? 0;
  const isUnitItem = isUnitBasedItem(item.unit);
  const isOutOfStock = curKg <= 0 && (isUnitItem || curGrams <= 0);

  const formattedTotalStock = formatTotalStockBadge(curKg, curGrams, item.unit);
  const paddedGramsStr = curGrams.toString().padStart(3, '0');

  return (
    <View style={[styles.card, isOutOfStock && styles.cardOutOfStock]}>
      {/* Top Row: Picture, Name & Rate, Live Total Stock Badge */}
      <View style={styles.topCardRow}>
        {/* 1. Picture on the Left */}
        <View style={styles.imgWrapper}>
          {item.photoUrl ? (
            <Image source={{ uri: item.photoUrl }} style={styles.itemImg} resizeMode="cover" />
          ) : (
            <View style={styles.imgPlaceholder}>
              <Ionicons name="basket-outline" size={22} color="#0F172A" />
            </View>
          )}
        </View>

        {/* 2. Product Name Beside It & Rate */}
        <View style={styles.nameAndPriceCol}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.nameEn}
          </Text>
          <Text style={styles.itemCategoryUnit}>
            {item.unit} • {item.category}
          </Text>
          <Text style={styles.priceText}>
            ₹{priceRupees}{' '}
            <Text style={styles.priceUnitText}>/ {item.unit}</Text>
          </Text>
        </View>

        {/* 3. Combined Live Weight Badge on Top Right */}
        <View style={[styles.totalStockBadge, isOutOfStock && styles.totalStockBadgeOut]}>
          <Text style={[styles.totalStockBadgeText, isOutOfStock && styles.totalStockBadgeTextOut]}>
            {isOutOfStock ? '0 kg (Out)' : formattedTotalStock}
          </Text>
        </View>
      </View>

      {/* Subtle Card Divider */}
      <View style={styles.cardDivider} />

      {/* Bottom Section: Dual Metric Controllers [- 1 +] and [- 000 +] with 1000g Rollover */}
      {isUnitItem ? (
        // For unit-based items (Bananas dozen, Eggs pcs, Milk pouch): Clean Standard Width Controller
        <View>
          <View style={styles.dualMetricRow}>
            <View style={styles.metricCol}>
              <Text style={styles.stepperColLabel}>
                QUANTITY ({item.unit.includes('dozen') ? 'DOZEN' : 'PIECES'})
              </Text>
              <View style={styles.stepperContainer}>
                <TouchableOpacity
                  style={[styles.stepperBtn, curKg <= 0 && styles.stepperBtnDisabled]}
                  onPress={() => onAdjustWeight(item.id, -1, 0)}
                  disabled={curKg <= 0}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="remove" size={16} color={curKg <= 0 ? '#94A3B8' : '#0F172A'} />
                </TouchableOpacity>

                <View style={styles.stepperValBox}>
                  <Text style={[styles.stepperNum, isOutOfStock && styles.stepperNumOut]}>
                    {curKg}
                  </Text>
                  <Text style={styles.stepperUnitLabel}>
                    {item.unit.includes('dozen') ? 'doz' : 'pcs'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => onAdjustWeight(item.id, 1, 0)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="add" size={16} color="#0F172A" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Empty matching column on the right for symmetry with weight cards */}
            <View style={styles.metricCol} />
          </View>

          {/* Quick chips for unit items */}
          <View style={styles.quickChipsRow}>
            <TouchableOpacity
              style={styles.quickChipBtn}
              onPress={() => onAdjustWeight(item.id, -1, 0)}
              activeOpacity={0.7}
            >
              <Text style={styles.quickChipText}>-1</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickChipBtn}
              onPress={() => onAdjustWeight(item.id, 1, 0)}
              activeOpacity={0.7}
            >
              <Text style={styles.quickChipText}>+1</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickChipBtn}
              onPress={() => onAdjustWeight(item.id, item.unit.includes('dozen') ? 6 : 5, 0)}
              activeOpacity={0.7}
            >
              <Text style={styles.quickChipText}>{item.unit.includes('dozen') ? '+6' : '+5'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickChipBtn}
              onPress={() => onAdjustWeight(item.id, item.unit.includes('dozen') ? 12 : 10, 0)}
              activeOpacity={0.7}
            >
              <Text style={styles.quickChipText}>{item.unit.includes('dozen') ? '+12' : '+10'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        // For weight produce (Vegetables, Fruits, Poultry or Meat): Dual Metric Controllers
        <View>
          <View style={styles.dualMetricRow}>
            {/* Left: KILOS (KG) Stepper [- 1 +] */}
            <View style={styles.metricCol}>
              <Text style={styles.stepperColLabel}>KILOS (KG)</Text>
              <View style={styles.stepperContainer}>
                <TouchableOpacity
                  style={[styles.stepperBtn, curKg <= 0 && curGrams <= 0 && styles.stepperBtnDisabled]}
                  onPress={() => onAdjustWeight(item.id, -1, 0)}
                  disabled={curKg <= 0 && curGrams <= 0}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="remove" size={16} color={curKg <= 0 && curGrams <= 0 ? '#94A3B8' : '#0F172A'} />
                </TouchableOpacity>

                <View style={styles.stepperValBox}>
                  <Text style={[styles.stepperNum, isOutOfStock && styles.stepperNumOut]}>
                    {curKg}
                  </Text>
                  <Text style={styles.stepperUnitLabel}>kg</Text>
                </View>

                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => onAdjustWeight(item.id, 1, 0)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="add" size={16} color="#0F172A" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Right: GRAMS (G) Stepper [- 000 +] with 1000g rollover */}
            <View style={styles.metricCol}>
              <View style={styles.gramsLabelRow}>
                <Text style={styles.stepperColLabel}>GRAMS (G)</Text>
                <TouchableOpacity onPress={() => onOpenQuickModal(item)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                  <Text style={styles.quickModalLink}>Quick Adjust</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.stepperContainer}>
                <TouchableOpacity
                  style={[styles.stepperBtn, curKg <= 0 && curGrams <= 0 && styles.stepperBtnDisabled]}
                  onPress={() => onAdjustWeight(item.id, 0, -100)}
                  disabled={curKg <= 0 && curGrams <= 0}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="remove" size={16} color={curKg <= 0 && curGrams <= 0 ? '#94A3B8' : '#0F172A'} />
                </TouchableOpacity>

                {/* Tap grams value to open Quick Weight modal */}
                <TouchableOpacity
                  style={styles.stepperValBox}
                  onPress={() => onOpenQuickModal(item)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.stepperNum, isOutOfStock && styles.stepperNumOut]}>
                    {paddedGramsStr}
                  </Text>
                  <Text style={styles.stepperUnitLabel}>g</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => onAdjustWeight(item.id, 0, 100)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="add" size={16} color="#0F172A" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Quick Order Granular Chips: -10g, +10g, +200g, +1kg (all neutral, no green highlight) */}
          <View style={styles.quickChipsRow}>
            <TouchableOpacity
              style={styles.quickChipBtn}
              onPress={() => onAdjustWeight(item.id, 0, -10)}
              activeOpacity={0.7}
            >
              <Text style={styles.quickChipText}>-10g</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickChipBtn}
              onPress={() => onAdjustWeight(item.id, 0, 10)}
              activeOpacity={0.7}
            >
              <Text style={styles.quickChipText}>+10g</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickChipBtn}
              onPress={() => onAdjustWeight(item.id, 0, 200)}
              activeOpacity={0.7}
            >
              <Text style={styles.quickChipText}>+200g</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickChipBtn}
              onPress={() => onAdjustWeight(item.id, 1, 0)}
              activeOpacity={0.7}
            >
              <Text style={styles.quickChipText}>+1kg</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
});

export const VendorStockScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<VendorStockItem[]>(INITIAL_STORE_STOCK);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('All');

  // Master Catalogue Modal State
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);

  // Quick Gram Modal State
  const [quickModalItem, setQuickModalItem] = useState<VendorStockItem | null>(null);

  // Floating Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastAnim = useRef(new Animated.Value(40)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    Animated.parallel([
      Animated.spring(toastAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 9,
      }),
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(toastAnim, {
          toValue: 40,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setToastMessage(null);
      });
    }, 2400);
  }, [toastAnim, toastOpacity]);

  // Load Vendor Stock
  const loadStock = useCallback(async () => {
    try {
      const data = await dusmintApi.getVendorStock();
      if (data && data.length > 0) {
        // Merge server data with our rich local stockKg, stockGrams and photoUrl fields
        const merged = data.map((serverItem) => {
          const match = INITIAL_STORE_STOCK.find((d) => d.nameEn.toLowerCase() === serverItem.nameEn.toLowerCase());
          return {
            ...serverItem,
            stockKg: serverItem.stockKg ?? match?.stockKg ?? 15,
            stockGrams: serverItem.stockGrams ?? match?.stockGrams ?? 0,
            photoUrl: serverItem.photoUrl || match?.photoUrl,
          };
        });
        setItems(merged);
      } else {
        setItems(INITIAL_STORE_STOCK);
      }
    } catch {
      setItems(INITIAL_STORE_STOCK);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStock();
  }, [loadStock]);

  const onRefresh = () => {
    setRefreshing(true);
    loadStock();
  };

  // Adjust Weight with 1000g Rollover Math
  // Formula: totalGrams = curKg * 1000 + curGrams + deltaKg * 1000 + deltaGrams;
  // nextKg = Math.floor(totalGrams / 1000); nextGrams = totalGrams % 1000;
  const handleAdjustWeight = useCallback(
    (itemId: string, deltaKg: number, deltaGrams: number) => {
      try {
        Vibration.vibrate(18);
      } catch {}

      let updatedSummary = '';

      setItems((prev) =>
        prev.map((item) => {
          if (item.id === itemId) {
            const isUnit = isUnitBasedItem(item.unit);
            if (isUnit) {
              const cur = item.stockKg ?? 0;
              const nextVal = Math.max(0, cur + deltaKg);
              const inStock = nextVal > 0;
              const unitLabel = item.unit.includes('dozen') ? 'dozen' : 'pcs';
              updatedSummary = `${item.nameEn}: ${nextVal} ${unitLabel}`;
              dusmintApi.updateVendorStock(itemId, { stockKg: nextVal, inStock }).catch(() => {});
              return {
                ...item,
                stockKg: nextVal,
                stockGrams: 0,
                isInStock: inStock,
              };
            }

            const curKg = item.stockKg ?? 0;
            const curG = item.stockGrams ?? 0;
            const totalG = Math.max(0, curKg * 1000 + curG + deltaKg * 1000 + deltaGrams);
            const nextKg = Math.floor(totalG / 1000);
            const nextG = totalG % 1000;
            const inStock = nextKg > 0 || nextG > 0;

            updatedSummary = `${item.nameEn}: ${formatTotalStockBadge(nextKg, nextG, item.unit)}`;
            dusmintApi.updateVendorStock(itemId, { stockKg: nextKg, stockGrams: nextG, inStock }).catch(() => {});

            return {
              ...item,
              stockKg: nextKg,
              stockGrams: nextG,
              isInStock: inStock,
            };
          }
          return item;
        })
      );

      if (updatedSummary) {
        showToast(updatedSummary);
      }
    },
    [showToast]
  );

  // Add new item from Master Catalogue Database
  const handleAddItemFromCatalogue = (newItem: VendorStockItem) => {
    setItems((prev) => [newItem, ...prev]);
    showToast(`${newItem.nameEn} added (${formatTotalStockBadge(newItem.stockKg ?? 0, newItem.stockGrams ?? 0, newItem.unit)})`);
  };

  // Category filter + Auto-sorted alphabetically from A to Z
  const filteredItems = useMemo(() => {
    const list =
      selectedCategory === 'All'
        ? items
        : items.filter((i) => i.category.toLowerCase() === selectedCategory.toLowerCase());
    return [...list].sort((a, b) => a.nameEn.localeCompare(b.nameEn));
  }, [items, selectedCategory]);

  // Small Metrics
  const inStockCount = useMemo(
    () => items.filter((i) => ((i.stockKg ?? 0) > 0 || (i.stockGrams ?? 0) > 0) && i.isInStock).length,
    [items]
  );
  const outOfStockCount = useMemo(
    () => items.filter((i) => (i.stockKg ?? 0) <= 0 && (i.stockGrams ?? 0) <= 0).length,
    [items]
  );
  const existingNames = useMemo(() => items.map((i) => i.nameEn), [items]);

  // Synchronize modal state item reference when items update
  useEffect(() => {
    if (quickModalItem) {
      const refreshed = items.find((i) => i.id === quickModalItem.id);
      if (refreshed) {
        setQuickModalItem(refreshed);
      }
    }
  }, [items, quickModalItem]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Soft Green Gradient Accent Header Background */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height={260}>
          <Defs>
            <SvgGradient id="stockAccentGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#E8F5EC" />
              <Stop offset="100%" stopColor="#FFFFFF" />
            </SvgGradient>
          </Defs>
          <Rect width="100%" height={260} fill="url(#stockAccentGrad)" />
        </Svg>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#047A36']} />}
      >
        {/* Screen Header - Aligned to exact vertical position & typography of Earnings & Profile */}
        <Text style={styles.screenTitle}>Stock</Text>

        {/* 1. Boxes of Active Inventory & Out of Stock (Clean single-line label & number with background watermark icon) */}
        <View style={styles.metricsRow}>
          {/* Active Inventory Box */}
          <View style={styles.metricBoxActive}>
            <View style={styles.metricBgWatermark} pointerEvents="none">
              <Ionicons name="checkmark-circle" size={44} color="#047A36" style={{ opacity: 0.14 }} />
            </View>
            <Text style={styles.metricLabelActive}>Active in Stock</Text>
            <Text style={styles.metricValActive}>{inStockCount}</Text>
          </View>

          {/* Out of Inventory Box */}
          <View style={styles.metricBoxOut}>
            <View style={styles.metricBgWatermark} pointerEvents="none">
              <Ionicons name="alert-circle" size={44} color="#DC2626" style={{ opacity: 0.14 }} />
            </View>
            <Text style={styles.metricLabelOut}>Out of Stock</Text>
            <Text style={styles.metricValOut}>{outOfStockCount}</Text>
          </View>
        </View>

        {/* 2. Single Line Left-to-Right Add Button */}
        <TouchableOpacity
          style={styles.addProduceBtn}
          onPress={() => setIsMasterModalOpen(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.addProduceBtnText}>Add Vegetable, Fruit, Poultry or Meat, Dairy</Text>
        </TouchableOpacity>

        {/* 3. Limited Category Filter Pills: Strictly Vegetables, Fruits, Poultry or Meat, Dairy */}
        <View style={styles.categoryNavWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.categoryPillText, isSelected && styles.categoryPillTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Live Items Section Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Inventory Stock</Text>
          <Text style={styles.sectionCountText}>
            Showing {filteredItems.length} items
          </Text>
        </View>

        {loading && items.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#047A36" />
            <Text style={styles.loadingText}>Loading inventory...</Text>
          </View>
        ) : (
          filteredItems.map((item) => (
            <StockInventoryCard
              key={item.id}
              item={item}
              onAdjustWeight={handleAdjustWeight}
              onOpenQuickModal={(target) => setQuickModalItem(target)}
            />
          ))
        )}
      </ScrollView>

      {/* Floating Animated Toast Banner */}
      {toastMessage && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              transform: [{ translateY: toastAnim }],
              opacity: toastOpacity,
            },
          ]}
        >
          <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}

      {/* Quick Weight Adjuster Modal */}
      <QuickWeightAdjustModal
        visible={quickModalItem !== null}
        item={quickModalItem}
        onClose={() => setQuickModalItem(null)}
        onApplyWeightChange={(deltaKg, deltaGrams) => {
          if (quickModalItem) {
            handleAdjustWeight(quickModalItem.id, deltaKg, deltaGrams);
          }
        }}
      />

      {/* Master Catalogue Database Modal */}
      <AddMasterCatalogueModal
        visible={isMasterModalOpen}
        existingItemNames={existingNames}
        onClose={() => setIsMasterModalOpen(false)}
        onAddItem={handleAddItemFromCatalogue}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  screenTitle: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 26,
    fontWeight: '800',
    color: '#111117',
    marginTop: 16,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  metricBoxActive: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#047A36',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  metricBoxOut: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  metricBgWatermark: {
    position: 'absolute',
    left: 8,
    top: '50%',
    transform: [{ translateY: -22 }],
    zIndex: 0,
  },
  metricValActive: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 20,
    fontWeight: '800',
    color: '#047A36',
  },
  metricValOut: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 20,
    fontWeight: '800',
    color: '#DC2626',
  },
  metricLabelActive: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1F2937',
  },
  metricLabelOut: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#6B7280',
  },
  addProduceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#047A36',
    borderRadius: 14,
    height: 48,
    marginBottom: 16,
    shadowColor: '#047A36',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 3,
  },
  addProduceBtnText: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  categoryNavWrapper: {
    paddingVertical: 2,
    marginBottom: 14,
  },
  categoryScroll: {
    paddingHorizontal: 0,
    gap: 8,
  },
  categoryPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryPillActive: {
    backgroundColor: '#047A36',
    borderColor: '#047A36',
    shadowColor: '#047A36',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryPillText: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 16,
    fontWeight: '800',
    color: '#111117',
    letterSpacing: -0.2,
  },
  sectionCountText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8ECF2',
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1,
  },
  cardOutOfStock: {
    opacity: 0.72,
    backgroundColor: '#FAFAFA',
  },
  topCardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  imgWrapper: {
    marginRight: 12,
    marginTop: 1,
  },
  itemImg: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  imgPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameAndPriceCol: {
    flex: 1,
    marginRight: 8,
  },
  itemName: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 16.5,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  itemCategoryUnit: {
    fontSize: 13.5,
    color: '#334155',
    marginTop: 2,
    fontWeight: '600',
  },
  priceText: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 20,
    fontWeight: '800',
    color: '#047A36',
    marginTop: 3,
  },
  priceUnitText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  totalStockBadge: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginTop: 1,
  },
  totalStockBadgeOut: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  totalStockBadgeText: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 13,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: -0.2,
  },
  totalStockBadgeTextOut: {
    color: '#DC2626',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  unitControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dualMetricRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  metricCol: {
    flex: 1,
  },
  stepperColLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 5,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  gramsLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  quickModalLink: {
    fontSize: 11,
    fontWeight: '800',
    color: '#047A36',
    textDecorationLine: 'underline',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 4,
    paddingVertical: 3,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  stepperBtnDisabled: {
    backgroundColor: '#F1F5F9',
    opacity: 0.45,
  },
  stepperValBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    minHeight: 28,
  },
  stepperNum: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  stepperNumOut: {
    color: '#EF4444',
  },
  stepperUnitLabel: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  quickChipsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    alignItems: 'center',
  },
  quickChipBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 5,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickChipText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#334155',
  },
  quickChipHighlightBtn: {
    flex: 1.4,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingVertical: 5,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickChipHighlightText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#047A36',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 12,
    color: '#64748B',
  },
  toastContainer: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 999,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalItemSnapshot: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalItemImg: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  modalItemPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalItemName: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalItemCat: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  modalLiveBadge: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalLiveBadgeLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#047A36',
  },
  modalLiveBadgeVal: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 12,
    fontWeight: '900',
    color: '#047A36',
    marginTop: 1,
  },
  modalSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 8,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  modalChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  modalDeductChip: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalDeductChipText: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 12,
    fontWeight: '800',
    color: '#DC2626',
  },
  modalAddChip: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalAddChipText: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
  },
  modalAddChipHighlight: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  modalAddChipHighlightText: {
    color: '#047A36',
  },
  modalInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  modalGramInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalDeductActionBtn: {
    backgroundColor: '#FEE2E2',
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDeductActionText: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 12,
    fontWeight: '800',
    color: '#DC2626',
  },
  modalAddActionBtn: {
    backgroundColor: '#DCFCE7',
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalAddActionText: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 12,
    fontWeight: '800',
    color: '#047A36',
  },
  modalDoneBtn: {
    backgroundColor: '#047A36',
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#047A36',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  modalDoneBtnText: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
