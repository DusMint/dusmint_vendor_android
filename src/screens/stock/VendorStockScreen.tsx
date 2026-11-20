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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient as SvgGradient, Stop, Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { dusmintApi } from '../../api-client/client';
import { VendorStockItem } from '../../api-client/types';
import { VendorAppFooter } from '../profile/widgets/VendorAppFooter';
import { AddMasterCatalogueModal } from './widgets/AddMasterCatalogueModal';

// Categories Filter - Limited strictly to Vegetables, Fruits, Poultry / Meat, Dairy
const CATEGORIES = ['All', 'Vegetables', 'Fruits', 'Poultry / Meat', 'Dairy'] as const;
type CategoryType = (typeof CATEGORIES)[number];

// Default Rich Store Inventory for Gupta Traders with live Kilos & Reserved quantities
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
    reservedKg: 1.4, // 1 kg 400 g reserved for active customer orders
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
    reservedKg: 2.0, // 2 kg reserved
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
    reservedKg: 0.8, // 800 g reserved
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
    reservedKg: 1.0, // 1 kg reserved
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
    reservedKg: 0, // 0 reserved
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
    reservedKg: 3.0, // 3 pouches reserved
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
    reservedKg: 0.4, // 400 g reserved
  },
  {
    id: 'stock-8',
    nameEn: 'Farm Fresh White Eggs',
    category: 'Poultry / Meat',
    unit: '6 pcs',
    pricePaise: 4800,
    mrpPaise: 5400,
    isInStock: true,
    photoUrl: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=200&q=80',
    stockKg: 20,
    reservedKg: 2.0,
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
    reservedKg: 0,
  },
  {
    id: 'stock-10',
    nameEn: 'Fresh Chicken Curry Cut',
    category: 'Poultry / Meat',
    unit: '500 g',
    pricePaise: 13000,
    mrpPaise: 15000,
    isInStock: true,
    photoUrl: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=200&q=80',
    stockKg: 10,
    reservedKg: 1.5,
  },
];

// Helper to format reserved weights cleanly (e.g. 1.4 -> "1 kg 400 g", 0.8 -> "800 g")
function formatReservedWeight(valKg?: number, unitStr: string = 'kg'): string {
  if (!valKg || valKg <= 0) return '0';
  if (unitStr.toLowerCase().includes('dozen') || unitStr.toLowerCase().includes('pc') || unitStr.toLowerCase().includes('ml')) {
    return `${valKg} ${unitStr}`;
  }
  const kg = Math.floor(valKg);
  const grams = Math.round((valKg - kg) * 1000);
  if (kg > 0 && grams > 0) return `${kg} kg ${grams} g`;
  if (kg > 0) return `${kg} kg`;
  return `${grams} g`;
}

// Single Live Inventory Stock Item Row
const StockInventoryCard: React.FC<{
  item: VendorStockItem;
  onAdjustStock: (id: string, delta: number) => void;
}> = React.memo(({ item, onAdjustStock }) => {
  const priceRupees = (item.pricePaise / 100).toFixed(0);
  const currentStock = item.stockKg ?? (item.isInStock ? 10 : 0);
  const isOutOfStock = currentStock <= 0 || !item.isInStock;
  const reservedText = formatReservedWeight(item.reservedKg, item.unit);
  const hasReserved = Boolean(item.reservedKg && item.reservedKg > 0);

  return (
    <View style={[styles.card, isOutOfStock && styles.cardOutOfStock]}>
      {/* Top Main Row: 1. Picture, 2. Name & Unit, 3. Price, 4. Stepper [- 1 +] */}
      <View style={styles.topCardRow}>
        {/* 1. Picture on the Left */}
        <View style={styles.imgWrapper}>
          {item.photoUrl ? (
            <Image source={{ uri: item.photoUrl }} style={styles.itemImg} resizeMode="cover" />
          ) : (
            <View style={styles.imgPlaceholder}>
              <Ionicons name="basket-outline" size={22} color="#047A36" />
            </View>
          )}
        </View>

        {/* 2. Product Name Beside It & 3. Price */}
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

        {/* 4. On the Right Side: Number Representing Total Kilos in format [- 1 +] */}
        <View style={styles.stepperContainer}>
          <TouchableOpacity
            style={[styles.stepperBtn, currentStock <= 0 && styles.stepperBtnDisabled]}
            onPress={() => onAdjustStock(item.id, -1)}
            disabled={currentStock <= 0}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="remove" size={16} color={currentStock <= 0 ? '#94A3B8' : '#0F172A'} />
          </TouchableOpacity>

          <View style={styles.stepperValBox}>
            <Text style={[styles.stepperNum, isOutOfStock && styles.stepperNumOut]}>
              {currentStock}
            </Text>
            <Text style={styles.stepperUnitLabel}>
              {item.unit.includes('dozen') ? 'doz' : item.unit.includes('pc') ? 'pcs' : 'kg'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.stepperBtn}
            onPress={() => onAdjustStock(item.id, 1)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="add" size={16} color="#047A36" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.cardDivider} />

      {/* Single Line Below Telling How Much is Reserved */}
      <View style={styles.reservedRow}>
        <View style={styles.reservedLeft}>
          <Ionicons
            name={hasReserved ? 'lock-closed' : 'checkmark-circle'}
            size={13}
            color={hasReserved ? '#D97706' : '#059669'}
            style={{ marginRight: 5 }}
          />
          <Text style={[styles.reservedText, hasReserved ? styles.reservedTextActive : styles.reservedTextClear]}>
            {hasReserved
              ? `${reservedText} reserved for active customer orders`
              : `All ${currentStock} available • 0 reserved`}
          </Text>
        </View>

        <View style={[styles.stockPill, isOutOfStock ? styles.stockPillOut : styles.stockPillIn]}>
          <Text style={[styles.stockPillText, isOutOfStock ? styles.stockPillTextOut : styles.stockPillTextIn]}>
            {isOutOfStock ? 'OUT OF STOCK' : 'LIVE'}
          </Text>
        </View>
      </View>
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
        // Merge server data with our rich local stockKg and photoUrl fields
        const merged = data.map((serverItem) => {
          const match = INITIAL_STORE_STOCK.find((d) => d.nameEn.toLowerCase() === serverItem.nameEn.toLowerCase());
          return {
            ...serverItem,
            stockKg: serverItem.stockKg ?? match?.stockKg ?? 15,
            reservedKg: serverItem.reservedKg ?? match?.reservedKg ?? 0,
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

  // Stepper increment / decrement (- 1 +)
  const handleAdjustStock = (itemId: string, delta: number) => {
    try {
      Vibration.vibrate(20);
    } catch {}

    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const cur = item.stockKg ?? (item.isInStock ? 10 : 0);
          const nextStock = Math.max(0, cur + delta);
          const nextInStock = nextStock > 0;
          return {
            ...item,
            stockKg: nextStock,
            isInStock: nextInStock,
          };
        }
        return item;
      })
    );

    const target = items.find((i) => i.id === itemId);
    if (target) {
      const cur = target.stockKg ?? 10;
      const nextStock = Math.max(0, cur + delta);
      showToast(`${target.nameEn}: ${nextStock} ${target.unit.includes('dozen') ? 'dozen' : 'kg'} in stock`);
      dusmintApi.updateVendorStock(itemId, { stockKg: nextStock, inStock: nextStock > 0 }).catch(() => {});
    }
  };

  // Add new item from Master Catalogue Database
  const handleAddItemFromCatalogue = (newItem: VendorStockItem) => {
    setItems((prev) => [newItem, ...prev]);
    showToast(`${newItem.nameEn} added (${newItem.stockKg} kg @ ₹${(newItem.pricePaise / 100).toFixed(0)})`);
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
  const inStockCount = useMemo(() => items.filter((i) => (i.stockKg ?? 1) > 0 && i.isInStock).length, [items]);
  const outOfStockCount = useMemo(() => items.filter((i) => (i.stockKg ?? 0) <= 0 || !i.isInStock).length, [items]);
  const existingNames = useMemo(() => items.map((i) => i.nameEn), [items]);

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
        {/* Screen Header - Exact font & vertical position as Earnings */}
        <Text style={styles.screenTitle}>Menu & Stock</Text>

        {/* 1. Boxes of Active Inventory & Out of Stock */}
        <View style={styles.metricsRow}>
          {/* Active Inventory Box */}
          <View style={styles.metricBoxActive}>
            <View style={styles.metricBoxTop}>
              <View style={styles.metricIconCircleActive}>
                <Ionicons name="checkmark-circle" size={18} color="#047A36" />
              </View>
              <Text style={styles.metricValActive}>{inStockCount}</Text>
            </View>
            <Text style={styles.metricLabelActive}>Active in Stock</Text>
          </View>

          {/* Out of Inventory Box */}
          <View style={styles.metricBoxOut}>
            <View style={styles.metricBoxTop}>
              <View style={styles.metricIconCircleOut}>
                <Ionicons name="alert-circle-outline" size={18} color="#DC2626" />
              </View>
              <Text style={styles.metricValOut}>{outOfStockCount}</Text>
            </View>
            <Text style={styles.metricLabelOut}>Out of Stock</Text>
          </View>
        </View>

        {/* 2. Single Line Left-to-Right Add Button (No extra descriptions) */}
        <TouchableOpacity
          style={styles.addProduceBtn}
          onPress={() => setIsMasterModalOpen(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.addProduceBtnText}>+ Add Vegetable, Fruit, Poultry or Dairy</Text>
        </TouchableOpacity>

        {/* 3. Limited Category Filter Pills - Clean, fully visible, zero overlap */}
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
              onAdjustStock={handleAdjustStock}
            />
          ))
        )}

        {/* App Version Footer */}
        <VendorAppFooter version="1.0.0" build="42" />
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
    marginVertical: 16,
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
    borderRadius: 18,
    padding: 14,
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
    borderRadius: 18,
    padding: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  metricBoxTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  metricIconCircleActive: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricIconCircleOut: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValActive: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 22,
    fontWeight: '800',
    color: '#047A36',
  },
  metricValOut: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 22,
    fontWeight: '800',
    color: '#DC2626',
  },
  metricLabelActive: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1F2937',
  },
  metricLabelOut: {
    fontSize: 12.5,
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
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  categoryNavWrapper: {
    paddingVertical: 2,
    marginBottom: 12,
  },
  categoryScroll: {
    paddingHorizontal: 0,
    gap: 8,
  },
  categoryPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 8,
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
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569',
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
    marginBottom: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardOutOfStock: {
    opacity: 0.72,
    backgroundColor: '#FAFAFA',
  },
  topCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  imgWrapper: {
    marginRight: 12,
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
    marginRight: 10,
  },
  itemName: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  itemCategoryUnit: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  priceText: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 15,
    fontWeight: '800',
    color: '#047A36',
    marginTop: 3,
  },
  priceUnitText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 4,
    paddingVertical: 3,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 10,
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
    opacity: 0.5,
  },
  stepperValBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    minWidth: 44,
  },
  stepperNum: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  stepperNumOut: {
    color: '#EF4444',
  },
  stepperUnitLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  reservedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reservedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  reservedText: {
    fontSize: 11.5,
    fontWeight: '600',
    flex: 1,
  },
  reservedTextActive: {
    color: '#B45309',
  },
  reservedTextClear: {
    color: '#059669',
  },
  stockPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  stockPillIn: {
    backgroundColor: '#ECFDF5',
  },
  stockPillOut: {
    backgroundColor: '#FEE2E2',
  },
  stockPillText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  stockPillTextIn: {
    color: '#047857',
  },
  stockPillTextOut: {
    color: '#DC2626',
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
});
