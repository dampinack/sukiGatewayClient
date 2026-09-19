import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  X,
  ExternalLink,
  ShieldAlert,
  Loader2,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { apiService } from '../services/api-client';
import { EnvironmentProfile } from '../types/gateway';

interface CashierSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: EnvironmentProfile;
  orderId: string;
  amount: string;
  currency: string;
  onPaymentSettled?: () => void;
}

const TEST_CARDS = [
  { brand: 'Visa', number: '4111 •••• •••• 1111', exp: '12/28', cvv: '123', label: 'Visa Approved' },
  { brand: 'Mastercard', number: '5555 •••• •••• 4444', exp: '08/29', cvv: '888', label: 'Mastercard 3DS' },
  { brand: 'Amex', number: '3782 •••••• 0005', exp: '11/27', cvv: '9876', label: 'Amex Commercial' },
  { brand: 'Decline', number: '4000 •••• •••• 0002', exp: '01/26', cvv: '000', label: 'Simulate Decline' },
];

export const CashierSimulatorModal: React.FC<CashierSimulatorModalProps> = ({
  isOpen,
  onClose,
  profile,
  orderId,
  amount,
  currency,
  onPaymentSettled,
}) => {
  const [selectedCard, setSelectedCard] = useState(TEST_CARDS[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<{
    status: 'idle' | 'success' | 'failed';
    message: string;
    transactionId?: string;
  }>({ status: 'idle', message: '' });

  useEffect(() => {
    if (isOpen) {
      setPaymentResult({ status: 'idle', message: '' });
      setIsProcessing(false);
    }
  }, [isOpen, orderId]);

  if (!isOpen) return null;

  const handleSimulatePayment = async () => {
    setIsProcessing(true);
    try {
      if (selectedCard.brand === 'Decline') {
        await new Promise(r => setTimeout(r, 600));
        setPaymentResult({
          status: 'failed',
          message: 'Payment declined by issuer (ISO 8583 Response Code: 05 Do Not Honor)',
        });
        setIsProcessing(false);
        return;
      }

      const res = await apiService.simulatePayOrder(profile, orderId);
      if (res.success) {
        setPaymentResult({
          status: 'success',
          message: res.message || 'Payment settled successfully!',
          transactionId: `TX-${Date.now().toString(36).toUpperCase()}`,
        });
        if (onPaymentSettled) onPaymentSettled();
      } else {
        setPaymentResult({
          status: 'failed',
          message: res.message || 'Payment simulation failed',
        });
      }
    } catch (err: any) {
      setPaymentResult({
        status: 'failed',
        message: err.message || 'Error executing checkout settlement',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const hostedPayUrl = `${profile.baseUrl.replace(/\/+$/, '')}/cashier/pay?orderId=${encodeURIComponent(orderId)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">SukiPay Terminal & Buyer Simulator</h3>
              <p className="text-xs text-slate-400 font-mono">Order: {orderId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          
          {/* Amount Badge */}
          <div className="bg-gradient-to-r from-indigo-950/60 to-slate-900 border border-indigo-500/30 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-indigo-300 font-medium">Total Payable Amount</div>
              <div className="text-2xl font-black text-white mt-0.5">
                {amount} <span className="text-sm font-semibold text-indigo-300">{currency}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 uppercase tracking-wide font-mono">
                {profile.name}
              </span>
            </div>
          </div>

          {paymentResult.status === 'success' ? (
            <div className="p-5 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto ring-4 ring-emerald-500/10">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-base font-bold text-emerald-300">Payment Approved & Settled!</h4>
                <p className="text-xs text-emerald-400/80 mt-1">{paymentResult.message}</p>
                {paymentResult.transactionId && (
                  <div className="mt-2 text-xs font-mono text-emerald-200 bg-emerald-900/40 py-1 px-2 rounded inline-block">
                    Txn: {paymentResult.transactionId}
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-400 pt-2">
                Order status updated to <span className="text-emerald-400 font-semibold">PAID</span>. Webhook notification dispatched.
              </p>
            </div>
          ) : (
            <>
              {/* Test Card Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Select Simulated Card Preset</label>
                <div className="grid grid-cols-2 gap-2">
                  {TEST_CARDS.map(card => (
                    <button
                      key={card.label}
                      onClick={() => setSelectedCard(card)}
                      className={`p-3 rounded-xl border text-left transition ${
                        selectedCard.label === card.label
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{card.brand}</span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                          card.brand === 'Decline' ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {card.label}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-slate-400 mt-1">{card.number}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Simulated Card Preview */}
              <div className="bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950/40 p-4 rounded-xl border border-slate-800 relative overflow-hidden">
                <div className="flex justify-between items-center text-xs text-slate-400 mb-4">
                  <div className="flex items-center space-x-1.5">
                    <Lock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>EMV Chip / Contactless Simulation</span>
                  </div>
                  <span className="font-bold text-indigo-300">{selectedCard.brand}</span>
                </div>
                <div className="text-lg font-mono text-white tracking-widest my-2">
                  {selectedCard.number}
                </div>
                <div className="flex justify-between text-xs font-mono text-slate-400 mt-3">
                  <div>
                    <span className="text-[10px] text-slate-500 block">EXPIRES</span>
                    <span>{selectedCard.exp}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">CVV</span>
                    <span>{selectedCard.cvv}</span>
                  </div>
                </div>
              </div>

              {paymentResult.status === 'failed' && (
                <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800/60 flex items-start space-x-2 text-rose-300 text-xs">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <span>{paymentResult.message}</span>
                </div>
              )}
            </>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <a
            href={hostedPayUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-400 hover:text-cyan-400 flex items-center space-x-1"
          >
            <span>Open Kirara Hosted Cashier</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg transition"
            >
              Close
            </button>
            {paymentResult.status !== 'success' && (
              <button
                onClick={handleSimulatePayment}
                disabled={isProcessing}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-lg shadow-indigo-500/20 flex items-center space-x-1.5 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing Switch...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Settle</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
