# 📊 Architectural & Sequence Diagrams — SukiPay Client ↔ Kirara Gateway Server

This document delivers an in-depth architectural blueprint and Mermaid sequence diagrams detailing the end-to-end interactions between **SukiPay Client** (`sukiGatewayClient`) and **Kirara Gateway Server** (`kirara-server`). 

It covers client-side authenticated cryptography (**AES-256-GCM** and **HMAC-SHA256**), token handshakes, order lifecycle management, **ISO 8583 financial switch message translation** (MTI 0200, 0210, 0400, 0220), hosted cashier vs. embedded POS terminal checkout, and asynchronous webhook delivery.

---

## 📑 Table of Contents

1. [High-Level Ecosystem Architecture](#1-high-level-ecosystem-architecture)
2. [Authentication & JWT Token Handshake Flow](#2-authentication--jwt-token-handshake-flow)
3. [Secure Order Ingestion & Cryptographic Wire Protocol](#3-secure-order-ingestion--cryptographic-wire-protocol)
4. [Dual Checkout Experience: Hosted Cashier, QR & Embedded POS Simulator](#4-dual-checkout-experience-hosted-cashier-qr--embedded-pos-simulator)
5. [ISO 8583 Core Financial Switch Translation & Live Telemetry](#5-iso-8583-core-financial-switch-translation--live-telemetry)
6. [Complete Order & Refund Lifecycle State Machine](#6-complete-order--refund-lifecycle-state-machine)
7. [Asynchronous Webhook Notification & Retry Engine](#7-asynchronous-webhook-notification--retry-engine)
8. [Order Inquiry, Cancellation & Multi-Tier Refund Operations](#8-order-inquiry-cancellation--multi-tier-refund-operations)
9. [Component & Layered System Architecture](#9-component--layered-system-architecture)

---

## 1. High-Level Ecosystem Architecture

The SukiPay ecosystem bridges modern REST web and mobile applications with traditional ISO 8583 core financial banking switches.

```mermaid
graph TB
    subgraph "Merchant & Operator Domain (Frontend)"
        Client["SukiPay Client (React 19 + Vite)<br/>• Dynamic Environment Profiles<br/>• Pure TypeScript AES/HMAC Engine<br/>• Embedded Virtual POS Terminal<br/>• Live Switch Telemetry Streamer"]
        Browser["Buyer Web / Mobile Browser<br/>(Hosted Cashier / QR Display)"]
    end

    subgraph "SukiPay Gateway Platform (Kirara Server)"
        Ingress["API Gateway Router (Express / TypeScript)<br/>• Replay Guard & Drift Validator<br/>• Auth & Signature Middleware"]
        CryptoEngine["Kirara Cryptographic Engine<br/>• AES-256-GCM / HMAC-SHA256<br/>• HS256 JWT Token Issuer"]
        SwitchCore["ISO 8583 Financial Switch Engine<br/>• MTI 0200 / 0210 / 0400 / 0220<br/>• STAN & RRN Generator<br/>• Bitmaps & Field Formatter"]
        OrderStore["Order & Ledger Service (`order.store.ts`)<br/>• In-Memory Fast Cache<br/>• Atomic Transaction State"]
        CashierRouter["Hosted Cashier & QR Engine (`cashier.routes.ts`)<br/>• Mobile Checkout UI<br/>• Dynamic QR Code Generator"]
        WebhookEng["Async Webhook Dispatcher<br/>• Exponential Backoff Retries<br/>• HMAC Delivery Receipts"]
    end

    subgraph "Persistence & External Banking Network"
        MariaDB[("MariaDB Enterprise Ledger<br/>• orders<br/>• refunds<br/>• iso8583_logs")]
        Acquirer["Core Banking Network / Acquirer Switch<br/>(ISO 8583 Host)"]
        MerchantServer["Merchant Backend System<br/>(Webhook Receiver / returnUrl)"]
    end

    Client -->|"POST /api/v2/* (AES-256-GCM + HMAC)"| Ingress
    Client -->|"GET /iso8583/logs (Live Poll/Stream)"| Ingress
    Browser -->|"GET /cashier/pay?orderId=..."| CashierRouter
    Browser -->|"POST /cashier/api/simulate-pay"| CashierRouter

    Ingress --> CryptoEngine
    Ingress --> OrderStore
    OrderStore --> SwitchCore
    SwitchCore <--> Acquirer
    OrderStore <--> MariaDB
    OrderStore --> WebhookEng
    CashierRouter --> OrderStore
    WebhookEng -->|"POST returnUrl (Encrypted & Signed)"| MerchantServer
```

---

## 2. Authentication & JWT Token Handshake Flow

All transactional operations require a time-bounded HS256 JWT access token issued via `/api/v2/token`. The request and response utilize client-side HMAC signature verification and AES-256-GCM envelope encryption.

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Merchant / Operator
    participant Client as SukiPay Client (`api-client.ts`)
    participant Crypto as Crypto Engine (`crypto-engine.ts`)
    participant Gateway as Kirara Gateway (`auth.routes.ts`)
    participant TokenSvc as Token Service (`token.ts`)

    Note over Dev,Gateway: Step 1: Request Preparation & Canonical Signature
    Dev->>Client: Triggers "Acquire Token" or performs business call
    Client->>Crypto: getSignTime()
    Crypto-->>Client: signTime = "1726780800000"
    Client->>Crypto: signToken(appId, appKey, signTime)
    Note over Crypto: Canonical Query: appId={appId}&signTime={signTime}<br/>Calculates HMAC-SHA256(appKey, string)
    Crypto-->>Client: appSign (Hexadecimal Signature)

    Note over Client,Gateway: Step 2: Gateway Verification & JWT Issuance
    Client->>Gateway: POST /api/v2/token<br/>Headers: [appId, signTime, appSign]
    Gateway->>Gateway: Lookup merchant appKey by appId
    Gateway->>Gateway: Verify HMAC-SHA256 signature
    Gateway->>TokenSvc: generateToken(appId, expireSeconds = 7200)
    TokenSvc-->>Gateway: jwtToken ("eyJhbGciOiJIUzI1Ni...")
    
    Note over Gateway,Client: Step 3: Authenticated Response Encryption
    Gateway->>Gateway: Encrypt payload `{ token, expiresIn: 7200 }` with AES-256-GCM
    Gateway-->>Client: HTTP 200 OK { statusCode: 200, message: "success", content: "<HEX_CIPHERTEXT>" }
    
    Note over Client: Step 4: Client-Side Decryption & Local Profile Cache
    Client->>Crypto: decryptFromHex(content, appKey)
    Note over Crypto: Parse IV(12B) || Ciphertext(NB) || Tag(16B)<br/>GHASH Auth Verification + GCTR Decryption
    Crypto-->>Client: Plain JSON: `{ token: "jwtToken...", expiresIn: 7200 }`
    Client->>Client: Cache token in Active Profile with expiration timestamp
    Client-->>Dev: UI displays Active Token & countdown badge
```

---

## 3. Secure Order Ingestion & Cryptographic Wire Protocol

The `/api/v2/pay` endpoint creates an order within Kirara Gateway. It enforces strict Replay Guard defenses, validates signatures, decrypts order metadata, logs an ISO 8583 presentment request (MTI 0200), and registers the transaction in MariaDB.

```mermaid
sequenceDiagram
    autonumber
    actor Merchant as Merchant / Cashier
    participant UI as PaymentConsole.tsx
    participant Client as SukiApiClient
    participant Crypto as Client Crypto Engine
    participant Gateway as Kirara Server (/api/v2/pay)
    participant ReplayGuard as Middleware (Replay & Drift)
    participant Switch as ISO 8583 Switch Core
    participant DB as MariaDB Core Ledger

    Merchant->>UI: Submits Order ($49.99 USD, Channel: ONLINE, returnUrl)
    UI->>Client: createOrder(activeProfile, orderPayload)

    Note over Client,Crypto: Client-Side Envelope Preparation
    Client->>Crypto: encryptToHex(JSON.stringify(orderPayload), appKey)
    Note over Crypto: 1. Generate random 12-byte IV<br/>2. AES-CTR encrypt payload<br/>3. Compute 16-byte GHASH tag<br/>4. Concat: IV || Ciphertext || Tag (Uppercase Hex)
    Crypto-->>Client: appData (Hex Encrypted Envelope)

    Client->>Crypto: generateNonce()
    Crypto-->>Client: nonce ("a4f9b2c8e1d03567...")
    Client->>Crypto: getSignTime()
    Crypto-->>Client: signTime = "1726780825000"
    Client->>Crypto: signAppData(appData, appKey, signTime)
    Note over Crypto: Canonical String: appData={hex}&signTime={time}<br/>HMAC-SHA256 signature
    Crypto-->>Client: appSign

    Note over Client,Gateway: Secure HTTPS Transmission
    Client->>Gateway: POST /api/v2/pay<br/>Headers: [appId, token, signTime, nonce, appSign, locale]<br/>Body: { "appData": "<HEX_CIPHERTEXT>" }

    Note over Gateway,ReplayGuard: Security & Anti-Tamper Verification
    Gateway->>ReplayGuard: Validate clock drift (|now - signTime| <= 300s)
    Gateway->>ReplayGuard: Check Nonce uniqueness (prevent replay attacks)
    Gateway->>Gateway: Verify JWT Bearer Token (HS256)
    Gateway->>Gateway: Recalculate HMAC-SHA256(appKey, "appData=...&signTime=...")
    Gateway->>Gateway: Decrypt appData via AES-256-GCM

    Note over Gateway,Switch: Financial Switch & Persistence
    Gateway->>Switch: recordIsoSwitch("0200", "000000", amount, terminalId, appId, currency, orderId)
    Switch->>Switch: Generate STAN (DE 11) & RRN (DE 37)
    Switch->>DB: INSERT INTO iso8583_logs (mti: "0200", stan, rrn, amount...)
    Gateway->>DB: INSERT INTO orders (order_id, status: "PENDING", amount, pay_url...)
    
    Gateway->>Gateway: Encrypt response data `{ orderId, payUrl, qrCodeData, status: "PENDING" }`
    Gateway-->>Client: HTTP 200 OK { statusCode: 200, content: "<ENCRYPTED_HEX>" }
    
    Client->>Crypto: decryptFromHex(content, appKey)
    Crypto-->>Client: CreateOrderData
    Client-->>UI: Renders Order Result Card with Hosted URL, QR & POS Simulator
```

---

## 4. Dual Checkout Experience: Hosted Cashier, QR & Embedded POS Simulator

Once an order is created with status `PENDING`, SukiPay offers two distinct buyer completion pathways: the external hosted web cashier/QR scan or the zero-latency embedded POS Buyer Terminal Simulator.

```mermaid
flowchart TD
    Start([Order Created in State: PENDING]) --> PathSelection{Checkout Mode Chosen}

    %% External Hosted Cashier Path
    PathSelection -- "External Hosted Cashier" --> OpenCashier["Open payUrl in Browser<br/>`/cashier/pay?orderId=CP...`"]
    PathSelection -- "Dynamic Scan-to-Pay QR" --> ScanQR["Display Dynamic QR Code<br/>Base64 Image Data"]
    
    OpenCashier --> HostedUI["Kirara Hosted Cashier Page<br/>(Card inputs, Expiry, CVV, Amount)"]
    ScanQR --> MobileScan["Buyer Scans with Banking App / Wallet"]
    
    HostedUI --> SubmitHosted["Buyer Clicks 'Pay Now'<br/>Calls `/cashier/api/simulate-pay`"]
    MobileScan --> SubmitHosted

    %% Embedded POS Terminal Simulator Path
    PathSelection -- "Embedded POS Simulator" --> LaunchModal["Open `CashierSimulatorModal.tsx`<br/>Fetches `/cashier/api/order-details`"]
    LaunchModal --> CardSelect{"Select Virtual Card Preset"}
    CardSelect -- "Visa Approved" --> LoadVisa["Load 4111********1111 (Exp: 12/28)"]
    CardSelect -- "Mastercard Approved" --> LoadMC["Load 5500********0004 (Exp: 09/27)"]
    CardSelect -- "Amex Approved" --> LoadAmex["Load 3782********0005 (Exp: 01/29)"]
    CardSelect -- "Decline Test" --> LoadDecline["Load 4000********0002 (Do Not Honor)"]

    LoadVisa --> TapCard["Click 'Simulate Payment Settlement'<br/>(Simulates EMV Chip / Contactless NFC)"]
    LoadMC --> TapCard
    LoadAmex --> TapCard
    LoadDecline --> DeclineAction["Click 'Simulate Payment Settlement'"]

    TapCard --> DispatchPay["POST /cashier/api/simulate-pay<br/>Payload: { orderId }"]
    DeclineAction --> DispatchDecline["POST /cashier/api/simulate-pay<br/>(Simulate Card Rejection)"]

    %% Settlement Core
    SubmitHosted --> ProcessSettlement["Kirara OrderStore.simulatePayOrder(orderId)"]
    DispatchPay --> ProcessSettlement
    DispatchDecline --> DeclineSettlement["Record ISO MTI 0210 Response Code 05<br/>Set Order status = FAILED"]

    ProcessSettlement --> CoreApproval["1. Generate ISO 8583 MTI 0210 (Code 00 Approved)<br/>2. Update MariaDB: status = 'PAID', paid_at = NOW()<br/>3. Enqueue Asynchronous Webhook (`ORDER.PAID`)"]

    CoreApproval --> ReconcileUI{"Client Updates State"}
    ReconcileUI -- "Console Auto-Poll / Query" --> QueryOrder["Client calls `/api/v2/query`"]
    QueryOrder --> PaidBadge["Order Status Badge changes to PAID (Green)"]
    
    DeclineSettlement --> FailedBadge["Order Status Badge changes to FAILED (Red)"]
```

---

## 5. ISO 8583 Core Financial Switch Translation & Live Telemetry

Every financial event in SukiPay is translated into standard **ISO 8583:1987/1993 Financial Transaction Card Originated Messages**. The dual-pane `SwitchInspector.tsx` monitors this telemetry in real time.

```mermaid
sequenceDiagram
    autonumber
    participant Client as SukiPay Client (`SwitchInspector.tsx`)
    participant Gateway as Kirara Gateway API
    participant Switch as ISO 8583 Switch Core
    participant DB as MariaDB (`iso8583_logs`)

    rect rgb(235, 248, 255)
    Note over Client,DB: Phase A: Order Authorization Presentment (MTI 0200)
    Gateway->>Switch: recordIsoSwitch(MTI: "0200", ProcCode: "000000", Amount, Currency: "840")
    Switch->>Switch: Pack ISO Bitmap & Fields:<br/>• DE 0: MTI (0200)<br/>• DE 2: Masked PAN (620000******9123)<br/>• DE 3: Processing Code (000000 Purchase)<br/>• DE 4: Amount (12-digit zero padded: 000000004999)<br/>• DE 11: STAN (Generated 6-digit sequence: 100042)<br/>• DE 37: RRN (Year + Julian Day + Hour + Random: 626214819203)<br/>• DE 49: Currency Code (840 = USD)
    Switch->>DB: INSERT INTO iso8583_logs VALUES (...)
    end

    rect rgb(240, 255, 244)
    Note over Client,DB: Phase B: Financial Authorization Response (MTI 0210)
    Gateway->>Switch: recordIsoSwitch(MTI: "0210", ProcCode: "000000", ResponseCode: "00")
    Switch->>Switch: Pack ISO Fields:<br/>• DE 0: MTI (0210)<br/>• DE 38: Auth Code (e.g., "789123")<br/>• DE 39: Response Code ("00" Approved)<br/>• DE 11: STAN (Matching transmission STAN)
    Switch->>DB: INSERT INTO iso8583_logs VALUES (...)
    end

    rect rgb(255, 245, 245)
    Note over Client,DB: Phase C: Order Cancellation / Reversal (MTI 0400)
    Gateway->>Switch: recordIsoSwitch(MTI: "0400", ProcCode: "020000")
    Switch->>Switch: Pack ISO Reversal Fields:<br/>• DE 0: MTI (0400 Reversal Request)<br/>• DE 3: Processing Code (020000 Void/Reversal)<br/>• DE 39: Response Code ("00" Reversal Accepted)
    Switch->>DB: INSERT INTO iso8583_logs VALUES (...)
    end

    rect rgb(255, 250, 235)
    Note over Client,DB: Phase D: Live Client Inspection Stream
    Client->>Gateway: GET /iso8583/logs
    Gateway->>DB: SELECT * FROM iso8583_logs ORDER BY id DESC LIMIT 500
    DB-->>Gateway: Recent ISO Switch Transactions
    Gateway-->>Client: HTTP 200 { switchLogs: [...] }
    Client->>Client: Decode Bitmap, Data Elements & Raw HEX Packet
    Client-->>Client: Render live MTI breakdown cards in SwitchInspector
    end
```

---

## 6. Complete Order & Refund Lifecycle State Machine

An order moves through strict finite states with full support for partial and multi-stage refunds.

```mermaid
stateDiagram-v2
    [*] --> PENDING: POST /api/v2/pay (Order Ingested)

    PENDING --> PAID: Payment Settlement via Cashier / POS Simulator (MTI 0210)
    PENDING --> CANCELLED: POST /api/v2/cancel (Merchant Void, MTI 0400)
    PENDING --> EXPIRED: TTL Exceeded (30m Online / 5m POS)
    PENDING --> FAILED: Card Declined / Channel Error (Response Code != 00)

    PAID --> REFUNDED: Full Refund via POST /api/v2/refund (MTI 0220)
    PAID --> PARTIALLY_REFUNDED: Partial Refund (refundAmount < total amount)

    PARTIALLY_REFUNDED --> PARTIALLY_REFUNDED: Subsequent Partial Refund (remaining balance > 0)
    PARTIALLY_REFUNDED --> REFUNDED: Subsequent Refund exhausts remaining balance

    CANCELLED --> [*]
    EXPIRED --> [*]
    FAILED --> [*]
    REFUNDED --> [*]
```

### State Definitions:
* **`PENDING`**: Order initialized, payment URL and QR generated, awaiting cardholder presentment.
* **`PAID`**: Authorization approved (Response Code `00`), funds captured, double-entry ledger credited.
* **`CANCELLED`**: Unpaid order revoked by merchant before expiration; triggers MTI 0400 switch reversal.
* **`EXPIRED`**: Window closed without successful presentment; order locked against late settlement.
* **`FAILED`**: Switch or issuer declined transaction (e.g., Code `05` Do Not Honor, Code `51` Insufficient Funds).
* **`PARTIALLY_REFUNDED`**: Portion of settled funds returned to cardholder; remaining balance tracks available credit.
* **`REFUNDED`**: 100% of order principal returned; no further refund requests allowed.

---

## 7. Asynchronous Webhook Notification & Retry Engine

Upon successful payment settlement or refund execution, Kirara Gateway's background `WebhookDispatcher` securely notifies the merchant's `returnUrl`.

```mermaid
sequenceDiagram
    autonumber
    participant Switch as Kirara OrderStore
    participant Dispatcher as WebhookDispatcher (`webhook.dispatcher.ts`)
    participant Crypto as Backend Crypto Engine
    participant Merchant as Merchant Webhook Receiver (`returnUrl`)
    participant DB as MariaDB Core Audit

    Switch->>Dispatcher: dispatchEvent(appId, returnUrl, "ORDER.PAID", orderData)
    Note over Dispatcher: Enqueue event non-blocking (setImmediate)

    rect rgb(240, 248, 255)
    Note over Dispatcher,Merchant: Attempt 1: Delivery
    Dispatcher->>Dispatcher: Build WebhookEnvelopePlain `{ eventId, eventType, timestamp, order: {...} }`
    Dispatcher->>Crypto: encryptToHex(JSON.stringify(payload), appKey)
    Crypto-->>Dispatcher: appData (AES-256-GCM hex)
    Dispatcher->>Crypto: signAppData(appData, appKey, signTime)
    Crypto-->>Dispatcher: appSign (HMAC-SHA256)

    Dispatcher->>Merchant: POST returnUrl<br/>Headers: [appId, signTime, appSign]<br/>Body: { "appData": "<HEX_CIPHERTEXT>" }
    
    alt Merchant Server Online & Signature Valid
        Merchant->>Merchant: Verify HMAC-SHA256 header with appKey
        Merchant->>Merchant: Decrypt appData via AES-256-GCM
        Merchant->>Merchant: Update Internal Merchant DB (Order -> PAID)
        Merchant-->>Dispatcher: HTTP 200 OK
        Dispatcher->>DB: Log Webhook Delivery Success (attempt: 1, statusCode: 200)
    else Merchant Server Timeout / Error (HTTP 500 or Unreachable)
        Merchant-->>Dispatcher: HTTP 500 / Connection Timeout (4s)
        Dispatcher->>DB: Log Webhook Attempt 1 Failure
        
        Note over Dispatcher: Exponential Backoff (Wait 2s)
        Note over Dispatcher,Merchant: Attempt 2: Retry Delivery
        Dispatcher->>Merchant: POST returnUrl (Retry #2)
        Merchant-->>Dispatcher: HTTP 200 OK
        Dispatcher->>DB: Log Webhook Success on Retry 2
    end
    end
```

---

## 8. Order Inquiry, Cancellation & Multi-Tier Refund Operations

SukiPay Client enables full lifecycle operations via authenticated business endpoints:

```mermaid
sequenceDiagram
    autonumber
    actor Operator as Console Operator
    participant Client as SukiPay Client
    participant Gateway as Kirara Gateway (/api/v2/*)
    participant Store as OrderStore (`order.store.ts`)
    participant Switch as ISO Switch Core
    participant DB as MariaDB Core

    %% Query Flow
    rect rgb(245, 245, 255)
    Note over Operator,DB: Operation 1: Order Query (/api/v2/query)
    Operator->>Client: Queries order by orderId or merchantOrderId
    Client->>Gateway: POST /api/v2/query { appData: Encrypted({ orderId }) }
    Gateway->>Store: queryOrder(appId, orderId)
    Store->>DB: SELECT * FROM orders WHERE order_id = ?
    DB-->>Store: Order Record
    Store-->>Gateway: OrderData (Status: PAID / PENDING / REFUNDED)
    Gateway-->>Client: Encrypted Order Details
    Client-->>Operator: Displays live order status & timestamps
    end

    %% Cancel Flow
    rect rgb(255, 245, 245)
    Note over Operator,DB: Operation 2: Order Cancellation (/api/v2/cancel)
    Operator->>Client: Requests Cancel on PENDING order
    Client->>Gateway: POST /api/v2/cancel { appData: Encrypted({ orderId, reason }) }
    Gateway->>Store: cancelOrder(appId, orderId, reason)
    Store->>Store: Verify status === 'PENDING'
    Store->>DB: UPDATE orders SET status = 'CANCELLED', cancel_reason = ?
    Store->>Switch: recordIsoSwitch("0400", "020000", amount, terminalId...)
    Store-->>Gateway: CancelOrderData
    Gateway-->>Client: Encrypted Cancellation Confirmation
    Client-->>Operator: Shows Order status: CANCELLED (Red Badge)
    end

    %% Refund Flow
    rect rgb(255, 250, 240)
    Note over Operator,DB: Operation 3: Refund Execution (/api/v2/refund)
    Operator->>Client: Requests Partial Refund ($20.00 of $49.99)
    Client->>Gateway: POST /api/v2/refund { appData: Encrypted({ orderId, refundAmount: "20.00" }) }
    Gateway->>Store: refundOrder(appId, refundPayload)
    Store->>Store: Verify: (alreadyRefunded + requested) <= originalAmount
    Store->>DB: UPDATE orders SET refunded_amount = 20.00, status = 'PARTIALLY_REFUNDED'
    Store->>DB: INSERT INTO refunds (refund_id, order_id, amount, status: 'SUCCESS')
    Store->>Switch: recordIsoSwitch("0220", "200000", "20.00", ...)
    Store-->>Gateway: RefundData (refundId: "CPR-...", status: "SUCCESS")
    Gateway-->>Client: Encrypted Refund Confirmation
    Client-->>Operator: Displays Refund Receipt & updated order balance
    end
```

---

## 9. Component & Layered System Architecture

The frontend and backend codebase architectures decouple cryptographic security, UI orchestration, and financial switch protocols.

```mermaid
graph TD
    subgraph "SukiPay Client Frontend (`sukiGatewayClient`)"
        AppMain["src/App.tsx<br/>(Root Coordinator & Modal Host)"]
        
        subgraph "UI Component Layer"
            HeaderComp["Header.tsx<br/>(Health Ping & Profile Selector)"]
            PayConsole["PaymentConsole.tsx<br/>(Create, Query, Refund Cockpit)"]
            SwitchInspectorComp["SwitchInspector.tsx<br/>(Dual-Pane ISO 8583 Monitor)"]
            AuditComp["AuditLedger.tsx<br/>(Searchable Log & CSV/JSON Export)"]
            CryptoBox["CryptoToolbox.tsx<br/>(AES/HMAC Interactive Sandbox)"]
            PosModal["CashierSimulatorModal.tsx<br/>(Virtual Card POS Terminal)"]
            ProfileModalComp["ProfileModal.tsx<br/>(Environment Manager)"]
            CodeExportModal["CodeExporterModal.tsx<br/>(Multi-Lang SDK Exporter)"]
        end

        subgraph "Client Core Services & Engine"
            ApiClient["src/services/api-client.ts<br/>(Profile Store, REST Caller, Audit Tracker)"]
            CryptoEngineTS["src/crypto/crypto-engine.ts<br/>(Zero-dep AES-256-GCM & HMAC-SHA256)"]
            CodeGenerator["src/services/code-generator.ts<br/>(TS, Python, Java, cURL Exporter)"]
            TypeDefs["src/types/gateway.ts<br/>(Gateway, ISO & Order Type Contracts)"]
        end
    end

    subgraph "Kirara Gateway Server Backend (`kirara-server`)"
        ExpressApp["src/app.ts<br/>(Express Core, CORS & Body Parsers)"]
        
        subgraph "Routing & Middleware Layer"
            AuthRoutes["routes/auth.routes.ts (`/api/v2/token`)"]
            OrderRoutes["routes/order.routes.ts (`/api/v2/pay`, `/query`, `/cancel`)"]
            RefundRoutes["routes/refund.routes.ts (`/api/v2/refund`)"]
            CashierRoutes["routes/cashier.routes.ts (`/cashier/*`)"]
            AdminRoutes["routes/admin.routes.ts (`/iso8583/logs`, `/health`)"]
            ReplayMiddleware["middleware/replay-guard.ts<br/>(Nonce Check & Drift Validator)"]
        end

        subgraph "Backend Services & Engine"
            OrderStoreSvc["services/order.store.ts<br/>(Order Cache, ISO 8583 Switch, Ledger)"]
            WebhookDispatcherSvc["services/webhook.dispatcher.ts<br/>(Async Notification & Retry Engine)"]
            AesGcmNode["crypto/aes-gcm.ts<br/>(Node.js native crypto AES-256-GCM)"]
            HmacSignerNode["crypto/hmac-signer.ts<br/>(HMAC-SHA256 Canonical Signer)"]
            DbModule["db/database.ts<br/>(MariaDB Connection Pool)"]
        end
    end

    AppMain --> HeaderComp
    AppMain --> PayConsole
    AppMain --> SwitchInspectorComp
    AppMain --> AuditComp
    AppMain --> CryptoBox
    AppMain --> PosModal
    AppMain --> ProfileModalComp
    AppMain --> CodeExportModal

    PayConsole --> ApiClient
    SwitchInspectorComp --> ApiClient
    AuditComp --> ApiClient
    PosModal --> ApiClient
    CryptoBox --> CryptoEngineTS
    PayConsole --> CodeGenerator

    ApiClient --> CryptoEngineTS
    ApiClient --> TypeDefs

    ApiClient -->|"REST HTTPS / JSON"| ExpressApp
    ExpressApp --> ReplayMiddleware
    ReplayMiddleware --> AuthRoutes
    ReplayMiddleware --> OrderRoutes
    ReplayMiddleware --> RefundRoutes
    ExpressApp --> CashierRoutes
    ExpressApp --> AdminRoutes

    AuthRoutes --> HmacSignerNode
    AuthRoutes --> AesGcmNode
    OrderRoutes --> OrderStoreSvc
    RefundRoutes --> OrderStoreSvc
    CashierRoutes --> OrderStoreSvc
    AdminRoutes --> OrderStoreSvc

    OrderStoreSvc --> DbModule
    OrderStoreSvc --> WebhookDispatcherSvc
    WebhookDispatcherSvc --> AesGcmNode
    WebhookDispatcherSvc --> HmacSignerNode
```

---

## 10. Summary Reference of Cryptographic & Wire Constants

| Parameter | Specification | Implementation in SukiPay Client ↔ Kirara |
| :--- | :--- | :--- |
| **Cipher Algorithm** | `AES-256-GCM` | Authenticated Galois/Counter Mode with 256-bit symmetric key |
| **Key Encoding** | 64 Uppercase Hex Characters | `09548218645f0070fc80591c858ec7b4a8334fbd0a5aa8fe6bc8d819a849e6fa` |
| **IV / Nonce (Cipher)** | 12 Bytes (96 bits) | Cryptographically secure random bytes generated per encryption |
| **Authentication Tag** | 16 Bytes (128 bits) | GHASH polynomial authentication tag appended to ciphertext |
| **Cipher Wire Format** | Uppercase Hex | `IV (12B) || Ciphertext (NB) || AuthTag (16B)` |
| **Signature Algorithm** | `HMAC-SHA256` | Hash-based Message Authentication Code with SHA-256 digest |
| **Token Query Format** | Canonical string | `appId={appId}&signTime={signTime}` |
| **Business Query Format**| Canonical string | `appData={appDataHex}&signTime={signTime}` |
| **Anti-Replay Window** | Timestamp drift $\le 300$s | Enforced by `nonce` memory cache and epoch drift check |
| **Core Switch Protocol** | `ISO 8583:1987` | MTI `0200` (Purchase), `0210` (Auth), `0400` (Void), `0220` (Refund) |
