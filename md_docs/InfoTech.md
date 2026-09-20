# SukiPay Client — Architecture, Protocol & Technical Manual (`InfoTech.md`)

**Project Name:** SukiPay Client (`sukiGatewayClient`)  
**Standard Compliance:** ISO 8583 Financial Transaction Card Originated Messages / CoalaPay REST v2.1  
**Target Backend:** Kirara Gateway / ISO 8583 Payment Switch (`http://localhost:8080` & `http://localhost:3000`)  
**Technology Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React  
**Author:** SukiPay Systems & Antigravity AI Engineering  
**Date:** September 19, 2026  

---

## 1. Executive Summary & Product Vision

**SukiPay Client** is a fintech developer console and payment switch operations platform designed as an enterprise-grade successor to legacy gateway testing clients (such as `coalaPay-client`).

While legacy clients were tied to customer-specific constraints and monolithic single-component architectures, SukiPay Client delivers:
1. **Dynamic Environment Management:** Instant profile switching between local switches (ports 8080 and 3000), staging bank egress, and offline mock sandboxes with custom URL, App ID, and App Key management.
2. **End-to-End Client-Side Cryptography:** Pure TypeScript implementation of AES-256-GCM and HMAC-SHA256 with 100% roundtrip accuracy and wire-format parity with banking switch specifications.
3. **Dual Banking Switch Visibility:** Dual-pane inspection showing REST JSON requests alongside raw ISO 8583 packets (MTI 0200, 0210, 0400), STAN, RRN, and parsed data element bitmaps.
4. **Embedded POS & Buyer Terminal Simulator:** An integrated virtual card checkout terminal with test card presets (Visa, Mastercard, Amex, Decline) allowing instant settlement (`/cashier/api/simulate-pay`) directly within the console.
5. **Multi-Language SDK Code Generation:** 1-click exporter producing ready-to-run integration code in TypeScript/Node.js, Python, Java, and cURL.
6. **Auditable Local Ledger:** Local storage-backed audit log capturing raw headers, encrypted envelopes, decrypted payloads, and latency, exportable to JSON and CSV.

---

## 2. System Architecture & Component Hierarchy

```
sukiGatewayClient/
├── index.html
├── package.json               # React 19, Vite, Tailwind CSS v4, Lucide React
├── tsconfig.json              # Bundler resolution, strict types
├── tsconfig.app.json          # Module detection & TS configuration
├── vite.config.ts             # Tailwind CSS Vite plugin integration
└── src/
    ├── main.tsx               # React root renderer
    ├── App.tsx                # Central state coordinator & modal orchestrator
    ├── index.css              # Tailwind CSS directives & custom dark theme
    ├── types/
    │   └── gateway.ts         # TypeScript contracts for orders, switch logs & audit
    ├── crypto/
    │   └── crypto-engine.ts   # Pure TS AES-256-GCM & HMAC-SHA256 engine
    ├── services/
    │   ├── api-client.ts      # Profile manager, REST dispatcher & audit logger
    │   └── code-generator.ts  # Multi-language SDK generator (TS, Python, Java, cURL)
    └── components/
        ├── Header.tsx                 # Profile selector, health check ping, token status
        ├── ProfileModal.tsx           # Environment manager & custom profile editor
        ├── PaymentConsole.tsx         # Payment operations cockpit (Pay, Query, Refund)
        ├── CashierSimulatorModal.tsx  # Embedded POS virtual buyer terminal simulator
        ├── SwitchInspector.tsx        # ISO 8583 switch packet visualizer & field decoder
        ├── AuditLedger.tsx            # Searchable request ledger with JSON/CSV export
        ├── CryptoToolbox.tsx          # Standalone cryptographic sandbox & key generator
        └── CodeExporterModal.tsx      # SDK snippet exporter modal
```

---

## 3. Cryptographic Layer & Wire Protocol

SukiPay Client implements authenticated payload encryption and request signing matching Kirara Gateway's security requirements.

### 3.1 AES-256-GCM Authenticated Encryption
* **Cipher Mode:** AES-256-GCM (Galois/Counter Mode).
* **Key Length:** 256 bits (32 bytes), represented as a 64-character uppercase hexadecimal string.
* **Initialization Vector (IV):** 96 bits (12 bytes) cryptographically random per message.
* **Authentication Tag:** 128 bits (16 bytes) appended at the end of the ciphertext.
* **Wire Format (Uppercase Hex):**
  $$\text{Payload} = \text{IV (12 bytes)} \;||\; \text{Ciphertext (N bytes)} \;||\; \text{Auth Tag (16 bytes)}$$

```typescript
// src/crypto/crypto-engine.ts
public encryptToHex(plainText: string, appKeyHex: string): string {
  const keyBytes = this.hexToBytes(appKeyHex);
  const iv = this.randomBytes(12);
  const plainBytes = new TextEncoder().encode(plainText);
  // ... GCTR counter mode encryption & GHASH polynomial authentication ...
  return this.bytesToHexUpper(out); // IV(12) || CT(N) || Tag(16)
}
```

### 3.2 HMAC-SHA256 Request Signing
All requests must include an `appSign` header generated via HMAC-SHA256:

* **For Token Handshake (`/api/v2/token`):**
  $$\text{appSign} = \text{HMAC-SHA256}(appKey, \text{"appId="} + appId + \text{"&signTime="} + signTime)$$
* **For Business Endpoints (`/api/v2/pay`, `/api/v2/query`, etc.):**
  $$\text{appSign} = \text{HMAC-SHA256}(appKey, \text{"appData="} + appDataHex + \text{"&signTime="} + signTime)$$

---

## 4. API Endpoints & Request Specifications

| Endpoint | Method | Required Headers | Payload Format | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/api/v2/token` | `POST` | `appId`, `signTime`, `appSign` | `null` | Issues 2-hour JWT access token |
| `/api/v2/pay` | `POST` | `appId`, `token`, `signTime`, `nonce`, `appSign`, `locale` | `{"appData": "<HEX>"}` | Creates cashier order & returns checkout URL |
| `/api/v2/query` | `POST` | `appId`, `token`, `signTime`, `nonce`, `appSign`, `locale` | `{"appData": "<HEX>"}` | Queries order status by `orderId` or `merchantOrderId` |
| `/api/v2/cancel` | `POST` | `appId`, `token`, `signTime`, `nonce`, `appSign`, `locale` | `{"appData": "<HEX>"}` | Cancels an unpaid pending order |
| `/api/v2/refund` | `POST` | `appId`, `token`, `signTime`, `nonce`, `appSign`, `locale` | `{"appData": "<HEX>"}` | Submits partial or full order refund |
| `/api/v2/refund/query` | `POST` | `appId`, `token`, `signTime`, `nonce`, `appSign`, `locale` | `{"appData": "<HEX>"}` | Queries refund status by `refundId` |
| `/iso8583/logs` | `GET` | *(None)* | *(None)* | Streams live banking switch transaction telemetry |
| `/cashier/api/simulate-pay` | `POST` | `Content-Type: application/json` | `{"orderId": "..."}` | Settles order to `PAID` and triggers webhook |

---

## 5. Registered Merchant Credentials & Profiles

Kirara Gateway validates credentials using its internal credential store in [`kirara-server/src/config/env.ts`](file:///home/cyrus/Projects/API_Projects/kirara-server/src/config/env.ts). SukiPay Client includes these preloaded:

### Default Profile: Kirara Switch (Port 8080)
* **Base URL:** `http://localhost:8080`
* **App ID:** `CZtest20260915090037`
* **App Key:** `09548218645f0070fc80591c858ec7b4a8334fbd0a5aa8fe6bc8d819a849e6fa`
* **Health Check:** `GET /health` (monitors status and server latency)

### Secondary Profile: Kirara Switch (Port 3000)
* **Base URL:** `http://localhost:3000`
* **App ID:** `CZtest20260915090037`
* **App Key:** `09548218645f0070fc80591c858ec7b4a8334fbd0a5aa8fe6bc8d819a849e6fa`

### Cross-Compatible Profile: SukiPay Integration Key
* **App ID:** `APP_COALAPAY_TEST_01`
* **App Key:** `E1F2A3B4C5D6E7F809182736455463728192A3B4C5D6E7F80918273645546372`

---

## 6. ISO 8583 Financial Switch Telemetry

When an order is created or settled in Kirara Gateway, it is converted into an ISO 8583 core financial message. SukiPay Client inspects these in real time:

* **MTI (Message Type Identifier):**
  * `0200`: Acquirer Financial Transaction Request (Purchase)
  * `0210`: Financial Transaction Response (Issuer Approval/Decline)
  * `0400`: Transaction Reversal Request
* **Key Data Elements (DE):**
  * **DE 2:** Primary Account Number (PAN, masked `4111********1111`)
  * **DE 3:** Processing Code (`000000` for Goods & Services Purchase)
  * **DE 4:** Transaction Amount (12-digit zero-padded, e.g., `000000004999` for $49.99)
  * **DE 11:** Systems Trace Audit Number (STAN, 6 numeric digits)
  * **DE 37:** Retrieval Reference Number (RRN, 12 alphanumeric characters)
  * **DE 39:** Response Code (`00` = Approved, `05` = Do Not Honor, `51` = Insufficient Funds)
  * **DE 49:** Currency Code (`840` = USD, `978` = EUR, `124` = CAD)

---

## 7. Multi-Language SDK Exporter Reference

Beside every executed request, SukiPay Client generates production-ready code in 4 languages:

### TypeScript / Node.js
```typescript
import crypto from 'node:crypto';

function encryptAes256Gcm(plainText: string, keyHex: string): string {
  const key = Buffer.from(keyHex, 'hex');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, encrypted, tag]).toString('hex').toUpperCase();
}
```

### Python
```python
import json, time, os, requests, hmac, hashlib
from Cryptodome.Cipher import AES

def encrypt_aes_256_gcm(plain_text: str, key_hex: str) -> str:
    key_bytes = bytes.fromhex(key_hex)
    iv = os.urandom(12)
    cipher = AES.new(key_bytes, AES.MODE_GCM, nonce=iv)
    ciphertext, tag = cipher.encrypt_and_digest(plain_text.encode('utf-8'))
    return (iv + ciphertext + tag).hex().upper()
```

### Java
```java
Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
cipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(keyBytes, "AES"), new GCMParameterSpec(128, iv));
byte[] cipherTextWithTag = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));
```

### cURL
```bash
curl -X POST "http://localhost:8080/api/v2/pay" \
  -H "Content-Type: application/json" \
  -H "appId: CZtest20260915090037" \
  -H "token: YOUR_JWT_TOKEN" \
  -H "signTime: 1789832913000" \
  -H "nonce: 690940523e16428d9c288ca388d011ff" \
  -H "appSign: YOUR_HMAC_SIGNATURE" \
  -H "locale: en" \
  -d '{"appData": "A1B2...ENCRYPTED_HEX...D4E5"}'
```

---

## 8. Verification & Live Execution Trajectory

During development, the live end-to-end flow was executed and verified against the running Kirara Gateway switch backend:

```
[LIVE FLOW EXECUTION LOG]
--- 1. ACQUIRING TOKEN ---
POST http://localhost:8080/api/v2/token
Status: 200 OK
Decrypted Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ... (Expires in 7200s)

--- 2. CREATING CASHIER ORDER ---
POST http://localhost:8080/api/v2/pay
Payload: { merchantOrderId: 'SUKI-LIVE-913784', amount: '49.99', currency: 'USD' }
Status: 200 OK
Order ID: CP17898329139329793 | Status: PENDING

--- 3. SIMULATING BUYER PAYMENT ---
POST http://localhost:8080/cashier/api/simulate-pay
Body: { orderId: 'CP17898329139329793' }
Status: 200 OK
Payment settled successfully! Transaction ID: TXN-SWITCH-1789832913972-5715

--- 4. QUERYING ORDER STATUS ---
POST http://localhost:8080/api/v2/query
Status: 200 OK
Queried Status: PAID (Succeeded)

--- 5. CHECKING ISO 8583 SWITCH LOGS ---
GET http://localhost:8080/iso8583/logs
Captured Switch Packet: MTI 0200 | STAN: 100001 | RRN: 626021671490 | Response: 00 APPROVED
```

---

## 9. Operation & Maintenance Commands

* **Run Development Server:**
  ```bash
  npm run dev
  ```
* **Build Production Bundle:**
  ```bash
  npm run build
  ```
* **Run Linter:**
  ```bash
  npm run lint
  ```
* **Run Preview Server:**
  ```bash
  npm run preview
  ```
