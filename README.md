# SukiPay Client — ISO 8583 & REST Payment Switch Operations Console

**SukiPay Client** is a high-performance developer console and payment operations suite engineered for ISO 8583 financial switches and REST payment gateways (adhering to CoalaPay REST v2.1 and Kirara Switch standards).

Built with **React 19 + Vite + TypeScript + Tailwind CSS**, SukiPay Client delivers an elevated developer and merchant experience with client-side cryptography, point-of-sale terminal simulation, real-time switch message inspection, and instant multi-language SDK code export.

---

## 🌟 Key Features & Improvements over Legacy CoalaPay Client

| Feature | Legacy CoalaPay Client | **SukiPay Client** |
| :--- | :--- | :--- |
| **Gateway Management** | Hardcoded dropdown presets | **Dynamic Environment Profiles** (custom URLs, ports 8080/3000/remote, custom AppId/AppKey, live `/health` latency ping) |
| **ISO 8583 Visibility** | None (REST-only perspective) | **Live Financial Switch Inspector** (MTI 0200/0210/0400, STAN, RRN, field breakdown, raw HEX packet telemetry) |
| **Point of Sale / Checkout** | Requires external browser tab | **Embedded Buyer Terminal Simulator** (virtual EMV chip/contactless cards, preset test cards, 1-click payment settlement) |
| **Client-Side Cryptography** | Hidden inside Angular service | **Interactive Crypto Sandbox** (AES-256-GCM authenticated encrypt/decrypt, HMAC-SHA256 hasher, key generator) |
| **SDK Code Exporter** | None (manual curl reproduction) | **1-Click Multi-Language Exporter** (TypeScript / Node.js, Python, Java, and cURL) |
| **Audit Ledger** | Memory-only logs | **Persistent Audit Ledger** with local storage, request inspection, search filters, and JSON / CSV export |
| **Stack & Performance** | Heavy Angular monolithic component | **React 19 + Vite + Tailwind CSS** with sub-350ms instant production builds |

---

## 🚀 Quick Start

### 1. Start Kirara Gateway Server (Switch Backend)
In a separate terminal:
```bash
cd /home/cyrus/Projects/API_Projects/kirara-server
npm start
```
*Kirara Gateway will listen on `http://0.0.0.0:8080` (or configured port).*

### 2. Start SukiPay Client
In the `sukiGatewayClient` directory:
```bash
cd /home/cyrus/Projects/API_Projects/sukiGatewayClient
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 🧩 Architectural Modules

* **`src/types/gateway.ts`**: Complete type contracts for profiles, orders, refunds, ISO 8583 switch logs, and audit entries.
* **`src/crypto/crypto-engine.ts`**: Pure TypeScript AES-256-GCM (12-byte IV, 16-byte Auth Tag, hex encoding) and HMAC-SHA256 signature calculation.
* **`src/services/api-client.ts`**: Automated request signing, token acquisition, business endpoint dispatching, and audit logging.
* **`src/services/code-generator.ts`**: Real-time code generator exporting executed calls into TypeScript, Python, Java, and cURL.
* **`src/components/Header.tsx`**: Profile selector, live gateway health ping badge, token status, and documentation links.
* **`src/components/PaymentConsole.tsx`**: Interactive operations workbench (Create Order, Query, Refund, Cancel, Acquire Token).
* **`src/components/CashierSimulatorModal.tsx`**: Embedded virtual card terminal with test card presets (Visa, Mastercard, Amex, Decline) for live order settlement.
* **`src/components/SwitchInspector.tsx`**: Dual-pane ISO 8583 switch monitor streaming live transactions from `/iso8583/logs`.
* **`src/components/AuditLedger.tsx`**: Filterable transaction log with JSON and CSV export capabilities.
* **`src/components/CryptoToolbox.tsx`**: Cryptographic validation utility for testing AES keys, IVs, tags, and HMAC signatures.

---

## 🔐 Cryptographic Specifications

* **Symmetric Encryption**: `AES-256-GCM` (Galois/Counter Mode).
  * Key: 256 bits (32 bytes / 64 hex characters).
  * IV: 96 bits (12 bytes) cryptographically random per message.
  * Tag: 128 bits (16 bytes) authentication tag.
  * Wire Format: `IV(12 bytes) || Ciphertext(N bytes) || AuthTag(16 bytes)` in uppercase hexadecimal.
* **Message Authentication**: `HMAC-SHA256`.
  * Canonical Query String format:
    * Token: `appId={appId}&signTime={signTime}`
    * Business endpoints: `appData={appDataHex}&signTime={signTime}`
