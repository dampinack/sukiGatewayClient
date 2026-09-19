import React, { useState } from 'react';
import {
  Play,
  Copy,
  Check,
  Code,
  CreditCard,
  RefreshCw,
  Search,
  RotateCcw,
  Ban,
  ShieldCheck,
  SlidersHorizontal,
  ExternalLink,
  Loader2,
  FileJson,
} from 'lucide-react';
import { apiService } from '../services/api-client';
import {
  CancelOrderPlain,
  CreateOrderPlain,
  EnvironmentProfile,
  RefundPlain,
} from '../types/gateway';

interface PaymentConsoleProps {
  profile: EnvironmentProfile;
  onOpenCashier: (orderId: string, amount: string, currency: string) => void;
  onOpenCodeExport: (endpoint: string, payload: any) => void;
  onPaymentSuccess?: () => void;
}

type ActionType = 'create_order' | 'query_order' | 'cancel_order' | 'refund_order' | 'query_refund' | 'token';

export const PaymentConsole: React.FC<PaymentConsoleProps> = ({
  profile,
  onOpenCashier,
  onOpenCodeExport,
  onPaymentSuccess,
}) => {
  const [action, setAction] = useState<ActionType>('create_order');
  const [editorMode, setEditorMode] = useState<'form' | 'json'>('form');
  const [isExecuting, setIsExecuting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form State for Create Order
  const [merchantOrderId, setMerchantOrderId] = useState(`SUKI-${Date.now().toString().slice(-6)}`);
  const [amount, setAmount] = useState('49.99');
  const [currency, setCurrency] = useState('USD');
  const [paymentChannel, setPaymentChannel] = useState<'ONLINE' | 'POS'>('ONLINE');
  const [returnUrl, setReturnUrl] = useState('http://localhost:8080/cashier/webhook');
  const [itemName, setItemName] = useState('Fintech API License');

  // Form State for Queries & Actions
  const [targetOrderId, setTargetOrderId] = useState('');
  const [targetMerchantOrderId, setTargetMerchantOrderId] = useState('');
  const [cancelReason, setCancelReason] = useState('Customer requested order cancellation');
  const [refundAmount, setRefundAmount] = useState('49.99');
  const [refundReason, setRefundReason] = useState('Merchant refund settlement');
  const [merchantRefundId, setMerchantRefundId] = useState(`REF-${Date.now().toString().slice(-6)}`);
  const [targetRefundId, setTargetRefundId] = useState('');

  // View state: 'card' (visual order card) vs 'json' (raw payload tree)
  const [resultView, setResultView] = useState<'card' | 'json'>('card');
  const [copiedLink, setCopiedLink] = useState(false);

  // Raw JSON override state
  const [rawJsonPayload, setRawJsonPayload] = useState('');

  // Execution Result State
  const [executionResult, setExecutionResult] = useState<{
    endpoint: string;
    httpStatus: number;
    durationMs: number;
    decryptedData: any;
    rawResponse: any;
    error?: string;
  } | null>(null);

  const handleQuickQuery = (orderId: string) => {
    setTargetOrderId(orderId);
    setAction('query_order');
    setExecutionResult(null);
  };

  const handleQuickCancel = (orderId: string) => {
    setTargetOrderId(orderId);
    setAction('cancel_order');
    setExecutionResult(null);
  };

  const handleQuickRefund = (orderId: string, amt: string) => {
    setTargetOrderId(orderId);
    setRefundAmount(amt);
    setAction('refund_order');
    setExecutionResult(null);
  };

  const copyPayUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const regenerateOrderId = () => {
    setMerchantOrderId(`SUKI-${Date.now().toString().slice(-6)}`);
  };

  const regenerateRefundId = () => {
    setMerchantRefundId(`REF-${Date.now().toString().slice(-6)}`);
  };

  const getPayloadForAction = (): any => {
    if (editorMode === 'json' && rawJsonPayload.trim()) {
      try {
        return JSON.parse(rawJsonPayload);
      } catch {
        throw new Error('Invalid JSON in payload editor');
      }
    }

    switch (action) {
      case 'create_order':
        return {
          merchantOrderId,
          amount,
          currency,
          paymentChannel,
          returnUrl,
          frontReturnUrl: 'http://localhost:5173/return',
          expireMinutes: 30,
          items: [
            {
              name: itemName,
              quantity: '1',
              unitPrice: amount,
              amount: amount,
            }
          ]
        } as CreateOrderPlain;

      case 'query_order':
        return {
          ...(targetOrderId ? { orderId: targetOrderId } : {}),
          ...(targetMerchantOrderId ? { merchantOrderId: targetMerchantOrderId } : {}),
        };

      case 'cancel_order':
        return {
          ...(targetOrderId ? { orderId: targetOrderId } : {}),
          ...(targetMerchantOrderId ? { merchantOrderId: targetMerchantOrderId } : {}),
          reason: cancelReason,
        } as CancelOrderPlain;

      case 'refund_order':
        return {
          ...(targetOrderId ? { orderId: targetOrderId } : {}),
          merchantRefundId,
          refundAmount,
          reason: refundReason,
        } as RefundPlain;

      case 'query_refund':
        return {
          ...(targetRefundId ? { refundId: targetRefundId } : {}),
          ...(merchantRefundId ? { merchantRefundId } : {}),
        };

      case 'token':
        return {};
    }
  };

  const getEndpointForAction = (): string => {
    switch (action) {
      case 'create_order': return '/api/v2/pay';
      case 'query_order': return '/api/v2/query';
      case 'cancel_order': return '/api/v2/cancel';
      case 'refund_order': return '/api/v2/refund';
      case 'query_refund': return '/api/v2/refund/query';
      case 'token': return '/api/v2/token';
    }
  };

  const handleExecute = async () => {
    setIsExecuting(true);
    const endpoint = getEndpointForAction();
    const startTime = performance.now();

    try {
      const payload = getPayloadForAction();
      let res: any;

      if (action === 'token') {
        const token = await apiService.getToken(profile);
        res = { token, message: 'OAuth Token successfully acquired and saved to profile' };
      } else if (action === 'create_order') {
        res = await apiService.createOrder(profile, payload);
        if (res?.orderId) {
          setTargetOrderId(res.orderId);
          setTargetMerchantOrderId(res.merchantOrderId || merchantOrderId);
        }
      } else if (action === 'query_order') {
        res = await apiService.queryOrder(profile, payload);
      } else if (action === 'cancel_order') {
        res = await apiService.cancelOrder(profile, payload);
      } else if (action === 'refund_order') {
        res = await apiService.refundOrder(profile, payload);
        if (res?.refundId) setTargetRefundId(res.refundId);
      } else if (action === 'query_refund') {
        res = await apiService.queryRefund(profile, payload);
      }

      const durationMs = Math.round(performance.now() - startTime);
      setExecutionResult({
        endpoint,
        httpStatus: 200,
        durationMs,
        decryptedData: res,
        rawResponse: { statusCode: 200, message: 'success', content: '*** AES-256-GCM Decrypted ***' },
      });

      if (onPaymentSuccess) onPaymentSuccess();
    } catch (err: any) {
      const durationMs = Math.round(performance.now() - startTime);
      setExecutionResult({
        endpoint,
        httpStatus: 500,
        durationMs,
        decryptedData: null,
        rawResponse: null,
        error: err.message || 'Request execution failed',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCopyDecrypted = () => {
    if (executionResult?.decryptedData) {
      navigator.clipboard.writeText(JSON.stringify(executionResult.decryptedData, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const currentPayload = (() => {
    try {
      return getPayloadForAction();
    } catch {
      return {};
    }
  })();

  return (
    <div className="space-y-6">
      
      {/* Top Action Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 flex-wrap gap-3">
        <div className="flex items-center space-x-1.5 overflow-x-auto p-1 bg-slate-900/90 rounded-xl border border-slate-800">
          <button
            onClick={() => { setAction('create_order'); setExecutionResult(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
              action === 'create_order' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Create Order (Pay)</span>
          </button>
          <button
            onClick={() => { setAction('query_order'); setExecutionResult(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
              action === 'query_order' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Query Order</span>
          </button>
          <button
            onClick={() => { setAction('refund_order'); setExecutionResult(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
              action === 'refund_order' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Refund</span>
          </button>
          <button
            onClick={() => { setAction('query_refund'); setExecutionResult(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
              action === 'query_refund' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Query Refund</span>
          </button>
          <button
            onClick={() => { setAction('cancel_order'); setExecutionResult(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
              action === 'cancel_order' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Ban className="w-3.5 h-3.5" />
            <span>Cancel</span>
          </button>
          <button
            onClick={() => { setAction('token'); setExecutionResult(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
              action === 'token' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Acquire Token</span>
          </button>
        </div>

        {/* Right tools: Editor Switcher & Export Code */}
        <div className="flex items-center space-x-2">
          <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setEditorMode('form')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                editorMode === 'form' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Form
            </button>
            <button
              onClick={() => {
                setEditorMode('json');
                setRawJsonPayload(JSON.stringify(currentPayload, null, 2));
              }}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                editorMode === 'json' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              JSON
            </button>
          </div>

          <button
            onClick={() => onOpenCodeExport(getEndpointForAction(), currentPayload)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-indigo-400 flex items-center space-x-1.5 transition"
          >
            <Code className="w-3.5 h-3.5" />
            <span>SDK Code</span>
          </button>
        </div>
      </div>

      {/* Main Two-Pane Interactive Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Request Form / Editor (7 cols) */}
        <div className="lg:col-span-6 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
          
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Request Parameters</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{getEndpointForAction()}</p>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              POST
            </span>
          </div>

          {editorMode === 'json' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Raw JSON Payload</label>
              <textarea
                value={rawJsonPayload}
                onChange={e => setRawJsonPayload(e.target.value)}
                rows={14}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-cyan-300 focus:outline-none focus:border-indigo-500 selection:bg-indigo-500"
              />
            </div>
          ) : (
            <>
              {/* Form for Create Order */}
              {action === 'create_order' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-300">Merchant Order ID</label>
                        <button
                          onClick={regenerateOrderId}
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center space-x-0.5"
                        >
                          <RefreshCw className="w-2.5 h-2.5" />
                          <span>New</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        value={merchantOrderId}
                        onChange={e => setMerchantOrderId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Item / Description</label>
                      <input
                        type="text"
                        value={itemName}
                        onChange={e => setItemName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Amount</label>
                      <input
                        type="text"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-emerald-400 font-mono font-bold focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Currency</label>
                      <select
                        value={currency}
                        onChange={e => setCurrency(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="USD">USD (US Dollar)</option>
                        <option value="EUR">EUR (Euro)</option>
                        <option value="CAD">CAD (Canadian Dollar)</option>
                        <option value="GBP">GBP (British Pound)</option>
                        <option value="MXN">MXN (Mexican Peso)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Channel</label>
                      <select
                        value={paymentChannel}
                        onChange={e => setPaymentChannel(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="ONLINE">ONLINE (Cashier Web)</option>
                        <option value="POS">POS (Terminal / QR)</option>
                      </select>
                    </div>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1.5">Quick Presets:</span>
                    <div className="flex flex-wrap gap-2">
                      {['10.00', '25.00', '49.99', '99.95', '250.00'].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setAmount(val)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-slate-300 transition"
                        >
                          ${val}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Return / Webhook URL</label>
                    <input
                      type="text"
                      value={returnUrl}
                      onChange={e => setReturnUrl(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 font-mono focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Form for Query Order */}
              {action === 'query_order' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Gateway Order ID (orderId)</label>
                    <input
                      type="text"
                      value={targetOrderId}
                      onChange={e => setTargetOrderId(e.target.value)}
                      placeholder="e.g. CP20260914008899 or leave blank"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-cyan-300 font-mono focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Merchant Order ID (merchantOrderId)</label>
                    <input
                      type="text"
                      value={targetMerchantOrderId}
                      onChange={e => setTargetMerchantOrderId(e.target.value)}
                      placeholder="e.g. SUKI-123456"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Form for Cancel Order */}
              {action === 'cancel_order' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Gateway Order ID (orderId)</label>
                    <input
                      type="text"
                      value={targetOrderId}
                      onChange={e => setTargetOrderId(e.target.value)}
                      placeholder="e.g. CP20260914008899"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-cyan-300 font-mono focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Cancellation Reason</label>
                    <input
                      type="text"
                      value={cancelReason}
                      onChange={e => setCancelReason(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Form for Refund Order */}
              {action === 'refund_order' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Order ID to Refund</label>
                    <input
                      type="text"
                      value={targetOrderId}
                      onChange={e => setTargetOrderId(e.target.value)}
                      placeholder="e.g. CP20260914008899"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-cyan-300 font-mono focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-300">Merchant Refund ID</label>
                        <button
                          onClick={regenerateRefundId}
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center space-x-0.5"
                        >
                          <RefreshCw className="w-2.5 h-2.5" />
                          <span>New</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        value={merchantRefundId}
                        onChange={e => setMerchantRefundId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Refund Amount</label>
                      <input
                        type="text"
                        value={refundAmount}
                        onChange={e => setRefundAmount(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-rose-400 font-mono font-bold focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Reason</label>
                    <input
                      type="text"
                      value={refundReason}
                      onChange={e => setRefundReason(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Form for Query Refund */}
              {action === 'query_refund' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Gateway Refund ID</label>
                    <input
                      type="text"
                      value={targetRefundId}
                      onChange={e => setTargetRefundId(e.target.value)}
                      placeholder="e.g. REF-123456"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-cyan-300 font-mono focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Merchant Refund ID</label>
                    <input
                      type="text"
                      value={merchantRefundId}
                      onChange={e => setMerchantRefundId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Action: Token */}
              {action === 'token' && (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs text-slate-300">
                  <div className="font-semibold text-white">OAuth / JWT Token Acquisition</div>
                  <p>
                    Issues a signed handshake via <code className="text-cyan-300">/api/v2/token</code> using HMAC-SHA256 of your AppId + signTime. The returned token will be stored in your active profile.
                  </p>
                  <div className="pt-2 font-mono text-[11px] text-indigo-300">
                    Active App ID: {profile.appId}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Primary Action Button */}
          <button
            onClick={handleExecute}
            disabled={isExecuting}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 flex items-center justify-center space-x-2 transition disabled:opacity-50"
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Encrypting & Dispatching...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Execute API Call</span>
              </>
            )}
          </button>

        </div>

        {/* Right Column: Response Inspector / Order Creation Result (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl flex flex-col min-h-[460px]">
          
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {executionResult?.decryptedData?.orderId ? 'Order Creation Result' : 'Gateway Response'}
              </h3>
              {executionResult && (
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    executionResult.httpStatus === 200
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {executionResult.httpStatus === 200 ? 'READY' : 'ERR'} • {executionResult.durationMs}ms
                </span>
              )}
            </div>

            {/* Mode Switcher: Order Card vs Raw JSON */}
            {executionResult?.decryptedData && (
              <div className="flex items-center space-x-2">
                {executionResult.decryptedData.orderId && (
                  <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
                    <button
                      onClick={() => setResultView('card')}
                      className={`px-2.5 py-0.5 rounded-md font-medium transition ${
                        resultView === 'card' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Result Card
                    </button>
                    <button
                      onClick={() => setResultView('json')}
                      className={`px-2.5 py-0.5 rounded-md font-medium transition ${
                        resultView === 'json' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Raw JSON
                    </button>
                  </div>
                )}
                <button
                  onClick={handleCopyDecrypted}
                  className="text-xs text-slate-400 hover:text-white flex items-center space-x-1 p-1 rounded hover:bg-slate-800 transition"
                  title="Copy Decrypted JSON"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto max-h-[460px]">
            {executionResult ? (
              executionResult.error ? (
                <div className="text-rose-400 space-y-2 p-4 bg-slate-950 rounded-xl border border-rose-900/50 font-mono text-xs">
                  <div className="font-bold text-sm">Execution Error:</div>
                  <div>{executionResult.error}</div>
                </div>
              ) : resultView === 'card' && executionResult.decryptedData?.orderId ? (
                /* Order Creation Result Card */
                <div className="space-y-4">
                  
                  {/* Order Attribute Summary Box */}
                  <div className="bg-slate-950 border border-slate-800/90 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                      <span className="text-xs text-slate-400 font-medium">Gateway Order ID</span>
                      <span className="font-mono font-bold text-xs text-cyan-400 bg-cyan-950/40 px-2.5 py-0.5 rounded border border-cyan-800/40 select-all">
                        {executionResult.decryptedData.orderId}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Merchant Order ID</span>
                      <span className="font-mono text-slate-200 font-bold">{executionResult.decryptedData.merchantOrderId}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Order Status</span>
                      <span
                        className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded ${
                          executionResult.decryptedData.status === 'PAID'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {executionResult.decryptedData.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Order Amount</span>
                      <span className="font-mono font-bold text-base text-white">
                        {executionResult.decryptedData.amount} <span className="text-xs text-indigo-300 font-semibold">{executionResult.decryptedData.currency}</span>
                      </span>
                    </div>

                    {executionResult.decryptedData.expiresAt && (
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Expires At</span>
                        <span className="font-mono text-[11px] text-slate-300">
                          {new Date(executionResult.decryptedData.expiresAt).toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Cashier & Hosted Checkout Actions */}
                  {executionResult.decryptedData.payUrl && (
                    <div className="p-4 rounded-xl bg-gradient-to-tr from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                          <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Buyer Checkout & Cashier</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">ONLINE Cashier</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Open the hosted payment cashier in your browser or simulate virtual EMV checkout directly in the console.
                      </p>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <a
                          href={executionResult.decryptedData.payUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition shadow shadow-indigo-600/25"
                        >
                          <span>Open Cashier</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => copyPayUrl(executionResult.decryptedData.payUrl)}
                          className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center space-x-1.5 transition border border-slate-700"
                        >
                          {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                          <span>{copiedLink ? 'Link Copied' : 'Copy Pay Link'}</span>
                        </button>
                      </div>

                      {/* Embedded Virtual POS Simulator Button */}
                      <button
                        onClick={() =>
                          onOpenCashier(
                            executionResult.decryptedData.orderId,
                            executionResult.decryptedData.amount || amount,
                            executionResult.decryptedData.currency || currency
                          )
                        }
                        className="w-full py-2.5 px-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center space-x-2 transition shadow mt-1"
                      >
                        <CreditCard className="w-4 h-4 text-emerald-400" />
                        <span>Open in Virtual Terminal Simulator (Pay Order)</span>
                      </button>
                    </div>
                  )}

                  {/* Quick-Flow Navigation Bar */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[11px] text-slate-500 font-medium">Quick Actions:</span>
                    <div className="flex space-x-1.5">
                      <button
                        onClick={() => handleQuickQuery(executionResult.decryptedData.orderId)}
                        className="px-2.5 py-1 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] flex items-center space-x-1 transition"
                      >
                        <Search className="w-3 h-3 text-indigo-400" />
                        <span>Query</span>
                      </button>
                      <button
                        onClick={() => handleQuickRefund(executionResult.decryptedData.orderId, executionResult.decryptedData.amount || amount)}
                        className="px-2.5 py-1 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] flex items-center space-x-1 transition"
                      >
                        <RotateCcw className="w-3 h-3 text-emerald-400" />
                        <span>Refund</span>
                      </button>
                      <button
                        onClick={() => handleQuickCancel(executionResult.decryptedData.orderId)}
                        className="px-2.5 py-1 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] flex items-center space-x-1 transition"
                      >
                        <Ban className="w-3 h-3 text-rose-400" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>

                </div>
              ) : (
                /* Raw JSON viewer */
                <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono text-xs overflow-y-auto">
                  <pre className="text-emerald-300 whitespace-pre-wrap selection:bg-indigo-500 selection:text-white">
                    {JSON.stringify(executionResult.decryptedData, null, 2)}
                  </pre>
                </div>
              )
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2 py-16">
                <FileJson className="w-8 h-8 stroke-1 text-slate-600" />
                <span className="text-xs">No execution yet. Click "Execute API Call" to dispatch.</span>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
