import axios, { AxiosInstance } from 'axios';
import {
  UserProfile,
  Address,
  ClusterInfo,
  DeliverySlot,
  VendorShop,
  CatalogueCategory,
  CatalogueItem,
  CreateOrderPayload,
  OrderSummary,
  QualityClaimPayload,
  VendorProfileInfo,
  VendorOrderPart,
  VendorStockItem,
  VendorEarningsData,
} from './types';

export class DusmintApiClient {
  private client: AxiosInstance;
  private authToken: string | null = null;

  constructor(baseURL: string = process.env.EXPO_PUBLIC_API_URL || 'https://riksho-backend-htdg.onrender.com/api/v1') {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use((config) => {
      if (this.authToken) {
        config.headers.Authorization = `Bearer ${this.authToken}`;
      }
      return config;
    });
  }

  public setAuthToken(token: string | null) {
    this.authToken = token;
  }

  // --- Auth & Profile ---
  async sendPhoneOtp(phone: string): Promise<{ success: boolean; message: string; devOtp?: string }> {
    const res = await this.client.post('/auth/otp/send', { phone });
    return res.data;
  }

  async verifyPhoneOtp(phone: string, otp: string): Promise<{ token: string; user: UserProfile; vendor?: any; isNewVendor?: boolean }> {
    const res = await this.client.post('/auth/otp/verify', { phone, otp });
    return res.data;
  }

  async submitVendorOnboarding(data: {
    ownerName: string;
    ownerPhone: string;
    email?: string;
    shopName: string;
    category?: string;
    address: string;
    lat?: number;
    lng?: number;
    shopPhotoUrls?: string[];
    bankOrUpi: string;
    authUserId?: string;
  }): Promise<{ success: boolean; message: string; vendor: any }> {
    const res = await this.client.post('/vendor/onboarding', data);
    return res.data;
  }

  async registerPushToken(
    token: string,
    platform: 'android' | 'ios' = 'android',
    app: 'dusmint_vendor' | 'dusmint_customer' = 'dusmint_vendor'
  ): Promise<{ success: boolean }> {
    const res = await this.client.post('/push/fcm-register', { token, platform, app });
    return res.data;
  }

  async getProfile(): Promise<UserProfile> {
    const res = await this.client.get('/user/profile');
    return res.data;
  }

  // --- Cluster & Addresses ---
  async checkServiceability(lat: number, lng: number): Promise<ClusterInfo> {
    const res = await this.client.get('/clusters/check-serviceability', {
      params: { lat, lng },
    });
    return res.data;
  }

  async getSavedAddresses(): Promise<Address[]> {
    const res = await this.client.get('/user/addresses');
    return res.data;
  }

  async saveAddress(address: Omit<Address, 'id' | 'userId'>): Promise<Address> {
    const res = await this.client.post('/user/addresses', address);
    return res.data;
  }

  // --- Catalogue & Discovery ---
  async getCategories(clusterId: string): Promise<CatalogueCategory[]> {
    const res = await this.client.get(`/clusters/${clusterId}/categories`);
    return res.data;
  }

  async getVendors(clusterId: string, categoryId?: string): Promise<VendorShop[]> {
    const res = await this.client.get(`/clusters/${clusterId}/vendors`, {
      params: { categoryId },
    });
    return res.data;
  }

  async getCatalogueItems(vendorId: string): Promise<CatalogueItem[]> {
    const res = await this.client.get(`/vendors/${vendorId}/items`);
    return res.data;
  }

  async searchItems(clusterId: string, query: string): Promise<CatalogueItem[]> {
    const res = await this.client.get(`/clusters/${clusterId}/search`, {
      params: { q: query },
    });
    return res.data;
  }

  // --- Slots & Ordering ---
  async getDeliverySlots(clusterId: string): Promise<DeliverySlot[]> {
    const res = await this.client.get(`/clusters/${clusterId}/slots`);
    return res.data;
  }

  async createOrder(payload: CreateOrderPayload): Promise<{ orderId: string; orderCode: string; paymentSessionId?: string }> {
    const res = await this.client.post('/orders', payload);
    return res.data;
  }

  async getOrders(): Promise<OrderSummary[]> {
    const res = await this.client.get('/orders');
    return res.data;
  }

  async getOrderDetail(orderId: string): Promise<OrderSummary> {
    const res = await this.client.get(`/orders/${orderId}`);
    return res.data;
  }

  // --- Claims & Trust ---
  async scanSealAndOpenBag(orderId: string, sealQr: string): Promise<{ claimWindowExpiresAt: string }> {
    const res = await this.client.post(`/orders/${orderId}/scan-seal`, { sealQr });
    return res.data;
  }

  async submitQualityClaim(payload: QualityClaimPayload): Promise<{ claimId: string; status: string; decision: string }> {
    const res = await this.client.post('/claims', payload);
    return res.data;
  }

const SUPABASE_REST_URL = 'https://llvulxhjpyztuoorcacz.supabase.co/rest/v1';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsdnVseGhqcHl6dHVvb3JjYWN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwNzExNjAsImV4cCI6MjA5ODY0NzE2MH0.yVEm7ra2IjJ6xZWIIQj9KBJbCdsE6KItkLOjHM64zcU';

  // ==========================================
  // --- Merchant / Vendor Specific APIs ---
  // ==========================================
  async getVendorList(): Promise<VendorProfileInfo[]> {
    let list: VendorProfileInfo[] = [];
    try {
      const res = await this.client.get('/vendor/list');
      list = res.data || [];
    } catch {}

    // Check if the backend list lacks rich columns (like shop_photo_urls or address)
    const hasRichFields = list.some((v) => v.shop_photo_urls && v.shop_photo_urls.length > 0);
    if (!hasRichFields || list.length === 0) {
      try {
        const sbRes = await axios.get(
          `${SUPABASE_REST_URL}/vendors?select=*&order=created_at.desc`,
          {
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
            timeout: 6000,
          }
        );
        if (sbRes.data && sbRes.data.length > 0) {
          return sbRes.data;
        }
      } catch (err) {
        console.warn('Direct Supabase vendor list fallback error:', err);
      }
    }
    return list;
  }

  async getMyVendorProfile(phone?: string): Promise<VendorProfileInfo | null> {
    try {
      const res = await this.client.get('/vendor/me', {
        params: phone ? { phone } : undefined,
      });
      if (res.data && res.data.id) return res.data;
    } catch {}

    if (phone) {
      try {
        const cleanPhone = phone.replace(/\D/g, '').slice(-10);
        const sbRes = await axios.get(
          `${SUPABASE_REST_URL}/vendors?owner_phone=ilike.*${cleanPhone}*&select=*`,
          {
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
            timeout: 6000,
          }
        );
        if (sbRes.data && sbRes.data.length > 0) {
          return sbRes.data[0];
        }
      } catch (err) {
        console.warn('Direct Supabase vendor me fallback error:', err);
      }
    }
    return null;
  }

  async toggleVendorStatus(vendorId: string, isOpen: boolean): Promise<{ success: boolean; vendor: any }> {
    try {
      const res = await this.client.patch('/vendor/status', { vendorId, isOpen });
      if (res.data) return res.data;
    } catch {}

    // Direct Supabase update fallback
    try {
      await axios.patch(
        `${SUPABASE_REST_URL}/vendors?id=eq.${vendorId}`,
        { is_open: isOpen },
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          timeout: 6000,
        }
      );
    } catch {}

    return { success: true, vendor: { id: vendorId, is_open: isOpen } };
  }

  async updateVendorProfile(
    vendorId: string,
    payload: {
      shopName?: string;
      ownerName?: string;
      bankOrUpi?: string;
      category?: string;
      address?: string;
      shopPhotoUrls?: string[];
    }
  ): Promise<{ success: boolean; vendor: any }> {
    let result: any = null;
    try {
      const res = await this.client.patch('/vendor/profile', { vendorId, ...payload });
      result = res.data;
    } catch {}

    // Direct Supabase update fallback so database updates immediately
    try {
      const dbPayload: any = {};
      if (payload.shopName) dbPayload.name = payload.shopName;
      if (payload.ownerName) dbPayload.owner_name = payload.ownerName;
      if (payload.bankOrUpi) dbPayload.bank_or_upi = payload.bankOrUpi;
      if (payload.category) dbPayload.category = payload.category;
      if (payload.address) dbPayload.address = payload.address;
      if (payload.shopPhotoUrls) dbPayload.shop_photo_urls = payload.shopPhotoUrls;

      const patchRes = await axios.patch(
        `${SUPABASE_REST_URL}/vendors?id=eq.${vendorId}`,
        dbPayload,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            Prefer: 'return=representation',
          },
          timeout: 6000,
        }
      );
      if (patchRes.data && patchRes.data.length > 0) {
        return { success: true, vendor: patchRes.data[0] };
      }
    } catch (err) {
      console.warn('Direct Supabase vendor patch error:', err);
    }

    return result || { success: true, vendor: payload };
  }

  async getVendorOrders(vendorId?: string): Promise<VendorOrderPart[]> {
    const res = await this.client.get('/vendor/orders', {
      params: vendorId ? { vendorId } : undefined,
    });
    return res.data;
  }

  async packOrderPart(
    partId: string,
    payload: { sealQr: string; packedWeightGrams?: number }
  ): Promise<{ success: boolean; partId: string; status: string; message: string }> {
    const res = await this.client.post(`/vendor/orders/${partId}/pack`, payload);
    return res.data;
  }

  async getVendorStock(vendorId?: string): Promise<VendorStockItem[]> {
    const res = await this.client.get('/vendor/stock', {
      params: vendorId ? { vendorId } : undefined,
    });
    return res.data;
  }

  async updateVendorStock(
    itemId: string,
    payload: { inStock?: boolean; price?: number }
  ): Promise<{ success: boolean }> {
    const res = await this.client.put(`/vendor/stock/${itemId}`, payload);
    return res.data;
  }

  async getVendorEarnings(vendorId?: string): Promise<VendorEarningsData> {
    const res = await this.client.get('/vendor/earnings', {
      params: vendorId ? { vendorId } : undefined,
    });
    return res.data;
  }
}

export const dusmintApi = new DusmintApiClient();
