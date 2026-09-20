import React, { useState, useEffect } from 'react';
import {
  Blocks,
  Cpu,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Hash,
  Clock,
  Send,
  Wallet,
  Coins,
  ArrowRight,
  ShieldCheck,
  Zap,
  Key,
  Copy,
  Check,
} from 'lucide-react';
import { bwClient } from '../services/blockchainworks-client';
import { BWBlock, BWNodeHealth, BWTransaction } from '../types/blockchainworks';

export const BlockchainExplorer: React.FC = () => {
  const [health, setHealth] = useState<BWNodeHealth | null>(null);
  const [nodeOnline, setNodeOnline] = useState(false);
  const [latency, setLatency] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Chain state
  const [chain, setChain] = useState<BWBlock[]>([]);
  const [isChainValid, setIsChainValid] = useState(true);
  const [mempool, setMempool] = useState<BWTransaction[]>([]);

  // Mining state
  const [isMining, setIsMining] = useState(false);
  const [lastMinedInfo, setLastMinedInfo] = useState<{
    index: number;
    hash: string;
    nonce: number;
    timeMs: number;
  } | null>(null);

  // Transaction form state
  const [sender, setSender] = useState('SYSTEM');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('50.00');
  const [currency, setCurrency] = useState('USD');
  const [isoRef, setIsoRef] = useState(`ISO8583_RRN_${Math.floor(100000000000 + Math.random() * 900000000000)}`);
  const [autoSignKey, setAutoSignKey] = useState('');
  const [isSubmittingTx, setIsSubmittingTx] = useState(false);
  const [txError, setTxError] = useState('');

  // Wallet Generator state
  const [generatedWallet, setGeneratedWallet] = useState<{
    address: string;
    public_key: string;
    private_key: string;
  } | null>(null);

  // Balance Inspector state
  const [queryAddress, setQueryAddress] = useState('');
  const [balanceResult, setBalanceResult] = useState<{ confirmed: number; pending: number } | null>(null);

  // Copy feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const refreshData = async () => {
    setIsLoading(true);
    const healthRes = await bwClient.getHealth();
    setNodeOnline(healthRes.ok);
    setLatency(healthRes.latencyMs);

    if (healthRes.ok && healthRes.data) {
      setHealth(healthRes.data);
      try {
        const chainRes = await bwClient.getChain();
        setChain(chainRes.chain);
        setIsChainValid(chainRes.valid);

        const mempoolRes = await bwClient.getMempool();
        setMempool(mempoolRes.mempool || []);
      } catch (err) {
        console.warn('Error fetching chain data', err);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleMineBlock = async () => {
    setIsMining(true);
    try {
      const res = await bwClient.mineBlock();
      setLastMinedInfo({
        index: res.block_index,
        hash: res.block_hash,
        nonce: res.nonce,
        timeMs: res.mining_time_ms,
      });
      await refreshData();
    } catch (err: any) {
      alert(`Mining failed: ${err.message}`);
    } finally {
      setIsMining(false);
    }
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setTxError('');
    setIsSubmittingTx(true);

    try {
      await bwClient.submitTransaction({
        sender: sender.trim(),
        recipient: recipient.trim(),
        amount: parseFloat(amount) || 10,
        currency,
        iso_reference: isoRef,
        auto_sign_key: autoSignKey ? autoSignKey.trim() : undefined,
      });

      // Reset reference for next tx
      setIsoRef(`ISO8583_RRN_${Math.floor(100000000000 + Math.random() * 900000000000)}`);
      await refreshData();
    } catch (err: any) {
      setTxError(err.message || 'Transaction submission failed');
    } finally {
      setIsSubmittingTx(false);
    }
  };

  const handleGenerateWallet = async () => {
    try {
      const wlt = await bwClient.generateWallet();
      setGeneratedWallet(wlt);
      setRecipient(wlt.address); // auto-fill recipient
      setQueryAddress(wlt.address);
    } catch (err: any) {
      alert(`Wallet creation failed: ${err.message}`);
    }
  };

  const handleCheckBalance = async () => {
    if (!queryAddress) return;
    try {
      const res = await bwClient.getBalance(queryAddress.trim());
      setBalanceResult({
        confirmed: res.confirmed_balance,
        pending: res.pending_balance,
      });
    } catch (err: any) {
      alert(`Balance check failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-cyan-500/5 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm tracking-wide uppercase">
              <Blocks className="w-5 h-5 text-emerald-400" />
              Sovereign Settlement Ledger
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">
              BlockchainWorks Explorer
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl">
              High-performance, concurrent Go blockchain engine. Settles and notarizes financial ISO 8583
              transactions from Kirara Server into cryptographically linked, mined blocks.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-3 py-2 rounded-xl text-xs font-mono">
              <span className="text-slate-400">Node (Go):</span>
              <span className={nodeOnline ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                {nodeOnline ? 'Online (:8085)' : 'Offline'}
              </span>
              {nodeOnline ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-400" />
              )}
            </div>

            <button
              onClick={refreshData}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Node Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-slate-400 text-xs font-medium">Block Height</span>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {health ? health.block_height : chain.length}
          </div>
          <span className="text-[11px] text-slate-500 font-mono">Mined Blocks</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-slate-400 text-xs font-medium">Mempool</span>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {mempool.length}
          </div>
          <span className="text-[11px] text-slate-500 font-mono">Unmined Transactions</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-slate-400 text-xs font-medium">PoW Difficulty</span>
          <div className="text-2xl font-bold font-mono text-cyan-400">
            {health ? health.difficulty : 2}
          </div>
          <span className="text-[11px] text-slate-500 font-mono">Leading Zeros Target</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-slate-400 text-xs font-medium">Chain Integrity</span>
          <div className="flex items-center gap-1.5 text-xl font-bold font-mono text-emerald-400 mt-1">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            {isChainValid ? 'VALID' : 'INVALID'}
          </div>
          <span className="text-[11px] text-slate-500 font-mono">Merkle & Hash Verified</span>
        </div>
      </div>

      {/* Main Grid: Transaction Submitter & Mining Controller */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaction Submitter Form */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 font-semibold text-slate-200">
              <Send className="w-4 h-4 text-emerald-400" />
              Submit Financial Transaction to Mempool
            </div>
            <span className="text-[11px] text-slate-500 font-mono">ISO 8583 Settlement</span>
          </div>

          <form onSubmit={handleCreateTransaction} className="space-y-3">
            <div className="space-y-1">
              <label className="text-slate-400 font-medium">Sender</label>
              <input
                type="text"
                value={sender}
                onChange={e => setSender(e.target.value)}
                placeholder="SYSTEM or BW_..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono"
                required
              />
              <span className="text-[10px] text-slate-500">
                Use "SYSTEM" to mint/fund directly from treasury without ECDSA signature check.
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 font-medium">Recipient Address</label>
              <input
                type="text"
                value={recipient}
                onChange={e => setRecipient(e.target.value)}
                placeholder="BW_..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Amount</label>
                <input
                  type="text"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="50.00"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Currency</label>
                <select
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 font-mono"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="BTC">BTC</option>
                  <option value="SATS">SATS</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 font-medium">ISO 8583 Reference / RRN (Field 37)</label>
              <input
                type="text"
                value={isoRef}
                onChange={e => setIsoRef(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 font-mono text-[11px]"
              />
            </div>

            {txError && (
              <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs">
                {txError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmittingTx || !nodeOnline}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2"
            >
              {isSubmittingTx ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Submit to Blockchain Mempool
            </button>
          </form>
        </div>

        {/* Mining Controller & Mempool Inspector */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 text-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2 font-semibold text-slate-200">
                <Cpu className="w-4 h-4 text-cyan-400" />
                Proof-of-Work Mining Engine
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {mempool.length} tx pending in mempool
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Mining Reward</span>
                  <span className="font-mono text-emerald-400 font-bold">10.00 USD</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Target Nonce Search</span>
                  <span className="font-mono text-cyan-400">Difficulty {health?.difficulty || 2} (Hash begins with 00)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Consensus</span>
                  <span className="font-mono text-slate-300">Proof-of-Work (SHA-256)</span>
                </div>
              </div>

              {lastMinedInfo && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1 font-mono text-[11px]">
                  <div className="flex items-center justify-between text-emerald-400 font-semibold">
                    <span>Block #{lastMinedInfo.index} Mined!</span>
                    <span>{lastMinedInfo.timeMs}ms</span>
                  </div>
                  <div className="text-slate-400 truncate">Hash: {lastMinedInfo.hash}</div>
                  <div className="text-slate-500">Nonce: {lastMinedInfo.nonce}</div>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleMineBlock}
            disabled={isMining || !nodeOnline}
            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-cyan-600/20 transition flex items-center justify-center gap-2"
          >
            {isMining ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Mining Block (Solving PoW Nonce)...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Mine Pending Transactions Now
              </>
            )}
          </button>
        </div>
      </div>

      {/* Wallet Tools & Balance Checker */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
        {/* Wallet Generator */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 font-semibold text-slate-200">
              <Key className="w-4 h-4 text-indigo-400" />
              Cryptographic Wallet Generator (ECDSA P-256)
            </div>
            <button
              onClick={handleGenerateWallet}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition"
            >
              Generate New Wallet
            </button>
          </div>

          {generatedWallet ? (
            <div className="space-y-2 p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px]">
              <div>
                <span className="text-slate-500 block">Address:</span>
                <span className="text-emerald-400 font-semibold select-all break-all">
                  {generatedWallet.address}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Private Key Hex (Save safely):</span>
                <span className="text-amber-400 select-all break-all">
                  {generatedWallet.private_key}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-slate-500 text-[11px] py-2">
              Click "Generate New Wallet" to generate an ECDSA P-256 keypair and a sovereign "BW_" address.
            </p>
          )}
        </div>

        {/* Balance Query Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 font-semibold text-slate-200">
              <Wallet className="w-4 h-4 text-emerald-400" />
              Address Ledger Balance Inspector
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={queryAddress}
              onChange={e => setQueryAddress(e.target.value)}
              placeholder="Paste BW_ address..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono text-xs"
            />
            <button
              onClick={handleCheckBalance}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium"
            >
              Query
            </button>
          </div>

          {balanceResult && (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Confirmed Balance</span>
                <span className="text-lg font-bold font-mono text-emerald-400">
                  {balanceResult.confirmed.toFixed(2)} USD
                </span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Pending (incl. Mempool)</span>
                <span className="text-lg font-bold font-mono text-amber-400">
                  {balanceResult.pending.toFixed(2)} USD
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Visual Block Chain Explorer (Ledger Cards) */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 font-semibold text-slate-200 text-sm">
            <Blocks className="w-4 h-4 text-cyan-400" />
            Immutable Blockchain Ledger ({chain.length} Blocks)
          </div>
          <span className="text-xs font-mono text-slate-400">Latest Block: #{chain.length - 1}</span>
        </div>

        {chain.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No blocks loaded. Verify that BlockchainWorks is running on port 8085.
          </div>
        ) : (
          <div className="space-y-4">
            {chain
              .slice()
              .reverse()
              .map(block => (
                <div
                  key={block.hash}
                  className="p-5 bg-slate-950/80 border border-slate-800/80 rounded-2xl space-y-3 font-mono text-xs hover:border-slate-700 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/30">
                        Block #{block.index}
                      </span>
                      {block.index === 0 && (
                        <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px]">
                          Genesis Block
                        </span>
                      )}
                      <span className="text-slate-500 text-[11px]">
                        {new Date(block.timestamp * 1000).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                      <span>Nonce: <strong className="text-cyan-400">{block.nonce}</strong></span>
                      <span>Difficulty: <strong className="text-amber-400">{block.difficulty}</strong></span>
                      <span>Tx: <strong className="text-slate-200">{block.transactions.length}</strong></span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                    <div className="truncate">
                      <span className="text-slate-500">Hash: </span>
                      <span className="text-emerald-400 font-semibold">{block.hash}</span>
                    </div>
                    <div className="truncate">
                      <span className="text-slate-500">Prev Hash: </span>
                      <span className="text-slate-400">{block.prev_hash}</span>
                    </div>
                    <div className="truncate md:col-span-2">
                      <span className="text-slate-500">Merkle Root: </span>
                      <span className="text-cyan-400">{block.merkle_root}</span>
                    </div>
                  </div>

                  {/* Transactions inside this block */}
                  <div className="mt-3 pt-2 border-t border-slate-900/60 space-y-2">
                    <span className="text-slate-500 text-[10px] uppercase font-semibold block">
                      Confirmed Transactions ({block.transactions.length}):
                    </span>
                    <div className="space-y-1.5">
                      {block.transactions.map(tx => (
                        <div
                          key={tx.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-slate-900/80 rounded-xl text-[11px] border border-slate-800/60"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-slate-400 truncate max-w-[140px]">{tx.sender}</span>
                            <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
                            <span className="text-slate-300 truncate max-w-[140px]">{tx.recipient}</span>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {tx.iso_reference && (
                              <span className="px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded text-[10px] border border-slate-700">
                                {tx.iso_reference}
                              </span>
                            )}
                            <span className="font-bold text-emerald-400">
                              +{tx.amount.toFixed(2)} {tx.currency}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};
