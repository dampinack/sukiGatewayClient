import React, { useEffect, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  ExternalLink,
  Layers,
  RefreshCw,
  Server,
  Settings,
  ShieldCheck,
  XCircle,
  Coins,
  LayoutDashboard,
  Blocks,
} from 'lucide-react';
import { apiService } from '../services/api-client';
import { EnvironmentProfile } from '../types/gateway';

interface HeaderProps {
  activeProfile: EnvironmentProfile;
  profiles: EnvironmentProfile[];
  onSelectProfile: (id: string) => void;
  onOpenProfileModal: () => void;
  onOpenCryptoToolbox: () => void;
  activeTab: 'console' | 'switch' | 'ledger' | 'crypto' | 'btcpay' | 'blockchain';
  onSelectTab: (tab: 'console' | 'switch' | 'ledger' | 'crypto' | 'btcpay' | 'blockchain') => void;
  tokenStatus: { hasToken: boolean; isAcquiring: boolean };
  onAcquireToken: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeProfile,
  profiles,
  onSelectProfile,
  onOpenProfileModal,
  activeTab,
  onSelectTab,
  tokenStatus,
  onAcquireToken,
}) => {
  const [health, setHealth] = useState<{ ok: boolean; latencyMs: number; checking: boolean }>({
    ok: false,
    latencyMs: 0,
    checking: false,
  });

  const runHealthCheck = async () => {
    setHealth(prev => ({ ...prev, checking: true }));
    const result = await apiService.checkHealth(activeProfile.baseUrl);
    setHealth({
      ok: result.ok,
      latencyMs: result.latencyMs,
      checking: false,
    });
  };

  useEffect(() => {
    runHealthCheck();
    const interval = setInterval(runHealthCheck, 20000);
    return () => clearInterval(interval);
  }, [activeProfile.baseUrl]);

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-black tracking-tight text-white">SukiPay</span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Switch v2.1
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">ISO 8583 & REST Developer Console</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onSelectTab('console')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                activeTab === 'console'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Payment Operations</span>
            </button>
            <button
              onClick={() => onSelectTab('switch')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                activeTab === 'switch'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>ISO 8583 Switch</span>
            </button>
            <button
              onClick={() => onSelectTab('ledger')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                activeTab === 'ledger'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Audit Ledger</span>
            </button>
            <button
              onClick={() => onSelectTab('crypto')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                activeTab === 'crypto'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Crypto Toolbox</span>
            </button>
            <button
              onClick={() => onSelectTab('btcpay')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                activeTab === 'btcpay'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>BTCPay Greenfield</span>
            </button>
            <button
              onClick={() => onSelectTab('blockchain')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                activeTab === 'blockchain'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Blocks className="w-3.5 h-3.5 text-emerald-400" />
              <span>BlockchainWorks</span>
            </button>
          </nav>

          {/* Right Controls: Profile, Health, Token */}
          <div className="flex items-center space-x-3">
            
            {/* Health & Ping Badge */}
            <button
              onClick={runHealthCheck}
              title={`Gateway Base URL: ${activeProfile.baseUrl}\nClick to refresh health`}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-300 hover:border-slate-700 transition"
            >
              {health.checking ? (
                <RefreshCw className="w-3 h-3 text-cyan-400 animate-spin" />
              ) : health.ok ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              ) : (
                <XCircle className="w-3 h-3 text-rose-400" />
              )}
              <span className="font-mono text-[11px] hidden sm:inline">
                {health.ok ? `${health.latencyMs}ms` : 'Offline'}
              </span>
            </button>

            {/* Profile Selector */}
            <div className="relative">
              <select
                value={activeProfile.id}
                onChange={(e) => onSelectProfile(e.target.value)}
                className="appearance-none bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs rounded-lg pl-3 pr-8 py-1.5 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer max-w-[170px] sm:max-w-[220px] truncate"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>

            {/* Token Badge / Acquire */}
            <button
              onClick={onAcquireToken}
              disabled={tokenStatus.isAcquiring}
              title={tokenStatus.hasToken ? 'Token active. Click to refresh token.' : 'Click to acquire OAuth JWT Token'}
              className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition ${
                tokenStatus.hasToken
                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 hover:bg-emerald-900/40'
                  : 'bg-amber-950/60 text-amber-300 border border-amber-800/60 hover:bg-amber-900/40 animate-pulse'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tokenStatus.hasToken ? 'Token Ready' : 'Get Token'}</span>
            </button>

            {/* Profile Settings Modal Trigger */}
            <button
              onClick={onOpenProfileModal}
              title="Manage Gateway Environments & Keys"
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Swagger UI Link */}
            <a
              href={`${activeProfile.baseUrl.replace(/\/+$/, '')}/docs`}
              target="_blank"
              rel="noopener noreferrer"
              title="Open Kirara Swagger API Docs"
              className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition hidden md:block"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Kirara Switch Admin Dashboard Link */}
            <a
              href={`${activeProfile.baseUrl.replace(/\/+$/, '')}/admin`}
              target="_blank"
              rel="noopener noreferrer"
              title="Open Kirara Server Operator Dashboard (/admin)"
              className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition hidden md:block"
            >
              <LayoutDashboard className="w-4 h-4" />
            </a>
          </div>

        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800/60 text-xs">
          <button
            onClick={() => onSelectTab('console')}
            className={`py-1 px-2 rounded ${activeTab === 'console' ? 'text-indigo-400 font-bold' : 'text-slate-400'}`}
          >
            Console
          </button>
          <button
            onClick={() => onSelectTab('switch')}
            className={`py-1 px-2 rounded ${activeTab === 'switch' ? 'text-indigo-400 font-bold' : 'text-slate-400'}`}
          >
            ISO 8583
          </button>
          <button
            onClick={() => onSelectTab('ledger')}
            className={`py-1 px-2 rounded ${activeTab === 'ledger' ? 'text-indigo-400 font-bold' : 'text-slate-400'}`}
          >
            Ledger
          </button>
          <button
            onClick={() => onSelectTab('crypto')}
            className={`py-1 px-2 rounded ${activeTab === 'crypto' ? 'text-indigo-400 font-bold' : 'text-slate-400'}`}
          >
            Crypto
          </button>
          <button
            onClick={() => onSelectTab('btcpay')}
            className={`py-1 px-2 rounded ${activeTab === 'btcpay' ? 'text-amber-400 font-bold' : 'text-slate-400'}`}
          >
            BTCPay
          </button>
          <button
            onClick={() => onSelectTab('blockchain')}
            className={`py-1 px-2 rounded ${activeTab === 'blockchain' ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}
          >
            Blockchain
          </button>
        </div>

      </div>
    </header>
  );
};
