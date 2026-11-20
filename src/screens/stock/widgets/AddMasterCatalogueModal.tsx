import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Vibration,
  StatusBar,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient as SvgGradient, Stop, Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { VendorStockItem } from '../../../api-client/types';

export type MasterCategory = 'Vegetables' | 'Fruits' | 'Meat' | 'Dairy';

export interface MasterCatalogueItem {
  id: string;
  nameEn: string;
  category: MasterCategory;
  unit: string;
  defaultPricePaise: number;
  mrpPaise: number;
  mandiRateText: string;
  photoUrl: string;
}

const MASTER_PRODUCE_DATABASE: MasterCatalogueItem[] = [
  // --- Vegetables ---
  {
    id: 'master-veg-1',
    nameEn: 'Desi Hybrid Tomato',
    category: 'Vegetables',
    unit: '1 kg',
    defaultPricePaise: 3500,
    mrpPaise: 4500,
    mandiRateText: '₹28 – ₹38 / kg',
    photoUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=200&q=80',
  },
  {
    id: 'master-veg-2',
    nameEn: 'Nashik Red Onion',
    category: 'Vegetables',
    unit: '1 kg',
    defaultPricePaise: 3800,
    mrpPaise: 4800,
    mandiRateText: '₹32 – ₹42 / kg',
    photoUrl: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=200&q=80',
  },
  {
    id: 'master-veg-3',
    nameEn: 'Indore Jyoti Potato',
    category: 'Vegetables',
    unit: '1 kg',
    defaultPricePaise: 2500,
    mrpPaise: 3200,
    mandiRateText: '₹20 – ₹28 / kg',
    photoUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=200&q=80',
  },
  {
    id: 'master-veg-4',
    nameEn: 'Fresh Green Spinach',
    category: 'Vegetables',
    unit: '250 g',
    defaultPricePaise: 1800,
    mrpPaise: 2400,
    mandiRateText: '₹14 – ₹20 / bunch',
    photoUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=200&q=80',
  },
  {
    id: 'master-veg-5',
    nameEn: 'Fresh Cauliflower',
    category: 'Vegetables',
    unit: '1 piece ~500g',
    defaultPricePaise: 3000,
    mrpPaise: 3800,
    mandiRateText: '₹24 – ₹34 / pc',
    photoUrl: 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=200&q=80',
  },
  {
    id: 'master-veg-6',
    nameEn: 'Orange Crunchy Carrots',
    category: 'Vegetables',
    unit: '500 g',
    defaultPricePaise: 2500,
    mrpPaise: 3200,
    mandiRateText: '₹20 – ₹28 / 500g',
    photoUrl: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5c317?w=200&q=80',
  },
  {
    id: 'master-veg-7',
    nameEn: 'Hot Green Chillies',
    category: 'Vegetables',
    unit: '100 g',
    defaultPricePaise: 1200,
    mrpPaise: 1600,
    mandiRateText: '₹10 – ₹15 / 100g',
    photoUrl: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=200&q=80',
  },
  {
    id: 'master-veg-8',
    nameEn: 'Fresh Coriander Bunch',
    category: 'Vegetables',
    unit: '100 g',
    defaultPricePaise: 1200,
    mrpPaise: 1800,
    mandiRateText: '₹10 – ₹14 / bunch',
    photoUrl: 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?w=200&q=80',
  },
  {
    id: 'master-veg-9',
    nameEn: 'Fresh Green Capsicum',
    category: 'Vegetables',
    unit: '500 g',
    defaultPricePaise: 3500,
    mrpPaise: 4500,
    mandiRateText: '₹28 – ₹38 / 500g',
    photoUrl: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=200&q=80',
  },
  {
    id: 'master-veg-10',
    nameEn: 'Fresh Bottle Gourd',
    category: 'Vegetables',
    unit: '1 piece ~1kg',
    defaultPricePaise: 3200,
    mrpPaise: 4000,
    mandiRateText: '₹25 – ₹35 / pc',
    photoUrl: 'https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=200&q=80',
  },

  // --- Fruits ---
  {
    id: 'master-fruit-1',
    nameEn: 'Shimla Royal Apple',
    category: 'Fruits',
    unit: '1 kg',
    defaultPricePaise: 14000,
    mrpPaise: 18000,
    mandiRateText: '₹120 – ₹160 / kg',
    photoUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=200&q=80',
  },
  {
    id: 'master-fruit-2',
    nameEn: 'Robusta Golden Banana',
    category: 'Fruits',
    unit: '1 dozen',
    defaultPricePaise: 4500,
    mrpPaise: 6000,
    mandiRateText: '₹38 – ₹50 / doz',
    photoUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=200&q=80',
  },
  {
    id: 'master-fruit-3',
    nameEn: 'Nagpur Sweet Orange',
    category: 'Fruits',
    unit: '1 kg',
    defaultPricePaise: 6500,
    mrpPaise: 8500,
    mandiRateText: '₹55 – ₹75 / kg',
    photoUrl: 'https://images.unsplash.com/photo-1547514701-42782101795e?w=200&q=80',
  },
  {
    id: 'master-fruit-4',
    nameEn: 'Ratnagiri Alphonso Mango',
    category: 'Fruits',
    unit: '1 kg',
    defaultPricePaise: 28000,
    mrpPaise: 35000,
    mandiRateText: '₹240 – ₹320 / kg',
    photoUrl: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=200&q=80',
  },
  {
    id: 'master-fruit-5',
    nameEn: 'Seedless Black Grapes',
    category: 'Fruits',
    unit: '500 g',
    defaultPricePaise: 6000,
    mrpPaise: 8000,
    mandiRateText: '₹50 – ₹70 / 500g',
    photoUrl: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=200&q=80',
  },
  {
    id: 'master-fruit-6',
    nameEn: 'Fresh Ruby Pomegranate',
    category: 'Fruits',
    unit: '1 kg',
    defaultPricePaise: 16000,
    mrpPaise: 20000,
    mandiRateText: '₹140 – ₹180 / kg',
    photoUrl: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=200&q=80',
  },

  // --- Milk & Dairy ---
  {
    id: 'master-dairy-1',
    nameEn: 'Full Cream Fresh Milk Pouch',
    category: 'Dairy',
    unit: '500 ml',
    defaultPricePaise: 3400,
    mrpPaise: 3400,
    mandiRateText: '₹34 MRP standard',
    photoUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200&q=80',
  },
  {
    id: 'master-dairy-2',
    nameEn: 'Toned Fresh Milk Pouch',
    category: 'Dairy',
    unit: '1 L',
    defaultPricePaise: 5800,
    mrpPaise: 6000,
    mandiRateText: '₹56 – ₹60 / L',
    photoUrl: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=200&q=80',
  },
  {
    id: 'master-dairy-3',
    nameEn: 'Fresh Malai Paneer Block',
    category: 'Dairy',
    unit: '200 g',
    defaultPricePaise: 8500,
    mrpPaise: 9500,
    mandiRateText: '₹75 – ₹90 / 200g',
    photoUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=200&q=80',
  },
  {
    id: 'master-dairy-4',
    nameEn: 'Fresh Malai Dahi Curd',
    category: 'Dairy',
    unit: '400 g',
    defaultPricePaise: 4200,
    mrpPaise: 4500,
    mandiRateText: '₹38 – ₹45 / 400g',
    photoUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=200&q=80',
  },
  {
    id: 'master-dairy-5',
    nameEn: 'Fresh White Table Butter',
    category: 'Dairy',
    unit: '100 g',
    defaultPricePaise: 5600,
    mrpPaise: 6000,
    mandiRateText: '₹50 – ₹60 / 100g',
    photoUrl: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=200&q=80',
  },

  // --- Meat ---
  {
    id: 'master-meat-1',
    nameEn: 'Fresh Chicken Curry Cut',
    category: 'Meat',
    unit: '500 g',
    defaultPricePaise: 13000,
    mrpPaise: 15000,
    mandiRateText: '₹120 – ₹140 / 500g',
    photoUrl: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=200&q=80',
  },
  {
    id: 'master-meat-2',
    nameEn: 'Tender Chicken Breast Boneless',
    category: 'Meat',
    unit: '500 g',
    defaultPricePaise: 18000,
    mrpPaise: 21000,
    mandiRateText: '₹170 – ₹200 / 500g',
    photoUrl: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=200&q=80',
  },
  {
    id: 'master-meat-3',
    nameEn: 'Fresh Mutton Curry Cut',
    category: 'Meat',
    unit: '500 g',
    defaultPricePaise: 39000,
    mrpPaise: 44000,
    mandiRateText: '₹370 – ₹420 / 500g',
    photoUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=200&q=80',
  },
  {
    id: 'master-meat-4',
    nameEn: 'Farm Fresh White Eggs',
    category: 'Meat',
    unit: '6 pcs',
    defaultPricePaise: 4800,
    mrpPaise: 5400,
    mandiRateText: '₹44 – ₹52 / 6pcs',
    photoUrl: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=200&q=80',
  },
  {
    id: 'master-meat-5',
    nameEn: 'Rohu Fresh Fish Cut',
    category: 'Meat',
    unit: '500 g',
    defaultPricePaise: 16000,
    mrpPaise: 19000,
    mandiRateText: '₹150 – ₹180 / 500g',
    photoUrl: 'https://images.unsplash.com/photo-1534043464124-3be32fe00099?w=200&q=80',
  },
];

const MASTER_CATEGORIES = ['All', 'Vegetables', 'Fruits', 'Meat', 'Dairy'] as const;

interface Props {
  visible: boolean;
  existingItemNames: string[];
  onClose: () => void;
  onAddItem: (item: VendorStockItem) => void;
}

export const AddMasterCatalogueModal: React.FC<Props> = ({
  visible,
  existingItemNames,
  onClose,
  onAddItem,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Config Dialogue state when + Add is pressed on an item
  const [configuringItem, setConfiguringItem] = useState<MasterCatalogueItem | null>(null);
  const [sellingPriceStr, setSellingPriceStr] = useState('');
  const [initialKg, setInitialKg] = useState(20);

  // Filtered Master Database Items - Auto-sorted alphabetically from A to Z
  const filteredCatalogue = useMemo(() => {
    const list = MASTER_PRODUCE_DATABASE.filter((item) => {
      // 1. Category Filter
      if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }

      // 2. Search Query
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        return item.nameEn.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
      }

      return true;
    });

    // Auto-sorted alphabetically from A to Z
    return list.sort((a, b) => a.nameEn.localeCompare(b.nameEn));
  }, [selectedCategory, searchQuery]);

  // Open config dialog when + Add button is tapped
  const handleOpenConfigDialog = (item: MasterCatalogueItem) => {
    try {
      Vibration.vibrate(20);
    } catch {}
    setConfiguringItem(item);
    setSellingPriceStr((item.defaultPricePaise / 100).toString());
    setInitialKg(20);
  };

  // Confirm and Add to Store
  const handleConfirmAdd = () => {
    if (!configuringItem) return;

    const pricePaise = Math.round((parseFloat(sellingPriceStr) || configuringItem.defaultPricePaise / 100) * 100);
    const finalStock = Math.max(1, initialKg);

    const newStockItem: VendorStockItem = {
      id: `stock-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      nameEn: configuringItem.nameEn,
      category: configuringItem.category,
      unit: configuringItem.unit,
      pricePaise,
      mrpPaise: configuringItem.mrpPaise,
      isInStock: finalStock > 0,
      photoUrl: configuringItem.photoUrl,
      stockKg: finalStock,
      stockGrams: 0,
    };

    onAddItem(newStockItem);
    setConfiguringItem(null);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" />

        {/* Soft Green Gradient Accent Header Background */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Svg width="100%" height={260}>
            <Defs>
              <SvgGradient id="masterGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#E8F5EC" />
                <Stop offset="100%" stopColor="#FFFFFF" />
              </SvgGradient>
            </Defs>
            <Rect width="100%" height={260} fill="url(#masterGrad)" />
          </Svg>
        </View>

        {/* Header Row - Aligned to exact vertical position & typography of Earnings and Menu & Stock */}
        <View style={styles.headerRow}>
          <Text style={styles.screenTitle} numberOfLines={1} adjustsFontSizeToFit>
            Master Produce Catalogue
          </Text>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={22} color="#111117" />
          </TouchableOpacity>
        </View>

        {/* Search Input Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#0F172A" style={{ marginRight: 8 }} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search vegetable, fruit, poultry, dairy..."
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Filter Navigation Bar - Fully visible, zero overlap */}
        <View style={styles.categoryNavWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {MASTER_CATEGORIES.map((cat) => {
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

        {/* Items Master List (Auto-sorted A-Z) */}
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.resultsCount}>
            Found {filteredCatalogue.length} matching items
          </Text>

          {filteredCatalogue.map((item) => {
            const isAlreadyAdded = existingItemNames.some(
              (n) => n.toLowerCase().trim() === item.nameEn.toLowerCase().trim()
            );

            return (
              <View key={item.id} style={styles.itemRow}>
                {/* 1. Picture on Left */}
                <Image
                  source={{ uri: item.photoUrl }}
                  style={styles.itemImg}
                  resizeMode="cover"
                />

                {/* 2. Item Name & Category Beside It */}
                <View style={styles.itemInfo}>
                  <Text style={styles.itemNameText}>{item.nameEn}</Text>
                  <Text style={styles.itemCategoryText}>{item.category}</Text>
                </View>

                {/* 3. Add Button on Right */}
                <TouchableOpacity
                  style={[styles.addBtn, isAlreadyAdded && styles.addBtnDone]}
                  onPress={() => (isAlreadyAdded ? null : handleOpenConfigDialog(item))}
                  disabled={isAlreadyAdded}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={isAlreadyAdded ? 'checkmark-circle' : 'add'}
                    size={16}
                    color={isAlreadyAdded ? '#047A36' : '#FFFFFF'}
                    style={{ marginRight: 3 }}
                  />
                  <Text style={[styles.addBtnText, isAlreadyAdded && styles.addBtnTextDone]}>
                    {isAlreadyAdded ? 'Added' : 'Add'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
          <View style={{ height: 60 }} />
        </ScrollView>

        {/* --- Custom Dialogue Box Modal to Set Price & Inventory --- */}
        <Modal
          visible={Boolean(configuringItem)}
          transparent
          animationType="fade"
          onRequestClose={() => setConfiguringItem(null)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.dialogBackdrop}
          >
            <View style={styles.dialogCard}>
              <View style={styles.dialogHeader}>
                <Text style={styles.dialogTitle}>Add to Store Inventory</Text>
                <TouchableOpacity
                  style={styles.dialogCloseBtn}
                  onPress={() => setConfiguringItem(null)}
                >
                  <Ionicons name="close" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              {configuringItem && (
                <View style={styles.dialogItemPreview}>
                  <Image source={{ uri: configuringItem.photoUrl }} style={styles.dialogImg} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.dialogItemName}>{configuringItem.nameEn}</Text>
                    <Text style={styles.dialogItemMeta}>{configuringItem.category}</Text>
                  </View>
                </View>
              )}

              {/* Input 1: Set Selling Rate */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Your Selling Rate (₹)</Text>
                <View style={styles.textInputBox}>
                  <Text style={styles.rupeePrefix}>₹</Text>
                  <TextInput
                    value={sellingPriceStr}
                    onChangeText={setSellingPriceStr}
                    keyboardType="numeric"
                    style={styles.modalTextInput}
                    placeholder="e.g. 35"
                  />
                </View>
              </View>

              {/* Input 2: Set Initial Stock (Direct and Clean for Tier 3/4 Vendors) */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Initial Stock</Text>
                <View style={styles.simpleStockRow}>
                  <TouchableOpacity
                    style={styles.stockStepBtn}
                    onPress={() => setInitialKg((prev) => Math.max(1, prev - 1))}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="remove" size={20} color="#0F172A" />
                  </TouchableOpacity>

                  <TextInput
                    value={initialKg.toString()}
                    onChangeText={(t) => setInitialKg(Math.max(0, parseInt(t, 10) || 0))}
                    keyboardType="numeric"
                    style={styles.simpleStockInput}
                  />

                  <TouchableOpacity
                    style={styles.stockStepBtn}
                    onPress={() => setInitialKg((prev) => prev + 1)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={20} color="#0F172A" />
                  </TouchableOpacity>

                  <View style={styles.stockUnitBadge}>
                    <Text style={styles.stockUnitText}>
                      {configuringItem?.unit?.toLowerCase().includes('dozen')
                        ? 'Dozen'
                        : configuringItem?.unit?.toLowerCase().includes('pc') || configuringItem?.unit?.toLowerCase().includes('piece')
                        ? 'Pieces'
                        : 'Kg'}
                    </Text>
                  </View>
                </View>

                {/* Quick Add Presets (5, 10, 20, 50) */}
                <View style={styles.quickPresetRow}>
                  {[5, 10, 20, 50].map((amt) => {
                    const isSelected = initialKg === amt;
                    const unitSuffix = configuringItem?.unit?.toLowerCase().includes('dozen')
                      ? 'doz'
                      : configuringItem?.unit?.toLowerCase().includes('pc') || configuringItem?.unit?.toLowerCase().includes('piece')
                      ? 'pcs'
                      : 'kg';
                    return (
                      <TouchableOpacity
                        key={amt}
                        style={[styles.presetChip, isSelected && styles.presetChipActive]}
                        onPress={() => setInitialKg(amt)}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.presetChipText, isSelected && styles.presetChipTextActive]}>
                          {amt} {unitSuffix}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Confirm Button */}
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleConfirmAdd}
                activeOpacity={0.85}
              >
                <Text style={styles.confirmBtnText}>Confirm & Add to Inventory</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    marginTop: 16,
    marginBottom: 16,
  },
  screenTitle: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 26,
    fontWeight: '800',
    color: '#111117',
    letterSpacing: -0.5,
    flex: 1,
    marginRight: 10,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    marginHorizontal: 20,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
    shadowColor: '#047A36',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  categoryNavWrapper: {
    paddingVertical: 2,
    marginBottom: 10,
  },
  categoryScroll: {
    paddingHorizontal: 20,
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
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  resultsCount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  itemImg: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  itemNameText: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 16.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  itemCategoryText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#047A36',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addBtnDone: {
    backgroundColor: '#E8F5EC',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  addBtnTextDone: {
    color: '#047A36',
  },
  dialogBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  dialogCard: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    shadowColor: '#047A36',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
  dialogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  dialogTitle: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  dialogCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogItemPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  dialogImg: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  dialogItemName: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  dialogItemMeta: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
    marginTop: 2,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  textInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    marginTop: 6,
  },
  rupeePrefix: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 18,
    fontWeight: '800',
    color: '#047A36',
    marginRight: 6,
  },
  modalTextInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  simpleStockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  stockStepBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  simpleStockInput: {
    flex: 1,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    textAlign: 'center',
    fontFamily: 'Metropolis-Bold',
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  stockUnitBadge: {
    height: 48,
    paddingHorizontal: 14,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockUnitText: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  quickPresetRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  presetChip: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetChipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#047A36',
    borderWidth: 1.5,
  },
  presetChipText: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569',
  },
  presetChipTextActive: {
    color: '#047A36',
    fontWeight: '800',
  },
  confirmBtn: {
    backgroundColor: '#047A36',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#047A36',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  confirmBtnText: {
    fontFamily: 'Metropolis-Bold',
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
