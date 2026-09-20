# 🛡️ CryptoWorks Interface & FinTech Payment Switching Documentation

**Document Title:** Comprehensive Technical Ledger & Interface Guide: Modern Fortran + Qt 6.0 Cryptographic Suite & SukiPay/Kirara FinTech Ecosystem  
**Document Identifier:** `cryptoWorks_interface.md`  
**Workspace:** `/home/cyrus/Projects/API_Projects/sukiGatewayClient` & `/home/cyrus/Projects/modernFortran_QT/CryptoWorks`  
**Standards Compliance:** ISO 8583:1987/1993 Financial Standards, NIST SP 800-38D (AES-GCM), RFC 2104 (HMAC-SHA256), ISO/IEC 7812 (Luhn Mod-10)  
**Author:** Antigravity AI Senior FinTech & Systems Architect  
**Date:** September 19, 2026  

---

## 📑 Executive Overview

This document captures the complete technical journey, architectural decisions, and production implementations established across two major projects:

1. **The SukiPay / Kirara FinTech Platform** (`sukiGatewayClient` & `kirara-server`):
   * Detailed Mermaid architectural and sequence diagrams (`DIAGRAMS_SUKIPAY_KIRARA.md`).
   * In-depth comparative analysis vs. legacy PassWay / CoalaPay (`Comparative.md`).
   * Master 12-week study guide, textbook bibliography, and RFC catalog (`begin_master_study.md`).

2. **The Modern Fortran 2008 + Qt 6.0 Cryptographic Suite** (`CryptoWorks`):
   * Complete augmentation of the computational engine with **AES-256-GCM AEAD**, **HMAC-SHA256 canonical query signing**, and **ISO 8583:1987 core banking financial presentment switching**.
   * Expansion of the C-ABI bridge and automated CLI verification test suite to **20/20 PASSING tests**.
   * Implementation of **Tab 3: "FinTech & ISO 8583 (SukiPay / Kirara)"** in the Qt 6 desktop application.

---

## 🏛️ Part 1: SukiPay Client ↔ Kirara Gateway Server Architecture

### 1.1 Diagram Suite Summary (`DIAGRAMS_SUKIPAY_KIRARA.md`)

Modeled as an enterprise-grade successor to `DIAGRAMAS_COALAPAY_V3.md`, the new specification contains 8 exhaustive diagrams in English:

* **High-Level Ecosystem Architecture (`graph TB`):** System topology linking SukiPay Client, Kirara API Ingress, ISO 8583 Switch Core, Hosted Cashier, MariaDB Ledger, Acquirer Switch, and Merchant Webhook sink.
* **Authentication & JWT Handshake (`sequenceDiagram`):** Canonical HMAC-SHA256 signing (`appId={id}&signTime={time}`), `/api/v2/token` issuance, AES-256-GCM response decryption, and local profile caching.
* **Secure Order Ingestion & Wire Protocol (`sequenceDiagram`):** Order payload encryption (`IV(12) || Ciphertext(N) || Tag(16)` hex), nonce anti-replay validation, timestamp drift check ($\le 300$s), MTI 0200 generation, and MariaDB persistence.
* **Dual Checkout Experience (`flowchart TD`):** Hosted cashier (`/cashier/pay`), dynamic scan-to-pay QR, and embedded virtual POS terminal simulator (`CashierSimulatorModal.tsx` with Visa/Mastercard/Amex/Decline presets).
* **ISO 8583 Core Financial Switch Translation (`sequenceDiagram`):** MTI 0200 (Purchase presentment), MTI 0210 (Authorization response), MTI 0400 (Reversal), STAN (DE 11), RRN (DE 37), and live telemetry streaming (`/iso8583/logs`).
* **Order & Refund Lifecycle State Machine (`stateDiagram-v2`):** Finite state transitions: `PENDING` $\rightarrow$ `PAID`, `CANCELLED`, `EXPIRED`, `FAILED`, and multi-stage partial/full refunds (`PARTIALLY_REFUNDED` $\rightarrow$ `REFUNDED`).
* **Async Webhook & Retry Engine (`sequenceDiagram`):** Background non-blocking dispatcher with exponential backoff, HMAC header signing, and AES delivery receipts.
* **Inquiry, Cancel & Refund Operations (`sequenceDiagram`):** Business operations flow for `/api/v2/query`, `/api/v2/cancel`, `/api/v2/refund`, and balance validation.
* **Decoupled System Architecture (`graph TD`):** Complete frontend/backend class and service layout.

---

## ⚖️ Part 2: Comparative Architecture Findings (`Comparative.md`)

A rigorous head-to-head evaluation between **SukiPay Client ↔ Kirara Server** and **PassWay Client ↔ CoalaPay Server**:

| Architectural Dimension | PassWay Client ↔ CoalaPay Server | SukiPay Client ↔ Kirara Server |
| :--- | :--- | :--- |
| **Technology Stack** | React 18, Vite, Tailwind v3, external `crypto-js` | **React 19**, Vite, **Tailwind CSS v4**, Pure TypeScript, zero crypto dependencies |
| **Build Speed** | Standard Vite bundle with polyfills | **Sub-220ms instant production build** |
| **System Autonomy** | Opaque third-party SaaS hosted in China | **100% Autonomous, open, self-hosted Node.js / TypeScript banking switch** |
| **Testing Ergonomics** | External browser tab redirect | **Embedded Virtual POS Terminal Simulator** (EMV Chip / Contactless NFC) |
| **Security & Anti-Replay** | Basic $\pm 30$s timestamp check | **Replay Guard** (Nonce cache, clock drift $\le 300$s, strict tenant isolation) |
| **Audit & Accounting** | Ephemeral browser console logs | **MariaDB Double-Entry Ledger** + Persistent Local Storage Audit Log (CSV/JSON) |
| **Cryptographic Engine** | Hybrid `crypto-js` + WebCrypto (`window.crypto.subtle`) | **Universal Pure TS Engine** (client) + **Node.js OpenSSL AES-NI** (server) |
| **ISO 8583:1987 Protocol** | ❌ **None** (Omitted / hidden by external SaaS) | ✅ **Full Core Compliance** (MTI 0200, 0210, 0400, 0220, STAN, RRN) |

---

## 📚 Part 3: Master Curriculum & Syllabus (`begin_master_study.md`)

A structured, 12-week professional mastery plan covering:
1. **The Definitive Textbooks:**
   * *Serious Cryptography* (Jean-Philippe Aumasson) — Block ciphers, GCM mode, and $\text{GF}(2^{128})$ GHASH polynomial math.
   * *Cryptography Engineering* (Ferguson, Schneier, Kohno) — Practical security pitfalls, nonce design, side-channel attacks.
   * *ISO 8583:1987/1993 Standard* & *jPOS Programmer's Guide* — Financial switch architecture, bitmaps, and data elements.
   * *Designing Data-Intensive Applications* (Martin Kleppmann) — ACID ledgers, idempotency, distributed transactions.
2. **The 12-Week Syllabus:**
   * Weeks 1–4: Cryptographic Foundations (AES-GCM, HMAC, Replay Guards, WebCrypto).
   * Weeks 5–8: ISO 8583 Financial Switching (MTIs, Bitmaps, STAN/RRN, Reversals, Switch Core).
   * Weeks 9–12: Gateway Integration & Ledgers (Double-entry accounting, Dynamic QR/POS, Webhooks, PCI-DSS 4.0).
3. **Four Hands-On Labs:**
   * Lab 1: Zero-Dependency Cryptographic Verification.
   * Lab 2: Live ISO 8583 Packet Decomposition.
   * Lab 3: Terminal POS Decline & Reversal Simulation.
   * Lab 4: Multi-Language Integration Validation (TS, Python, Java, cURL).

---

## 🚀 Part 4: The Augmented `CryptoWorks` Project

Located at: `/home/cyrus/Projects/modernFortran_QT/CryptoWorks`

### 4.1 System Topology & Interoperability

```mermaid
graph TB
    subgraph "Modern Fortran 2008 Backend (Engine)"
        E_Base["crypto_engine.f90<br/>• SHA-256 Digest & Hex<br/>• AES-256-CBC (PKCS#7)<br/>• NIST P-256 ECDSA (OpenSSL EVP)"]
        E_RC4["pure_fortran_rc4.f90<br/>• Pure Fortran RC4 Stream Cipher"]
        E_Pay["NEW: payment_crypto.f90<br/>• AES-256-GCM AEAD Wire Engine<br/>• 12B IV || Ciphertext || 16B Tag<br/>• HMAC-SHA256 Canonical Signer"]
        E_ISO["NEW: iso8583_engine.f90<br/>• Pure Fortran ISO 8583:1987 Packager<br/>• 64-bit Bitmap Bitmask (ibset, iand)<br/>• MTI 0200 Presentment Pack/Unpack<br/>• Luhn Mod-10 Checksum Validator"]
    end

    subgraph "C-ABI Interoperability Bridge"
        Bridge["engine_bridge.f90 & crypto_bridge.h<br/>• fortran_aes_256_gcm_encrypt()<br/>• fortran_aes_256_gcm_decrypt()<br/>• fortran_hmac_sha256()<br/>• fortran_iso8583_pack_0200()<br/>• fortran_luhn_check()"]
    end

    subgraph "Qt 6.0 Desktop Application"
        GUI["gui/cryptowindow.cpp & cryptowindow.h<br/>• Tab 1: Symmetric & Hash (AES-CBC / SHA / RC4)<br/>• Tab 2: Asymmetric ECC (NIST P-256 ECDSA)<br/>• Tab 3: FinTech & ISO 8583 (SukiPay / Kirara)"]
    end

    E_Base --> Bridge
    E_RC4 --> Bridge
    E_Pay --> Bridge
    E_ISO --> Bridge
    Bridge --> GUI
```

---

### 4.2 Detailed Implementation of New Modules

#### 1. `backend/payment_crypto.f90`
Provides authenticated Galois/Counter Mode encryption and HMAC canonical signing matching SukiPay/Kirara wire specifications:

* **AES-256-GCM Encryption (`aes_256_gcm_encrypt_wire`):**
  * Key: 64-character hexadecimal string converted to 32 binary bytes.
  * IV: 12 bytes generated cryptographically via OpenSSL `RAND_bytes`.
  * Tag: 16-byte GHASH authentication tag extracted via `EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_GCM_GET_TAG, 16, tag)`.
  * Wire Output: `IV(12) || Ciphertext(N) || Tag(16)` encoded as uppercase hexadecimal.
* **AES-256-GCM Decryption (`aes_256_gcm_decrypt_wire`):**
  * Splits wire payload: first 12 bytes as IV, last 16 bytes as Auth Tag, middle $N$ bytes as Ciphertext.
  * Sets expected tag via `EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_GCM_SET_TAG, 16, tag)`.
  * Decrypts and performs constant-time polynomial authentication. Returns `-2` on authentication tag mismatch.
* **Canonical HMAC-SHA256 (`hmac_sha256_hex`):**
  * Computes HMAC over canonical message strings (`appId={id}&signTime={time}` or `appData={hex}&signTime={time}`).
  * Returns 64-character lowercase hexadecimal signature.

#### 2. `backend/iso8583_engine.f90`
Pure Modern Fortran financial switch packager:

* **64-bit Primary Bitmap Calculation:**
  Uses 64-bit integer intrinsics (`ibset`, `iand`, `ishft`) to set active data element bits:
  * Bit 2: DE 2 (Primary Account Number - PAN)
  * Bit 3: DE 3 (Processing Code `000000`)
  * Bit 4: DE 4 (Amount in cents, 12 digits zero-padded)
  * Bit 11: DE 11 (Systems Trace Audit Number - STAN, 6 digits)
  * Bit 37: DE 37 (Retrieval Reference Number - RRN, 12 characters)
  * Bit 49: DE 49 (Currency Code `840` USD)
* **Packet Serialization (`iso8583_pack_0200`):**
  Assembles the wire message: `MTI(4) + Bitmap(16 Hex) + DE2_LL(2) + DE2(PAN) + DE3(6) + DE4(12) + DE11(6) + DE37(12) + DE49(3)`.
* **Packet Deserialization (`iso8583_unpack_0200`):**
  Unpacks incoming MTI 0200 messages, validates LLVAR lengths, and extracts individual data elements.
* **Luhn Mod-10 Checksum (`luhn_verify`):**
  Validates card number integrity per ISO/IEC 7812.

#### 3. `backend/crypto_bridge.h` & `backend/engine_bridge.f90`
Declares and exports clean C-ABI prototypes:
```c
int fortran_aes_256_gcm_encrypt(const char *plain_buf, int plain_len,
                                const char *app_key_hex,
                                char *out_wire_hex, int *out_len);

int fortran_aes_256_gcm_decrypt(const char *wire_hex, int wire_len,
                                const char *app_key_hex,
                                char *out_plain, int *out_len);

int fortran_hmac_sha256(const char *msg_buf, int msg_len,
                        const char *key_buf, int key_len,
                        char *out_sign_hex);

int fortran_iso8583_pack_0200(const char *pan, const char *amount_cents,
                              const char *stan, const char *rrn,
                              const char *currency,
                              char *out_packet, int *out_len);

int fortran_luhn_check(const char *pan);
```

---

### 4.3 Qt 6 GUI Implementation (`gui/cryptowindow.cpp`)

Added **Tab 3: "FinTech & ISO 8583 (SukiPay / Kirara)"**:

1. **Merchant Credentials Controls:**
   * `finAppIdEdit`: Merchant Application ID (e.g., `CZtest20260915090037`).
   * `finAppKeyEdit`: 64-character symmetric key (`09548218645f0070fc80591c858ec7b4a8334fbd0a5aa8fe6bc8d819a849e6fa`).
   * `finSignTimeEdit`: Millisecond epoch timestamp.
   * `finAppSignEdit`: Displays computed 64-character lowercase HMAC signature.

2. **Order Ingestion & Wire Cryptography:**
   * `finPayloadEdit`: JSON order string (`{"orderId":"CP20260919001","amount":"49.99","currency":"USD","channel":"ONLINE"}`).
   * `finAppDataEdit`: Output/Input field for encrypted wire hexadecimal string (`IV || Ciphertext || AuthTag`).
   * Action buttons:
     * 🔒 **"Encrypt to appData (AES-GCM Hex)"**: Calls Fortran GCM engine and populates `finAppDataEdit`.
     * 🔓 **"Decrypt appData & Verify Tag"**: Calls Fortran decryption; displays plaintext on success or flags GHASH tampering.
     * ✍️ **"Sign Canonical (HMAC-SHA256)"**: Computes canonical query signature.

3. **Core Banking Switch Controls:**
   * `isoPanEdit`: Card PAN (`4111111111111111`).
   * `isoAmountEdit`: Amount in cents (`4999`).
   * `isoStanEdit`: Systems Trace Audit Number (`100042`).
   * `isoRrnEdit`: Retrieval Reference Number (`626214819203`).
   * `isoCurEdit`: Currency Code (`840`).
   * `isoPacketEdit`: Displays complete packed ISO 8583 message.
   * Action buttons:
     * 💳 **"Pack MTI 0200 Presentment"**: Serializes fields into standard ISO wire string.
     * 🔍 **"Verify Card (Luhn Mod-10)"**: Checks card validity.

---

### 4.4 Automated 20-Point CLI Verification Suite

The backend test suite in [`backend/test_crypto_engine.f90`](file:///home/cyrus/Projects/modernFortran_QT/CryptoWorks/backend/test_crypto_engine.f90) verifies all 20 cryptographic and financial test vectors:

```text
 === 4. AUTOMATED VERIFICATION SUITE ===
  [PASS] SHA-256 NIST Vector 1 (Empty String)
  [PASS] SHA-256 NIST Vector 2 ('abc')
  [PASS] SHA-256 Demo Payload Integrity
  [PASS] AES-256-CBC Roundtrip Integrity
  [PASS] AES-256-CBC Tampered Ciphertext Detection
  [PASS] AES-256-CBC Buffer Guard
  [PASS] RC4 Known Test Vector (RFC 6229)
  [PASS] RC4 Roundtrip Integrity
  [PASS] RC4 Empty Key Guard
  [PASS] Hex Utility Conversion Roundtrip
  [PASS] ECC NIST P-256 Keypair Generation
  [PASS] ECDSA P-256 Signature & Verification Roundtrip
  [PASS] ECDSA Tampered Message Rejection
  [PASS] ECDSA Tampered Signature Rejection
  [PASS] ECDSA Wrong Key Rejection
  [PASS] AES-256-GCM Wire Roundtrip (IV || Ciphertext || AuthTag)
  [PASS] AES-256-GCM Tampered Auth Tag Rejection
  [PASS] HMAC-SHA256 Canonical Query String Signing
  [PASS] ISO 8583 MTI 0200 Pack & Unpack (64-bit Bitmap)
  [PASS] Luhn Mod-10 Card Checksum Verification

Test Summary: 20/20 passed.
 ALL TESTS PASSED SUCCESSFULLY!
```

---

## 💻 Part 5: Compilation, Execution & Operations Guide

### 5.1 Quick Start for `CryptoWorks`

```bash
cd /home/cyrus/Projects/modernFortran_QT/CryptoWorks

# 1. Clean build and compile both Fortran backend and Qt 6 GUI:
make all

# 2. Run the 20-point verification test suite:
make test

# 3. Launch the Qt 6 GUI application:
make run
# or run the staged binary directly:
./bin/cryptoworks_gui
```

### 5.2 Quick Start for SukiPay Client & Kirara Server

```bash
# Terminal 1: Start Kirara Gateway Server (Switch Backend)
cd /home/cyrus/Projects/API_Projects/kirara-server
npm start
# Listens on http://0.0.0.0:8080

# Terminal 2: Start SukiPay Client (Merchant Console & POS Simulator)
cd /home/cyrus/Projects/API_Projects/sukiGatewayClient
npm run dev
# Open http://localhost:5173 in browser
```

---

## 📜 Part 6: Cross-Project Documentation Index

| Document | Location | Purpose |
| :--- | :--- | :--- |
| **`DIAGRAMS_SUKIPAY_KIRARA.md`** | `sukiGatewayClient/` | 8 Mermaid diagrams covering authentication, order creation, ISO 8583 switching, cashier/POS simulator, and webhooks. |
| **`Comparative.md`** | `sukiGatewayClient/` | Comprehensive technical comparison of SukiPay/Kirara vs. PassWay/CoalaPay across cryptography, ISO 8583, and architecture. |
| **`begin_master_study.md`** | `sukiGatewayClient/` | Master 12-week study syllabus, textbook guide, and 4 practical hands-on labs. |
| **`cryptoWorks_interface.md`** | `sukiGatewayClient/` & `CryptoWorks/` | **This document:** Full ledger and interface guide linking the Fortran/Qt engine to the SukiPay payment switch. |
| **`README.md`** | `CryptoWorks/` | Architecture manual for the Modern Fortran + Qt 6.0 Cryptographic Suite. |
| **`README.md`** | `sukiGatewayClient/` | Developer console overview and operations workbench manual. |

---

*Verified and sealed by SukiPay Systems & Antigravity AI Engineering.*
