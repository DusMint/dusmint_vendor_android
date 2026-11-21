import { create } from 'zustand';
import { VendorStockItem } from '../api-client/types';

export const INITIAL_STORE_STOCK: VendorStockItem[] = [
  {
    id: 'stock-1',
    nameEn: 'Fresh Desi Tomato',
    nameHi: 'देसी टमाटर',
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
    nameHi: 'ज्योति आलू',
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
    nameHi: 'लाल प्याज / कांदा',
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
    nameHi: 'शिमला सेब',
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
    nameHi: 'केला',
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
    nameHi: 'फुल क्रीम दूध',
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
    nameHi: 'मलाई पनीर',
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
    nameHi: 'सफेद अंडे',
    category: 'Meat',
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
    nameHi: 'नागपुर संतरा',
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
    nameHi: 'चिकन करी कट',
    category: 'Meat',
    unit: '500 g',
    pricePaise: 13000,
    mrpPaise: 15000,
    isInStock: true,
    photoUrl: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=200&q=80',
    stockKg: 10,
    stockGrams: 200,
  },
];

interface VendorStockState {
  items: VendorStockItem[];
  setItems: (items: VendorStockItem[] | ((prev: VendorStockItem[]) => VendorStockItem[])) => void;
  addItem: (item: VendorStockItem) => void;
  updateStockDelta: (
    itemIdOrName: string,
    deltaKg: number,
    deltaGrams?: number
  ) => { item: VendorStockItem; prevKg: number; newKg: number } | null;
  toggleStockStatus: (
    itemIdOrName: string,
    inStock?: boolean
  ) => { item: VendorStockItem; inStock: boolean } | null;
  updateItemPrice: (
    itemIdOrName: string,
    newPriceRupees: number
  ) => { item: VendorStockItem; prevPrice: number; newPrice: number } | null;
}

export const useVendorStockStore = create<VendorStockState>((set, get) => ({
  items: INITIAL_STORE_STOCK,

  setItems: (itemsOrUpdater) => {
    if (typeof itemsOrUpdater === 'function') {
      set({ items: itemsOrUpdater(get().items) });
    } else {
      set({ items: itemsOrUpdater });
    }
  },

  addItem: (item) => {
    set((state) => ({
      items: [item, ...state.items.filter((i) => i.id !== item.id)],
    }));
  },

  updateStockDelta: (itemIdOrName, deltaKg, deltaGrams = 0) => {
    const state = get();
    const query = itemIdOrName.toLowerCase().trim();
    const idx = state.items.findIndex(
      (i) => i.id.toLowerCase() === query || i.nameEn.toLowerCase().includes(query) || (i.nameHi && i.nameHi.includes(query))
    );
    if (idx === -1) return null;

    const currentItem = state.items[idx];
    const prevKg = currentItem.stockKg ?? 0;
    const prevG = currentItem.stockGrams ?? 0;

    let totalGrams = (prevKg + deltaKg) * 1000 + prevG + deltaGrams;
    if (totalGrams < 0) totalGrams = 0;

    const newKg = Math.floor(totalGrams / 1000);
    const newG = totalGrams % 1000;
    const inStock = totalGrams > 0;

    const updatedItem: VendorStockItem = {
      ...currentItem,
      stockKg: newKg,
      stockGrams: newG,
      isInStock: inStock,
    };

    const newItems = [...state.items];
    newItems[idx] = updatedItem;
    set({ items: newItems });

    return { item: updatedItem, prevKg, newKg };
  },

  toggleStockStatus: (itemIdOrName, forcedInStock) => {
    const state = get();
    const query = itemIdOrName.toLowerCase().trim();
    const idx = state.items.findIndex(
      (i) => i.id.toLowerCase() === query || i.nameEn.toLowerCase().includes(query) || (i.nameHi && i.nameHi.includes(query))
    );
    if (idx === -1) return null;

    const currentItem = state.items[idx];
    const newStatus = forcedInStock !== undefined ? forcedInStock : !currentItem.isInStock;
    const updatedItem: VendorStockItem = {
      ...currentItem,
      isInStock: newStatus,
      stockKg: !newStatus ? 0 : (currentItem.stockKg && currentItem.stockKg > 0 ? currentItem.stockKg : 10),
    };

    const newItems = [...state.items];
    newItems[idx] = updatedItem;
    set({ items: newItems });

    return { item: updatedItem, inStock: newStatus };
  },

  updateItemPrice: (itemIdOrName, newPriceRupees) => {
    const state = get();
    const query = itemIdOrName.toLowerCase().trim();
    const idx = state.items.findIndex(
      (i) => i.id.toLowerCase() === query || i.nameEn.toLowerCase().includes(query) || (i.nameHi && i.nameHi.includes(query))
    );
    if (idx === -1) return null;

    const currentItem = state.items[idx];
    const prevPrice = Math.round(currentItem.pricePaise / 100);
    const updatedItem: VendorStockItem = {
      ...currentItem,
      pricePaise: Math.round(newPriceRupees * 100),
    };

    const newItems = [...state.items];
    newItems[idx] = updatedItem;
    set({ items: newItems });

    return { item: updatedItem, prevPrice, newPrice: newPriceRupees };
  },
}));
