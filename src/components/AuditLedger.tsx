import React, { useState, useEffect } from 'react';
import {
  Layers,
  Search,
  Download,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  Code,
  FileSpreadsheet,
} from 'lucide-react';
import { apiService } from '../services/api-client';
import { ApiLogEntry } from '../types/gateway';

interface AuditLedgerProps {
  onRefreshTrigger?: number;
}

export const AuditLedger: React.FC<AuditLedgerProps> = ({ onRefreshTrigger }) => {
  const [logs, setLogs] = useState<ApiLogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSuccess, setFilterSuccess] = useState<'all' | 'success' | 'error'>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const loadLogs = () => {
    setLogs(apiService.getLogs());
  };

  useEffect(() => {
    loadLogs();
  }, [onRefreshTrigger]);

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all stored audit logs?')) {
      apiService.clearLogs();
      loadLogs();
    }
  };

  const filteredLogs = logs.filter(l => {
    if (filterSuccess === 'success' && !l.success) return false;
    if (filterSuccess === 'error' && l.success) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      l.endpoint.toLowerCase().includes(term) ||
      l.method.toLowerCase().includes(term) ||
      (l.errorMessage && l.errorMessage.toLowerCase().includes(term)) ||
      (l.plainPayload && JSON.stringify(l.plainPayload).toLowerCase().includes(term)) ||
      (l.decryptedContent && JSON.stringify(l.decryptedContent).toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header & Actions */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Client Audit Ledger & Call History</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Cryptographic verification and transmission log for every REST and switch message
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => apiService.exportLogsJson()}
            disabled={logs.length === 0}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center space-x-1.5 transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={() => apiService.exportLogsCsv()}
            disabled={logs.length === 0}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center space-x-1.5 transition disabled:opacity-50"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleClear}
            disabled={logs.length === 0}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 transition disabled:opacity-50"
            title="Clear Audit History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search endpoint, order ID, or error..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex space-x-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => setFilterSuccess('all')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
              filterSuccess === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({logs.length})
          </button>
          <button
            onClick={() => setFilterSuccess('success')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
              filterSuccess === 'success' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Success
          </button>
          <button
            onClick={() => setFilterSuccess('error')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
              filterSuccess === 'error' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Errors
          </button>
        </div>
      </div>

      {/* Audit Log Entries List */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl divide-y divide-slate-800/60">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No audit logs matching query. Executed requests will automatically persist here.
          </div>
        ) : (
          filteredLogs.map((entry) => {
            const isExpanded = expandedLogId === entry.id;
            return (
              <div key={entry.id} className="transition">
                
                {/* Summary Row */}
                <div
                  onClick={() => setExpandedLogId(isExpanded ? null : entry.id)}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/30 text-xs"
                >
                  <div className="flex items-center space-x-3">
                    <button className="text-slate-500">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    {entry.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-white">{entry.endpoint}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                          {entry.method}
                        </span>
                        {entry.mock && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                            MOCK
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {new Date(entry.timestamp).toLocaleTimeString()} • {entry.durationMs}ms
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded ${
                        entry.success
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      HTTP {entry.httpStatus}
                    </span>
                  </div>
                </div>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className="p-4 bg-slate-950/80 border-t border-slate-800/80 space-y-4 text-xs">
                    
                    {/* Headers */}
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-1">Request Headers</span>
                      <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
                        {Object.entries(entry.headers || {}).map(([k, v]) => (
                          <div key={k} className="truncate">
                            <span className="text-indigo-400 font-bold">{k}:</span> {v}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Payloads Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                          Plain Request Payload
                        </span>
                        <pre className="bg-slate-900 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-cyan-300 max-h-48 overflow-y-auto whitespace-pre-wrap">
                          {entry.plainPayload ? JSON.stringify(entry.plainPayload, null, 2) : '(None)'}
                        </pre>
                      </div>

                      <div>
                        <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                          Decrypted Response Content
                        </span>
                        <pre className="bg-slate-900 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-300 max-h-48 overflow-y-auto whitespace-pre-wrap">
                          {entry.decryptedContent
                            ? JSON.stringify(entry.decryptedContent, null, 2)
                            : entry.errorMessage || '(No payload)'}
                        </pre>
                      </div>
                    </div>

                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
