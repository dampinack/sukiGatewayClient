All 22 documentation and transcript markdown files have been organized into the dedicated **md_docs** directory,
  preserving full Git history for tracked files while keeping README.md at the repository root.

  I have also generated a master directory index: **INDEX.md**.
  ──────
  ### Organized File Structure in md_docs:
  #### 1. ⛓️ Blockchain & Distributed Ledger
  • blockchainWorks_architecture.md: Complete architecture of the Go blockchain daemon (BlockchainWorks), Kirara
  settlement connector, and SukiPay visual explorer.
  • chat_goBlockChain.md: Feasibility analysis, architecture planning, and Go vs. C++ decision matrix.

  #### 2. ⚡ BTCPay Server (Sovereign Crypto Rails)
  • BTCPaySetup_info.md: Comprehensive setup guide (sandbox registration, store creation, hot/cold wallet linking,
  Greenfield API keys, and HMAC verification).
  • btcpay_resources_study.md: Curated bibliography of open-source textbooks (Mastering Bitcoin, Mastering the Lightning
  Network), BIP standards, and adjacent platforms.
  • userManual_btcpay.md: Technical integration manual for the Greenfield REST API and 3-command Docker VPS deployment.
  • chat_btcserver.md: Analysis of proprietary US gateway limitations (Moov) and the shift to BTCPay Server.

  #### 3. 🏦 SukiPay Switch & Kirara Architecture (ISO 8583)
  • DIAGRAMS_SUKIPAY_KIRARA.md: Comprehensive English Mermaid diagrams covering ISO 8583:1987 financial messaging, dual
  RSA-4096 + AES-256-CBC / HMAC-SHA256 handshake, and network topologies.
  • Comparative.md: Deep architectural comparison between SukiPay/Kirara and Passway/CoalaPay across protocols, safety,
  modernization, and use cases.
  • gatewayPay_info.md: Payment gateway specifications and data models.
  • InfoTech.md: Technical breakdown of the switch, tokens, encryption algorithms, and endpoints.
  • WhoIsWho_chat.md: Clarification of system components and client/server responsibilities.
  • Diagrams_chat.md: Dialogue notes on diagram design.

  #### 4. 🔐 Cryptography & Systems (CryptoWorks: Modern Fortran + Qt6 C++)

  • cryptoWorks_interface.md: Full documentation for the Modern Fortran + Qt6 C++ cryptographic application
  (CryptoWorks), including ISO 8583 unpackers and AES/HMAC engines.
  • begin_master_study.md: Extensive study syllabus covering textbooks, ISO 8583 standards, ANSI X9.24, PCI-DSS, and
  banking cryptography.
  • crypto_cross.md: Cross-language cryptographic equivalence notes between TypeScript WebCrypto, OpenSSL, and Modern
  Fortran.

  #### 5. 🛠️ Tooling, Scripts & Workspace Orchestration

  • chat_scriptSuite.md: Discussion and documentation for the unified start-fintech-suite.sh launcher.
  • userManual_moov.md: Analysis and user manual for the Moov TypeScript SDK and MCP inspector.
  • chat_moov.md: Analysis of Moov developer console options.
  • github_update.md: Git command instructions for staging and pushing updates.
  • chat_study.md: Master study guide conversation notes.
  • chat_play.md: Initial exploration session transcript.
  • chat_id.md: Session identification records.