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
} from './types';

export class DusmintApiClient {
  private client: AxiosInstance;
  private authToken: string | null = null;

  constructor(baseURL: string = 'http://localhost:3000/api/v1') {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
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
  async sendPhoneOtp(phone: string): Promise<{ success: boolean; message: string }> {
    const res = await this.client.post('/auth/otp/send', { phone });
    return res.data;
  }

  async verifyPhoneOtp(phone: string, otp: string): Promise<{ token: string; user: UserProfile }> {
    const res = await this.client.post('/auth/otp/verify', { phone, otp });
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
}

export const dusmintApi = new DusmintApiClient();
