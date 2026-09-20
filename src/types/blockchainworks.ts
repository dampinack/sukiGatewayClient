/**
 * BlockchainWorks Types for SukiPay Client
 */

export interface BWTransaction {
  id: string;
  sender: string;
  recipient: string;
  amount: number;
  currency: string;
  timestamp: number;
  iso_reference?: string;
  signature?: string;
  public_key?: string;
}

export interface BWBlock {
  index: number;
  timestamp: number;
  transactions: BWTransaction[];
  prev_hash: string;
  hash: string;
  nonce: number;
  difficulty: number;
  merkle_root: string;
  mined_by: string;
}

export interface BWNodeHealth {
  status: string;
  node: string;
  network: string;
  node_address: string;
  block_height: number;
  latest_hash: string;
  mempool_size: number;
  difficulty: number;
  mining_reward: number;
  is_chain_valid: boolean;
  timestamp: number;
}
