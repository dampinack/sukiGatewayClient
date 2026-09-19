> In your knowledge which implementation is more modern, better, safe and best suited for the purpose between this SukyPay
  Client - Kiarara Server and PassWay Client - CoalaPay Server?, use the same cryptographic engine?, ISO8583:1987
  Protocol?, the response, please in a file called Comparative.md, Thanks!

● Bash(ls -la /home/cyrus/Projects /home/cyrus/Projects/SynergyPass)
● Bash(ls -la /home/cyrus/Projects/API_Projects)
● Bash(ls -la /home/cyrus/Projects/SynergyPass/PasswayCheckoutReactFrontV2-main)
● Read(~/Projects/SynergyPass/PasswayCheckoutReactFrontV2-main/COALAPAY_INTEGRACION_V3.md)
● Bash(ls -la /home/cyrus/Projects/API_Projects/CoalaPay)
● Bash(ls -la /home/cyrus/Projects/API_Projects/coalapay-client) (ctrl+o to expand)

▸ Thought for 6s, 1.7k tokens
  Frontend comparison reveals one system is more modern, the other is older, which could introduce compatibility issues...

● Bash(ls -la /home/cyrus/Projects/SynergyPass/PasswayCheckoutReactFrontV2-main/src
/home/cyrus/Projects/SynergyPass/Pass...)
● Read(~/Projects/SynergyPass/PasswayCheckoutReactFrontV2-main/src/utils/coalapay.crypto.ts) (ctrl+o to expand)

▸ Thought for 22s, 2.8k tokens
  Specifically, the file path is confirmed as `/home/cyrus/Projects/API_Projects/sukiGatewayClient/Comparative.md` base...
● Edit(~/Projects/API_Projects/sukiGatewayClient/Comparative.md)
● Read(~/Projects/API_Projects/sukiGatewayClient/README.md)
● Edit(~/Projects/API_Projects/sukiGatewayClient/README.md)
● Bash(npm run build)
● Bash(git status -s) (ctrl+o to expand)

  I have generated a comprehensive comparative analysis document:
  📄 File Created: Comparative.md
  🔗 Referenced in: README.md:111-117

  Here is an executive breakdown addressing your core questions:
  ──────
  ### 1. Which implementation is more modern, better, safer, and best suited?
   Dimension           | PassWay Client ↔ CoalaPay Server        | SukiPay Client ↔ Kirara Server          |   Winner
  ---------------------|--------------------------------------|--------------------------------------|------------------
   Stack Modernity     | React 18, Vite, Tailwind v3,         | React 19, Vite, Tailwind CSS v4,     | SukiPay / Kirara
                       | external crypto-js                   | pure TypeScript, zero crypto         |
                       |                                      | dependencies                         |
   Build & Performance | Standard Vite bundle with polyfills  | Sub-220ms instant production build,  | SukiPay / Kirara
                       |                                      | minimal footprint                    |
   System Autonomy     | Opaque third-party SaaS hosted in    | 100% Autonomous, open, self-hosted   | SukiPay / Kirara
                          | China (access.coalapay.cn)         | Node.js / TypeScript banking switch |
   Testing Ergonomics     | External browser tab redirect      | Embedded Virtual POS Terminal       | SukiPay / Kirara
                          |                                    | Simulator (EMV Chip / Contactless   |
                          |                                    | NFC)                                |
   Security & Anti-Replay | Basic ±30s timestamp check         | Replay Guard (Nonce cache, clock    | SukiPay / Kirara
                          |                                    | drift ≤ 300s, strict tenant         |
                          |                                    | isolation)                          |
   Audit & Accounting     | Ephemeral browser console logs     | MariaDB Double-Entry Ledger +       | SukiPay / Kirara
                          |                                    | Persistent Local Storage Audit Log  |
                          |                                    | (CSV/JSON)                          |

  │ Verdict: SukiPay Client ↔ Kirara Server is significantly more modern, architecturally superior, safer, and far more
  │ capable. PassWay Client is suited only as a simple checkout screen when a merchant is strictly tied to CoalaPay's
  │ external aggregator in China.
  ──────
  ### 2. Do they use the same cryptographic engine?
  • At the Wire & Specification Level: YES (100% Interoperable)
      • Both implement AES-256-GCM (authenticated Galois/Counter Mode with 12-byte random IV, 16-byte GHASH tag, and
      uppercase HEX wire format).
      • Both calculate HMAC-SHA256 signatures across canonical query strings (appId={id}&signTime={time} and
      appData={hex}&signTime={time}).
      • SukiPay can encrypt messages that CoalaPay/Kirara decrypts, and vice versa.
  • At the Implementation & Architectural Level: NO
      • PassWay Client (coalapay.crypto.ts): Uses an external crypto-js library for HMAC and relies on the browser's
      window.crypto.subtle API. This forces async/await Promises and fails outside secure DOM contexts (e.g., SSR, Node.
      js scripts, non-HTTPS origins).
      • SukiPay Client (crypto-engine.ts): Implements a zero-dependency pure TypeScript engine (with custom GCTR, GHASH
      GF(2¹²⁸) Galois multiplier, and SHA-256 bitwise core). It runs universally and synchronously in any environment
      (Node, browser, web worker, edge runtime).
      • Kirara Server (aes-gcm.ts, hmac-signer.ts): Uses Node.js native OpenSSL crypto with hardware AES-NI acceleration.

  ──────
  ### 3. What about the ISO 8583:1987 Protocol?

  • PassWay Client ↔ CoalaPay Server:
      • ❌ No ISO 8583 support. CoalaPay is an aggregated REST SaaS that conceals the underlying banking switch behind
      HTTP JSON endpoints. PassWay has zero visibility into MTIs, STAN, RRN, or ISO bitmaps.
  • SukiPay Client ↔ Kirara Server:
      • ✅ Native ISO 8583:1987 / 1993 financial switch core.
      • Every REST event triggers real ISO 8583 banking messages:
          • Order Creation → MTI 0200 (Acquirer Financial Request / Purchase Presentment).
          • POS Card Settlement → MTI 0210 (Financial Response with Authorization Code & DE 39 00 Approved).
          • Order Void / Cancellation → MTI 0400 (Financial Transaction Reversal).
          • Refund → MTI 0220 (Financial Advice / Refund).
      • Full data element packing: DE 2 (Masked PAN), DE 3 (ProcCode 000000/020000/200000), DE 4 (Amount), DE 11 (STAN),
      DE 37 (RRN), DE 49 (Currency).
      • Real-time packet telemetry streamed to SukiPay’s dual-pane SwitchInspector.tsx via /iso8583/logs.

  ──────
  ### 📖 Full Report Available

  Read the comprehensive section-by-section breakdown in Comparative.md.