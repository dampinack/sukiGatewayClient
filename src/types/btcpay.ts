/**
 * BTCPay Server Greenfield API Types
 * Based on official Greenfield API v1 Specification
 */

export interface BTCPayConfig {
  serverUrl: string;
  apiKey: string;
  storeId: string;
}

export interface BTCPayHealth {
  synchronized: boolean;
}

export interface BTCPayServerInfo {
  version?: string;
  onion?: string;
  supportedPaymentMethods?: string[];
  fullySynched?: boolean;
  syncStatus?: any[];
}

export interface BTCPayStore {
  id: string;
  name: string;
  website?: string;
  invoiceExpiration?: number;
  monitoringExpiration?: number;
  speedPolicy?: 'HighSpeed' | 'MediumSpeed' | 'LowSpeed' | 'LowMediumSpeed';
  defaultCurrency?: string;
}

export type InvoiceStatus = 'New' | 'Processing' | 'Expired' | 'Invalid' | 'Settled';

export interface CheckoutOptions {
  speedPolicy?: 'HighSpeed' | 'MediumSpeed' | 'LowSpeed' | 'LowMediumSpeed';
  paymentMethods?: string[];
  defaultPaymentMethod?: string;
  expirationMinutes?: number;
  monitoringMinutes?: number;
  paymentTolerance?: number;
  redirectURL?: string;
  redirectAutomatically?: boolean;
  defaultLanguage?: string;
}

export interface CreateInvoiceRequest {
  amount: number | string;
  currency: string;
  metadata?: {
    orderId?: string;
    orderUrl?: string;
    itemDesc?: string;
    buyerName?: string;
    buyerEmail?: string;
    buyerPhone?: string;
    buyerAddress1?: string;
    buyerCity?: string;
    buyerZip?: string;
    buyerCountry?: string;
    posData?: any;
    [key: string]: any;
  };
  checkout?: CheckoutOptions;
  additionalSearchTerms?: string[];
}

export interface InvoicePaymentMethod {
  activated: boolean;
  destination: string;
  paymentLink: string;
  rate: string | number;
  paymentMethodPaid: string | number;
  totalPaid: string | number;
  due: string | number;
  amount: string | number;
  paymentMethodFee: string | number;
  paymentMethodId: string; // e.g. "BTC", "BTC-LightningNetwork"
  currency: string;
  payments?: Array<{
    id: string;
    receivedDate: string;
    value: string | number;
    fee: string | number;
    status: 'Invalid' | 'Processing' | 'Settled';
    destination: string;
  }>;
}

export interface InvoiceData {
  id: string;
  storeId: string;
  amount: string | number;
  currency: string;
  type: 'Standard' | 'TopUp';
  checkoutLink: string;
  status: InvoiceStatus;
  additionalStatus?: 'None' | 'Marked' | 'PaidLate' | 'PaidPartial' | 'PaidOver';
  createdTime: number;
  expirationTime: number;
  monitoringExpiration?: number;
  metadata?: Record<string, any>;
  checkout?: CheckoutOptions;
  archived?: boolean;
  paymentMethods?: InvoicePaymentMethod[];
}

export interface WebhookEventPayload {
  deliveryId: string;
  webhookId: string;
  originalDeliveryId: string;
  isRedelivery: boolean;
  type: string;
  timestamp: number;
  storeId: string;
  invoiceId?: string;
  metadata?: Record<string, any>;
  afterExpiration?: boolean;
  paymentMethodId?: string;
  manuallyMarked?: boolean;
  overPaid?: boolean;
  partiallyPaid?: boolean;
  payment?: any;
}
