import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { PaymentConsole } from './components/PaymentConsole';
import { SwitchInspector } from './components/SwitchInspector';
import { AuditLedger } from './components/AuditLedger';
import { CryptoToolbox } from './components/CryptoToolbox';
import { ProfileModal } from './components/ProfileModal';
import { CashierSimulatorModal } from './components/CashierSimulatorModal';
import { CodeExporterModal } from './components/CodeExporterModal';
import { apiService, DEFAULT_PROFILES } from './services/api-client';
import { EnvironmentProfile } from './types/gateway';

export function App() {
  const [profiles, setProfiles] = useState<EnvironmentProfile[]>(() => apiService.getProfiles());
  const [activeProfileId, setActiveProfileId] = useState<string>(() => apiService.getActiveProfileId());
  const [activeTab, setActiveTab] = useState<'console' | 'switch' | 'ledger' | 'crypto'>(() => {
    const param = new URLSearchParams(window.location.search).get('tab');
    if (param === 'switch' || param === 'ledger' || param === 'crypto') return param;
    return 'console';
  });
  
  // Modals state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [cashierModal, setCashierModal] = useState<{
    isOpen: boolean;
    orderId: string;
    amount: string;
    currency: string;
  }>({ isOpen: false, orderId: '', amount: '10.00', currency: 'USD' });

  const [codeExportModal, setCodeExportModal] = useState<{
    isOpen: boolean;
    endpoint: string;
    payload: any;
  }>({ isOpen: false, endpoint: '/api/v2/pay', payload: {} });

  const [isAcquiringToken, setIsAcquiringToken] = useState(false);
  const [ledgerRefreshCounter, setLedgerRefreshCounter] = useState(0);

  const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0] || DEFAULT_PROFILES[0];

  const handleSaveProfiles = (newProfiles: EnvironmentProfile[]) => {
    setProfiles(newProfiles);
    apiService.saveProfiles(newProfiles);
  };

  const handleSelectActiveProfile = (id: string) => {
    setActiveProfileId(id);
    apiService.setActiveProfileId(id);
  };

  const handleAcquireToken = async () => {
    setIsAcquiringToken(true);
    try {
      await apiService.getToken(activeProfile);
      setProfiles(apiService.getProfiles());
      setLedgerRefreshCounter(prev => prev + 1);
    } catch (err: any) {
      alert(`Token Acquisition Failed: ${err.message}`);
    } finally {
      setIsAcquiringToken(false);
    }
  };

  const handleOpenCashier = (orderId: string, amount: string, currency: string) => {
    setCashierModal({
      isOpen: true,
      orderId,
      amount,
      currency,
    });
  };

  const handleOpenCodeExport = (endpoint: string, payload: any) => {
    setCodeExportModal({
      isOpen: true,
      endpoint,
      payload,
    });
  };

  const handlePaymentSuccess = () => {
    setLedgerRefreshCounter(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Top Header */}
      <Header
        activeProfile={activeProfile}
        profiles={profiles}
        onSelectProfile={handleSelectActiveProfile}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onOpenCryptoToolbox={() => setActiveTab('crypto')}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        tokenStatus={{
          hasToken: Boolean(activeProfile.token),
          isAcquiring: isAcquiringToken,
        }}
        onAcquireToken={handleAcquireToken}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'console' && (
          <PaymentConsole
            profile={activeProfile}
            onOpenCashier={handleOpenCashier}
            onOpenCodeExport={handleOpenCodeExport}
            onPaymentSuccess={handlePaymentSuccess}
          />
        )}

        {activeTab === 'switch' && (
          <SwitchInspector profile={activeProfile} />
        )}

        {activeTab === 'ledger' && (
          <AuditLedger onRefreshTrigger={ledgerRefreshCounter} />
        )}

        {activeTab === 'crypto' && (
          <CryptoToolbox profile={activeProfile} />
        )}
      </main>

      {/* Global Modals */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profiles={profiles}
        activeProfileId={activeProfileId}
        onSaveProfiles={handleSaveProfiles}
        onSelectActiveProfile={handleSelectActiveProfile}
      />

      <CashierSimulatorModal
        isOpen={cashierModal.isOpen}
        onClose={() => setCashierModal(prev => ({ ...prev, isOpen: false }))}
        profile={activeProfile}
        orderId={cashierModal.orderId}
        amount={cashierModal.amount}
        currency={cashierModal.currency}
        onPaymentSettled={handlePaymentSuccess}
      />

      <CodeExporterModal
        isOpen={codeExportModal.isOpen}
        onClose={() => setCodeExportModal(prev => ({ ...prev, isOpen: false }))}
        profile={activeProfile}
        endpoint={codeExportModal.endpoint}
        payload={codeExportModal.payload}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span className="text-slate-300 font-semibold">SukiPay Client</span> • ISO 8583 Payment Switch Operations Console
          </div>
          <div className="font-mono text-[11px] text-slate-600">
            Gateway: {activeProfile.baseUrl} • AppId: {activeProfile.appId}
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
