# Moov TypeScript SDK (`@moovio/sdk`) — Comprehensive User Manual

> **Repository Path:** `/home/cyrus/Projects/API_Projects/moov-typescript`  
> **Package Name:** `@moovio/sdk` (`v0.0.0-dev.34`)  
> **Upstream Repository:** [moovfinancial/moov-typescript](https://github.com/moovfinancial/moov-typescript.git)  
> **Platform Documentation:** [docs.moov.io](https://docs.moov.io/)  
> **Primary Runtime:** Node.js `>= 22.12` / Bun `1.2.17+` / Modern Browsers (ESM)

---

## 1. Executive Overview

### What is this Repository?
The `moov-typescript` repository is the official, type-safe TypeScript/Node.js Software Development Kit (SDK) and **Model Context Protocol (MCP)** server for **Moov Financial** ([moov.io](https://moov.io)).

Moov is an enterprise US **Banking-as-a-Service (BaaS)** platform and licensed money transmitter that connects software platforms directly to the US banking rails. Unlike simple card-only payment gateways, Moov provides direct programmatic access to:
- **FedNow:** Instant, 24/7/365 US Federal Reserve real-time gross settlement rail.
- **RTP (Real-Time Payments):** The Clearing House instant clearing and settlement network.
- **ACH Network:** Standard batch and Same-Day Automated Clearing House debits and credits.
- **Card Acquiring & Issuing:** Visa/Mastercard processing and virtual/physical debit card issuance.
- **Digital Wallets & Ledgers:** Programmable stored-value accounts and automated sweeping.
- **Physical POS Terminals:** Cloud-managed smart terminal applications.

### Key Technical Characteristics
1. **Speakeasy Code Generation:** Built to exact OpenAPI specifications, guaranteeing 100% synchronization with Moov's REST API v2.
2. **Dual Programming Models:**
   - **Class-Based OOP SDK (`Moov`):** Ergonomic, stateful, and ideal for backend engines and microservices (e.g., `kirara-server`).
   - **Standalone Functional Core (`MoovCore` + `funcs/*`):** Tree-shakeable, zero-dead-code functions returning `Result<Value, Error>` types, optimized for frontend bundles (e.g., `sukiGatewayClient`) and serverless edge runtimes.
3. **Native MCP Server:** Implements the Anthropic/Model Context Protocol standard ([`@modelcontextprotocol/sdk`](file:///home/cyrus/Projects/API_Projects/moov-typescript/package.json#L57)), turning the entire financial API into actionable tools for LLMs and agentic AI systems.
4. **End-to-End Encryption (E2EE):** Built-in JWE/JWS public-key cryptographic primitives allowing client-side card/account tokenization with minimal PCI DSS scope (SAQ-A).

---

## 2. Repository Architecture & Directory Structure

```
/home/cyrus/Projects/API_Projects/moov-typescript/
├── bin/
│   └── mcp-server.js           # Compiled standalone CLI binary for the MCP server
├── docs/
│   ├── sdks/                   # Detailed Markdown documentation for every service module
│   └── models/                 # Request/response schema definitions
├── examples/
│   ├── accountsCreate.example.ts # Executable sample script
│   └── .env.template           # Template for API credentials
├── src/
│   ├── index.ts                # Main export entrypoint for the class-based SDK
│   ├── core.ts                 # Core client configuration for standalone functions
│   ├── funcs/                  # 100+ standalone, tree-shakeable endpoint functions
│   ├── hooks/                  # HTTP lifecycle hooks (auth injection, telemetry, retries)
│   ├── lib/                    # HTTP client abstractions, serializer, and error wrappers
│   ├── mcp-server/             # Model Context Protocol server implementation
│   │   ├── cli.ts              # Command-line interface for the MCP runner
│   │   ├── tools/              # MCP tool definitions wrapping SDK calls
│   │   ├── prompts.ts          # Pre-engineered prompts for AI agents
│   │   └── server.ts           # MCP Stdio/SSE transport server
│   ├── models/                 # Zod validation schemas and TypeScript type declarations
│   ├── sdk/                    # 40+ domain-specific service classes attached to `Moov`
│   └── types/                  # Common primitives, PageIterator, and RFC3339 date types
├── FUNCTIONS.md                # Guide to using tree-shakeable standalone functions
├── RUNTIMES.md                 # Compatibility matrix across Node, Bun, Deno, and Cloudflare
└── USAGE.md                    # Quickstart configuration reference
```

---

## 3. Core Functional Domains in the SDK

The SDK splits Moov's capabilities into distinct sub-clients accessible through `moov.<service>`:

| Service Sub-Client | API Path | Core Purpose |
| :--- | :--- | :--- |
| [`moov.transfers`](file:///home/cyrus/Projects/API_Projects/moov-typescript/src/sdk/transfers.ts) | `/transfers` | Move money between accounts, cards, bank accounts, and wallets via FedNow, RTP, or ACH. |
| [`moov.wallets`](file:///home/cyrus/Projects/API_Projects/moov-typescript/src/sdk/wallets.ts) | `/wallets` | Retrieve stored-value ledger balances and manage virtual balance accounts. |
| [`moov.walletTransactions`](file:///home/cyrus/Projects/API_Projects/moov-typescript/src/sdk/wallettransactions.ts) | `/wallets/{walletID}/transactions` | Query historical ledger credits, debits, holds, and pending settlements. |
| [`moov.accounts`](file:///home/cyrus/Projects/API_Projects/moov-typescript/src/sdk/accounts.ts) | `/accounts` | Create and manage business or individual customer/merchant accounts. |
| [`moov.underwriting`](file:///home/cyrus/Projects/API_Projects/moov-typescript/src/sdk/underwriting.ts) | `/accounts/{accountID}/underwriting` | Submit and retrieve KYC/CIP business verification and compliance data. |
| [`moov.bankAccounts`](file:///home/cyrus/Projects/API_Projects/moov-typescript/src/sdk/bankaccounts.ts) | `/accounts/{accountID}/bank-accounts` | Link external routing/account numbers, manage micro-deposits, or integrate Plaid/MX tokens. |
| [`moov.cards`](file:///home/cyrus/Projects/API_Projects/moov-typescript/src/sdk/cards.ts) | `/accounts/{accountID}/cards` | Store, update, and verify payment cards using PCI-compliant tokens. |
| [`moov.cardIssuing`](file:///home/cyrus/Projects/API_Projects/moov-typescript/src/sdk/cardissuing.ts) | `/accounts/{accountID}/issuing` | Issue physical and virtual Visa/Mastercard debit cards. |
| [`moov.sweeps`](file:///home/cyrus/Projects/API_Projects/moov-typescript/src/sdk/sweeps.ts) | `/accounts/{accountID}/sweeps` | Configure automated daily/scheduled payouts from wallets to external bank accounts. |
| [`moov.disputes`](file:///home/cyrus/Projects/API_Projects/moov-typescript/src/sdk/disputes.ts) | `/disputes` | Manage chargebacks, submit evidence, and track dispute lifecycles. |
| [`moov.endToEndEncryption`](file:///home/cyrus/Projects/API_Projects/moov-typescript/src/sdk/endtoendencryption.ts) | `/certificates` | Fetch Moov's public encryption keys for client-side JWE/E2EE token generation. |
| [`moov.terminalApplications`](file:///home/cyrus/Projects/API_Projects/moov-typescript/src/sdk/terminalapplications.ts) | `/terminal-applications` | Provision smart POS terminals and inspect terminal profiles. |

---

## 4. Authentication & Security Schemes

Moov supports two main authentication tiers:

### 1. Server-to-Server Authentication (HTTP Basic)
Used when calling the API from backend services (`kirara-server`). It uses your Moov API Public Key as the `username` and Secret Key as the `password`:
```typescript
import { Moov } from "@moovio/sdk";

const moov = new Moov({
  security: {
    username: process.env.MOOV_PUBLIC_KEY!, // Public identifier (e.g. pk_live_...)
    password: process.env.MOOV_PRIVATE_KEY!, // Secret private key (e.g. sk_live_...)
  },
});
```

### 2. Client-Side Authentication (OAuth Access Tokens)
Used when making calls directly from the browser (`sukiGatewayClient`). The frontend requests a short-lived token from your backend with scoped permissions:
```typescript
import { Moov } from "@moovio/sdk";

// Scoped access token generated server-side for this specific customer
const moov = new Moov({
  accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
});
```

---

## 5. Development Paradigms: OOP vs. Standalone Functions

### Paradigm A: Class-Based SDK (Recommended for Backend / Microservices)
Best for Node.js backends like `kirara-server` where bundle size does not matter and ergonomic autocompletion across all 40+ services is desired.

```typescript
import { Moov } from "@moovio/sdk";

const moov = new Moov({
  security: {
    username: process.env.MOOV_PUBLIC_KEY!,
    password: process.env.MOOV_PRIVATE_KEY!,
  },
});

async function checkBalance(walletID: string, accountID: string) {
  try {
    const wallet = await moov.wallets.get({
      accountID: accountID,
      walletID: walletID,
    });
    console.log(`Available Balance: ${wallet.availableBalance.value} ${wallet.availableBalance.currency}`);
  } catch (error) {
    console.error("Failed to retrieve wallet:", error);
  }
}
```

### Paradigm B: Tree-Shakeable Standalone Functions (Recommended for Frontend / Edge)
Best for browser bundles like `sukiGatewayClient` or Cloudflare Workers. Unused methods, Zod schemas, and serializers are omitted by bundlers (Vite/Webpack), reducing bundle impact.

Standalone functions return a `Result<T, SDKError>` type rather than throwing exceptions:

```typescript
import { MoovCore } from "@moovio/sdk/core.js";
import { walletsGet } from "@moovio/sdk/funcs/walletsGet.js";

const moovCore = new MoovCore({
  accessToken: "scoped-client-token",
});

async function checkBalanceFunctional(walletID: string, accountID: string) {
  const res = await walletsGet(moovCore, {
    accountID: accountID,
    walletID: walletID,
  });

  if (res.ok) {
    const wallet = res.value;
    console.log(`Available Balance: ${wallet.availableBalance.value}`);
  } else {
    // res.error is strongly typed
    console.error("API Error Code:", res.error.message);
  }
}
```

---

## 6. How to Interface With Your Existing Projects

```
                               ┌─────────────────────────────┐
                               │     sukiGatewayClient       │
                               │  (React Merchant Console)   │
                               └──────────────┬──────────────┘
                                              │ REST Orders
                                              ▼
┌───────────────────────────┐  ISO 8583 MTI   ┌─────────────────────────────┐
│        CryptoWorks        │◄───────────────►│        kirara-server        │
│  (Fortran + Qt 6 Engine)  │   Crypto Bridge │      (Payment Switch)       │
└───────────────────────────┘                 └──────────────┬──────────────┘
                                                             │ Moov SDK Calls
                                                             ▼
                                              ┌─────────────────────────────┐
                                              │      @moovio/sdk (Moov)     │
                                              │   (FedNow, RTP, ACH, Card)  │
                                              └─────────────────────────────┘
```

### 1. Interfacing With `kirara-server` (The Settlement Bridge)

In `kirara-server`, when an ISO 8583 MTI 0200 or REST v2.1 transaction is successfully authorized, funds need to be disbursed or settled to the merchant's real bank account.

Create a dedicated settlement service in `kirara-server`:
`kirara-server/src/services/moovSettlement.ts`:

```typescript
import { Moov } from "@moovio/sdk";

export class MoovSettlementService {
  private moov: Moov;
  private platformAccountId: string;

  constructor() {
    this.moov = new Moov({
      security: {
        username: process.env.MOOV_PUBLIC_KEY ?? "",
        password: process.env.MOOV_PRIVATE_KEY ?? "",
      },
    });
    this.platformAccountId = process.env.MOOV_PLATFORM_ACCOUNT_ID ?? "";
  }

  /**
   * Settle an approved Kirara transaction directly to merchant via FedNow / RTP
   */
  async settleMerchantPayout(params: {
    merchantAccountId: string;
    merchantPaymentMethodId: string;
    amountCents: number;
    referenceId: string;
  }) {
    const transfer = await this.moov.transfers.create({
      accountID: this.platformAccountId,
      createTransfer: {
        source: {
          paymentMethodID: process.env.MOOV_SETTLEMENT_WALLET_ID!,
        },
        destination: {
          paymentMethodID: params.merchantPaymentMethodId,
        },
        amount: {
          currency: "USD",
          value: params.amountCents,
        },
        description: `Kirara Order Settlement: ${params.referenceId}`,
      },
    });

    return transfer;
  }
}
```

### 2. Interfacing With `sukiGatewayClient` (The Merchant Console)

In `sukiGatewayClient`, you can add Moov digital wallet monitoring and instant bank payments to the UI.

In [`PaymentConsole.tsx`](file:///home/cyrus/Projects/API_Projects/sukiGatewayClient/src/components/PaymentConsole.tsx), add a "Pay by Bank" option:

```typescript
// Example: Client-side initiation for ACH / Bank Transfer
async function initiateBankCheckout(bankPaymentMethodId: string, amountCents: number) {
  const response = await fetch("/api/v2.1/orders/bank-pay", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bankPaymentMethodId,
      amountCents,
      channel: "ACH_SAME_DAY",
    }),
  });
  return await response.json();
}
```

### 3. Cryptographic Alignment With `CryptoWorks` (Fortran + Qt 6)

Moov requires sensitive card details (PAN, CVV, Expiration) and SSNs to be encrypted using **JSON Web Encryption (JWE - RFC 7516)** with **AES-GCM** before sending them over the wire if not using hosted fields.

The cryptographic primitives implemented in `CryptoWorks`:
- [`crypto_aes.f90`](file:///home/cyrus/Projects/modernFortran_QT/CryptoWorks/src/crypto_aes.f90): Implements **AES-256-GCM** with authenticated tag validation.
- [`crypto_hmac.f90`](file:///home/cyrus/Projects/modernFortran_QT/CryptoWorks/src/crypto_hmac.f90): Implements **HMAC-SHA256** for message integrity and webhook signature verification.

`CryptoWorks` can be used to generate, inspect, and verify test cryptographic payloads that simulate Moov's End-to-End Encryption (E2EE) envelope before passing them into the SDK.

---

## 7. Model Context Protocol (MCP) Server Setup

The SDK includes a built-in MCP server that allows AI assistants to interact with your Moov account.

### Building the MCP Server
From the root of `moov-typescript`:
```bash
npm run build:mcp
```
This compiles the CLI runner to `bin/mcp-server.js`.

### Registering in AI Agents (Claude Desktop, Cursor, Antigravity)

Add the following to your MCP configuration file:

```json
{
  "mcpServers": {
    "moov": {
      "command": "node",
      "args": [
        "/home/cyrus/Projects/API_Projects/moov-typescript/bin/mcp-server.js",
        "start",
        "--username", "YOUR_MOOV_PUBLIC_KEY",
        "--password", "YOUR_MOOV_PRIVATE_KEY"
      ]
    }
  }
}
```

### What AI Tools Become Available?
Once running, the AI agent will have access to tools such as:
- `transfers_create`: Execute transfers between accounts.
- `wallets_get`: Check ledger balances.
- `accounts_get`: Inspect KYC and capability status.
- `disputes_list`: Check active chargebacks.

---

## 8. Common Code Recipes

### Recipe 1: Onboard a New Business Merchant
```typescript
import { Moov } from "@moovio/sdk";

const moov = new Moov({
  security: {
    username: process.env.MOOV_PUBLIC_KEY!,
    password: process.env.MOOV_PRIVATE_KEY!,
  },
});

async function onboardMerchant() {
  const account = await moov.accounts.create({
    accountType: "business",
    profile: {
      business: {
        legalBusinessName: "Pacific Retailers Inc",
        doingBusinessAs: "Pacific Shop",
        businessType: "llc",
        address: {
          addressLine1: "123 Ocean Ave",
          city: "San Francisco",
          stateOrProvince: "CA",
          postalCode: "94107",
          country: "US",
        },
        phone: {
          number: "4155551234",
          countryCode: "1",
        },
      },
    },
    capabilities: [
      "transfers",
      "send-funds",
      "collect-funds",
      "wallet",
    ],
  });

  console.log("Created Merchant Account ID:", account.accountID);
  return account;
}
```

### Recipe 2: Link a Bank Account via Routing/Account Numbers
```typescript
async function linkBankAccount(accountID: string) {
  const bankAccount = await moov.bankAccounts.link({
    accountID: accountID,
    linkBankAccount: {
      account: {
        accountNumber: "1234567890",
        routingNumber: "121000358", // Wells Fargo routing
        accountType: "checking",
        holderName: "Pacific Retailers Inc",
        holderType: "business",
      },
    },
  });

  console.log("Bank Account Linked:", bankAccount.bankAccountID);
  console.log("Verification Status:", bankAccount.status);
  return bankAccount;
}
```

### Recipe 3: Execute an Instant Transfer (FedNow / RTP)
```typescript
async function sendInstantPayout(accountID: string, sourceWalletID: string, destBankID: string, amountCents: number) {
  const transfer = await moov.transfers.create({
    accountID: accountID,
    createTransfer: {
      source: {
        paymentMethodID: sourceWalletID,
      },
      destination: {
        paymentMethodID: destBankID,
      },
      amount: {
        currency: "USD",
        value: amountCents,
      },
      description: "Instant Merchant Settlement",
    },
  });

  console.log("Transfer Initiated:", transfer.transferID);
  console.log("Status:", transfer.status); // 'pending' -> 'completed'
  return transfer;
}
```

---

## 9. Build, Test, and Maintenance Commands

From `/home/cyrus/Projects/API_Projects/moov-typescript`:

| Command | Action |
| :--- | :--- |
| `npm run build` | Builds both the TypeScript library (`tsc`) and the MCP server bundle. |
| `npm run build:mcp` | Uses Bun to bundle `src/mcp-server/build.mts` into the standalone MCP server. |
| `npm run lint` | Runs ESLint 9 across all source files. |
| `npx tsx examples/accountsCreate.example.ts` | Runs the example account creation script. |

---

## 10. Summary Checklist for Integration

- [ ] **API Keys:** Register at [dashboard.moov.io](https://dashboard.moov.io/) and generate sandbox API keys.
- [ ] **Backend Switch:** Add `moovSettlement.ts` in `kirara-server` to route completed orders to Moov transfers.
- [ ] **Frontend:** Import standalone functions from `@moovio/sdk/funcs` in `sukiGatewayClient` to avoid bloating the browser bundle.
- [ ] **AI Tools:** Configure the local MCP server in Antigravity or your preferred AI assistant for direct financial telemetry.
