import { BWBlock, BWNodeHealth, BWTransaction } from '../types/blockchainworks';

export const DEFAULT_BLOCKCHAINWORKS_URL = 'http://localhost:8085';

export class BlockchainWorksClient {
  private baseUrl: string;

  constructor(customUrl?: string) {
    this.baseUrl = (customUrl || DEFAULT_BLOCKCHAINWORKS_URL).replace(/\/+$/, '');
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/+$/, '');
  }

  /**
   * Health and live status of the local Go blockchain node.
   */
  public async getHealth(): Promise<{ ok: boolean; data?: BWNodeHealth; latencyMs: number; error?: string }> {
    const start = performance.now();
    try {
      const res = await fetch(`${this.baseUrl}/health`);
      const latencyMs = Math.round(performance.now() - start);
      if (!res.ok) return { ok: false, latencyMs, error: `HTTP ${res.status}` };
      const data: BWNodeHealth = await res.json();
      return { ok: true, data, latencyMs };
    } catch (err: any) {
      return { ok: false, latencyMs: Math.round(performance.now() - start), error: err.message || 'Connection refused' };
    }
  }

  /**
   * Fetches the entire blockchain.
   */
  public async getChain(): Promise<{ length: number; valid: boolean; chain: BWBlock[] }> {
    const res = await fetch(`${this.baseUrl}/api/v1/chain`);
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching chain`);
    return res.json();
  }

  /**
   * Fetches pending mempool transactions.
   */
  public async getMempool(): Promise<{ count: number; mempool: BWTransaction[] }> {
    const res = await fetch(`${this.baseUrl}/api/v1/mempool`);
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching mempool`);
    return res.json();
  }

  /**
   * Submits a transaction to the mempool.
   */
  public async submitTransaction(payload: {
    sender: string;
    recipient: string;
    amount: number;
    currency?: string;
    iso_reference?: string;
    auto_sign_key?: string;
  }): Promise<{ success: boolean; transaction: BWTransaction; mempool_size: number }> {
    const res = await fetch(`${this.baseUrl}/api/v1/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    return res.json();
  }

  /**
   * Triggers Proof-of-Work mining across all pending transactions.
   */
  public async mineBlock(minerAddress?: string): Promise<{
    success: boolean;
    block_index: number;
    block_hash: string;
    transactions_count: number;
    nonce: number;
    difficulty: number;
    mining_time_ms: number;
    block: BWBlock;
  }> {
    const res = await fetch(`${this.baseUrl}/api/v1/mine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ miner_address: minerAddress || '' }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    return res.json();
  }

  /**
   * Retrieves confirmed and pending balances for an address.
   */
  public async getBalance(address: string): Promise<{
    address: string;
    confirmed_balance: number;
    pending_balance: number;
    currency: string;
  }> {
    const res = await fetch(`${this.baseUrl}/api/v1/balance/${address}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  /**
   * Generates a new cryptographic ECDSA P-256 wallet.
   */
  public async generateWallet(): Promise<{
    address: string;
    public_key: string;
    private_key: string;
    curve: string;
  }> {
    const res = await fetch(`${this.baseUrl}/api/v1/wallets/new`, { method: 'POST' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
}

export const bwClient = new BlockchainWorksClient();
