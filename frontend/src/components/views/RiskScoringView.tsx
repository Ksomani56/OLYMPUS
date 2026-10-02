import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle, 
  TrendingUp, 
  ArrowRight, 
  Sparkles,
  Smartphone,
  CreditCard,
  Building,
  UserCheck,
  UserX
} from 'lucide-react';
import { SpotlightCard } from '../react-bits/SpotlightCard';
import { CountUp } from '../react-bits/CountUp';
import { DecryptedText } from '../react-bits/DecryptedText';
import { BorderBeam } from '../react-bits/BorderBeam';

interface TransactionInput {
  amount: number;
  type: string;
  newRecipient: boolean;
  deviceSeenBefore: boolean;
  transfersLast90s: number;
  originBalance: number;
}

export const RiskScoringView: React.FC = () => {
  const [tx, setTx] = useState<TransactionInput>({
    amount: 14850,
    type: 'TRANSFER',
    newRecipient: true,
    deviceSeenBefore: false,
    transfersLast90s: 4,
    originBalance: 15200,
  });

  const [isScored, setIsScored] = useState(true);
  const [modelType, setModelType] = useState<'both' | 'global' | 'silo'>('both');

  // Realistic calculation simulating the PyTorch model output
  const calculateScores = () => {
    let globalRisk = 12;
    let siloRisk = 10;

    // Amount factor
    if (tx.amount > 10000) {
      globalRisk += 28;
      siloRisk += 14; // Bank silo only checks amount, but has no cross-institutional velocity signals
    }

    // New recipient
    if (tx.newRecipient) {
      globalRisk += 22;
    }

    // Device seen before (learned from Wallet Silo)
    if (!tx.deviceSeenBefore) {
      globalRisk += 18;
      // Note: Silo bank model HAS NO DEVICE SIGNALS, so siloRisk does NOT increase!
    }

    // Velocity in 90 seconds
    if (tx.transfersLast90s >= 3) {
      globalRisk += 19;
    }

    globalRisk = Math.min(Math.max(globalRisk, 5), 96);
    siloRisk = Math.min(Math.max(siloRisk, 5), 35); // Bank alone misses it!

    return {
      globalScore: globalRisk,
      globalCategory: globalRisk >= 70 ? 'high' : globalRisk >= 40 ? 'medium' : 'low',
      globalAction: globalRisk >= 70 ? 'Manual Review' : globalRisk >= 40 ? 'Additional Verification' : 'Approve',
      siloScore: siloRisk,
      siloCategory: siloRisk >= 70 ? 'high' : siloRisk >= 40 ? 'medium' : 'low',
      siloAction: siloRisk >= 70 ? 'Manual Review' : siloRisk >= 40 ? 'Additional Verification' : 'Approve',
    };
  };

  const results = calculateScores();

  const loadPreset = (preset: 'attack' | 'normal' | 'mule') => {
    if (preset === 'attack') {
      setTx({
        amount: 18500,
        type: 'TRANSFER',
        newRecipient: true,
        deviceSeenBefore: false,
        transfersLast90s: 5,
        originBalance: 19000,
      });
    } else if (preset === 'normal') {
      setTx({
        amount: 450,
        type: 'PAYMENT',
        newRecipient: false,
        deviceSeenBefore: true,
        transfersLast90s: 0,
        originBalance: 8200,
      });
    } else if (preset === 'mule') {
      setTx({
        amount: 8900,
        type: 'CASH_OUT',
        newRecipient: true,
        deviceSeenBefore: false,
        transfersLast90s: 3,
        originBalance: 9000,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Quick Presets */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-cyan-400" />
            <DecryptedText text="Live Risk Scoring & SHAP Explanations (FR-7 & FR-8)" />
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Test how cross-institutional intelligence catches attacks that single-institution models miss.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Demo Scenarios:</span>
          <button
            onClick={() => loadPreset('attack')}
            className="px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 text-xs font-medium cursor-pointer transition-colors"
          >
            ⚡ Cross-Border Ring (Attack)
          </button>
          <button
            onClick={() => loadPreset('normal')}
            className="px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-xs font-medium cursor-pointer transition-colors"
          >
            ✓ Routine Salary
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Transaction Input Form (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-cyan-400" />
            Transaction Evaluation Parameters
          </h3>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Transfer Amount:</span>
              <span className="font-mono text-cyan-400 font-bold">${tx.amount.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="100"
              max="50000"
              step="250"
              value={tx.amount}
              onChange={(e) => setTx(prev => ({ ...prev, amount: Number(e.target.value) }))}
              className="w-full accent-cyan-400"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Transaction Type</label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {['TRANSFER', 'CASH_OUT', 'PAYMENT'].map(type => (
                <button
                  key={type}
                  onClick={() => setTx(prev => ({ ...prev, type }))}
                  className={`py-2 rounded-lg font-mono text-[11px] transition-colors cursor-pointer ${
                    tx.type === type
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold'
                      : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl border border-slate-800 bg-slate-950">
              <span className="text-[11px] text-slate-400 block mb-2">Recipient Status</span>
              <button
                onClick={() => setTx(prev => ({ ...prev, newRecipient: !prev.newRecipient }))}
                className={`w-full py-1.5 px-2 rounded-lg text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition-colors ${
                  tx.newRecipient
                    ? 'bg-amber-950/60 text-amber-300 border border-amber-800'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {tx.newRecipient ? '⚠️ New Recipient' : '✓ Known Recipient'}
              </button>
            </div>

            <div className="p-3 rounded-xl border border-slate-800 bg-slate-950">
              <span className="text-[11px] text-slate-400 block mb-2">Device Fingerprint</span>
              <button
                onClick={() => setTx(prev => ({ ...prev, deviceSeenBefore: !prev.deviceSeenBefore }))}
                className={`w-full py-1.5 px-2 rounded-lg text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition-colors ${
                  !tx.deviceSeenBefore
                    ? 'bg-red-950/60 text-red-300 border border-red-800'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {!tx.deviceSeenBefore ? '🚫 Unseen Device' : '✓ Familiar Device'}
              </button>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Velocity (Transfers in past 90s):</span>
              <span className="font-mono text-amber-400 font-bold">{tx.transfersLast90s} txs</span>
            </div>
            <input
              type="range"
              min="0"
              max="8"
              value={tx.transfersLast90s}
              onChange={(e) => setTx(prev => ({ ...prev, transfersLast90s: Number(e.target.value) }))}
              className="w-full accent-amber-400"
            />
          </div>
        </div>

        {/* Right Column: The Showdown & SHAP Factor Breakdown (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Side-by-Side Model Comparison Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Silo-Only (Bank Alone) */}
            <SpotlightCard className="p-4 border-slate-800 bg-slate-950" spotlightColor="rgba(244, 63, 94, 0.15)">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-slate-400">Isolated Bank Silo Model</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400">
                  No Cross-Signals
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <div className="text-3xl font-bold font-mono text-emerald-400">
                  <CountUp to={results.siloScore} duration={0.8} />
                </div>
                <span className="text-xs text-slate-500 font-mono">/ 100</span>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Decision:</span>
                <span className="px-2 py-0.5 rounded font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {results.siloAction}
                </span>
              </div>
              <div className="mt-2 text-[11px] text-red-400/90 font-mono flex items-center gap-1">
                ⚠️ Missed fraud (Blind to mobile device & velocity)
              </div>
            </SpotlightCard>

            {/* OLYMPUS Global Federated Model */}
            <SpotlightCard 
              className="p-4 border-cyan-500/40 bg-gradient-to-b from-slate-900 to-cyan-950/20 shadow-xl"
              spotlightColor="rgba(6, 182, 212, 0.25)"
            >
              <BorderBeam duration={5} colorFrom="#06B6D4" colorTo="#3B82F6" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-cyan-300">OLYMPUS Federated Global</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                  SecAgg + DP (v10)
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <div className={`text-3xl font-bold font-mono ${
                  results.globalScore >= 70 ? 'text-red-400' : results.globalScore >= 40 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  <CountUp to={results.globalScore} duration={0.8} />
                </div>
                <span className="text-xs text-slate-500 font-mono">/ 100</span>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Recommended Action:</span>
                <span className={`px-2 py-0.5 rounded font-semibold ${
                  results.globalScore >= 70 
                    ? 'bg-red-950 text-red-300 border border-red-800' 
                    : results.globalScore >= 40 
                    ? 'bg-amber-950 text-amber-300 border border-amber-800' 
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}>
                  {results.globalAction}
                </span>
              </div>
              <div className="mt-2 text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                ✓ Caught via collaborative cross-silo intelligence
              </div>
            </SpotlightCard>
          </div>

          {/* SHAP Reason Codes Waterfall (FR-8) */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono uppercase text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                SHAP Local Explainability Waterfall (PRD FR-8)
              </h4>
              <span className="text-[10px] font-mono text-slate-400">Model Version: global_v10</span>
            </div>

            <div className="space-y-2.5 pt-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Amount exceeds origin customer baseline</span>
                  <span className="font-mono text-red-400 font-bold">+38% (SHAP: +0.38)</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full" style={{ width: '76%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Unseen mobile device ID (Learned from Wallet silo)</span>
                  <span className="font-mono text-red-400 font-bold">+24% (SHAP: +0.24)</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" style={{ width: '48%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">New first-time destination account recipient</span>
                  <span className="font-mono text-amber-400 font-bold">+18% (SHAP: +0.18)</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '36%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Burst transfer velocity (4 transactions / 90 sec)</span>
                  <span className="font-mono text-amber-400 font-bold">+12% (SHAP: +0.12)</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '24%' }} />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 leading-relaxed">
              <span className="font-semibold text-slate-300">Audit Compliance Note:</span> High-risk transactions are routed to a human fraud analyst rather than auto-denied (PRD Non-goals & FR-7).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
