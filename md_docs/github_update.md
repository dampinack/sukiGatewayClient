# GitHub Upgrade Guide: Complete FinTech Suite

This guide details the exact steps to stage, commit, and push all updates across the **FinTech Suite** to GitHub.

---

## Architecture Overview of Changes

| Repository / Directory | Path | Changes to Upgrade |
|---|---|---|
| **`sukiGatewayClient`** | `/home/cyrus/Projects/API_Projects/sukiGatewayClient` | BTCPay Greenfield Client & UI, BlockchainWorks Explorer, `md_docs/` renames & index, `.gitignore` updates. |
| **`kirara-server`** | `/home/cyrus/Projects/API_Projects/kirara-server` | Settlement service integration (`blockchain.service.ts`), `order.store.ts` hook. |
| **`BlockchainWorks`** | `/home/cyrus/Projects/API_Projects/BlockchainWorks` | New Go distributed ledger engine (PoW, Merkle tree, Ed25519 wallets, REST API). Needs initial Git setup & push. |

---

## 1️⃣ Repository 1: `sukiGatewayClient`

Update the client console, BTCPay Greenfield connector, BlockchainWorks Explorer, and all reorganized documentation in `md_docs/`.

```bash
cd /home/cyrus/Projects/API_Projects/sukiGatewayClient

# 1. Review status (shows renamed markdown docs, new components, and modified files)
git status

# 2. Stage all changes (Git automatically tracks renamed md_docs/ and new components)
git add .

# 3. Commit with semantic message
git commit -m "feat: add BTCPay Greenfield client, BlockchainWorks explorer, and organize md_docs"

# 4. Push to GitHub
git push origin main
```

---

## 2️⃣ Repository 2: `kirara-server`

Update the backend ISO 8583 switch with the automated blockchain settlement engine.

```bash
cd /home/cyrus/Projects/API_Projects/kirara-server

# 1. Review status
git status

# 2. Stage the new settlement service and updated order store
git add src/services/blockchain.service.ts src/services/order.store.ts

# 3. Commit with semantic message
git commit -m "feat: integrate BlockchainWorks settlement service with ISO 8583 payment switch"

# 4. Push to GitHub
git push origin main
```

---

## 3️⃣ Repository 3: `BlockchainWorks` (New Go Ledger Repository)

Because `BlockchainWorks` is a newly developed standalone Go engine, you will initialize its Git repository and push it to GitHub.

### Step 3a: Create the empty repository on GitHub
1. Open your browser to [github.com/new](https://github.com/new).
2. Set **Repository name**: `BlockchainWorks`
3. Description: `Lightweight Go Distributed Ledger with Proof-of-Work, Merkle trees, Ed25519 wallets, and REST API`
4. Choose **Public** (or **Private** based on your preference).
5. **Do NOT check** "Add a README file", "Add .gitignore", or "Choose a license" (the project already contains them).
6. Click **Create repository**.

### Step 3b: Initialize, commit, and push from your terminal
```bash
cd /home/cyrus/Projects/API_Projects/BlockchainWorks

# 1. Initialize git with default branch main
git init -b main

# 2. Stage all files (.gitignore already excludes bin/)
git add .

# 3. Create the initial commit
git commit -m "feat: initial commit of BlockchainWorks Go distributed ledger daemon"

# 4. Link to your GitHub remote
git remote add origin git@github.com:dampinack/BlockchainWorks.git

# 5. Push and set upstream
git push -u origin main
```

---

## ⚡ All-in-One Upgrade Command (For existing repos)

Once the GitHub repo for `BlockchainWorks` has been created, you can run all upgrades sequentially from your terminal:

```bash
# 1. Update sukiGatewayClient
cd /home/cyrus/Projects/API_Projects/sukiGatewayClient && \
git add . && \
git commit -m "feat: add BTCPay Greenfield client, BlockchainWorks explorer, and organize md_docs" && \
git push origin main && \
\
# 2. Update kirara-server
cd /home/cyrus/Projects/API_Projects/kirara-server && \
git add src/services/blockchain.service.ts src/services/order.store.ts && \
git commit -m "feat: integrate BlockchainWorks settlement service with ISO 8583 payment switch" && \
git push origin main && \
\
# 3. Initialize & push BlockchainWorks
cd /home/cyrus/Projects/API_Projects/BlockchainWorks && \
git init -b main && \
git add . && \
git commit -m "feat: initial commit of BlockchainWorks Go distributed ledger daemon" && \
git remote add origin git@github.com:dampinack/BlockchainWorks.git && \
git push -u origin main
```

---

## 🔒 Verification and Security Checklist
- [x] **No Private Keys Staged**: `.gitignore` in `sukiGatewayClient` ignores `*KEY*.txt`, `*key*.txt`, and `*.env*`.
- [x] **Binaries Excluded**: `.gitignore` in `BlockchainWorks` ignores `bin/` and compiler outputs.
- [x] **Build Verification**:
  - `sukiGatewayClient`: `npm run build` succeeds (230ms).
  - `kirara-server`: `npm run build` succeeds without TS errors.
  - `BlockchainWorks`: `go test -v ./tests/...` passes all 4 test suites in 0.003s.