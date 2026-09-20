# BlockchainWorks (BW) Architecture & FinTech Integration Guide
## Distributed Settlement Ledger for Kirara Server (ISO 8583) & SukiPay Client

---

## 1. Executive Summary

`BlockchainWorks` is a sovereign, local, distributed ledger written in **Go (Golang)** that acts as an immutable settlement layer and cryptographic audit log for financial transactions routed through **Kirara Server** (ISO 8583 switch) and inspected via **SukiPay Client** (React 19).

```
+-----------------------------------------------------------------------------+
|                      SukiPay Client (React 19 + Vite)                       |
|               - Switch Operations Console                                   |
|               - ISO 8583 Message Inspector                                  |
|               - Live BlockchainWorks Explorer (Blocks, Tx, Balances)        |
+-----------------------------------------------------------------------------+
         |                                                   ^
         | 1. Submits Financial Request                      | 5. Real-Time Ledger
         |    (REST / ISO 8583 MTI 0200)                     |    Queries & Blocks
         v                                                   |
+----------------------------------------------------+       |
|            Kirara Server (Node / Express)          |       |
|  - Validates Cryptographic Handshake & Tokens      |       |
|  - Routes ISO 8583 Authorization (MTI 0210)        |       |
|  - Dispatches Settlement to BlockchainService      |       |
+----------------------------------------------------+       |
         |                                                   |
         | 2. POST /api/v1/transactions (Signed Settlement)  |
         v                                                   |
+-----------------------------------------------------------------------------+
|                      BlockchainWorks (Go Daemon :8085)                      |
|                                                                             |
|   [ HTTP / REST API ] <---> [ Mempool ] <---> [ Consensus / Mining Engine ] |
|                                                        |                    |
|                                           [ Cryptographic Ledger ]          |
|                                           - Genesis Block (1,000,000 USD)   |
|                                           - Block N: Hash(PrevHash + Data)  |
|                                           - Bitcoin-Style Merkle Tree       |
|                                           - ECDSA P-256 Signature Auth      |
|                                           - Double-Spend Protection         |
+-----------------------------------------------------------------------------+
```

---

## 2. Core Cryptographic Components in Go (`BlockchainWorks`)

### 2.1 Merkle Tree Calculation (`pkg/core/merkle.go`)
Implements Bitcoin's binary Merkle tree. If an odd number of transactions exist at a level, the last hash is duplicated to pair with itself.

### 2.2 Transaction Model (`pkg/core/transaction.go`)
Every transaction is signed using standard **ECDSA P-256 / secp256r1 (ASN.1 DER)**:
- `ID`: SHA-256 hash of `Sender:Recipient:Amount:Currency:Timestamp:IsoReference`
- `IsoReference`: Holds the ISO 8583 Retrieval Reference Number (Field 37) and Order ID.
- `Signature`: Hex-encoded ASN.1 DER ECDSA signature.
- `PublicKey`: Hex-encoded uncompressed public key.

### 2.3 Block & Proof-of-Work Consensus (`pkg/core/block.go`)
- Header: `Index:Timestamp:PrevHash:MerkleRoot:Nonce:Difficulty:MinedBy`
- Proof-of-Work: Nonce incremented until `Hash` begins with `difficulty` leading zeros (e.g. `00...`).

### 2.4 Blockchain State & Mempool (`pkg/core/blockchain.go`)
- Thread-safe using `sync.RWMutex`.
- Genesis Block initializes 1,000,000 USD in treasury funds.
- **Double-Spend Protection:** Verifies confirmed on-chain balances as well as unconfirmed pending spends in the mempool before accepting any transaction.
- **3-Layer Tamper Defense:** `IsChainValid()` checks block hash integrity, previous hash links, difficulty target, and validates each individual transaction hash against its content.

---

## 3. Kirara Server Settlement Connector (`kirara-server`)

Location: [`kirara-server/src/services/blockchain.service.ts`](file:///home/cyrus/Projects/API_Projects/kirara-server/src/services/blockchain.service.ts)

Whenever an order is paid or simulated via ISO 8583 in [`order.store.ts`](file:///home/cyrus/Projects/API_Projects/kirara-server/src/services/order.store.ts), Kirara automatically emits a settlement transaction:

```typescript
blockchainService.recordSettlement({
  orderId: order.orderId,
  amount: order.amount,
  currency: order.currency,
  rrn: order.transactionId || String(now),
});
```

---

## 4. SukiPay Client Live Blockchain Explorer (`sukiGatewayClient`)

Location: [`src/components/BlockchainExplorer.tsx`](file:///home/cyrus/Projects/API_Projects/sukiGatewayClient/src/components/BlockchainExplorer.tsx)

Access:
1. Run `npm run dev` in `sukiGatewayClient`.
2. Open `http://localhost:5173`.
3. Click the **"BlockchainWorks"** tab in the top navigation bar.
4. View live block height, mempool count, interactive mining controls, and all blocks with their confirmed ISO 8583 transactions!

---

## 5. Directory Reference

- **BlockchainWorks (Go Engine):** [`/home/cyrus/Projects/API_Projects/BlockchainWorks`](file:///home/cyrus/Projects/API_Projects/BlockchainWorks)
- **Kirara Server (ISO 8583 Switch):** [`/home/cyrus/Projects/API_Projects/kirara-server`](file:///home/cyrus/Projects/API_Projects/kirara-server)
- **SukiPay Client (Operations Console):** [`/home/cyrus/Projects/API_Projects/sukiGatewayClient`](file:///home/cyrus/Projects/API_Projects/sukiGatewayClient)
