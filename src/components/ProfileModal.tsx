import React, { useState } from 'react';
import {
  Check,
  Copy,
  Key,
  Plus,
  RefreshCw,
  Server,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { cryptoEngine } from '../crypto/crypto-engine';
import { apiService, DEFAULT_PROFILES } from '../services/api-client';
import { EnvironmentProfile } from '../types/gateway';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: EnvironmentProfile[];
  activeProfileId: string;
  onSaveProfiles: (profiles: EnvironmentProfile[]) => void;
  onSelectActiveProfile: (id: string) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profiles,
  activeProfileId,
  onSaveProfiles,
  onSelectActiveProfile,
}) => {
  const [editingProfile, setEditingProfile] = useState<EnvironmentProfile>(() => {
    return profiles.find(p => p.id === activeProfileId) || profiles[0] || DEFAULT_PROFILES[0];
  });
  const [testResult, setTestResult] = useState<{ status: 'idle' | 'testing' | 'success' | 'failed'; message: string }>({
    status: 'idle',
    message: '',
  });

  if (!isOpen) return null;

  const handleSelectToEdit = (profile: EnvironmentProfile) => {
    setEditingProfile({ ...profile });
    setTestResult({ status: 'idle', message: '' });
  };

  const handleFieldChange = (field: keyof EnvironmentProfile, value: any) => {
    setEditingProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerateKey = () => {
    const newKey = cryptoEngine.generateRandomAppKey().toUpperCase();
    handleFieldChange('appKey', newKey);
  };

  const handleTestConnection = async () => {
    setTestResult({ status: 'testing', message: 'Pinging /health...' });
    const res = await apiService.checkHealth(editingProfile.baseUrl);
    if (res.ok) {
      setTestResult({
        status: 'success',
        message: `Connected! Latency: ${res.latencyMs}ms (Service: ${res.data?.service || 'Switch'})`,
      });
    } else {
      setTestResult({
        status: 'failed',
        message: `Offline: ${res.error || 'Connection refused'}`,
      });
    }
  };

  const handleSaveCurrent = () => {
    const exists = profiles.some(p => p.id === editingProfile.id);
    let updated: EnvironmentProfile[];
    if (exists) {
      updated = profiles.map(p => p.id === editingProfile.id ? editingProfile : p);
    } else {
      updated = [...profiles, editingProfile];
    }
    onSaveProfiles(updated);
    onSelectActiveProfile(editingProfile.id);
    onClose();
  };

  const handleAddNew = () => {
    const newId = `custom-profile-${Date.now()}`;
    const newProfile: EnvironmentProfile = {
      id: newId,
      name: 'Custom Switch Profile',
      baseUrl: 'http://localhost:8080',
      appId: 'APP_CUSTOM_01',
      appKey: cryptoEngine.generateRandomAppKey().toUpperCase(),
      description: 'Custom switch or gateway connection profile',
      mockMode: false,
      isCustom: true,
    };
    setEditingProfile(newProfile);
    setTestResult({ status: 'idle', message: '' });
  };

  const handleDelete = (id: string) => {
    if (profiles.length <= 1) return;
    const remaining = profiles.filter(p => p.id !== id);
    onSaveProfiles(remaining);
    if (editingProfile.id === id) {
      setEditingProfile(remaining[0]);
    }
    if (activeProfileId === id) {
      onSelectActiveProfile(remaining[0].id);
    }
  };

  const handleResetDefaults = () => {
    onSaveProfiles(DEFAULT_PROFILES);
    setEditingProfile(DEFAULT_PROFILES[0]);
    onSelectActiveProfile(DEFAULT_PROFILES[0].id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-2">
            <Server className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Environment & Gateway Profiles</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Left Sidebar + Right Form */}
        <div className="grid grid-cols-1 md:grid-cols-3 flex-1 overflow-hidden">
          
          {/* Profile List */}
          <div className="border-r border-slate-800 p-4 space-y-2 bg-slate-950/40 overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Profiles</span>
              <button
                onClick={handleAddNew}
                className="text-xs flex items-center space-x-1 text-indigo-400 hover:text-indigo-300 font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New</span>
              </button>
            </div>

            {profiles.map(p => {
              const isActive = p.id === activeProfileId;
              const isSelected = p.id === editingProfile.id;
              return (
                <div
                  key={p.id}
                  onClick={() => handleSelectToEdit(p)}
                  className={`p-3 rounded-xl cursor-pointer border transition-all text-left group ${
                    isSelected
                      ? 'bg-indigo-600/10 border-indigo-500/50 text-white'
                      : 'bg-slate-900/40 border-slate-800/80 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs truncate max-w-[140px]">{p.name}</span>
                    {isActive && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono truncate mt-1">
                    {p.baseUrl}
                  </div>
                </div>
              );
            })}

            <div className="pt-4 mt-4 border-t border-slate-800">
              <button
                onClick={handleResetDefaults}
                className="text-[11px] text-slate-500 hover:text-slate-400 underline w-full text-center"
              >
                Reset to Standard Defaults
              </button>
            </div>
          </div>

          {/* Edit Form */}
          <div className="col-span-2 p-6 overflow-y-auto space-y-4 bg-slate-900">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Profile Name</label>
              <input
                type="text"
                value={editingProfile.name}
                onChange={e => handleFieldChange('name', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Gateway Base URL</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={editingProfile.baseUrl}
                  onChange={e => handleFieldChange('baseUrl', e.target.value)}
                  placeholder="http://localhost:8080"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-cyan-300 font-mono focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleTestConnection}
                  disabled={testResult.status === 'testing'}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center space-x-1.5 transition shrink-0"
                >
                  <Zap className={`w-3.5 h-3.5 text-cyan-400 ${testResult.status === 'testing' ? 'animate-spin' : ''}`} />
                  <span>Test Ping</span>
                </button>
              </div>
              {testResult.message && (
                <div
                  className={`mt-1.5 text-xs font-medium ${
                    testResult.status === 'success'
                      ? 'text-emerald-400'
                      : testResult.status === 'failed'
                      ? 'text-rose-400'
                      : 'text-slate-400'
                  }`}
                >
                  {testResult.message}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">App ID</label>
                <input
                  type="text"
                  value={editingProfile.appId}
                  onChange={e => handleFieldChange('appId', e.target.value)}
                  placeholder="APP_COALAPAY_TEST_01"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">App Key (AES-256 / 32B)</label>
                  <button
                    onClick={handleGenerateKey}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Generate</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={editingProfile.appKey}
                  onChange={e => handleFieldChange('appKey', e.target.value)}
                  placeholder="64 HEX CHARACTERS"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-amber-300 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Environment Description</label>
              <input
                type="text"
                value={editingProfile.description || ''}
                onChange={e => handleFieldChange('description', e.target.value)}
                placeholder="Notes about this switch or merchant endpoint"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <input
                type="checkbox"
                id="mockModeToggle"
                checked={Boolean(editingProfile.mockMode)}
                onChange={e => handleFieldChange('mockMode', e.target.checked)}
                className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
              <label htmlFor="mockModeToggle" className="text-xs text-slate-300 select-none">
                <span className="font-semibold text-white">Enable In-Browser Mock Mode</span> (simulates gateway responses offline without calling network)
              </label>
            </div>

          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div>
            {profiles.length > 1 && editingProfile.id !== DEFAULT_PROFILES[0].id && (
              <button
                onClick={() => handleDelete(editingProfile.id)}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Profile</span>
              </button>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveCurrent}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition shadow-lg shadow-indigo-500/20 flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Apply & Select</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
