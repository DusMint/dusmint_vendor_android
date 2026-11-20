import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Animated,
  Vibration,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient as SvgGradient, Stop, Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { dusmintApi } from '../../api-client/client';
import { VendorStockItem } from '../../api-client/types';
import { VendorAppFooter } from '../profile/widgets/VendorAppFooter';

// Category Definitions
const CATEGORIES = ['All', 'Vegetables', 'Fruits', 'Staples', 'Dairy'] as const;
type CategoryType = (typeof CATEGORIES)[number];

// Default Rich Catalogue for Gupta Traders
const DEFAULT_STOCK_ITEMS: VendorStockItem[] = [
  {
    id: 'stock-1',
    nameEn: 'Fresh Desi Tomato',
    category: 'Vegetables',
    unit: '1 kg',
    pricePaise: 3500,
    mrpPaise: 4500,
    isInStock: true,
  },
  {
    id: 'stock-2',
    nameEn: 'Indore Jyoti Potato',
    category: 'Vegetables',
    unit: '1 kg',
    pricePaise: 2500,
    mrpPaise: 3200,
    isInStock: true,
  },
  {
    id: 'stock-3',
    nameEn: 'Nashik Red Onion',
    category: 'Vegetables',
    unit: '1 kg',
    pricePaise: 3800,
    mrpPaise: 4800,
    isInStock: true,
  },
  {
    id: 'stock-4',
    nameEn: 'Fresh Green Coriander',
    category: 'Vegetables',
    unit: '100 g',
    pricePaise: 1200,
    mrpPaise: 1800,
    isInStock: true,
  },
  {
    id: 'stock-5',
    nameEn: 'Shimla Green Apple',
    category: 'Fruits',
    unit: '1 kg',
    pricePaise: 14000,
    mrpPaise: 18000,
    isInStock: true,
  },
  {
    id: 'stock-6',
    nameEn: 'Robusta Banana',
    category: 'Fruits',
    unit: '1 dozen',
    pricePaise: 4500,
    mrpPaise: 6000,
    isInStock: true,
  },
  {
    id: 'stock-7',
    nameEn: 'Nagpur Sweet Orange',
    category: 'Fruits',
    unit: '1 kg',
    pricePaise: 6500,
    mrpPaise: 8500,
    isInStock: false,
  },
  {
    id: 'stock-8',
    nameEn: 'Aashirvaad Shudh Chakki Atta',
    category: 'Staples',
    unit: '5 kg',
    pricePaise: 24500,
    mrpPaise: 27500,
    isInStock: true,
  },
  {
    id: 'stock-9',
    nameEn: 'Daawat Rozana Basmati Rice',
    category: 'Staples',
    unit: '1 kg',
    pricePaise: 8500,
    mrpPaise: 11000,
    isInStock: true,
  },
  {
    id: 'stock-10',
    nameEn: 'Tata Salt Iodized',
    category: 'Staples',
    unit: '1 kg',
    pricePaise: 2800,
    mrpPaise: 3000,
    isInStock: true,
  },
  {
    id: 'stock-11',
    nameEn: 'Amul Taaza Toned Milk',
    category: 'Dairy',
    unit: '500 ml',
    pricePaise: 2700,
    mrpPaise: 2800,
    isInStock: true,
  },
  {
    id: 'stock-12',
    nameEn: 'Amul Pasteurised Butter',
    category: 'Dairy',
    unit: '100 g',
    pricePaise: 5600,
    mrpPaise: 6000,
    isInStock: true,
  },
];

// Modern Sliding Toggle Row for each Stock Item
const StockItemCard: React.FC<{
  item: VendorStockItem;
  onToggle: (id: string, current: boolean) => void;
}> = React.memo(({ item, onToggle }) => {
  const animValue = useRef(new Animated.Value(item.isInStock ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(animValue, {
      toValue: item.isInStock ? 1 : 0,
      tension: 65,
      friction: 8,
      useNativeDriver: false,
    }).start();
  }, [item.isInStock, animValue]);

  const handlePress = () => {
    try {
      Vibration.vibrate(25);
    } catch {}
    onToggle(item.id, item.isInStock);
  };

  const trackBgColor = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#E2E8F0', '#047A36'],
  });

  const thumbTranslateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2.5, 23.5],
  });

  const priceRupees = (item.pricePaise / 100).toFixed(0);
  const mrpRupees = item.mrpPaise ? (item.mrpPaise / 100).toFixed(0) : null;

  // Icon based on category
  const getCategoryIcon = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'vegetables':
        return 'leaf-outline';
      case 'fruits':
        return 'nutrition-outline';
      case 'staples':
        return 'cube-outline';
      case 'dairy':
        return 'water-outline';
      default:
        return 'basket-outline';
    }
  };

  return (
    <View style={[styles.card, !item.isInStock && styles.outOfStockCard]}>
      <View style={styles.cardLeft}>
        {/* Category Outline Icon matching VendorOptionsCard style */}
        <View style={styles.iconCircle}>
          <Ionicons name={getCategoryIcon(item.category) as any} size={20} color="#0F172A" />
        </View>

        <View style={styles.infoCol}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.nameEn}
          </Text>
          <Text style={styles.itemMeta}>
            {item.unit} • {item.category}
          </Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceText}>₹{priceRupees}</Text>
            {mrpRupees && <Text style={styles.mrpText}>MRP ₹{mrpRupees}</Text>}
          </View>
        </View>
      </View>

      <View style={styles.cardRight}>
        <Text style={[styles.stockStatusText, item.isInStock ? styles.statusInStock : styles.statusOut]}>
          {item.isInStock ? 'IN STOCK' : 'OUT'}
        </Text>

        {/* Custom Modern Sliding Toggle */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handlePress}
          style={styles.toggleWrapper}
          accessibilityRole="switch"
          accessibilityState={{ checked: item.isInStock }}
          accessibilityLabel={`Toggle ${item.nameEn} stock status`}
        >
          <Animated.View style={[styles.toggleTrack, { backgroundColor: trackBgColor }]}>
            <Animated.View
              style={[
                styles.toggleThumb,
                { transform: [{ translateX: thumbTranslateX }] },
              ]}
            />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );
});

export const VendorStockScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<VendorStockItem[]>(DEFAULT_STOCK_ITEMS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('All');
  const [searchQuery, setSearchQuery] = useState('');

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
    }, 2200);
  }, [toastAnim, toastOpacity]);

  // Load Vendor Catalogue Items
  const loadStock = useCallback(async () => {
    try {
      const data = await dusmintApi.getVendorStock();
      if (data && data.length > 0) {
        setItems(data);
      } else {
        setItems(DEFAULT_STOCK_ITEMS);
      }
    } catch {
      setItems(DEFAULT_STOCK_ITEMS);
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

  // Toggle In-Stock / Out of Stock
  const handleToggleStock = async (itemId: string, currentVal: boolean) => {
    const newVal = !currentVal;
    const targetItem = items.find((i) => i.id === itemId);
    const itemName = targetItem ? targetItem.nameEn : 'Item';

    // Optimistic UI update
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, isInStock: newVal } : item))
    );
    showToast(`${itemName} marked ${newVal ? 'In Stock' : 'Out of Stock'}`);

    try {
      await dusmintApi.updateVendorStock(itemId, { inStock: newVal });
    } catch (err) {
      console.warn('Stock update API warning:', err);
    }
  };

  // Filtered catalogue based on category and search query
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory =
        selectedCategory === 'All' ||
        item.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch =
        searchQuery.trim().length === 0 ||
        item.nameEn.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase().trim());
      return matchesCategory && matchesSearch;
    });
  }, [items, selectedCategory, searchQuery]);

  // Summary Metrics
  const inStockCount = useMemo(() => items.filter((i) => i.isInStock).length, [items]);
  const outOfStockCount = useMemo(() => items.filter((i) => !i.isInStock).length, [items]);

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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#047A36']} />
        }
      >
        {/* Screen Header - Exact font & vertical position as Earnings and Profile */}
        <View style={styles.headerRow}>
          <Text style={styles.screenTitle}>Menu & Stock</Text>
          <View style={styles.badgeTotal}>
            <Text style={styles.badgeTotalText}>{items.length} Total Items</Text>
          </View>
        </View>

        {/* 2 Metric Cards Row (Best of Earnings & Profile design) */}
        <View style={styles.metricRow}>
          <View style={styles.metricCard}>
            <View style={styles.metricIconBox}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#047A36" />
            </View>
            <Text style={styles.metricLabel}>ACTIVE IN STOCK</Text>
            <Text style={styles.metricValue}>{inStockCount}</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIconBox, { backgroundColor: '#F3F4F6' }]}>
              <Ionicons name="pause-circle-outline" size={20} color="#64748B" />
            </View>
            <Text style={styles.metricLabel}>OUT OF STOCK</Text>
            <Text style={styles.metricValue}>{outOfStockCount}</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search menu or stock items..."
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Filter Pills (Horizontal Scroll) */}
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
                activeOpacity={0.75}
                style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
              >
                <Text style={[styles.categoryPillText, isSelected && styles.categoryPillTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Items List Heading */}
        <View style={styles.listHeaderRow}>
          <Text style={styles.sectionTitle}>Catalogue Items</Text>
          <Text style={styles.sectionCountText}>
            Showing {filteredItems.length} of {items.length}
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#047A36" />
            <Text style={styles.loadingText}>Fetching catalogue items...</Text>
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="basket-outline" size={32} color="#94A3B8" style={{ marginBottom: 8 }} />
            <Text style={styles.emptyTitle}>No matching items found</Text>
            <Text style={styles.emptySub}>Try searching for another keyword or change category filter.</Text>
          </View>
        ) : (
          filteredItems.map((item) => (
            <StockItemCard key={item.id} item={item} onToggle={handleToggleStock} />
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
  screenTitle: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 26,
    fontWeight: '800',
    color: '#111117',
    letterSpacing: -0.5,
  },
  badgeTotal: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  badgeTotalText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047A36',
  },
  metricRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8ECF2',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#047A36',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  metricIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
    textAlign: 'center',
  },
  metricValue: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 22,
    fontWeight: '800',
    color: '#111117',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8ECF2',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 46,
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500',
  },
  categoryScroll: {
    paddingBottom: 16,
    gap: 8,
  },
  categoryPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
  },
  categoryPillActive: {
    backgroundColor: '#047A36',
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 17,
    fontWeight: '800',
    color: '#111117',
    letterSpacing: -0.2,
  },
  sectionCountText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8ECF2',
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  outOfStockCard: {
    opacity: 0.72,
    backgroundColor: '#FAFAFA',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  infoCol: {
    flex: 1,
  },
  itemName: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  itemMeta: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  priceText: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 15,
    fontWeight: '800',
    color: '#047A36',
  },
  mrpText: {
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  cardRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockStatusText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statusInStock: {
    color: '#047A36',
  },
  statusOut: {
    color: '#94A3B8',
  },
  toggleWrapper: {
    padding: 2,
  },
  toggleTrack: {
    width: 50,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
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
  emptyCard: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#374151',
  },
  emptySub: {
    fontSize: 11.5,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 240,
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
