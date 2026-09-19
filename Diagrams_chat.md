Inspecting the provided Mermaid diagram document is essential to understand its structure and level of detail. This i...
  I inspected DIAGRAMAS_COALAPAY_V3.md and created an in-depth, English architectural blueprint and Mermaid diagram
  document tailored specifically for SukiPay Client (sukiGatewayClient) ↔ Kirara Gateway Server (kirara-server):
  📄 File Created: DIAGRAMS_SUKIPAY_KIRARA.md
  🔗 Referenced in: README.md:94-111
  ──────
  ### 📋 Overview of Included Diagrams & Sections
   # | Diagram / Section                   | Mermaid Type    | Description
  ---|-------------------------------------|-----------------|----------------------------------------------------------
   1 | High-Level Ecosystem Architecture   | graph TB        | Complete system topology linking SukiPay Client, Kirara
     |                                     |                 | API Ingress, ISO 8583 Switch Core, Hosted Cashier,
     |                                     |                 | MariaDB Ledger, Acquirer Switch, and Merchant Webhook
     |                                     |                 | sink.
   2 | Authentication & JWT Handshake      | sequenceDiagram | Canonical HMAC-SHA256 signing
     |                                     |                 | (appId={appId}&signTime={signTime}), /api/v2/token
     |                                     |                 | issuance, AES-256-GCM response decryption, and local
     |                                     |                 | profile caching.
   3 | Secure Order Ingestion & Wire       | sequenceDiagram | Order payload encryption (12-byte IV + AES-256-GCM + 16-
     | Protocol                            |                 | byte Auth Tag), nonce anti-replay validation, timestamp
     |                                     |                 | drift check (≤ 300s), MTI 0200 generation, and MariaDB
     |                                     |                 | persistence.
   4  | Dual Checkout Experience           | flowchart TD    | Decision tree covering the hosted cashier
      |                                     |                 | (/cashier/pay), dynamic scan-to-pay QR, and the
      |                                     |                 | embedded virtual POS terminal simulator
      |                                     |                 | (CashierSimulatorModal.tsx with
      |                                     |                 | Visa/Mastercard/Amex/Decline presets).
   5  | ISO 8583 Financial Switch           | sequenceDiagram | Step-by-step breakdown of MTI 0200 (Purchase
      | Translation                         |                 | presentment), MTI 0210 (Authorization response), MTI
      |                                     |                 | 0400 (Reversal), STAN (DE 11), RRN (DE 37), and live
      |                                     |                 | telemetry streaming (/iso8583/logs).
   6  | Order & Refund Lifecycle State      | stateDiagram-v2 | Finite state transitions: PENDING → PAID, CANCELLED,
      | Machine                             |                 | EXPIRED, FAILED, and multi-stage partial/full refunds
      |                                     |                 | (PARTIALLY_REFUNDED → REFUNDED).
   7  | Async Webhook & Retry Engine        | sequenceDiagram | Background WebhookDispatcher execution, HMAC header
      |                                     |                 | signing, AES ciphertext delivery to merchant returnUrl,
      |                                     |                 | timeout handling, and exponential backoff retry cycles.
   8  | Inquiry, Cancel & Refund Operations | sequenceDiagram | Secondary operations flow for /api/v2/query,
      |                                     |                 | /api/v2/cancel, /api/v2/refund, balance validation, and
      |                                     |                 | ISO 0220 Advice generation.
   9  | Decoupled System Architecture       | graph TD        | Frontend React 19 component hierarchy
      |                                     |                 | (PaymentConsole.tsx, SwitchInspector.tsx,
      |                                     |                 | AuditLedger.tsx, CryptoToolbox.tsx) mapped to Kirara
      |                                     |                 | Express routes, services, and database layers.
   10 | Cryptographic & Wire Reference      | Markdown Table  | Precise reference values for key lengths, IV length,
      | Table                               |                 | auth tags, query string formats, and ISO 8583 MTI
      |                                     |                 | specifications.
  ──────
  ### 🔍 Quick Sample: High-Level Ecosystem

  │ Diagram exceeds terminal width (610 > 122 cols)
  │ Displayed as code block. Widen terminal to view inline.

    graph TB
        subgraph "Merchant & Operator Domain (Frontend)"
            Client["SukiPay Client (React 19 + Vite)<br/>• Dynamic Environment Profiles<br/>• Pure TypeScript AES/HMAC
  Engine<br/>• Embedded Virtual POS Terminal<br/>• Live Switch Telemetry Streamer"]
            Browser["Buyer Web / Mobile Browser<br/>(Hosted Cashier / QR Display)"]
        end
    
        subgraph "SukiPay Gateway Platform (Kirara Server)"
            Ingress["API Gateway Router (Express / TypeScript)<br/>• Replay Guard & Drift Validator<br/>• Auth &
  Signature Middleware"]
            CryptoEngine["Kirara Cryptographic Engine<br/>• AES-256-GCM / HMAC-SHA256<br/>• HS256 JWT Token Issuer"]
            SwitchCore["ISO 8583 Financial Switch Engine<br/>• MTI 0200 / 0210 / 0400 / 0220<br/>• STAN & RRN
  Generator<br/>• Bitmaps & Field Formatter"]
            OrderStore["Order & Ledger Service (order.store.ts)<br/>• In-Memory Fast Cache<br/>• Atomic Transaction
  State"]
            CashierRouter["Hosted Cashier & QR Engine<br/>• Mobile Checkout UI<br/>• Dynamic QR Code Generator"]
            WebhookEng["Async Webhook Dispatcher<br/>• Exponential Backoff Retries<br/>• HMAC Delivery Receipts"]
        end

        subgraph "Persistence & External Banking Network"
            MariaDB[("MariaDB Enterprise Ledger<br/>• orders<br/>• refunds<br/>• iso8583_logs")]
            Acquirer["Core Banking Network / Acquirer Switch<br/>(ISO 8583 Host)"]
            MerchantServer["Merchant Backend System<br/>(Webhook Receiver / returnUrl)"]
        end

        Client -->|"POST /api/v2/* (AES-256-GCM + HMAC)"| Ingress
        Client -->|"GET /iso8583/logs (Live Stream)"| Ingress
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

  You can view the full document in DIAGRAMS_SUKIPAY_KIRARA.md.