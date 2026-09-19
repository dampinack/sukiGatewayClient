import React, { useState, useEffect } from 'react';
import {
  Server,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Database,
  Layers,
} from 'lucide-react';
import { apiService } from '../services/api-client';
import { EnvironmentProfile, Iso8583SwitchLog } from '../types/gateway';

interface SwitchInspectorProps {
  profile: EnvironmentProfile;
}

const ISO_FIELD_DESCRIPTIONS: Record<string, string> = {
  '0': 'Message Type Identifier (MTI)',
  '1': 'Bitmap (Secondary)',
  '2': 'Primary Account Number (PAN)',
  '3': 'Processing Code',
  '4': 'Transaction Amount',
  '7': 'Transmission Date & Time',
  '11': 'System Trace Audit Number (STAN)',
  '12': 'Time, Local Transaction (hhmmss)',
  '13': 'Date, Local Transaction (MMDD)',
  '14': 'Expiration Date',
  '18': 'Merchant Category Code',
  '22': 'Point of Service Entry Mode',
  '25': 'Point of Service Condition Code',
  '37': 'Retrieval Reference Number (RRN)',
  '38': 'Authorization Identification Response',
  '39': 'Response Code',
  '41': 'Card Acceptor Terminal Identification (TID)',
  '42': 'Card Acceptor Identification Code (MID)',
  '49': 'Currency Code, Transaction',
  '55': 'Integrated Circuit Card (ICC) / EMV Data',
  '62': 'Private Use / Custom Field Data',
};

export const SwitchInspector: React.FC<SwitchInspectorProps> = ({ profile }) => {
  const [logs, setLogs] = useState<Iso8583SwitchLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<Iso8583SwitchLog | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await apiService.fetchIso8583Logs(profile);
      setLogs(data);
      if (data.length > 0 && !selectedLog) {
        setSelectedLog(data[0]);
      }
    } catch {}
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [profile.baseUrl]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchLogs, 6000);
    return () => clearInterval(interval);
  }, [autoRefresh, profile.baseUrl]);

  const filteredLogs = logs.filter(l => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (l.stan && l.stan.toLowerCase().includes(term)) ||
      (l.rrn && l.rrn.toLowerCase().includes(term)) ||
      (l.orderId && l.orderId.toLowerCase().includes(term)) ||
      (l.mti && l.mti.toLowerCase().includes(term)) ||
      (l.merchantOrderId && l.merchantOrderId.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Refresh Controls */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Server className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">ISO 8583 Financial Payment Switch Inspector</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time telemetry stream of core banking switch packets (MTI 0200/0210/0400, STAN, RRN) from <code className="text-cyan-400">{profile.baseUrl}/iso8583/logs</code>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 text-xs text-slate-300 select-none cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={e => setAutoRefresh(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
            />
            <span>Auto Refresh (6s)</span>
          </label>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Poll Switch</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Table + Right Packet Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Switch Messages Table (7 cols) */}
        <div className="lg:col-span-6 bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
          
          <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search STAN, RRN, MTI, or Order ID..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">
              {filteredLogs.length} Records
            </span>
          </div>

          <div className="overflow-y-auto max-h-[560px] divide-y divide-slate-800/60">
            {filteredLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                No ISO 8583 switch logs captured yet. Execute a payment or refund in the Payment Console to generate switch packets.
              </div>
            ) : (
              filteredLogs.map((log) => {
                const isSelected = selectedLog?.id === log.id;
                const isApproved = log.responseCode === '00';
                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className={`p-3.5 cursor-pointer transition flex items-center justify-between text-xs ${
                      isSelected
                        ? 'bg-indigo-600/15 border-l-4 border-indigo-500 text-white'
                        : 'hover:bg-slate-800/40 text-slate-300'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-indigo-400 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-800/40">
                          MTI {log.mti}
                        </span>
                        <span className="font-mono text-slate-400">STAN: {log.stan || 'N/A'}</span>
                        <span className="font-mono text-slate-500">RRN: {log.rrn || 'N/A'}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[280px]">
                        Order: {log.orderId || log.merchantOrderId || 'Direct Terminal'}
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="font-bold text-white">
                        {log.amount} <span className="text-[10px] text-slate-400">{log.currency}</span>
                      </div>
                      <span
                        className={`inline-block font-mono text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          isApproved
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {isApproved ? '00 APPR' : `${log.responseCode} DECL`}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* Right Side: Detailed ISO Packet & Field Breakdown (5 cols) */}
        <div className="lg:col-span-6 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Switch Packet Breakdown
              </h3>
            </div>
            {selectedLog && (
              <span className="text-xs font-mono text-slate-400">
                STAN {selectedLog.stan}
              </span>
            )}
          </div>

          {selectedLog ? (
            <div className="space-y-4">
              
              {/* Core Attributes */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block">MTI Code</span>
                  <span className="font-mono font-bold text-indigo-400 text-sm">{selectedLog.mti}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {selectedLog.mti === '0200'
                      ? 'Acquirer Financial Req'
                      : selectedLog.mti === '0210'
                      ? 'Issuer Financial Resp'
                      : selectedLog.mti === '0400'
                      ? 'Reversal Request'
                      : 'Switch Message'}
                  </span>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block">Trace / STAN</span>
                  <span className="font-mono font-bold text-cyan-300 text-sm">{selectedLog.stan || '000000'}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Field 11 Unique</span>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block">Ref / RRN</span>
                  <span className="font-mono font-bold text-amber-300 text-sm">{selectedLog.rrn || 'N/A'}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Field 37 Reference</span>
                </div>
              </div>

              {/* Raw ISO Hex Payload */}
              {selectedLog.rawIsoHex && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-300">Raw Hex Transmission</span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {selectedLog.rawIsoHex.length / 2} Bytes
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px] text-cyan-300/90 break-all leading-relaxed">
                    {selectedLog.rawIsoHex}
                  </div>
                </div>
              )}

              {/* Parsed Data Elements Table */}
              <div>
                <span className="text-xs font-semibold text-slate-300 block mb-2">Parsed ISO 8583 Data Elements</span>
                <div className="bg-slate-950 rounded-xl border border-slate-800 divide-y divide-slate-800/80 overflow-hidden font-mono text-xs max-h-[260px] overflow-y-auto">
                  {selectedLog.fields && Object.keys(selectedLog.fields).length > 0 ? (
                    Object.entries(selectedLog.fields).map(([fieldNum, value]) => (
                      <div key={fieldNum} className="p-2.5 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                            DE {fieldNum}
                          </span>
                          <span className="text-slate-400 text-[11px] truncate max-w-[160px]">
                            {ISO_FIELD_DESCRIPTIONS[fieldNum] || `Field ${fieldNum}`}
                          </span>
                        </div>
                        <span className="text-emerald-300 font-bold">{value}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-slate-500 text-center text-xs">
                      No field elements mapped.
                    </div>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-500 text-xs">
              Select a switch transaction on the left to inspect its ISO 8583 packet breakdown.
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
