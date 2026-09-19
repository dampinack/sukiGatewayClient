import React, { useState } from 'react';
import { X, Copy, Check, Code2, Terminal } from 'lucide-react';
import { CodeGenerator } from '../services/code-generator';
import { EnvironmentProfile } from '../types/gateway';

interface CodeExporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: EnvironmentProfile;
  endpoint: string;
  payload: any;
}

export const CodeExporterModal: React.FC<CodeExporterModalProps> = ({
  isOpen,
  onClose,
  profile,
  endpoint,
  payload,
}) => {
  const [activeLang, setActiveLang] = useState<'curl' | 'typescript' | 'python' | 'java'>('curl');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  let code = '';
  switch (activeLang) {
    case 'curl':
      code = CodeGenerator.generateCurl(profile, endpoint, payload);
      break;
    case 'typescript':
      code = CodeGenerator.generateTypeScript(profile, endpoint, payload);
      break;
    case 'python':
      code = CodeGenerator.generatePython(profile, endpoint, payload);
      break;
    case 'java':
      code = CodeGenerator.generateJava(profile, endpoint, payload);
      break;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center space-x-2">
            <Code2 className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-base font-bold text-white">Export SDK Client Code</h3>
              <p className="text-xs text-slate-400 font-mono">Target: {endpoint}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Language Tabs & Copy Button */}
        <div className="px-6 py-3 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
          <div className="flex space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveLang('curl')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                activeLang === 'curl' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              cURL
            </button>
            <button
              onClick={() => setActiveLang('typescript')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                activeLang === 'typescript' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              TypeScript / Node
            </button>
            <button
              onClick={() => setActiveLang('python')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                activeLang === 'python' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Python
            </button>
            <button
              onClick={() => setActiveLang('java')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                activeLang === 'java' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Java
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center space-x-1.5 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-indigo-400" />}
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>
        </div>

        {/* Code Content */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-950 font-mono text-xs">
          <pre className="text-slate-200 leading-relaxed whitespace-pre-wrap selection:bg-indigo-500 selection:text-white">
            {code}
          </pre>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Includes AES-256-GCM authenticated payload encryption & HMAC-SHA256 signature calculation.</span>
          <button
            onClick={onClose}
            className="px-3 py-1 text-slate-400 hover:text-white transition"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
