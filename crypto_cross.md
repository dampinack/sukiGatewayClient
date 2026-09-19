Completed the cryptographic library build, including the `payment_crypto.f90` module. Implemented AES-256-GCM authent...
  I have augmented your CryptoWorks project (/home/cyrus/Projects/modernFortran_QT/CryptoWorks) with the payment gateway
  and financial switch cryptography used in SukiPay Client ↔ Kirara Server.
  ──────
  ### 📦 Summary of Modules Added to CryptoWorks

  ┌──────────────────────────────────────────┐
  │"Modern Fortran 2008 Computational Engine"│
  │                                          │
  │                                          │
  │                  ┌────┐                  │
  │                  │    │                  │
  │ │ PC["NEW: backend/payment_crypto.f90 │  │
  │ │                                     │  │
  │ │   • AES-256-GCM AEAD (OpenSSL EVP)  │  │
  │ │                                     │  │
  │ │ • 12-byte IV + 16-byte GHASH Auth Tag │ │
  │ │                                       │ │
  │ │ • Wire Format: IV(12) || Ciphertext(N) || Tag(16) Hex │ │
  │ │                                                       │ │
  │ │                                                       │   │      ISO["NEW: backend/iso8583_engine.f90     │   │   │
│
  │ │            • AES-256-GCM AEAD (OpenSSL EVP)           │   │                                               │   │   │
│
  │ │                                                       │   │ • Pure Fortran ISO 8583:1987 Message Packager │   │   │
│
  │ │         • 12-byte IV + 16-byte GHASH Auth Tag         │   │                                               │   │ U │
│
  │ │                                                       │   │  • 64-bit Bitmap Bitmask (ibset, iand, ishft) │   │   │
│
  │ │ • Wire Format: IV(12) || Ciphertext(N) || Tag(16) Hex │   │                                               │   │   │
│
  │ │                                                       │   │          • MTI 0200 Presentment Pack          │   │   │
│
  │ │          • HMAC-SHA256 Canonical Query Signer         │   │                                               │   │   │
│
  │ │                                                       │   │                                               │   │   │
│
  │ └───────────────────────────────────────────────────────┘   └───────────────────────────────────────────────┘   └───┘
  • aes_256_gcm_decrypt_wire: Parses the hex wire string, extracts IV and GHASH tag, verifies tag authenticity
  (EVP_CTRL_GCM_SET_TAG), decrypts the ciphertext, and rejects tampered payloads with status -2.
  • hmac_sha256_hex: Computes canonical HMAC-SHA256 signatures over query strings (appId={id}&signTime={time} or
  appData={hex}&signTime={time}), returning a 64-character lowercase hex string.

  #### 2. Pure Fortran ISO 8583 Engine: iso8583_engine.f90

  • iso8583_pack_0200: Uses Fortran's 64-bit integer intrinsics (ibset, iand, ishft) to pack a primary 64-bit bitmap and
  serializes DE 2 (PAN), DE 3 (ProcCode 000000), DE 4 (Amount in cents), DE 11 (STAN), DE 37 (RRN), and DE 49 (Currency).
  • iso8583_unpack_0200: Unpacks an incoming ISO 8583 presentment packet and parses the data elements.
  • luhn_verify: Implements the ISO/IEC 7812 Luhn Mod-10 checksum algorithm in pure Fortran.

  #### 3. C-Bridge Interoperability: crypto_bridge.h & engine_bridge.f90

  • Exported 5 C-ABI functions using bind(C):
      • fortran_aes_256_gcm_encrypt
      • fortran_aes_256_gcm_decrypt
      • fortran_hmac_sha256
      • fortran_iso8583_pack_0200
      • fortran_luhn_check


  #### 4. Qt 6 Desktop GUI: cryptowindow.h & cryptowindow.cpp

  • Added a dedicated Tab 3: "FinTech & ISO 8583 (SukiPay / Kirara)" with:
      • Merchant Credentials Group: App ID, App Key (64 hex), signTime (ms), and calculated appSign.
      • Order Ingestion Group: JSON input, encrypted appData hex, and action buttons for GCM Encryption, Decryption &
      Tag verification, and Canonical HMAC signing.
      • Core Banking Switch Group: Card PAN, Amount, STAN, RRN, Currency, Raw ISO packet display, with action buttons
      for Pack MTI 0200 Presentment and Verify Card (Luhn Mod-10).


  #### 5. Build Systems & Automated Tests

  • Updated Makefile and CMakeLists.txt.
  • Expanded test_crypto_engine.f90 with 5 new automated verification tests (Tests 16–20).
  ──────
  ### 🧪 Test Suite Results: 20/20 PASS

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
  ──────
  ### 🚀 How to Run the Updated Application

  In a terminal, run:

    cd /home/cyrus/Projects/modernFortran_QT/CryptoWorks
    
    # Run the 20-point verification test suite:
    make test
    
    # Launch the Qt 6 GUI application:
    make run
    # or run the staged binary directly:
    ./bin/cryptoworks_gui

  When the GUI opens, switch to the "FinTech & ISO 8583" tab to encrypt live order payloads into SukiPay/Kirara wire
  format, verify GHASH authentication tags, sign canonical HMAC queries, and assemble ISO 8583 banking packets!