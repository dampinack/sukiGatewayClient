# BTCPay Server Greenfield Integration Manual
## Sovereign, Non-Custodial Payment Processing for SukiGateway & Kirara Switch

---

## 1. Executive Summary & Why BTCPay Server Beats Proprietary Gateways

When developing international FinTech software, proprietary US banking gateways (such as Moov, Stripe, or Plaid) introduce prohibitive barriers:
- **Strict US Legal Nexus:** Require US incorporation, US EIN/SSN, US bank accounts, and high-scrutiny KYB (Know Your Business) audits.
- **Geographic Censorship:** Account creation and live credentials from outside approved jurisdictions are denied or frozen.
- **Custodial Risk:** Intermediaries hold your customer funds and charge 1.5% to 3.5% + transaction fees.

**BTCPay Server (`btcpayserver/btcpayserver`) solves this completely:**
- **100% Free & Open-Source Software (MIT License):** Full ownership of the code, database, and infrastructure.
- **Permissionless & Sovereign:** Operates in any country without requiring approval, bank licenses, or third-party gatekeepers.
- **Zero Processing Fees (0.0%):** You only pay miners/network fees; no intermediary takes a cut.
- **Non-Custodial Architecture:** Your server **never touches private keys**. Payments flow directly into your cold wallet or hardware device via an Extended Public Key (`xpub`/`zpub`).
- **First-Class Developer API (Greenfield REST API):** Modern, OpenAPI-compliant endpoints with CORS support, granular API permissions, and cryptographically signed webhooks.

---

## 2. Cryptographic & Security Architecture

### 2.1 The Watch-Only Wallet Model (BIP32 / BIP44 / BIP84)

```
+-------------------------------------------------------------+
|               YOUR COLD / HARDWARE WALLET                   |
|          (Trezor, Ledger, Coldcard, Sparrow, etc.)          |
|                  Holds Private Key: xprv                    |
+-------------------------------------------------------------+
                              |
               Exports Extended Public Key only:
                     zpub... or xpub...
                              v
+-------------------------------------------------------------+
|                     BTCPAY SERVER                           |
|       (Self-Hosted Linux VPS / Docker / Testnet Demo)       |
|                                                             |
|  * Uses xpub to derive unique child address per invoice     |
|  * CANNOT spend or transfer funds                           |
|  * If server is hacked, zero funds can be stolen            |
+-------------------------------------------------------------+
```

1. **Address Derivation:** Each customer invoice receives a fresh, distinct Bitcoin address (e.g. `bc1q...` Native SegWit).
2. **No Spend Authority:** The server only possesses the mathematical power to **generate public addresses** and **monitor the blockchain**; it does not hold the private key (`xprv`) needed to sign transactions.
3. **Lightning Network Speed:** For sub-second micro-transactions, BTCPay Server connects directly to an internal or external Lightning node (LND or Core Lightning / CLN) emitting BOLT11 payment requests.

---

## 3. Greenfield REST API Specification

All Greenfield API calls use the `/api/v1` prefix.

### 3.1 Anonymous Public Endpoints

#### `GET /api/v1/health`
Checks whether the node is synchronized and operational.
- **Auth:** None required (`[AllowAnonymous]`).
- **Response:**
  ```json
  {
    "synchronized": true
  }
  ```

---

### 3.2 Authenticated Endpoints (`Authorization: token <API_KEY>`)

#### `GET /api/v1/server/info`
Retrieves node version, onion address, and supported payment methods.

#### `GET /api/v1/stores`
Lists all stores your API key is authorized to access.

#### `POST /api/v1/stores/{storeId}/invoices`
Generates a new payment invoice.

**Request Payload:**
```json
{
  "amount": "25.00",
  "currency": "USD",
  "metadata": {
    "orderId": "ORD-1726830129",
    "itemDesc": "FinTech Gateway Settlement Order",
    "buyerEmail": "client@example.com"
  },
  "checkout": {
    "speedPolicy": "HighSpeed",
    "paymentMethods": ["BTC", "BTC-LightningNetwork"],
    "expirationMinutes": 45,
    "redirectURL": "https://yourgateway.com/order/success"
  }
}
```

**Response Payload:**
```json
{
  "id": "D2rK19sA9e...",
  "storeId": "74C8gYQ8...",
  "amount": 25.00,
  "currency": "USD",
  "type": "Standard",
  "checkoutLink": "https://testnet.demo.btcpayserver.org/i/D2rK19sA9e...",
  "status": "New",
  "additionalStatus": "None",
  "createdTime": 1726830130,
  "expirationTime": 1726832830
}
```

#### `GET /api/v1/stores/{storeId}/invoices/{invoiceId}/payment-methods`
Returns specific on-chain addresses and Lightning invoices:
```json
[
  {
    "paymentMethodId": "BTC",
    "destination": "tb1q9jflh803k2jfe...",
    "amount": "0.00038461",
    "due": "0.00038461",
    "currency": "BTC",
    "paymentLink": "bitcoin:tb1q9jflh803k2jfe...?amount=0.00038461"
  },
  {
    "paymentMethodId": "BTC-LightningNetwork",
    "destination": "lnbc384610n1pj...",
    "amount": "38461",
    "due": "38461",
    "currency": "SATS",
    "paymentLink": "lightning:lnbc384610n1pj..."
  }
]
```

---

## 4. Webhook Cryptographic Verification (HMAC-SHA256)

BTCPay Server sends HTTP POST notifications to your backend whenever an invoice changes status:
- `InvoiceCreated`
- `InvoiceReceivedPayment`
- `InvoiceProcessing` (0-conf or unconfirmed tx in mempool)
- `InvoiceSettled` (Confirmed according to speed policy)
- `InvoiceExpired`
- `InvoiceInvalid`

### Signature Header:
`BTCPay-Sig: sha256=<hex_encoded_hmac>`

### Verification Code:
```typescript
import { btcpayClient } from './src/services/btcpay-client';

const rawBody = req.body; // Raw string body before JSON parsing
const signatureHeader = req.headers['btcpay-sig'];
const webhookSecret = process.env.BTCPAY_WEBHOOK_SECRET;

const isValid = await btcpayClient.verifyWebhookSignature(rawBody, signatureHeader, webhookSecret);
if (!isValid) {
  throw new Error('Unauthorized: Invalid cryptographic signature');
}
```

---

## 5. Built-in Client & Testing Tools in `sukiGatewayClient`

The `sukiGatewayClient` repository now includes a full suite of BTCPay tools:

### 5.1 Standalone CLI Test Runner
You can run diagnostics and test the API directly from the command line without compiling:

```bash
# 1. Anonymous health check + WebCrypto test vectors
node --experimental-strip-types test-btcpay.ts

# 2. Live Store test (against your own store or testnet)
BTCPAY_URL="https://testnet.demo.btcpayserver.org" \
BTCPAY_API_KEY="your_api_key_here" \
BTCPAY_STORE_ID="your_store_id_here" \
node --experimental-strip-types test-btcpay.ts
```

### 5.2 Interactive UI Console (`BTCPay Greenfield` Tab)
In the SukiPay Web Console:
1. Click the **BTCPay Greenfield** tab in the top navigation bar.
2. View live server latency and synchronization state.
3. Configure your **Server URL**, **API Key**, and **Store ID**.
4. Generate invoices with custom amounts, currencies (USD, EUR, BTC, SATS), and speed policies.
5. Inspect live payment rails (Bitcoin SegWit address and Lightning BOLT11).
6. Open the hosted BTCPay checkout dialog with a single click.
7. Test incoming webhook payloads and HMAC-SHA256 signatures with the built-in cryptographic validator.

---

## 6. How to Deploy Your Own BTCPay Server (Production)

To host your own BTCPay instance on a Debian/Ubuntu VPS ($5 to $10/month on Hetzner, DigitalOcean, or Vultr):

```bash
# 1. Clone the official docker deployment tool
git clone https://github.com/btcpayserver/btcpayserver-docker
cd btcpayserver-docker

# 2. Configure environment (replace with your domain and email)
export BTCPAY_HOST="pay.yourdomain.com"
export LETSENCRYPT_EMAIL="admin@yourdomain.com"
export NBITCOIN_NETWORK="mainnet" # or testnet
export BTCPAYGEN_CRYPTO1="btc"
export BTCPAYGEN_LIGHTNING="clightning" # or lnd

# 3. Generate setup and launch
. ./btcpay-setup.sh -i
```

BTCPay automatically provisions:
- Nginx reverse proxy with automated Let's Encrypt SSL.
- Pruned Bitcoin Core node or full node.
- NBXplorer block scanner.
- Lightning daemon (Core Lightning or LND).
- PostgreSQL database.
- Greenfield REST API engine.
