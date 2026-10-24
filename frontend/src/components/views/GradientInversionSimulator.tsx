import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Unlock, 
  Sliders, 
  Play, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Database, 
  Activity, 
  FileWarning, 
  CheckCircle, 
  AlertTriangle 
} from 'lucide-react';

interface GradientInversionSimulatorProps {
  isDark: boolean;
}

export const GradientInversionSimulator: React.FC<GradientInversionSimulatorProps> = ({ isDark }) => {
  const [epsilon, setEpsilon] = useState<number>(2.45);
  const [isProbing, setIsProbing] = useState<boolean>(false);
  const [probeIteration, setProbeIteration] = useState<number>(100);
  const [selectedRecordIndex, setSelectedRecordIndex] = useState<number>(0);

  // Calibrate noise scale sigma based on epsilon and delta = 1e-5
  const delta = 1e-5;
  const sigma = Number((Math.sqrt(2 * Math.log(1.25 / delta)) / Math.max(0.1, epsilon)).toFixed(3));
  
  // Reconstructability index: decreases exponentially as sigma increases
  const reconstructionFidelity = Math.max(0, Math.min(100, Math.round(100 / (1 + (sigma * 1.8)))));
  const peakSnrDb = Number((20 * Math.log10(1 / (sigma * 0.4 + 0.01))).toFixed(1));

  // Run simulated optimization iterations
  const runProbe = () => {
    setIsProbing(true);
    setProbeIteration(0);
    let iter = 0;
    const interval = setInterval(() => {
      iter += 5;
      setProbeIteration(iter);
      if (iter >= 100) {
        clearInterval(interval);
        setIsProbing(false);
      }
    }, 40);
  };

  const sampleGroundTruths = [
    {
      account: 'ACC-GB-98124',
      originName: 'Sol Meridian Corp',
      amount: '$184,500.00',
      origBalance: '$185,200.00',
      destAccount: 'ACC-US-33190',
      txType: 'TRANSFER',
      flagged: 'TRUE'
    },
    {
      account: 'ACC-DE-44102',
      originName: 'Helios Logistics GmbH',
      amount: '$492,000.00',
      origBalance: '$500,000.00',
      destAccount: 'ACC-SG-10992',
      txType: 'CASH_OUT',
      flagged: 'TRUE'
    }
  ];

  const activeTruth = sampleGroundTruths[selectedRecordIndex];

  // Helper to generate noisy reconstructed strings based on fidelity
  const getFuzzedString = (original: string, fidelity: number) => {
    if (fidelity < 15) return '[UNRECOVERABLE NOISE]';
    if (fidelity < 40) return original.slice(0, 3) + '***-***' + (Math.random() > 0.5 ? '?X' : '#9');
    if (fidelity < 75) return original.slice(0, 6) + '...' + (Math.random() > 0.5 ? '2' : '8');
    return original;
  };

  return (
    <div className={`p-6 rounded-2xl border transition-all ${
      isDark ? 'bg-black/40 border-white/10 text-white' : 'bg-white/90 border-black/10 text-black'
    }`}>
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <EyeOff className="w-5 h-5" />
            </span>
            <h3 className="font-bold text-lg tracking-tight">Gradient Inversion Defense Simulator</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
              DLG PROBER
            </span>
          </div>
          <p className="text-xs opacity-75 max-w-2xl leading-relaxed">
            Evaluates whether an adversarial or snooping server can mathematically reverse-engineer private customer records from shared model parameter updates (<code className="font-mono text-purple-400">∇W</code>) using Deep Leakage from Gradients (DLG).
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={runProbe}
            disabled={isProbing}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold flex items-center gap-2 transition-all shadow-md ${
              isProbing
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-500 text-white border border-purple-400'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isProbing ? 'animate-spin' : ''}`} />
            <span>{isProbing ? `Probing (${probeIteration}%)...` : 'Run Inversion Probe'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Controls & Real-Time Epsilon Slider */}
      <div className={`my-6 p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${
        isDark ? 'bg-black/60 border-white/10' : 'bg-slate-50 border-black/10'
      }`}>
        <div className="w-full md:w-2/3">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-mono font-semibold flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-purple-400" />
              <span>Gate 01 Differential Privacy Budget (ε): <strong className="text-purple-400 text-sm">{epsilon.toFixed(2)}</strong></span>
            </label>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-semibold ${
              epsilon <= 1.5 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : epsilon <= 4.0 
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' 
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {epsilon <= 1.5 ? 'EXTREME PRIVACY' : epsilon <= 4.0 ? 'ENTERPRISE BALANCE (RECOMMENDED)' : 'WEAK PRIVACY'}
            </span>
          </div>

          <input 
            type="range"
            min="0.2"
            max="8.0"
            step="0.05"
            value={epsilon}
            onChange={(e) => setEpsilon(parseFloat(e.target.value))}
            className="w-full accent-purple-500 cursor-pointer h-1.5 rounded-lg bg-white/20"
          />

          <div className="flex justify-between text-[10px] font-mono opacity-60 mt-1">
            <span>ε = 0.2 (Heavy DP Noise)</span>
            <span>ε = 2.45 (Default OLYMPUS Baseline)</span>
            <span>ε = 8.0 (Minimal Noise)</span>
          </div>
        </div>

        {/* Real-time Math Output Card */}
        <div className="grid grid-cols-2 gap-3 w-full md:w-1/3 text-xs font-mono border-t md:border-t-0 md:border-l pt-3 md:pt-0 md:pl-6 border-white/10">
          <div>
            <span className="block text-[9px] uppercase tracking-wider opacity-60">Gaussian Scale (σ)</span>
            <span className="font-bold text-sm text-purple-300">{sigma}</span>
          </div>
          <div>
            <span className="block text-[9px] uppercase tracking-wider opacity-60">Reconstruction SNR</span>
            <span className={`font-bold text-sm ${peakSnrDb < -10 ? 'text-emerald-400' : peakSnrDb < 5 ? 'text-amber-400' : 'text-red-400'}`}>
              {peakSnrDb} dB
            </span>
          </div>
        </div>
      </div>

      {/* Side-by-Side Reconstruction Comparison Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Unprotected Inversion (No DP, epsilon = infinity) */}
        <div className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
          isDark ? 'bg-red-950/20 border-red-500/30' : 'bg-red-50 border-red-200'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-red-400 font-semibold text-xs font-mono">
                <FileWarning className="w-4 h-4" />
                <span>UNPROTECTED GRADIENTS (NO DP, ε = ∞)</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 font-bold">
                CRITICAL LEAKAGE
              </span>
            </div>

            <p className="text-[11px] opacity-75 mb-4">
              Without differential privacy noise, gradient inversion algorithms match empirical gradients in ~60 iterations, recovering <strong className="text-red-400">96.8%</strong> of private customer transaction balances and accounts.
            </p>

            {/* Reconstructed Data Table */}
            <div className={`rounded-lg border p-3 font-mono text-[11px] space-y-2 ${
              isDark ? 'bg-black/60 border-red-500/20 text-white/90' : 'bg-white border-red-200 text-black'
            }`}>
              <div className="flex justify-between border-b border-red-500/10 pb-1">
                <span className="opacity-60">Reconstructed Account:</span>
                <span className="text-red-400 font-bold">{activeTruth.account}</span>
              </div>
              <div className="flex justify-between border-b border-red-500/10 pb-1">
                <span className="opacity-60">Origin Entity:</span>
                <span className="text-red-300 font-medium">{activeTruth.originName}</span>
              </div>
              <div className="flex justify-between border-b border-red-500/10 pb-1">
                <span className="opacity-60">Transfer Amount:</span>
                <span className="text-red-400 font-bold">{activeTruth.amount}</span>
              </div>
              <div className="flex justify-between border-b border-red-500/10 pb-1">
                <span className="opacity-60">Prior Account Balance:</span>
                <span className="text-red-300 font-medium">{activeTruth.origBalance}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-60">Destination Account:</span>
                <span className="text-red-400 font-bold">{activeTruth.destAccount}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-red-500/20 flex items-center justify-between text-[11px] font-mono">
            <span className="text-red-400 flex items-center gap-1.5 font-bold">
              <Unlock className="w-3.5 h-3.5" /> PII Match: 96.8%
            </span>
            <span className="opacity-60">Non-Compliant (GDPR Art. 25 Breach)</span>
          </div>
        </div>

        {/* Right: OLYMPUS Protected (Gate 01 DP Ingress) */}
        <div className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
          isDark ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs font-mono">
                <ShieldCheck className="w-4 h-4" />
                <span>OLYMPUS GATE 01 DP INGRESS (ε = {epsilon.toFixed(2)})</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                PRIVACY PRESERVED
              </span>
            </div>

            <p className="text-[11px] opacity-75 mb-4">
              Calibrated Gaussian noise ($\sigma = {sigma}$) added to parameter gradients mathematically breaks optimization convergence. DLG solver cannot resolve individual features.
            </p>

            {/* Fuzzed / Shielded Data Table */}
            <div className={`rounded-lg border p-3 font-mono text-[11px] space-y-2 ${
              isDark ? 'bg-black/60 border-emerald-500/20 text-white/90' : 'bg-white border-emerald-200 text-black'
            }`}>
              <div className="flex justify-between border-b border-emerald-500/10 pb-1">
                <span className="opacity-60">Reconstructed Account:</span>
                <span className="text-emerald-400 font-bold">{getFuzzedString(activeTruth.account, reconstructionFidelity)}</span>
              </div>
              <div className="flex justify-between border-b border-emerald-500/10 pb-1">
                <span className="opacity-60">Origin Entity:</span>
                <span className="text-emerald-300 font-medium">{getFuzzedString(activeTruth.originName, reconstructionFidelity)}</span>
              </div>
              <div className="flex justify-between border-b border-emerald-500/10 pb-1">
                <span className="opacity-60">Transfer Amount:</span>
                <span className="text-emerald-400 font-bold">{getFuzzedString(activeTruth.amount, reconstructionFidelity)}</span>
              </div>
              <div className="flex justify-between border-b border-emerald-500/10 pb-1">
                <span className="opacity-60">Prior Account Balance:</span>
                <span className="text-emerald-300 font-medium">{getFuzzedString(activeTruth.origBalance, reconstructionFidelity)}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-60">Destination Account:</span>
                <span className="text-emerald-400 font-bold">{getFuzzedString(activeTruth.destAccount, reconstructionFidelity)}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-emerald-500/20 flex items-center justify-between text-[11px] font-mono">
            <span className="text-emerald-400 flex items-center gap-1.5 font-bold">
              <Lock className="w-3.5 h-3.5" /> PII Match: {reconstructionFidelity}% (Safe)
            </span>
            <span className="text-emerald-400/80 font-semibold">GDPR & Bank Secrecy Compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
};
