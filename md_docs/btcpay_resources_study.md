# Sovereign Crypto Payment Systems & BTCPay Server
## Curated Literature, Technical Specifications, Textbooks & Developer Resources

---

## 1. Definitive Textbooks (Industry Gold Standards)

These books are widely regarded as the foundational engineering bibles for understanding non-custodial crypto payments and layer-2 networks. Both are **openly available on GitHub**:

### 📖 1. *Mastering Bitcoin: Programming the Open Blockchain* (3rd Edition, Dec 2023)
- **Authors:** Andreas M. Antonopoulos & David A. Harding
- **Publisher:** O'Reilly Media
- **Why it matters:** 
  - Explains the exact mathematical foundation behind BTCPay Server: **secp256k1 elliptic curve cryptography**, **ECDSA / Schnorr signatures**, **BIP32 Hierarchical Deterministic (HD) wallets**, and **Extended Public Keys (`xpub`/`zpub`)**.
  - Details transaction serialization, UTXO models, fee estimation, and mempool behavior.
- **Free Open Access:** [GitHub: bitcoinbook/bitcoinbook](https://github.com/bitcoinbook/bitcoinbook)

### ⚡ 2. *Mastering the Lightning Network: A Second Layer Blockchain Protocol for Instant Payments*
- **Authors:** Andreas M. Antonopoulos, Olaoluwa Osuntokun (CTO of Lightning Labs), René Pickhardt
- **Publisher:** O'Reilly Media
- **Why it matters:** 
  - Details how sub-second, zero-confirmation payments work in BTCPay Server without waiting for blockchain block confirmations.
  - Covers payment channels, Hash Time-Locked Contracts (HTLCs), onion routing (Sphinx), and BOLT-11 invoice construction.
- **Free Open Access:** [GitHub: lnbank/lnbook](https://github.com/lnbook/lnbook)

### 💻 3. *Programming Bitcoin: Learn How to Program Bitcoin from Scratch*
- **Author:** Jimmy Song
- **Publisher:** O'Reilly Media
- **Why it matters:** Takes a code-first approach. You implement finite fields, elliptic curves, transaction parsing, and script validation from raw bytes.
- **Free Open Access:** [GitHub: jimmysong/programmingbitcoin](https://github.com/jimmysong/programmingbitcoin)

### 🎨 4. *Grokking Bitcoin*
- **Author:** Kalle Rosenbaum
- **Publisher:** Manning Publications
- **Why it matters:** Highly visual, architectural diagrams explaining proof-of-work, digital signatures, peer-to-peer gossip protocols, and network consensus.

---

## 2. The Core Technical Standards (BIPs & BOLTs)

BTCPay Server is built strictly on open, vendor-neutral standards:

### 🔑 Wallet & Address Standards (Bitcoin Improvement Proposals - BIPs)
| BIP | Name | What it Does in BTCPay Server |
| :--- | :--- | :--- |
| **BIP 32** | Hierarchical Deterministic Wallets | Allows BTCPay to generate an infinite sequence of receiving addresses from a single `xpub` without knowing the private key (`xprv`). |
| **BIP 39** | Mnemonic Seed Words | Standardizes the 12/24-word recovery phrases used by wallets. |
| **BIP 44** | Multi-Account Derivation (Legacy) | Derivation path `m/44'/0'/0'/0/x` for legacy `1...` addresses. |
| **BIP 49** | SegWit in P2SH | Derivation path `m/49'/0'/0'/0/x` for `3...` wrapped SegWit addresses. |
| **BIP 84** | Native SegWit (Bech32) | Derivation path `m/84'/0'/0'/0/x` for `bc1q...` native SegWit addresses (default for modern BTCPay instances). |
| **BIP 21** | Bitcoin URI Scheme | Formats QR codes: `bitcoin:address?amount=0.001&label=Store`. |

### ⚡ Lightning Standards (Basis of Lightning Technology - BOLT)
- **BOLT 11:** Defines the invoice format (`lnbc...`), expiration times, fallbacks, and routing hints.
- **BOLT 12 (Offers):** Next-generation reusable QR codes, static donation links, and recurring subscriptions.
- **Official Specs Repository:** [github.com/lightning/bolts](https://github.com/lightning/bolts)

---

## 3. Official BTCPay Server Resources & Codebases

### 📚 Official Documentation
- **Main Documentation Portal:** [docs.btcpayserver.org](https://docs.btcpayserver.org/)
- **Greenfield REST API Reference (OpenAPI / Swagger):** [docs.btcpayserver.org/API/Greenfield/v1/](https://docs.btcpayserver.org/API/Greenfield/v1/)
- **Wallet Architecture & Setup Guide:** [docs.btcpayserver.org/WalletSetup/](https://docs.btcpayserver.org/WalletSetup/)
- **Custom Plugin Development:** [docs.btcpayserver.org/Plugins/](https://docs.btcpayserver.org/Plugins/)

### 🛠️ Key Repositories Under `btcpayserver` Organization
- **Core Server:** [github.com/btcpayserver/btcpayserver](https://github.com/btcpayserver/btcpayserver) (ASP.NET Core, C#)
- **Deployment Engine:** [github.com/btcpayserver/btcpayserver-docker](https://github.com/btcpayserver/btcpayserver-docker) (Production multi-container orchestrator)
- **NBXplorer:** [github.com/dgarage/NBXplorer](https://github.com/dgarage/NBXplorer) (Lightweight, ultra-fast blockchain tracker written by Nicolas Dorier)
- **NBitcoin:** [github.com/MetacoSA/NBitcoin](https://github.com/MetacoSA/NBitcoin) (The complete, cross-platform Bitcoin cryptographic library for .NET)

---

## 4. Complementary & Alternative Sovereign Payment Platforms

Studying adjacent platforms expands your understanding of the sovereign FinTech landscape:

| Project | Tech Stack | Description |
| :--- | :--- | :--- |
| **LNbits** | Python (FastAPI, SQLite/PostgreSQL) | Ultra-modular Lightning wallet accounts and extension framework (great for POS, offline cards, tipping, and paywalls). |
| **Alby Hub / NWC** | Go / TypeScript | Nostr Wallet Connect (NWC) self-hosted Lightning nodes with permissioned app connections. |
| **Breez SDK** | Rust / C / Swift / Kotlin / Flutter | Non-custodial mobile and desktop Lightning node in a library (Greenlight & Core Lightning). |
| **Core Lightning (CLN)** | C / Python | Modular, highly performant Lightning Network implementation by Blockstream with rich plugin architecture. |
| **LND** | Go | Battle-tested Lightning Network daemon maintained by Lightning Labs. |

---

## 5. Free Interactive Courses & Learning Platforms

1. **Saylor Academy - Bitcoin for Developers (PRDV151):**
   - Free accredited course covering cryptography, UTXOs, scripting, and consensus.
   - Link: [learn.saylor.org](https://learn.saylor.org/course/PRDV151)
2. **Base58 (Bitcoin Protocol Engineering):**
   - High-level protocol deep dives, transaction mechanics, and wallet engineering.
   - Link: [base58.info](https://www.base58.info/)
3. **Qala / Btrust Builders:**
   - Free open-source developer curriculum for African and Latin American software engineers transitioning into Bitcoin and Lightning development.
   - Link: [btrust.tech](https://btrust.tech/)
4. **BTCPay Server YouTube Channel:**
   - Walkthroughs on deployment, store management, WooCommerce/Shopify integration, and Greenfield API scripting.
   - Link: [youtube.com/@BTCPayServer](https://www.youtube.com/@BTCPayServer)
