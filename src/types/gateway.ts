export interface EnvironmentProfile {
  id: string;
  name: string;
  baseUrl: string;
  appId: string;
  appKey: string;
  token?: string;
  tokenExpiresAt?: number;
  mockMode?: boolean;
  description?: string;
  isCustom?: boolean;
}

export interface CoalaPayEnvelopeRequest {
  appData: string;
}

export interface CoalaPayResponse<T = string> {
  statusCode: number;
  message: string;
  content: T;
}

export interface TokenPlain {
  token: string;
  expiresIn?: number;
}

export interface OrderItem {
  code?: string;
  sku?: string;
  name: string;
  quantity: string;
  unitPrice: string;
  taxRate?: string;
  tax?: string;
  amount: string;
  unit?: string;
}

export interface CreateOrderPlain {
  merchantOrderId: string;
  merchantNo?: string;
  posMerchantNo?: string;
  payMerchantNo?: string;
  paymentChannel: 'ONLINE' | 'POS';
  amount: string;
  currency: string;
  returnUrl: string;
  frontReturnUrl?: string;
  storeId?: string;
  braId?: string;
  terminalId?: string;
  uid?: string;
  taxType?: '0' | '1';
  taxFee?: string;
  tipAmt?: string;
  expireMinutes?: number;
  existDetails?: '0' | '1';
  price?: string;
  taxRate?: string;
  tax?: string;
  items?: OrderItem[];
  customer?: Record<string, any>;
}

export interface CreateOrderData {
  orderId: string;
  merchantOrderId: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'CANCELLED';
  amount: string;
  currency: string;
  paymentChannel: 'ONLINE' | 'POS';
  payUrl?: string;
  qrCodeData?: string;
  createdAt: number;
  expiresAt: number;
  terminalMessage?: string;
}

export interface QueryOrderPlain {
  orderId?: string;
  merchantOrderId?: string;
}

export interface OrderData {
  orderId: string;
  merchantOrderId: string;
  merchantNo?: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'CANCELLED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
  amount: string;
  currency: string;
  paymentChannel: 'ONLINE' | 'POS';
  createdAt: number;
  paidAt?: number;
  expiresAt: number;
  completedAt?: number;
  transactionId?: string;
  refundedAmount?: string;
  storeId?: string;
  braId?: string;
  terminalId?: string;
  items?: OrderItem[];
}

export interface CancelOrderPlain {
  orderId?: string;
  merchantOrderId?: string;
  reason?: string;
}

export interface CancelOrderData {
  orderId: string;
  merchantOrderId: string;
  status: 'CANCELLED';
  amount: number | string;
  cancelledAt?: number;
  reason?: string;
}

export interface RefundPlain {
  orderId?: string;
  merchantOrderId?: string;
  refundAmount: string;
  reason?: string;
  merchantRefundId: string;
}

export interface RefundData {
  orderId: string;
  merchantOrderId: string;
  refundId: string;
  merchantRefundId: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  refundAmount: string;
  currency?: string;
  createdAt: number;
  completedAt?: number;
}

export interface RefundQueryPlain {
  refundId?: string;
  merchantRefundId?: string;
}

export interface RefundQueryData {
  refundId: string;
  merchantRefundId: string;
  orderId: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  refundAmount: string;
  currency?: string;
  createdAt: number;
  completedAt?: number;
  reason?: string;
}

export interface Iso8583SwitchLog {
  id: string;
  mti: string; // 0200, 0210, 0400, etc.
  stan: string;
  rrn: string;
  orderId?: string;
  merchantOrderId?: string;
  amount: string;
  currency: string;
  channel?: string;
  responseCode: string; // 00 = approved, etc.
  responseMessage?: string;
  timestamp: string | number;
  rawIsoHex?: string;
  fields?: Record<string, string>;
}

export interface WebhookLogEntry {
  id: string;
  event: string; // ORDER.PAID, ORDER.REFUNDED
  orderId: string;
  merchantOrderId: string;
  status: string;
  url: string;
  timestamp: string | number;
  headers: Record<string, string>;
  payload: any;
  verified: boolean;
}

export interface ApiLogEntry {
  id: string;
  timestamp: string; // ISO string
  endpoint: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  plainPayload?: any;
  requestBody?: any;
  httpStatus: number;
  responseBody: any;
  decryptedContent?: any;
  durationMs: number;
  success: boolean;
  mock: boolean;
  errorMessage?: string;
}
