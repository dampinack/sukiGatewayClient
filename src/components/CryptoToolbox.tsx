import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Unlock,
  Key,
  Hash,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { cryptoEngine } from '../crypto/crypto-engine';
import { EnvironmentProfile } from '../types/gateway';

interface CryptoToolboxProps {
  profile: EnvironmentProfile;
}

export const CryptoToolbox: React.FC<CryptoToolboxProps> = ({ profile }) => {
  const [appKey, setAppKey] = useState(profile.appKey);

  // Encryption state
  const [plainInput, setPlainInput] = useState('{"hello":"SukiPay Switch","amount":"100.00"}');
  const [encryptedOutput, setEncryptedOutput] = useState('');
  const [encryptError, setEncryptError] = useState('');

  // Decryption state
  const [cipherInput, setCipherInput] = useState('');
  const [decryptedOutput, setDecryptedOutput] = useState('');
  const [decryptError, setDecryptError] = useState('');

  // HMAC state
  const [hmacMessage, setHmacMessage] = useState('appId=APP_COALAPAY_TEST_01&signTime=1726700000000');
  const [hmacOutput, setHmacOutput] = useState('');

  // Copy feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleEncrypt = () => {
    setEncryptError('');
    try {
      const hex = cryptoEngine.encryptToHex(plainInput, appKey);
      setEncryptedOutput(hex);
      setCipherInput(hex); // pre-populate decrypt box
    } catch (err: any) {
      setEncryptError(err.message || 'Encryption failed');
    }
  };

  const handleDecrypt = () => {
    setDecryptError('');
    try {
      const text = cryptoEngine.decryptFromHex(cipherInput, appKey);
      setDecryptedOutput(text);
    } catch (err: any) {
      setDecryptError(err.message || 'Authentication tag failed or invalid key');
    }
  };

  const handleHmac = () => {
    try {
      const sign = cryptoEngine.hmacSha256(appKey, hmacMessage);
      setHmacOutput(sign);
    } catch (err: any) {
      setHmacOutput(`Error: ${err.message}`);
    }
  };

  const generateNewKey = () => {
    const key = cryptoEngine.generateRandomAppKey().toUpperCase();
    setAppKey(key);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-white">Cryptographic Sandbox & Validation Toolbox</h2>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Pure TypeScript AES-256-GCM and HMAC-SHA256 testing engine. Verify payloads and encryption keys in real time.
        </p>
      </div>

      {/* Shared Key Input */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>Active AES-256 Secret Key (64 HEX Characters / 32 Bytes)</span>
          </label>
          <div className="flex space-x-2">
            <button
              onClick={() => setAppKey(profile.appKey)}
              className="text-[11px] text-slate-400 hover:text-white"
            >
              Reset to Active Profile Key
            </button>
            <button
              onClick={generateNewKey}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Generate New</span>
            </button>
          </div>
        </div>
        <input
          type="text"
          value={appKey}
          onChange={e => setAppKey(e.target.value.trim())}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-amber-300 font-mono focus:border-indigo-500 focus:outline-none"
        />
      </div>

      {/* Two Column Tooling: AES-256-GCM */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Encrypt Block */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Lock className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">AES-256-GCM Encrypt</h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Plaintext / JSON</label>
            <textarea
              rows={4}
              value={plainInput}
              onChange={e => setPlainInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-cyan-300 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <button
            onClick={handleEncrypt}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/20"
          >
            Encrypt to Upper Hex (IV || CT || Tag)
          </button>

          {encryptError && (
            <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{encryptError}</span>
            </div>
          )}

          {encryptedOutput && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-slate-400 font-semibold">Ciphertext Hex Output</span>
                <button
                  onClick={() => copyToClipboard(encryptedOutput, 'enc')}
                  className="text-[10px] text-indigo-400 hover:text-white flex items-center space-x-1"
                >
                  {copiedKey === 'enc' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>Copy</span>
                </button>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-emerald-300 break-all max-h-32 overflow-y-auto">
                {encryptedOutput}
              </div>
            </div>
          )}
        </div>

        {/* Decrypt Block */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Unlock className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">AES-256-GCM Decrypt</h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Ciphertext Hex String</label>
            <textarea
              rows={4}
              value={cipherInput}
              onChange={e => setCipherInput(e.target.value.trim())}
              placeholder="Paste IV(12B) || CT(NB) || Tag(16B) hex..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-emerald-300 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <button
            onClick={handleDecrypt}
            className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-cyan-600/20"
          >
            Authenticate & Decrypt
          </button>

          {decryptError && (
            <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{decryptError}</span>
            </div>
          )}

          {decryptedOutput && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-slate-400 font-semibold">Decrypted Plaintext Output</span>
                <button
                  onClick={() => copyToClipboard(decryptedOutput, 'dec')}
                  className="text-[10px] text-indigo-400 hover:text-white flex items-center space-x-1"
                >
                  {copiedKey === 'dec' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>Copy</span>
                </button>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-cyan-300 break-all max-h-32 overflow-y-auto whitespace-pre-wrap">
                {decryptedOutput}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* HMAC-SHA256 Signer Block */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
          <Hash className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            HMAC-SHA256 Canonical Signature Tool
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Raw Message / Canonical String
            </label>
            <textarea
              rows={3}
              value={hmacMessage}
              onChange={e => setHmacMessage(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="space-y-3">
            <button
              onClick={handleHmac}
              className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-amber-600/20"
            >
              Compute HMAC-SHA256 (appSign)
            </button>

            {hmacOutput && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-slate-400 font-semibold">Signature (Hex Lowercase)</span>
                  <button
                    onClick={() => copyToClipboard(hmacOutput, 'hmac')}
                    className="text-[10px] text-indigo-400 hover:text-white flex items-center space-x-1"
                  >
                    {copiedKey === 'hmac' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Copy</span>
                  </button>
                </div>
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-amber-300 break-all">
                  {hmacOutput}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
