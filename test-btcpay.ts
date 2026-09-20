/**
 * Standalone Test Runner for BTCPay Server Greenfield Client
 * Run with: node --experimental-strip-types test-btcpay.ts
 */

import { BTCPayClient } from './src/services/btcpay-client.ts';
import type { CreateInvoiceRequest } from './src/types/btcpay.ts';

async function runTests() {
  console.log('====================================================');
  console.log('  BTCPay Server Greenfield Client Test Runner');
  console.log('====================================================\n');

  const serverUrl = process.env.BTCPAY_URL || 'https://testnet.demo.btcpayserver.org';
  const apiKey = process.env.BTCPAY_API_KEY || '';
  const storeId = process.env.BTCPAY_STORE_ID || '';

  const client = new BTCPayClient({ serverUrl, apiKey, storeId });

  // 1. Test Anonymous Health Check
  console.log(`[TEST 1] Testing anonymous health check on: ${serverUrl}`);
  const health = await client.checkHealth();
  if (health.ok) {
    console.log(`  ✓ Health check SUCCESS (${health.latencyMs}ms)`);
    console.log('    Response payload:', JSON.stringify(health.data));
  } else {
    console.error(`  ✗ Health check FAILED (${health.latencyMs}ms): ${health.error}`);
  }

  // 2. Test HMAC-SHA256 Webhook Verification
  console.log('\n[TEST 2] Testing HMAC-SHA256 Webhook Signature Verification');
  const secret = 'super_secret_webhook_key_123';
  const samplePayload = JSON.stringify({
    deliveryId: 'del_001',
    webhookId: 'wh_100',
    type: 'InvoiceSettled',
    timestamp: 1716300000,
    storeId: 'store_demo',
    invoiceId: 'inv_999',
  });

  // Calculate signature using Node crypto
  const nodeCrypto = await import('crypto');
  const expectedSigHex = nodeCrypto
    .createHmac('sha256', secret)
    .update(samplePayload)
    .digest('hex');
  const headerSig = `sha256=${expectedSigHex}`;

  const isValid = await client.verifyWebhookSignature(samplePayload, headerSig, secret);
  const isInvalidRejected = !(await client.verifyWebhookSignature(
    samplePayload + 'tampered',
    headerSig,
    secret
  ));

  if (isValid && isInvalidRejected) {
    console.log('  ✓ HMAC-SHA256 verification passed:');
    console.log(`    Header: ${headerSig}`);
    console.log('    Valid signature accepted: true');
    console.log('    Tampered payload rejected: true');
  } else {
    console.error('  ✗ HMAC verification failed!');
  }

  // 3. Test Invoice Payload Construction
  console.log('\n[TEST 3] Testing Invoice Payload Construction');
  const testInvoiceReq: CreateInvoiceRequest = {
    amount: '25.00',
    currency: 'USD',
    metadata: {
      orderId: `ORD-${Date.now()}`,
      itemDesc: 'SukiPay Fintech Gateway Test Order',
      buyerEmail: 'developer@example.com',
    },
    checkout: {
      speedPolicy: 'HighSpeed',
      paymentMethods: ['BTC', 'BTC-LightningNetwork'],
      expirationMinutes: 30,
      redirectURL: 'https://example.com/checkout/complete',
    },
  };
  console.log('  ✓ Generated invoice request object:');
  console.log('   ', JSON.stringify(testInvoiceReq, null, 2));

  // 4. Live API Key & Store test if credentials exist
  console.log('\n[TEST 4] Live Greenfield API Authentication Check');
  if (apiKey && storeId) {
    console.log(`  Using API Key: ${apiKey.slice(0, 6)}... and Store ID: ${storeId}`);
    try {
      console.log('  Fetching store info...');
      const store = await client.getStore(storeId);
      console.log('  ✓ Store retrieved successfully:', store.name);

      console.log('  Creating live test invoice...');
      const invoice = await client.createInvoice(testInvoiceReq, storeId);
      console.log(`  ✓ Invoice created successfully! ID: ${invoice.id}`);
      console.log(`    Status: ${invoice.status}`);
      console.log(`    Checkout URL: ${invoice.checkoutLink}`);

      console.log('  Fetching invoice payment methods...');
      const methods = await client.getInvoicePaymentMethods(invoice.id, storeId);
      console.log(`  ✓ Available payment rails (${methods.length}):`);
      for (const m of methods) {
        console.log(`    - Rail: ${m.paymentMethodId} | Due: ${m.due} ${m.currency} | Dest: ${m.destination}`);
      }
    } catch (err: any) {
      console.error(`  ✗ Live API call failed: ${err.message}`);
    }
  } else {
    console.log('  [INFO] No BTCPAY_API_KEY or BTCPAY_STORE_ID provided in environment.');
    console.log('  To test live invoice creation against your store, run:');
    console.log('    BTCPAY_API_KEY="your_key" BTCPAY_STORE_ID="your_store_id" node --experimental-strip-types test-btcpay.ts');
  }

  console.log('\n====================================================');
  console.log('  All Client Tests Finished!');
  console.log('====================================================\n');
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
