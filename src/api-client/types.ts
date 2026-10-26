/**
 * API Contracts and Data Models for Dusmint Mobile & Backend
 * Generated based on tech.md and Supabase SQL schema
 */

export interface UserProfile {
  id: string;
  phone: string;
  fullName?: string;
  email?: string;
  preferredLanguage: 'en' | 'hi' | 'mr';
  trustTier: 1 | 2 | 3;
  isVegOnly: boolean;
  avatarUrl?: string;
  createdAt: string;
}

export interface Address {
  id: string;
  userId: string;
  clusterId?: string;
  label: 'home' | 'work' | 'other';
  houseNo: string;
  buildingName?: string;
  streetArea: string;
  landmark?: string;
  pincode: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
}

export interface ClusterInfo {
  clusterId: string;
  clusterName: string;
  city: string;
  distanceMeters: number;
  isServiceable: boolean;
}

export interface DeliverySlot {
  id: string;
  clusterId: string;
  name: string;
  slotType: 'morning' | 'evening';
  startTime: string; // HH:mm:ss
  endTime: string;
  orderCutoffTime: string;
  maxOrdersCapacity: number;
  isActive: boolean;
}

export interface VendorShop {
  id: string;
  clusterId: string;
  shopName: string;
  ownerName: string;
  category: 'vegetables' | 'fruits' | 'dairy' | 'meat' | 'staples';
  addressText: string;
  fssaiLicenseNo?: string;
  score: number;
  isOpen: boolean;
  bannerPhotoUrl?: string;
  totalDeliveredOrders: number;
}

export interface CatalogueCategory {
  id: string;
  nameEn: string;
  nameHi?: string;
  slug: string;
  iconUrl?: string;
  displayOrder: number;
}

export interface CatalogueItem {
  id: string;
  vendorId: string;
  categoryId: string;
  nameEn: string;
  nameHi?: string;
  unit: string;
  stepQuantity: number;
  pricePaise: number;
  mandiBandMinPaise?: number;
  mandiBandMaxPaise?: number;
  photoUrl?: string;
  isInStock: boolean;
}

export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'packing'
  | 'ready_for_pickup'
  | 'assigned_to_rider'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface OrderCartItem {
  itemId: string;
  quantity: number;
  vendorId: string;
  pricePaise: number;
  unit: string;
  nameEn: string;
}

export interface CreateOrderPayload {
  clusterId: string;
  deliverySlotId: string;
  addressId: string;
  substitutionPreference: 'replace_with_similar' | 'remove_if_unavailable';
  customerNotes?: string;
  items: {
    itemId: string;
    vendorId: string;
    quantity: number;
  }[];
  paymentMode: 'upi_intent' | 'upi_on_delivery' | 'card_or_netbanking';
}

export interface OrderSummary {
  id: string;
  orderCode: string;
  status: OrderStatus;
  slotName: string;
  itemCount: number;
  totalPaise: number;
  deliveryFeePaise: number;
  paymentMode: string;
  paymentStatus: string;
  deliveryOtp?: string; // 4-digit code presented to rider
  claimWindowExpiresAt?: string;
  createdAt: string;
  vendorParts: {
    vendorName: string;
    shopCategory: string;
    status: string;
    packedWeightGrams?: number;
    proofPhotoUrl?: string;
    sealQrCode?: string;
  }[];
}

export interface QualityClaimPayload {
  orderId: string;
  orderItemId: string;
  claimType: 'underweight' | 'damaged_or_rotten' | 'missing_item' | 'incorrect_item';
  scannedSealQr?: string;
  claimedWeightGrams?: number;
  proofPhotoUrl: string;
  customerRemarks?: string;
}
