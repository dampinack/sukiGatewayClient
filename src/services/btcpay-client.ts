import type {
  BTCPayConfig,
  BTCPayHealth,
  BTCPayServerInfo,
  BTCPayStore,
  CreateInvoiceRequest,
  InvoiceData,
  InvoicePaymentMethod,
} from '../types/btcpay.ts';

export const DEFAULT_BTCPAY_CONFIG: BTCPayConfig = {
  serverUrl: 'https://testnet.demo.btcpayserver.org',
  apiKey: '',
  storeId: '',
};

const STORAGE_KEY = 'btcpay_config_v1';

export class BTCPayClient {
  private config: BTCPayConfig;

  constructor(initialConfig?: Partial<BTCPayConfig>) {
    this.config = this.loadConfig(initialConfig);
  }

  private loadConfig(override?: Partial<BTCPayConfig>): BTCPayConfig {
    let saved: Partial<BTCPayConfig> = {};
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) saved = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Could not read BTCPay config from localStorage', e);
    }
    return {
      ...DEFAULT_BTCPAY_CONFIG,
      ...saved,
      ...override,
    };
  }

  public saveConfig(newConfig: Partial<BTCPayConfig>): BTCPayConfig {
    this.config = {
      ...this.config,
      ...newConfig,
      serverUrl: (newConfig.serverUrl ?? this.config.serverUrl).replace(/\/+$/, ''),
    };
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
      }
    } catch (e) {
      console.warn('Could not save BTCPay config to localStorage', e);
    }
    return this.config;
  }

  public getConfig(): BTCPayConfig {
    return { ...this.config };
  }

  private getHeaders(contentType: boolean = true): HeadersInit {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (contentType) {
      headers['Content-Type'] = 'application/json';
    }
    if (this.config.apiKey) {
      headers['Authorization'] = `token ${this.config.apiKey.trim()}`;
    }
    return headers;
  }

  /**
   * Checks the public health status of the BTCPay Server instance.
   * Anonymous endpoint: does not require authentication.
   */
  public async checkHealth(customUrl?: string): Promise<{ ok: boolean; data?: BTCPayHealth; latencyMs: number; error?: string }> {
    const baseUrl = (customUrl || this.config.serverUrl).replace(/\/+$/, '');
    const startTime = performance.now();
    try {
      const res = await fetch(`${baseUrl}/api/v1/health`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      const latencyMs = Math.round(performance.now() - startTime);
      if (!res.ok) {
        return { ok: false, latencyMs, error: `HTTP ${res.status}: ${res.statusText}` };
      }
      const data: BTCPayHealth = await res.json();
      return { ok: true, data, latencyMs };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      return { ok: false, latencyMs, error: err.message || 'Network connection failed' };
    }
  }

  /**
   * Retrieves server information (requires API Key with server read permission).
   */
  public async getServerInfo(): Promise<BTCPayServerInfo> {
    const res = await fetch(`${this.config.serverUrl}/api/v1/server/info`, {
      method: 'GET',
      headers: this.getHeaders(false),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || `HTTP ${res.status} retrieving server info`);
    }
    return res.json();
  }

  /**
   * Lists all stores associated with the current API Key.
   */
  public async getStores(): Promise<BTCPayStore[]> {
    const res = await fetch(`${this.config.serverUrl}/api/v1/stores`, {
      method: 'GET',
      headers: this.getHeaders(false),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || `HTTP ${res.status} listing stores`);
    }
    return res.json();
  }

  /**
   * Retrieves a single store by ID.
   */
  public async getStore(storeId?: string): Promise<BTCPayStore> {
    const targetStore = storeId || this.config.storeId;
    if (!targetStore) throw new Error('Store ID is required');

    const res = await fetch(`${this.config.serverUrl}/api/v1/stores/${targetStore}`, {
      method: 'GET',
      headers: this.getHeaders(false),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || `HTTP ${res.status} retrieving store`);
    }
    return res.json();
  }

  /**
   * Creates an invoice for a store via Greenfield REST API.
   */
  public async createInvoice(request: CreateInvoiceRequest, storeId?: string): Promise<InvoiceData> {
    const targetStore = storeId || this.config.storeId;
    if (!targetStore) throw new Error('Store ID is required to create an invoice');

    const res = await fetch(`${this.config.serverUrl}/api/v1/stores/${targetStore}/invoices`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(request),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || `HTTP ${res.status} creating invoice`);
    }
    return res.json();
  }

  /**
   * Retrieves an invoice by ID.
   */
  public async getInvoice(invoiceId: string, storeId?: string): Promise<InvoiceData> {
    const targetStore = storeId || this.config.storeId;
    if (!targetStore) throw new Error('Store ID is required');

    const res = await fetch(`${this.config.serverUrl}/api/v1/stores/${targetStore}/invoices/${invoiceId}`, {
      method: 'GET',
      headers: this.getHeaders(false),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || `HTTP ${res.status} retrieving invoice`);
    }
    return res.json();
  }

  /**
   * Retrieves the active payment methods (Bitcoin address, Lightning BOLT11, etc.) for an invoice.
   */
  public async getInvoicePaymentMethods(invoiceId: string, storeId?: string): Promise<InvoicePaymentMethod[]> {
    const targetStore = storeId || this.config.storeId;
    if (!targetStore) throw new Error('Store ID is required');

    const res = await fetch(`${this.config.serverUrl}/api/v1/stores/${targetStore}/invoices/${invoiceId}/payment-methods`, {
      method: 'GET',
      headers: this.getHeaders(false),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || `HTTP ${res.status} retrieving payment methods`);
    }
    return res.json();
  }

  /**
   * Marks an invoice status manually (requires canmarkinvoicestatus permission).
   */
  public async markInvoiceStatus(
    invoiceId: string,
    status: 'MarkSettled' | 'MarkInvalid',
    storeId?: string
  ): Promise<InvoiceData> {
    const targetStore = storeId || this.config.storeId;
    if (!targetStore) throw new Error('Store ID is required');

    const res = await fetch(`${this.config.serverUrl}/api/v1/stores/${targetStore}/invoices/${invoiceId}/status`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || `HTTP ${res.status} marking invoice status`);
    }
    return res.json();
  }

  /**
   * Verifies the cryptographic HMAC-SHA256 signature sent in the `BTCPay-Sig` header.
   * Header format: `sha256=<hex-digest>`
   */
  public async verifyWebhookSignature(rawBody: string, headerSig: string, secret: string): Promise<boolean> {
    if (!headerSig || !headerSig.startsWith('sha256=')) {
      return false;
    }
    const expectedHash = headerSig.replace('sha256=', '').trim().toLowerCase();

    const cryptoEngine = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
    if (cryptoEngine && cryptoEngine.subtle) {
      const enc = new TextEncoder();
      const key = await cryptoEngine.subtle.importKey(
        'raw',
        enc.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const signatureBuf = await cryptoEngine.subtle.sign('HMAC', key, enc.encode(rawBody));
      const computedHex = Array.from(new Uint8Array(signatureBuf))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      return computedHex.toLowerCase() === expectedHash;
    }

    throw new Error('No SubtleCrypto engine available in current runtime environment.');
  }
}

export const btcpayClient = new BTCPayClient();
