# BTCPay Server Setup, Architecture & Integration Guide
## Sovereign, Non-Custodial FinTech Infrastructure for SukiPay & Kirara Switch

---

## 1. Executive Motivation: Why Switch from Proprietary Rails to BTCPay Server?

### 1.1 The Proprietary Gateway Barrier (Moov, Stripe, Plaid)
Traditional US-centric FinTech platforms (like Moov) impose strict jurisdictional and legal barriers:
- **US Legal Nexus Required:** Mandatory US business incorporation, US Employer Identification Number (EIN), US business bank accounts, and high-scrutiny Know Your Business (KYB) audits.
- **Geographic Censorship:** Developers and merchants outside approved countries are blocked from moving live funds.
- **Custodial Risk & Overhead:** Third-party intermediaries hold customer funds, impose holding periods, and deduct 1.5% to 3.5% + transaction fees.

### 1.2 The Sovereign Alternative: BTCPay Server (`btcpayserver/btcpayserver`)
BTCPay Server is the premier open-source payment processor:
- **100% Free & Open-Source (MIT License):** Full ownership of code, database, and infrastructure.
- **Permissionless & Borderless:** Operates globally in any country without requiring bank sponsors or centralized approval.
- **0.0% Gateway Fees:** Zero processing cuts; transactions only incur native network miner/routing fees.
- **Strictly Non-Custodial:** The server never holds private keys. Payments flow directly into your own wallet or hardware cold storage.
- **Modern Greenfield REST API:** Comprehensive OpenAPI/Swagger-compliant endpoints, CORS support, and cryptographically signed webhooks.

---

## 2. Cryptographic & Security Architecture

### 2.1 The Watch-Only Cold Wallet Model (BIP32 / BIP44 / BIP84)
In production, BTCPay Server operates using an **Extended Public Key (`xpub`/`zpub`)** derived from your hardware wallet or offline seed:

```
+-------------------------------------------------------------+
|                 YOUR COLD / HARDWARE WALLET                 |
|          (Trezor, Ledger, Coldcard, Sparrow, etc.)          |
|                  Holds Private Key (xprv)                   |
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
|  * If server is hacked, ZERO funds can be stolen            |
+-------------------------------------------------------------+
                              |
                     Derives unique address
                              v
+-------------------------------------------------------------+
|                      CUSTOMER INVOICE                       |
|     Address: bc1q... (Native SegWit) or Lightning BOLT11    |
+-------------------------------------------------------------+
```

- **BIP 32 (Hierarchical Deterministic Wallets):** Allows mathematical derivation of an infinite sequence of child public keys from the parent `xpub` without knowledge of the parent private key (`xprv`).
- **BIP 84 (Native SegWit Bech32):** Derives `bc1q...` addresses via path `m/84'/0'/0'/0/x`, providing the lowest transaction fees.
- **BIP 21 (URI Scheme):** Encodes amount and destination into standard QR codes (`bitcoin:<address>?amount=...`).
- **BOLT 11 (Lightning Network Invoices):** Encodes payment hash, route hints, and expiry into Bech32-encoded `lnbc...` payment requests for sub-second, sub-cent settlement.

---

## 3. Step-by-Step Setup Guide on `testnet.demo.btcpayserver.org`

### Step 1: Create a Free Sandbox Account
1. Open [testnet.demo.btcpayserver.org](https://testnet.demo.btcpayserver.org).
2. Register an account (no KYC, verification, or credit card required).

### Step 2: Create a Store & Obtain Your Store ID
1. In the left-hand sidebar, click **Stores > Create a new store**.
2. Give it a name (e.g. `SukiPay Test Store`).
3. Click **Store Settings** (General Settings).
4. The first field displays your **Store ID** (a string like `74C8gYQ8...`). Copy this value.

### Step 3: Link a Wallet (Resolving "No wallet has been linked to your BTCPay Store")
BTCPay is non-custodial and **refuses to generate invoices without a destination address**. To link a wallet:
1. Go to your Store Dashboard (`https://testnet.demo.btcpayserver.org/stores/YOUR_STORE_ID`).
2. Under the setup guide, click **"Set up a wallet"** next to **Bitcoin (BTC)**.
3. Select **"Hot wallet"** (ideal for testnet because coins have zero monetary value and setup takes 5 seconds).
4. Confirm the 12/24-word testnet seed phrase and click **Save / Finish**.
5. *(Optional for Lightning)* Under **Settings > Payment Methods > Lightning**, click **Setup** and select **"Use internal node"**.

### Step 4: Generate a Greenfield API Key
1. Navigate directly to `https://testnet.demo.btcpayserver.org/account/apikeys` (or click your user avatar in the bottom-left sidebar and select **API Keys**).
2. Click **"Generate Key"**.
3. Set a label (e.g. `SukiPay Dev Key`).
4. Scroll down to the permissions list and enable:
   - ☑️ **Create an invoice** (`btcpay.store.cancreateinvoice`)
   - ☑️ **View your invoices** (`btcpay.store.canviewinvoices`)
5. Click **Generate API Key** and copy the 40-character key immediately.

---

## 4. SukiPay Greenfield Client Integration

The `sukiGatewayClient` repository includes a native, zero-dependency Greenfield client and testing suite:

### 4.1 Architecture & Files Created
| File Path | Description |
| :--- | :--- |
| [`src/types/btcpay.ts`](file:///home/cyrus/Projects/API_Projects/sukiGatewayClient/src/types/btcpay.ts) | TypeScript interfaces for Greenfield models (`CreateInvoiceRequest`, `InvoiceData`, `InvoicePaymentMethod`, `BTCPayConfig`, `WebhookEventPayload`). |
| [`src/services/btcpay-client.ts`](file:///home/cyrus/Projects/API_Projects/sukiGatewayClient/src/services/btcpay-client.ts) | Native client using standard `fetch` and WebCrypto (`globalThis.crypto.subtle`) for browser and Node.js execution. |
| [`src/components/BTCPayConsole.tsx`](file:///home/cyrus/Projects/API_Projects/sukiGatewayClient/src/components/BTCPayConsole.tsx) | Interactive UI Console tab with live latency ping, invoice generator, payment rail inspector, and webhook HMAC tester. |
| [`test-btcpay.ts`](file:///home/cyrus/Projects/API_Projects/sukiGatewayClient/test-btcpay.ts) | Standalone CLI test runner executable with Node 26 native TypeScript stripping. |
| [`userManual_btcpay.md`](file:///home/cyrus/Projects/API_Projects/sukiGatewayClient/userManual_btcpay.md) | Technical integration manual covering API specifications and VPS Docker deployment. |

### 4.2 Webhook Cryptographic Verification (HMAC-SHA256)
When BTCPay delivers a webhook event (`InvoiceSettled`, `InvoiceCreated`), it sends the header:
```http
BTCPay-Sig: sha256=<hex_encoded_hmac>
```

Verification implementation:
```typescript
import { btcpayClient } from './src/services/btcpay-client';

const isValid = await btcpayClient.verifyWebhookSignature(
  rawBodyString,
  req.headers['btcpay-sig'],
  process.env.BTCPAY_WEBHOOK_SECRET
);

if (!isValid) {
  throw new Error('Unauthorized: Invalid cryptographic signature');
}
```

---

## 5. How to Test

### 5.1 CLI Test Runner (Terminal)
Run diagnostics without compiling:
```bash
cd /home/cyrus/Projects/API_Projects/sukiGatewayClient

# Anonymous connectivity & WebCrypto test vectors
node --experimental-strip-types test-btcpay.ts

# Live invoice creation against your Store
BTCPAY_API_KEY="your_api_key" BTCPAY_STORE_ID="your_store_id" node --experimental-strip-types test-btcpay.ts
```

### 5.2 Interactive UI Web Console
```bash
cd /home/cyrus/Projects/API_Projects/sukiGatewayClient
npm run dev
```
Open `http://localhost:5173` and click the **"BTCPay Greenfield"** tab in the top navigation bar.

---

## 6. Curated Literature, Textbooks & Developer Resources

### 6.1 Industry Standard Textbooks (Open-Source on GitHub)

#### 📖 1. *Mastering Bitcoin: Programming the Open Blockchain* (3rd Edition, Dec 2023)
- **Authors:** Andreas M. Antonopoulos & David A. Harding (O'Reilly Media)
- **Free Open Access:** [github.com/bitcoinbook/bitcoinbook](https://github.com/bitcoinbook/bitcoinbook)
- **Topics:** secp256k1 elliptic curve cryptography, BIP32/44/84 derivation math, transaction serialization, UTXO models, fee estimation.

#### ⚡ 2. *Mastering the Lightning Network*
- **Authors:** Andreas M. Antonopoulos, Olaoluwa Osuntokun (CTO Lightning Labs), René Pickhardt
- **Free Open Access:** [github.com/lnbook/lnbook](https://github.com/lnbook/lnbook)
- **Topics:** Payment channels, Hash Time-Locked Contracts (HTLCs), onion routing (Sphinx), BOLT-11 invoices, and BOLT-12 offers.

#### 💻 3. *Programming Bitcoin*
- **Author:** Jimmy Song (O'Reilly Media)
- **Free Open Access:** [github.com/jimmysong/programmingbitcoin](https://github.com/jimmysong/programmingbitcoin)
- **Topics:** Code-first implementation of finite fields, elliptic curves, transaction signing, and script validation.

#### 🎨 4. *Grokking Bitcoin*
- **Author:** Kalle Rosenbaum (Manning Publications)
- **Topics:** Visual diagrams explaining consensus, proof-of-work, and peer-to-peer gossip protocols.

---

### 6.2 Official Repositories & Documentation
- **Greenfield REST API Specification:** [docs.btcpayserver.org/API/Greenfield/v1/](https://docs.btcpayserver.org/API/Greenfield/v1/)
- **Core Server Repository:** [github.com/btcpayserver/btcpayserver](https://github.com/btcpayserver/btcpayserver) (ASP.NET Core, C#)
- **Deployment Suite:** [github.com/btcpayserver/btcpayserver-docker](https://github.com/btcpayserver/btcpayserver-docker)
- **NBXplorer:** [github.com/dgarage/NBXplorer](https://github.com/dgarage/NBXplorer) (Lightweight blockchain tracker)

---

### 6.3 Alternative Sovereign Platforms for Study
- **[LNbits](https://github.com/lnbits/lnbits):** Python/FastAPI modular accounting system with extensions for POS, offline cards, and paywalls.
- **[Alby Hub](https://github.com/getAlby/hub):** Go/TypeScript self-hosted node using Nostr Wallet Connect (NWC).
- **[Breez SDK](https://github.com/breez/breez-sdk):** Rust non-custodial Lightning client library for mobile/desktop apps.

---

## 7. Production Self-Hosting Blueprint (3-Command VPS Deploy)

To deploy your own production instance on any $5–$10/month cloud VPS (Debian/Ubuntu):

```bash
# 1. Clone the deployment tool
git clone https://github.com/btcpayserver/btcpayserver-docker
cd btcpayserver-docker

# 2. Configure domain and crypto engines
export BTCPAY_HOST="pay.yourdomain.com"
export LETSENCRYPT_EMAIL="admin@yourdomain.com"
export NBITCOIN_NETWORK="mainnet"
export BTCPAYGEN_CRYPTO1="btc"
export BTCPAYGEN_LIGHTNING="clightning"

# 3. Generate containers and launch
. ./btcpay-setup.sh -i
```
Automatically provisions Nginx reverse proxy with SSL, PostgreSQL database, NBXplorer, Bitcoin Core, and Lightning daemon.
