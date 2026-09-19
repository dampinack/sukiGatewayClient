/**
 * SukiPay Cryptographic Engine
 * Zero-dependency pure TypeScript implementation of:
 * - AES-256-GCM (Authenticated Encryption / Decryption with 12-byte IV and 16-byte Auth Tag)
 * - HMAC-SHA256 (Canonical signing of query strings and payloads)
 * - Secure random nonce & key generation
 */

type ByteArray = Uint8Array;

class SukiCryptoEngine {
  private readonly GCM_IV_LENGTH = 12;
  private readonly GCM_TAG_LENGTH = 16;

  private readonly AES_SBOX: ByteArray = new Uint8Array([
    0x63,0x7c,0x77,0x7b,0xf2,0x6b,0x6f,0xc5,0x30,0x01,0x67,0x2b,0xfe,0xd7,0xab,0x76,
    0xca,0x82,0xc9,0x7d,0xfa,0x59,0x47,0xf0,0xad,0xd4,0xa2,0xaf,0x9c,0xa4,0x72,0xc0,
    0xb7,0xfd,0x93,0x26,0x36,0x3f,0xf7,0xcc,0x34,0xa5,0xe5,0xf1,0x71,0xd8,0x31,0x15,
    0x04,0xc7,0x23,0xc3,0x18,0x96,0x05,0x9a,0x07,0x12,0x80,0xe2,0xeb,0x27,0xb2,0x75,
    0x09,0x83,0x2c,0x1a,0x1b,0x6e,0x5a,0xa0,0x52,0x3b,0xd6,0xb3,0x29,0xe3,0x2f,0x84,
    0x53,0xd1,0x00,0xed,0x20,0xfc,0xb1,0x5b,0x6a,0xcb,0xbe,0x39,0x4a,0x4c,0x58,0xcf,
    0xd0,0xef,0xaa,0xfb,0x43,0x4d,0x33,0x85,0x45,0xf9,0x02,0x7f,0x50,0x3c,0x9f,0xa8,
    0x51,0xa3,0x40,0x8f,0x92,0x9d,0x38,0xf5,0xbc,0xb6,0xda,0x21,0x10,0xff,0xf3,0xd2,
    0xcd,0x0c,0x13,0xec,0x5f,0x97,0x44,0x17,0xc4,0xa7,0x7e,0x3d,0x64,0x5d,0x19,0x73,
    0x60,0x81,0x4f,0xdc,0x22,0x2a,0x90,0x88,0x46,0xee,0xb8,0x14,0xde,0x5e,0x0b,0xdb,
    0xe0,0x32,0x3a,0x0a,0x49,0x06,0x24,0x5c,0xc2,0xd3,0xac,0x62,0x91,0x95,0xe4,0x79,
    0xe7,0xc8,0x37,0x6d,0x8d,0xd5,0x4e,0xa9,0x6c,0x56,0xf4,0xea,0x65,0x7a,0xae,0x08,
    0xba,0x78,0x25,0x2e,0x1c,0xa6,0xb4,0xc6,0xe8,0xdd,0x74,0x1f,0x4b,0xbd,0x8b,0x8a,
    0x70,0x3e,0xb5,0x66,0x48,0x03,0xf6,0x0e,0x61,0x35,0x57,0xb9,0x86,0xc1,0x1d,0x9e,
    0xe1,0xf8,0x98,0x11,0x69,0xd9,0x8e,0x94,0x9b,0x1e,0x87,0xe9,0xce,0x55,0x28,0xdf,
    0x8c,0xa1,0x89,0x0d,0xbf,0xe6,0x42,0x68,0x41,0x99,0x2d,0x0f,0xb0,0x54,0xbb,0x16
  ]);

  private readonly AES_INV_SBOX: ByteArray;
  private readonly AES_RCON = [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36];

  private readonly SHA256_K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ]);

  constructor() {
    this.AES_INV_SBOX = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      this.AES_INV_SBOX[this.AES_SBOX[i]] = i;
    }
  }

  // --- SHA-256 & HMAC ---

  private rotr32(x: number, n: number): number {
    return ((x >>> n) | (x << (32 - n))) >>> 0;
  }

  private sha256Bytes(msgBytes: ByteArray): ByteArray {
    const origLen = msgBytes.length;
    const bitLen = origLen * 8;
    const padLen = (origLen % 64 < 56) ? (56 - (origLen % 64)) : (120 - (origLen % 64));
    const totalLen = origLen + padLen + 8;
    const padded: ByteArray = new Uint8Array(totalLen);
    padded.set(msgBytes);
    padded[origLen] = 0x80;
    const dv = new DataView(padded.buffer);
    const hi = Math.floor(bitLen / 0x100000000);
    const lo = bitLen >>> 0;
    dv.setUint32(totalLen - 8, hi, false);
    dv.setUint32(totalLen - 4, lo, false);

    const h = new Uint32Array([
      0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
      0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
    ]);
    const w = new Uint32Array(64);

    for (let off = 0; off < totalLen; off += 64) {
      for (let i = 0; i < 16; i++) {
        w[i] = dv.getUint32(off + i * 4, false);
      }
      for (let i = 16; i < 64; i++) {
        const s0 = this.rotr32(w[i - 15], 7) ^ this.rotr32(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        const s1 = this.rotr32(w[i - 2], 17) ^ this.rotr32(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
      }

      let a = h[0], b = h[1], c = h[2], d = h[3];
      let e = h[4], f = h[5], g = h[6], hh = h[7];

      for (let i = 0; i < 64; i++) {
        const S1 = this.rotr32(e, 6) ^ this.rotr32(e, 11) ^ this.rotr32(e, 25);
        const ch = (e & f) ^ (~e & g);
        const temp1 = (hh + S1 + ch + this.SHA256_K[i] + w[i]) >>> 0;
        const S0 = this.rotr32(a, 2) ^ this.rotr32(a, 13) ^ this.rotr32(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const temp2 = (S0 + maj) >>> 0;
        hh = g; g = f; f = e; e = (d + temp1) >>> 0;
        d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
      }
      h[0] = (h[0] + a) >>> 0; h[1] = (h[1] + b) >>> 0; h[2] = (h[2] + c) >>> 0;
      h[3] = (h[3] + d) >>> 0; h[4] = (h[4] + e) >>> 0; h[5] = (h[5] + f) >>> 0;
      h[6] = (h[6] + g) >>> 0; h[7] = (h[7] + hh) >>> 0;
    }

    const out: ByteArray = new Uint8Array(32);
    const outDv = new DataView(out.buffer);
    for (let j = 0; j < 8; j++) outDv.setUint32(j * 4, h[j], false);
    return out;
  }

  public hmacSha256(secret: string, message: string): string {
    let keyBytes: ByteArray = new Uint8Array(new TextEncoder().encode(String(secret)));
    const msgBytes: ByteArray = new Uint8Array(new TextEncoder().encode(String(message)));
    if (keyBytes.length > 64) {
      keyBytes = this.sha256Bytes(keyBytes);
    }
    const ipad: ByteArray = new Uint8Array(64);
    const opad: ByteArray = new Uint8Array(64);
    for (let i = 0; i < 64; i++) {
      const kb = i < keyBytes.length ? keyBytes[i] : 0;
      ipad[i] = kb ^ 0x36;
      opad[i] = kb ^ 0x5c;
    }
    const inner: ByteArray = new Uint8Array(64 + msgBytes.length);
    inner.set(ipad);
    inner.set(msgBytes, 64);
    const innerHash = this.sha256Bytes(inner);
    const outer: ByteArray = new Uint8Array(64 + innerHash.length);
    outer.set(opad);
    outer.set(innerHash, 64);
    const digest = this.sha256Bytes(outer);

    let hex = '';
    for (let j = 0; j < 32; j++) {
      hex += (digest[j] >>> 4).toString(16) + (digest[j] & 15).toString(16);
    }
    return hex.toLowerCase();
  }

  // --- AES-256-GCM ---

  private gfMul(x: number, y: number): number {
    let result = 0;
    while (y) {
      if (y & 1) result ^= x;
      x = (x << 1) ^ ((x & 0x80) ? 0x1b : 0);
      y >>= 1;
    }
    return result & 0xff;
  }

  private aesExpandKey(key: ByteArray): Uint32Array {
    const nk = key.length / 4;
    const nr = nk + 6;
    const w = new Uint32Array(4 * (nr + 1));
    for (let i = 0; i < nk; i++) {
      w[i] = (key[4 * i] << 24) | (key[4 * i + 1] << 16) | (key[4 * i + 2] << 8) | key[4 * i + 3];
    }
    for (let i = nk; i < w.length; i++) {
      let temp = w[i - 1];
      if (i % nk === 0) {
        temp = (temp << 8) | (temp >>> 24);
        temp = ((this.AES_SBOX[(temp >>> 24) & 0xff] << 24) |
                (this.AES_SBOX[(temp >>> 16) & 0xff] << 16) |
                (this.AES_SBOX[(temp >>> 8) & 0xff] << 8) |
                this.AES_SBOX[temp & 0xff]) ^ (this.AES_RCON[i / nk - 1] << 24);
      } else if (nk > 6 && i % nk === 4) {
        temp = ((this.AES_SBOX[(temp >>> 24) & 0xff] << 24) |
                (this.AES_SBOX[(temp >>> 16) & 0xff] << 16) |
                (this.AES_SBOX[(temp >>> 8) & 0xff] << 8) |
                this.AES_SBOX[temp & 0xff]);
      }
      w[i] = w[i - nk] ^ temp;
    }
    return w;
  }

  private aesAddRoundKey(s: ByteArray, w: Uint32Array, round: number): void {
    for (let c = 0; c < 4; c++) {
      const word = w[round * 4 + c];
      s[4 * c] ^= (word >>> 24) & 0xff;
      s[4 * c + 1] ^= (word >>> 16) & 0xff;
      s[4 * c + 2] ^= (word >>> 8) & 0xff;
      s[4 * c + 3] ^= word & 0xff;
    }
  }

  private aesSubBytes(s: ByteArray, sbox: ByteArray): void {
    for (let i = 0; i < 16; i++) s[i] = sbox[s[i]];
  }

  private aesShiftRows(s: ByteArray): void {
    const t: ByteArray = new Uint8Array(s);
    for (let c = 0; c < 4; c++) {
      s[4 * c] = t[4 * c];
      s[4 * c + 1] = t[4 * ((c + 1) % 4) + 1];
      s[4 * c + 2] = t[4 * ((c + 2) % 4) + 2];
      s[4 * c + 3] = t[4 * ((c + 3) % 4) + 3];
    }
  }

  private aesMixColumns(s: ByteArray): void {
    for (let c = 0; c < 4; c++) {
      const i = 4 * c;
      const a0 = s[i], a1 = s[i + 1], a2 = s[i + 2], a3 = s[i + 3];
      s[i] = this.gfMul(a0, 2) ^ this.gfMul(a1, 3) ^ a2 ^ a3;
      s[i + 1] = a0 ^ this.gfMul(a1, 2) ^ this.gfMul(a2, 3) ^ a3;
      s[i + 2] = a0 ^ a1 ^ this.gfMul(a2, 2) ^ this.gfMul(a3, 3);
      s[i + 3] = this.gfMul(a0, 3) ^ a1 ^ a2 ^ this.gfMul(a3, 2);
    }
  }

  private aesEncryptBlock(block: ByteArray, w: Uint32Array): ByteArray {
    const s: ByteArray = new Uint8Array(block);
    const nr = w.length / 4 - 1;
    this.aesAddRoundKey(s, w, 0);
    for (let round = 1; round < nr; round++) {
      this.aesSubBytes(s, this.AES_SBOX);
      this.aesShiftRows(s);
      this.aesMixColumns(s);
      this.aesAddRoundKey(s, w, round);
    }
    this.aesSubBytes(s, this.AES_SBOX);
    this.aesShiftRows(s);
    this.aesAddRoundKey(s, w, nr);
    return s;
  }

  private gfMul128(x: ByteArray, y: ByteArray): ByteArray {
    const z: ByteArray = new Uint8Array(16);
    const v: ByteArray = new Uint8Array(16);
    v.set(y);
    for (let i = 0; i < 128; i++) {
      if ((x[i >>> 3] >>> (7 - (i & 7))) & 1) {
        for (let j = 0; j < 16; j++) z[j] ^= v[j];
      }
      const lsb = v[15] & 1;
      for (let j = 15; j > 0; j--) {
        v[j] = (v[j] >>> 1) | ((v[j - 1] & 1) << 7);
      }
      v[0] = v[0] >>> 1;
      if (lsb) v[0] ^= 0xe1;
    }
    return z;
  }

  private ghash(h: ByteArray, data: ByteArray): ByteArray {
    let y: ByteArray = new Uint8Array(16);
    for (let off = 0; off < data.length; off += 16) {
      for (let j = 0; j < 16; j++) y[j] ^= data[off + j];
      y = this.gfMul128(y, h);
    }
    return y;
  }

  private ghashInput(ct: ByteArray): ByteArray {
    const padLen = (16 - (ct.length % 16)) % 16;
    const input: ByteArray = new Uint8Array(ct.length + padLen + 16);
    input.set(ct);
    const dv = new DataView(input.buffer);
    dv.setUint32(ct.length + padLen + 12, (ct.length * 8) >>> 0, false);
    return input;
  }

  private inc32(cb: ByteArray): void {
    for (let i = 15; i >= 12; i--) {
      cb[i] = (cb[i] + 1) & 0xff;
      if (cb[i] !== 0) break;
    }
  }

  private gctr(keyBytes: ByteArray, icb: ByteArray, input: ByteArray): ByteArray {
    const w = this.aesExpandKey(keyBytes);
    const out: ByteArray = new Uint8Array(input.length);
    const cb: ByteArray = new Uint8Array(16);
    cb.set(icb);
    for (let off = 0; off < input.length; off += 16) {
      const enc = this.aesEncryptBlock(cb, w);
      const len = Math.min(16, input.length - off);
      for (let j = 0; j < len; j++) out[off + j] = input[off + j] ^ enc[j];
      this.inc32(cb);
    }
    return out;
  }

  private constantTimeEqual(a: ByteArray, b: ByteArray): boolean {
    let diff = a.length ^ b.length;
    for (let i = 0; i < a.length && i < b.length; i++) diff |= a[i] ^ b[i];
    return diff === 0;
  }

  public hexToBytes(hex: string): ByteArray {
    const clean = String(hex).replace(/[^0-9a-fA-F]/g, '');
    const bytes: ByteArray = new Uint8Array(clean.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(clean.substring(i * 2, i * 2 + 2), 16);
    }
    return bytes;
  }

  public bytesToHexUpper(bytes: ByteArray): string {
    let hex = '';
    const chars = '0123456789ABCDEF';
    for (let i = 0; i < bytes.length; i++) {
      hex += chars[bytes[i] >>> 4] + chars[bytes[i] & 15];
    }
    return hex;
  }

  public randomBytes(n: number): ByteArray {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const arr = new Uint8Array(n);
      window.crypto.getRandomValues(arr as any);
      return arr;
    }
    const fallback = new Uint8Array(n);
    for (let i = 0; i < n; i++) fallback[i] = Math.floor(Math.random() * 256);
    return fallback;
  }

  /**
   * AES-256-GCM authenticated encryption.
   * Outputs uppercase hex string: IV(12 bytes) || Ciphertext(N bytes) || AuthTag(16 bytes)
   */
  public encryptToHex(plainText: string, appKeyHex: string): string {
    const keyBytes = this.hexToBytes(appKeyHex);
    if (keyBytes.length !== 32) {
      throw new Error('appKey must be 64 hex characters (32 bytes)');
    }
    const iv = this.randomBytes(this.GCM_IV_LENGTH);
    const plainBytes: ByteArray = new Uint8Array(new TextEncoder().encode(plainText));

    const w = this.aesExpandKey(keyBytes);
    const h = this.aesEncryptBlock(new Uint8Array(16), w);
    const j0: ByteArray = new Uint8Array(16);
    j0.set(iv);
    j0[15] = 1;
    const icb: ByteArray = new Uint8Array(16);
    icb.set(j0);
    this.inc32(icb);

    const ct = this.gctr(keyBytes, icb, plainBytes);
    const tag = this.gctr(keyBytes, j0, this.ghash(h, this.ghashInput(ct)));

    const out: ByteArray = new Uint8Array(iv.length + ct.length + tag.length);
    out.set(iv);
    out.set(ct, iv.length);
    out.set(tag, iv.length + ct.length);

    return this.bytesToHexUpper(out);
  }

  /**
   * AES-256-GCM authenticated decryption.
   * Inputs uppercase/lowercase hex string: IV(12 bytes) || Ciphertext(N bytes) || AuthTag(16 bytes)
   */
  public decryptFromHex(hex: string, appKeyHex: string): string {
    const data = this.hexToBytes(hex);
    if (data.length < this.GCM_IV_LENGTH + this.GCM_TAG_LENGTH) {
      throw new Error('Ciphertext is too short for AES-256-GCM');
    }
    const keyBytes = this.hexToBytes(appKeyHex);
    if (keyBytes.length !== 32) {
      throw new Error('appKey must be 64 hex characters (32 bytes)');
    }

    const iv = data.subarray(0, this.GCM_IV_LENGTH);
    const body = data.subarray(this.GCM_IV_LENGTH);
    const ct = body.subarray(0, body.length - this.GCM_TAG_LENGTH);
    const tag = body.subarray(body.length - this.GCM_TAG_LENGTH);

    const w = this.aesExpandKey(keyBytes);
    const h = this.aesEncryptBlock(new Uint8Array(16), w);
    const j0: ByteArray = new Uint8Array(16);
    j0.set(iv);
    j0[15] = 1;
    const expectedTag = this.gctr(keyBytes, j0, this.ghash(h, this.ghashInput(ct)));

    if (!this.constantTimeEqual(expectedTag, tag)) {
      throw new Error('AES-GCM Authentication failed (invalid key or corrupted tag)');
    }

    const icb: ByteArray = new Uint8Array(16);
    icb.set(j0);
    this.inc32(icb);
    const plainBytes = this.gctr(keyBytes, icb, ct);

    return new TextDecoder().decode(plainBytes);
  }

  /**
   * Generate signature for Token endpoint:
   * HMAC-SHA256(appKey, "appId={appId}&signTime={signTime}")
   */
  public signToken(appId: string, appKeyHex: string, signTime: string): string {
    return this.hmacSha256(appKeyHex, `appId=${appId}&signTime=${signTime}`);
  }

  /**
   * Generate signature for Business endpoints:
   * HMAC-SHA256(appKey, "appData={appData}&signTime={signTime}")
   */
  public signAppData(appDataHex: string, appKeyHex: string, signTime: string): string {
    return this.hmacSha256(appKeyHex, `appData=${appDataHex}&signTime=${signTime}`);
  }

  /**
   * Nonce: 32 hex characters (16 bytes)
   */
  public generateNonce(): string {
    const arr = this.randomBytes(16);
    return Array.from(arr, n => n.toString(16).padStart(2, '0')).join('');
  }

  /**
   * 64-character hex key (32 bytes)
   */
  public generateRandomAppKey(): string {
    const arr = this.randomBytes(32);
    return Array.from(arr, n => n.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Current millisecond timestamp string
   */
  public getSignTime(): string {
    return String(Date.now());
  }
}

export const cryptoEngine = new SukiCryptoEngine();
