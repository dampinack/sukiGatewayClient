import { cryptoEngine } from '../crypto/crypto-engine';
import {
  ApiLogEntry,
  CancelOrderData,
  CancelOrderPlain,
  CoalaPayEnvelopeRequest,
  CoalaPayResponse,
  CreateOrderData,
  CreateOrderPlain,
  EnvironmentProfile,
  Iso8583SwitchLog,
  OrderData,
  RefundData,
  RefundPlain,
  RefundQueryData,
  RefundQueryPlain,
  TokenPlain,
  WebhookLogEntry,
} from '../types/gateway';

export const DEFAULT_PROFILES: EnvironmentProfile[] = [
  {
    id: 'local-kirara-8080',
    name: 'Kirara Switch (Port 8080)',
    baseUrl: 'http://localhost:8080',
    appId: 'CZtest20260915090037',
    appKey: '09548218645f0070fc80591c858ec7b4a8334fbd0a5aa8fe6bc8d819a849e6fa',
    description: 'Direct local connection to Kirara ISO 8583 payment switch on default port 8080',
    mockMode: false,
  },
  {
    id: 'local-kirara-3000',
    name: 'Kirara Gateway (Port 3000)',
    baseUrl: 'http://localhost:3000',
    appId: 'CZtest20260915090037',
    appKey: '09548218645f0070fc80591c858ec7b4a8334fbd0a5aa8fe6bc8d819a849e6fa',
    description: 'Local connection to Kirara on alternative port 3000',
    mockMode: false,
  },
  {
    id: 'staging-switch',
    name: 'Staging Bank Egress',
    baseUrl: 'https://staging-gw.example.com',
    appId: 'CZtest20250903126118',
    appKey: '6a19bdd546efdf7e2f7836af55a923c53f1dd0d425128546d414b7f93ef97295',
    description: 'Remote banking egress / staging switch environment',
    mockMode: true,
  },
  {
    id: 'mock-sandbox',
    name: 'Offline Sandbox (Simulator)',
    baseUrl: 'http://localhost:8080',
    appId: 'APP_SANDBOX_OFFLINE',
    appKey: '00112233445566778899AABBCCDDEEFF00112233445566778899AABBCCDDEEFF',
    description: 'In-browser mock response simulator without active network requests',
    mockMode: true,
  }
];

class SukiApiClient {
  private readonly PROFILES_STORAGE_KEY = 'suki_profiles_v2';
  private readonly ACTIVE_PROFILE_KEY = 'suki_active_profile_id_v2';
  private readonly AUDIT_LOGS_KEY = 'suki_audit_logs_v2';
  private readonly MAX_LOGS = 120;

  private mockOrders = new Map<string, OrderData>();
  private mockRefunds = new Map<string, RefundQueryData>();

  constructor() {
    this.seedMockData();
  }

  private seedMockData() {
    const demoOrder: OrderData = {
      orderId: 'CP20260919001122',
      merchantOrderId: 'SUKI-DEMO-ORD-01',
      status: 'PAID',
      amount: '99.95',
      currency: 'USD',
      paymentChannel: 'ONLINE',
      createdAt: Date.now() - 3600000,
      paidAt: Date.now() - 3200000,
      expiresAt: Date.now() + 1800000,
      transactionId: 'TX-SUKI-SWITCH-9901',
      items: [
        { name: 'SukiPay Enterprise Suite', quantity: '1', unitPrice: '99.95', amount: '99.95' }
      ]
    };
    this.mockOrders.set(demoOrder.orderId, demoOrder);
    this.mockOrders.set(demoOrder.merchantOrderId, demoOrder);
  }

  // --- Profile Management ---

  public getProfiles(): EnvironmentProfile[] {
    try {
      const saved = localStorage.getItem(this.PROFILES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return DEFAULT_PROFILES;
  }

  public saveProfiles(profiles: EnvironmentProfile[]): void {
    try {
      localStorage.setItem(this.PROFILES_STORAGE_KEY, JSON.stringify(profiles));
    } catch (e) {
      console.error('Failed to save profiles', e);
    }
  }

  public getActiveProfileId(): string {
    const saved = localStorage.getItem(this.ACTIVE_PROFILE_KEY);
    if (saved) return saved;
    return DEFAULT_PROFILES[0].id;
  }

  public setActiveProfileId(id: string): void {
    localStorage.setItem(this.ACTIVE_PROFILE_KEY, id);
  }

  public getActiveProfile(): EnvironmentProfile {
    const profiles = this.getProfiles();
    const activeId = this.getActiveProfileId();
    return profiles.find(p => p.id === activeId) || profiles[0] || DEFAULT_PROFILES[0];
  }

  public updateProfile(updated: EnvironmentProfile): void {
    const profiles = this.getProfiles().map(p => p.id === updated.id ? updated : p);
    this.saveProfiles(profiles);
  }

  // --- Audit Logs ---

  public getLogs(): ApiLogEntry[] {
    try {
      const saved = localStorage.getItem(this.AUDIT_LOGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  }

  public clearLogs(): void {
    try {
      localStorage.removeItem(this.AUDIT_LOGS_KEY);
    } catch {}
  }

  private addLog(entry: ApiLogEntry): void {
    const logs = [entry, ...this.getLogs().slice(0, this.MAX_LOGS - 1)];
    try {
      localStorage.setItem(this.AUDIT_LOGS_KEY, JSON.stringify(logs));
    } catch {}
  }

  public exportLogsJson(): void {
    const logs = this.getLogs();
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    this.downloadBlob(blob, `sukipay-logs-${new Date().toISOString().slice(0, 19)}.json`);
  }

  public exportLogsCsv(): void {
    const logs = this.getLogs();
    if (logs.length === 0) return;
    const headers = ['Timestamp', 'Endpoint', 'Method', 'HttpStatus', 'DurationMs', 'Success', 'Error'];
    const rows = logs.map(l => [
      l.timestamp,
      l.endpoint,
      l.method,
      l.httpStatus,
      l.durationMs,
      l.success ? 'TRUE' : 'FALSE',
      `"${(l.errorMessage || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    this.downloadBlob(blob, `sukipay-logs-${new Date().toISOString().slice(0, 19)}.csv`);
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // --- Utility ---

  private buildUrl(baseUrl: string, endpoint: string): string {
    const cleanBase = (baseUrl || '').trim().replace(/\/+$/, '');
    return `${cleanBase}${endpoint}`;
  }

  // --- Health Check ---

  public async checkHealth(baseUrl: string): Promise<{ ok: boolean; latencyMs: number; data?: any; error?: string }> {
    const start = performance.now();
    try {
      const clean = baseUrl.trim().replace(/\/+$/, '');
      const resp = await fetch(`${clean}/health`, { method: 'GET' });
      const latencyMs = Math.round(performance.now() - start);
      if (resp.ok) {
        const data = await resp.json().catch(() => ({}));
        return { ok: true, latencyMs, data };
      }
      return { ok: false, latencyMs, error: `HTTP ${resp.status}` };
    } catch (err: any) {
      return { ok: false, latencyMs: Math.round(performance.now() - start), error: err.message || 'Offline' };
    }
  }

  // --- Token Endpoint ---

  public async getToken(profile: EnvironmentProfile): Promise<string> {
    const startTime = performance.now();
    const signTime = cryptoEngine.getSignTime();
    const appSign = cryptoEngine.signToken(profile.appId, profile.appKey, signTime);
    const endpoint = '/api/v2/token';
    const url = this.buildUrl(profile.baseUrl, endpoint);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'appId': profile.appId,
      'signTime': signTime,
      'appSign': appSign,
    };

    if (profile.mockMode) {
      await new Promise(r => setTimeout(r, 200));
      const mockToken = `suki_jwt_mock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const plain: TokenPlain = { token: mockToken, expiresIn: 7200 };
      const encryptedHex = cryptoEngine.encryptToHex(JSON.stringify(plain), profile.appKey);
      const mockResp: CoalaPayResponse = { statusCode: 200, message: 'success', content: encryptedHex };
      const durationMs = Math.round(performance.now() - startTime);

      this.addLog({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        endpoint,
        method: 'POST',
        url,
        headers,
        httpStatus: 200,
        responseBody: mockResp,
        decryptedContent: plain,
        durationMs,
        success: true,
        mock: true,
      });

      profile.token = mockToken;
      profile.tokenExpiresAt = Date.now() + 7200 * 1000;
      this.updateProfile(profile);
      return mockToken;
    }

    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers,
      });
      const durationMs = Math.round(performance.now() - startTime);
      const json: CoalaPayResponse = await resp.json();

      if (json.statusCode === 200 && json.content) {
        const decryptedJson = cryptoEngine.decryptFromHex(json.content, profile.appKey);
        const plain: TokenPlain = JSON.parse(decryptedJson);

        this.addLog({
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          endpoint,
          method: 'POST',
          url,
          headers,
          httpStatus: resp.status,
          responseBody: json,
          decryptedContent: plain,
          durationMs,
          success: true,
          mock: false,
        });

        profile.token = plain.token;
        profile.tokenExpiresAt = Date.now() + (plain.expiresIn || 7200) * 1000;
        this.updateProfile(profile);
        return plain.token;
      } else {
        throw new Error(`Gateway returned [${json.statusCode}]: ${json.message}`);
      }
    } catch (err: any) {
      const durationMs = Math.round(performance.now() - startTime);
      const msg = err.message || 'Failed to acquire token';
      this.addLog({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        endpoint,
        method: 'POST',
        url,
        headers,
        httpStatus: 500,
        responseBody: null,
        durationMs,
        success: false,
        mock: false,
        errorMessage: msg,
      });
      throw new Error(msg);
    }
  }

  // --- Generic Business Endpoint Execution ---

  public async callBusinessEndpoint<TReq, TRes>(
    profile: EnvironmentProfile,
    endpoint: string,
    plainPayload: TReq,
    mockHandler?: (req: TReq) => TRes
  ): Promise<TRes> {
    const startTime = performance.now();
    const url = this.buildUrl(profile.baseUrl, endpoint);

    // Auto-acquire token if missing
    let token = profile.token;
    if (!token) {
      token = await this.getToken(profile);
    }

    const plainJson = JSON.stringify(plainPayload);
    const encryptedHex = cryptoEngine.encryptToHex(plainJson, profile.appKey);
    const signTime = cryptoEngine.getSignTime();
    const nonce = cryptoEngine.generateNonce();
    const appSign = cryptoEngine.signAppData(encryptedHex, profile.appKey, signTime);

    const envelope: CoalaPayEnvelopeRequest = { appData: encryptedHex };
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'appId': profile.appId,
      'token': token,
      'signTime': signTime,
      'nonce': nonce,
      'appSign': appSign,
      'locale': 'en',
    };

    if (profile.mockMode && mockHandler) {
      await new Promise(r => setTimeout(r, 250));
      const resData = mockHandler(plainPayload);
      const resEncrypted = cryptoEngine.encryptToHex(JSON.stringify(resData), profile.appKey);
      const mockResp: CoalaPayResponse = { statusCode: 200, message: 'success', content: resEncrypted };
      const durationMs = Math.round(performance.now() - startTime);

      this.addLog({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        endpoint,
        method: 'POST',
        url,
        headers,
        plainPayload,
        requestBody: envelope,
        httpStatus: 200,
        responseBody: mockResp,
        decryptedContent: resData,
        durationMs,
        success: true,
        mock: true,
      });
      return resData;
    }

    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(envelope),
      });
      const durationMs = Math.round(performance.now() - startTime);
      const json: CoalaPayResponse = await resp.json();

      if (json.statusCode === 200 && json.content) {
        const decryptedStr = cryptoEngine.decryptFromHex(json.content, profile.appKey);
        const data: TRes = JSON.parse(decryptedStr);

        this.addLog({
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          endpoint,
          method: 'POST',
          url,
          headers,
          plainPayload,
          requestBody: envelope,
          httpStatus: resp.status,
          responseBody: json,
          decryptedContent: data,
          durationMs,
          success: true,
          mock: false,
        });

        return data;
      } else {
        throw new Error(`Gateway Error [${json.statusCode}]: ${json.message}`);
      }
    } catch (err: any) {
      const durationMs = Math.round(performance.now() - startTime);
      const msg = err.message || 'Request failed';
      this.addLog({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        endpoint,
        method: 'POST',
        url,
        headers,
        plainPayload,
        requestBody: envelope,
        httpStatus: 500,
        responseBody: null,
        durationMs,
        success: false,
        mock: false,
        errorMessage: msg,
      });
      throw new Error(msg);
    }
  }

  // --- Specific Business Operations ---

  public async createOrder(profile: EnvironmentProfile, plain: CreateOrderPlain): Promise<CreateOrderData> {
    return this.callBusinessEndpoint<CreateOrderPlain, CreateOrderData>(
      profile,
      '/api/v2/pay',
      plain,
      (req) => {
        const orderId = `SUKI-${Date.now()}`;
        const data: CreateOrderData = {
          orderId,
          merchantOrderId: req.merchantOrderId,
          status: 'PENDING',
          amount: req.amount,
          currency: req.currency,
          paymentChannel: req.paymentChannel,
          payUrl: `${profile.baseUrl}/cashier/pay?orderId=${orderId}`,
          createdAt: Date.now(),
          expiresAt: Date.now() + (req.expireMinutes || 30) * 60000,
        };
        const fullOrder: OrderData = {
          ...data,
          items: req.items,
        };
        this.mockOrders.set(orderId, fullOrder);
        this.mockOrders.set(req.merchantOrderId, fullOrder);
        return data;
      }
    );
  }

  public async queryOrder(profile: EnvironmentProfile, plain: { orderId?: string; merchantOrderId?: string }): Promise<OrderData> {
    return this.callBusinessEndpoint<{ orderId?: string; merchantOrderId?: string }, OrderData>(
      profile,
      '/api/v2/query',
      plain,
      (req) => {
        const targetId = req.orderId || req.merchantOrderId || '';
        const existing = this.mockOrders.get(targetId);
        if (existing) return existing;
        return {
          orderId: req.orderId || 'UNKNOWN',
          merchantOrderId: req.merchantOrderId || 'UNKNOWN',
          status: 'PENDING',
          amount: '10.00',
          currency: 'USD',
          paymentChannel: 'ONLINE',
          createdAt: Date.now() - 60000,
          expiresAt: Date.now() + 1800000,
        };
      }
    );
  }

  public async cancelOrder(profile: EnvironmentProfile, plain: CancelOrderPlain): Promise<CancelOrderData> {
    return this.callBusinessEndpoint<CancelOrderPlain, CancelOrderData>(
      profile,
      '/api/v2/cancel',
      plain,
      (req) => {
        const targetId = req.orderId || req.merchantOrderId || '';
        const existing = this.mockOrders.get(targetId);
        if (existing) {
          existing.status = 'CANCELLED';
        }
        return {
          orderId: req.orderId || 'MOCK-CANCELLED',
          merchantOrderId: req.merchantOrderId || '',
          status: 'CANCELLED',
          amount: existing ? existing.amount : 0,
          cancelledAt: Date.now(),
          reason: req.reason || 'User cancelled via SukiPay Client',
        };
      }
    );
  }

  public async refundOrder(profile: EnvironmentProfile, plain: RefundPlain): Promise<RefundData> {
    return this.callBusinessEndpoint<RefundPlain, RefundData>(
      profile,
      '/api/v2/refund',
      plain,
      (req) => {
        const refundId = `REF-${Date.now()}`;
        const data: RefundData = {
          orderId: req.orderId || 'UNKNOWN',
          merchantOrderId: req.merchantOrderId || '',
          refundId,
          merchantRefundId: req.merchantRefundId,
          status: 'SUCCESS',
          refundAmount: req.refundAmount,
          createdAt: Date.now(),
          completedAt: Date.now(),
        };
        const queryData: RefundQueryData = {
          ...data,
          reason: req.reason,
        };
        this.mockRefunds.set(refundId, queryData);
        this.mockRefunds.set(req.merchantRefundId, queryData);
        return data;
      }
    );
  }

  public async queryRefund(profile: EnvironmentProfile, plain: RefundQueryPlain): Promise<RefundQueryData> {
    return this.callBusinessEndpoint<RefundQueryPlain, RefundQueryData>(
      profile,
      '/api/v2/refund/query',
      plain,
      (req) => {
        const target = req.refundId || req.merchantRefundId || '';
        const existing = this.mockRefunds.get(target);
        if (existing) return existing;
        return {
          refundId: req.refundId || 'UNKNOWN',
          merchantRefundId: req.merchantRefundId || '',
          orderId: 'MOCK-ORDER',
          status: 'SUCCESS',
          refundAmount: '10.00',
          createdAt: Date.now() - 120000,
          completedAt: Date.now() - 60000,
        };
      }
    );
  }

  // --- ISO 8583 Switch Telemetry ---

  public async fetchIso8583Logs(profile: EnvironmentProfile): Promise<Iso8583SwitchLog[]> {
    if (profile.mockMode) {
      return [
        {
          id: 'iso-mock-01',
          mti: '0200',
          stan: '849301',
          rrn: '984019283741',
          orderId: 'CP20260919001122',
          merchantOrderId: 'SUKI-DEMO-ORD-01',
          amount: '99.95',
          currency: '840 (USD)',
          channel: 'ONLINE_GUEST',
          responseCode: '00',
          responseMessage: 'APPROVED',
          timestamp: Date.now() - 3200000,
          rawIsoHex: '020070200000000000001641111111111111110000000099950919142010849301',
          fields: {
            '0': '0200 (Financial Request)',
            '2': '4111********1111 (PAN)',
            '3': '000000 (Purchase)',
            '4': '000000009995 ($99.95)',
            '11': '849301 (STAN)',
            '37': '984019283741 (RRN)',
            '39': '00 (Approved)',
            '49': '840 (USD)'
          }
        }
      ];
    }

    try {
      const url = this.buildUrl(profile.baseUrl, '/iso8583/logs');
      const resp = await fetch(url);
      if (resp.ok) {
        const json = await resp.json();
        return (json.switchLogs || []).map((item: any, idx: number) => ({
          id: item.id || `iso-log-${idx}`,
          mti: item.mti || '0200',
          stan: item.stan || '',
          rrn: item.rrn || '',
          orderId: item.orderId,
          merchantOrderId: item.merchantOrderId,
          amount: String(item.amount || '0.00'),
          currency: item.currency || 'USD',
          channel: item.channel,
          responseCode: item.responseCode || '00',
          responseMessage: item.responseCode === '00' ? 'APPROVED' : 'DECLINED',
          timestamp: item.timestamp || Date.now(),
          rawIsoHex: item.rawIsoHex,
          fields: item.fields || {}
        }));
      }
    } catch {}
    return [];
  }

  // --- Webhook Logs Telemetry ---

  public async fetchWebhookLogs(profile: EnvironmentProfile): Promise<WebhookLogEntry[]> {
    if (profile.mockMode) return [];
    try {
      const url = this.buildUrl(profile.baseUrl, '/webhooks/logs');
      const resp = await fetch(url);
      if (resp.ok) {
        const json = await resp.json();
        return json.webhookLogs || [];
      }
    } catch {}
    return [];
  }

  // --- Settle Payment in Cashier ---

  public async simulatePayOrder(profile: EnvironmentProfile, orderId: string): Promise<{ success: boolean; message: string }> {
    if (profile.mockMode) {
      const existing = this.mockOrders.get(orderId);
      if (existing) {
        existing.status = 'PAID';
        existing.paidAt = Date.now();
        existing.transactionId = `TX-SIM-${Date.now()}`;
      }
      return { success: true, message: 'Order paid in offline simulator' };
    }

    try {
      const url = this.buildUrl(profile.baseUrl, '/cashier/api/simulate-pay');
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = await resp.json();
      if (resp.ok && data.statusCode === 200) {
        return { success: true, message: data.message || 'Payment settled successfully' };
      }
      throw new Error(data.message || 'Simulation failed');
    } catch (err: any) {
      throw new Error(err.message || 'Failed to simulate payment');
    }
  }

  public async getOrderCashierDetails(profile: EnvironmentProfile, orderId: string): Promise<any> {
    if (profile.mockMode) {
      const existing = this.mockOrders.get(orderId);
      return {
        order: existing || { orderId, amount: '10.00', currency: 'USD', status: 'PENDING' },
        qrCodeData: ''
      };
    }

    const url = this.buildUrl(profile.baseUrl, `/cashier/api/order-details?orderId=${encodeURIComponent(orderId)}`);
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.json();
  }
}

export const apiService = new SukiApiClient();
