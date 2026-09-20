import React, { useState, useEffect } from 'react';
import {
  Coins,
  Server,
  Activity,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  AlertTriangle,
  QrCode,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { btcpayClient } from '../services/btcpay-client';
import { BTCPayConfig, InvoiceData, InvoicePaymentMethod } from '../types/btcpay';

export const BTCPayConsole: React.FC = () => {
  const [config, setConfig] = useState<BTCPayConfig>(() => btcpayClient.getConfig());
  const [isTestingHealth, setIsTestingHealth] = useState(false);
  const [healthStatus, setHealthStatus] = useState<{
    tested: boolean;
    ok: boolean;
    latencyMs: number;
    msg?: string;
  }>({ tested: false, ok: false, latencyMs: 0 });

  // Invoice creation form state
  const [amount, setAmount] = useState('15.00');
  const [currency, setCurrency] = useState('USD');
  const [orderId, setOrderId] = useState(`ORD-${Date.now()}`);
  const [itemDesc, setItemDesc] = useState('SukiPay Gateway Test Order');
  const [buyerEmail, setBuyerEmail] = useState('merchant@example.com');
  const [speedPolicy, setSpeedPolicy] = useState<'HighSpeed' | 'MediumSpeed' | 'LowSpeed'>('HighSpeed');

  // Execution state
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [invoiceError, setInvoiceError] = useState('');
  const [activeInvoice, setActiveInvoice] = useState<InvoiceData | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<InvoicePaymentMethod[]>([]);
  const [isRefreshingInvoice, setIsRefreshingInvoice] = useState(false);

  // Webhook Simulator state
  const [webhookSecret, setWebhookSecret] = useState('my_btcpay_webhook_secret_key');
  const [webhookPayload, setWebhookPayload] = useState(() =>
    JSON.stringify(
      {
        deliveryId: 'del_8984920',
        webhookId: 'wh_3840294',
        type: 'InvoiceSettled',
        timestamp: Math.floor(Date.now() / 1000),
        storeId: config.storeId || 'store_sandbox_default',
        invoiceId: 'inv_btcpay_mock_123',
        manuallyMarked: false,
        overPaid: false,
      },
      null,
      2
    )
  );
  const [computedSignature, setComputedSignature] = useState('');
  const [isVerifyingHmac, setIsVerifyingHmac] = useState(false);
  const [hmacResult, setHmacResult] = useState<{ tested: boolean; valid: boolean } | null>(null);

  // Clipboard copy state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Run Health Check on load
  const runHealthCheck = async (urlToTest?: string) => {
    setIsTestingHealth(true);
    const res = await btcpayClient.checkHealth(urlToTest || config.serverUrl);
    setHealthStatus({
      tested: true,
      ok: res.ok,
      latencyMs: res.latencyMs,
      msg: res.ok ? 'Synchronized and Online' : res.error,
    });
    setIsTestingHealth(false);
  };

  useEffect(() => {
    runHealthCheck();
  }, []);

  const handleSaveConfig = () => {
    const saved = btcpayClient.saveConfig(config);
    setConfig(saved);
    runHealthCheck(saved.serverUrl);
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setInvoiceError('');
    setIsCreatingInvoice(true);

    if (!config.storeId) {
      setInvoiceError('Please configure your Store ID in the settings box above.');
      setIsCreatingInvoice(false);
      return;
    }

    try {
      const invoice = await btcpayClient.createInvoice({
        amount: parseFloat(amount) || 10,
        currency: currency.toUpperCase(),
        metadata: {
          orderId,
          itemDesc,
          buyerEmail,
        },
        checkout: {
          speedPolicy,
          expirationMinutes: 45,
          paymentMethods: ['BTC', 'BTC-LightningNetwork'],
        },
      });

      setActiveInvoice(invoice);

      // Fetch payment methods
      try {
        const methods = await btcpayClient.getInvoicePaymentMethods(invoice.id);
        setPaymentMethods(methods);
      } catch (e) {
        console.warn('Could not fetch payment methods immediately', e);
      }
    } catch (err: any) {
      setInvoiceError(err.message || 'Invoice generation failed');
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  const handleRefreshInvoice = async () => {
    if (!activeInvoice) return;
    setIsRefreshingInvoice(true);
    try {
      const updated = await btcpayClient.getInvoice(activeInvoice.id);
      setActiveInvoice(updated);
      const methods = await btcpayClient.getInvoicePaymentMethods(activeInvoice.id);
      setPaymentMethods(methods);
    } catch (err: any) {
      console.error('Failed refreshing invoice', err);
    } finally {
      setIsRefreshingInvoice(false);
    }
  };

  const handleGenerateWebhookHmac = async () => {
    setIsVerifyingHmac(true);
    try {
      const enc = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        enc.encode(webhookSecret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(webhookPayload));
      const hex = Array.from(new Uint8Array(sigBuf))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      const fullHeader = `sha256=${hex}`;
      setComputedSignature(fullHeader);

      const isValid = await btcpayClient.verifyWebhookSignature(webhookPayload, fullHeader, webhookSecret);
      setHmacResult({ tested: true, valid: isValid });
    } catch (err) {
      console.error(err);
      setHmacResult({ tested: true, valid: false });
    } finally {
      setIsVerifyingHmac(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-slate-900 border border-amber-500/30 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm tracking-wide uppercase">
              <Coins className="w-5 h-5 text-amber-400" />
              Sovereign Payment Rails
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">
              BTCPay Server Greenfield Client
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl">
              100% Free, Open-Source & Non-Custodial crypto payment processor. Eliminate proprietary US
              gateways, banks, and jurisdictional blockers.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-3 py-2 rounded-xl text-xs font-mono">
              <span className="text-slate-400">Endpoint:</span>
              <span className="text-amber-300 font-semibold">
                {healthStatus.tested && healthStatus.ok ? 'Online (Regtest/Testnet)' : 'Checking...'}
              </span>
              {healthStatus.ok ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-400" />
              )}
            </div>

            <button
              onClick={() => runHealthCheck()}
              disabled={isTestingHealth}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTestingHealth ? 'animate-spin' : ''}`} />
              Ping
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Server Config & Quick Setup Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Server Connection Form */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 font-semibold text-slate-200">
              <Server className="w-4 h-4 text-indigo-400" />
              Greenfield API Connection Settings
            </div>
            {healthStatus.tested && (
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-mono ${
                  healthStatus.ok
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}
              >
                {healthStatus.latencyMs}ms • {healthStatus.msg}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-slate-400 font-medium">Server URL</label>
              <input
                type="text"
                value={config.serverUrl}
                onChange={e => setConfig({ ...config, serverUrl: e.target.value })}
                placeholder="https://testnet.demo.btcpayserver.org"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none rounded-lg px-3 py-2 text-slate-200 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium">API Key (Personal Access Token)</label>
              <input
                type="password"
                value={config.apiKey}
                onChange={e => setConfig({ ...config, apiKey: e.target.value })}
                placeholder="Paste Greenfield API Key"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none rounded-lg px-3 py-2 text-slate-200 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium">Store ID</label>
              <input
                type="text"
                value={config.storeId}
                onChange={e => setConfig({ ...config, storeId: e.target.value })}
                placeholder="e.g. 74C8gYQ8... (Store ID in BTCPay)"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none rounded-lg px-3 py-2 text-slate-200 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => {
                setConfig({
                  serverUrl: 'https://testnet.demo.btcpayserver.org',
                  apiKey: '',
                  storeId: '',
                });
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition"
            >
              Reset to Testnet Demo
            </button>
            <button
              onClick={handleSaveConfig}
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs rounded-lg shadow-lg shadow-amber-600/20 transition flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Save Configuration
            </button>
          </div>
        </div>

        {/* Quick Guide Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3 text-xs">
          <div className="flex items-center gap-2 font-semibold text-slate-200 border-b border-slate-800 pb-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Instant Sandbox Testing (60s)
          </div>
          <ol className="list-decimal list-inside space-y-2 text-slate-400 leading-relaxed">
            <li>
              Go to{' '}
              <a
                href="https://testnet.demo.btcpayserver.org"
                target="_blank"
                rel="noreferrer"
                className="text-amber-400 hover:underline inline-flex items-center gap-0.5"
              >
                testnet.demo.btcpayserver.org <ExternalLink className="w-3 h-3" />
              </a>
            </li>
            <li>Register an account (no KYC or verification).</li>
            <li>Create a new Store (e.g. "My Test Store").</li>
            <li>
              Go to <strong>Store Settings</strong> to copy your <strong>Store ID</strong>.
            </li>
            <li>
              Go to <strong>Account &gt; API Keys</strong>, generate a key with{' '}
              <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-300">
                btcpay.store.cancreateinvoice
              </code>
              .
            </li>
            <li>Paste them here to create live invoices!</li>
          </ol>
        </div>
      </div>

      {/* Main Workspace: Invoice Creator & Live Invoice Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invoice Creator Form */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 font-semibold text-slate-200">
              <Coins className="w-4 h-4 text-amber-400" />
              Create Greenfield Invoice
            </div>
            <button
              onClick={() => setOrderId(`ORD-${Date.now()}`)}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 font-mono"
            >
              <RefreshCw className="w-3 h-3" /> New Order ID
            </button>
          </div>

          <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Amount</label>
                <input
                  type="text"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="25.00"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none rounded-lg px-3 py-2 text-slate-100 font-mono text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Currency</label>
                <select
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none rounded-lg px-3 py-2 text-slate-100 font-mono text-sm"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="BTC">BTC</option>
                  <option value="SATS">SATS (Satoshis)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium">Order ID</label>
              <input
                type="text"
                value={orderId}
                onChange={e => setOrderId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none rounded-lg px-3 py-2 text-slate-200 font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium">Item Description</label>
              <input
                type="text"
                value={itemDesc}
                onChange={e => setItemDesc(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none rounded-lg px-3 py-2 text-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Buyer Email</label>
                <input
                  type="email"
                  value={buyerEmail}
                  onChange={e => setBuyerEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none rounded-lg px-3 py-2 text-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-medium">Speed Policy</label>
                <select
                  value={speedPolicy}
                  onChange={e => setSpeedPolicy(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none rounded-lg px-3 py-2 text-slate-200"
                >
                  <option value="HighSpeed">High Speed (0-conf)</option>
                  <option value="MediumSpeed">Medium Speed (1-conf)</option>
                  <option value="LowSpeed">Low Speed (6-conf)</option>
                </select>
              </div>
            </div>

            {invoiceError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{invoiceError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isCreatingInvoice}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-amber-600/20 transition flex items-center justify-center gap-2"
            >
              {isCreatingInvoice ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Creating Greenfield Invoice...
                </>
              ) : (
                <>
                  <Coins className="w-4 h-4" />
                  Create Invoice via Greenfield API
                </>
              )}
            </button>
          </form>
        </div>

        {/* Live Invoice Inspector Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2 font-semibold text-slate-200">
                <QrCode className="w-4 h-4 text-indigo-400" />
                Live Invoice Status & Checkout
              </div>
              {activeInvoice && (
                <button
                  onClick={handleRefreshInvoice}
                  disabled={isRefreshingInvoice}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono"
                >
                  <RefreshCw className={`w-3 h-3 ${isRefreshingInvoice ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              )}
            </div>

            {!activeInvoice ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto text-slate-500">
                  <Coins className="w-6 h-6" />
                </div>
                <div className="text-slate-400 text-sm font-medium">No Active Invoice</div>
                <p className="text-slate-500 text-xs max-w-xs mx-auto">
                  Submit the form on the left with your BTCPay Store credentials to generate an invoice.
                </p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Invoice Status Badge & Summary */}
                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Invoice ID</span>
                    <span className="font-mono text-slate-200 font-semibold">{activeInvoice.id}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[11px]">Status</span>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full font-mono text-xs font-semibold ${
                        activeInvoice.status === 'Settled'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : activeInvoice.status === 'Processing'
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {activeInvoice.status}
                    </span>
                  </div>
                </div>

                {/* Amount Details */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Total Due</span>
                    <span className="text-lg font-bold font-mono text-amber-400">
                      {activeInvoice.amount} {activeInvoice.currency}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Expires In</span>
                    <span className="text-sm font-mono text-slate-300">
                      {new Date(activeInvoice.expirationTime * 1000).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                {/* Payment Methods */}
                {paymentMethods.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-slate-400 font-medium block">Active Payment Rails:</span>
                    <div className="space-y-2">
                      {paymentMethods.map(m => (
                        <div
                          key={m.paymentMethodId}
                          className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-xl space-y-1.5"
                        >
                          <div className="flex items-center justify-between font-mono">
                            <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                              {m.paymentMethodId.includes('Lightning') ? (
                                <Zap className="w-3.5 h-3.5 text-amber-400" />
                              ) : (
                                <Coins className="w-3.5 h-3.5 text-amber-400" />
                              )}
                              {m.paymentMethodId}
                            </span>
                            <span className="text-slate-300">
                              {m.due} {m.currency}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              readOnly
                              value={m.destination}
                              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] font-mono text-slate-400 select-all"
                            />
                            <button
                              onClick={() => copyToClipboard(m.destination, m.paymentMethodId)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 transition"
                            >
                              {copiedKey === m.paymentMethodId ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Checkout Link Action */}
                {activeInvoice.checkoutLink && (
                  <a
                    href={activeInvoice.checkoutLink}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-center flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition"
                  >
                    <span>Open BTCPay Checkout Page</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Webhook HMAC-SHA256 Cryptographic Verifier Section */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 font-semibold text-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            BTCPay Webhook Cryptographic HMAC-SHA256 Verifier
          </div>
          <span className="text-xs text-slate-400 font-mono">Header: BTCPay-Sig: sha256=&lt;hmac&gt;</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium">Webhook Secret</label>
              <input
                type="text"
                value={webhookSecret}
                onChange={e => setWebhookSecret(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none rounded-lg px-3 py-2 text-slate-200 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 font-medium">Raw JSON Webhook Payload</label>
              <textarea
                rows={7}
                value={webhookPayload}
                onChange={e => setWebhookPayload(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none rounded-lg px-3 py-2 text-slate-300 font-mono text-[11px]"
              />
            </div>

            <button
              onClick={handleGenerateWebhookHmac}
              disabled={isVerifyingHmac}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg shadow-lg shadow-emerald-600/20 transition flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              Calculate & Verify HMAC-SHA256 Signature
            </button>
          </div>

          <div className="space-y-3 bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-slate-400 font-medium block">Computed BTCPay-Sig Header:</span>
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg font-mono text-[11px] text-emerald-400 break-all">
                {computedSignature || 'Click "Calculate & Verify" to generate signature...'}
              </div>

              {hmacResult && (
                <div
                  className={`p-3 rounded-xl border flex items-center gap-2.5 font-mono text-xs ${
                    hmacResult.valid
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  }`}
                >
                  {hmacResult.valid ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                      <span>Cryptographic Verification Passed: Payload is Authentic & Untampered.</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 shrink-0 text-rose-400" />
                      <span>Verification Failed: Signature mismatch or invalid secret.</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="text-[11px] text-slate-500 border-t border-slate-800/80 pt-3">
              This HMAC verification mirrors the exact cryptographic handshake performed by your Kirara Server
              or backend when receiving webhook events from BTCPay Server.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
