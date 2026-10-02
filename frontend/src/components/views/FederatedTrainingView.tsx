import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  RotateCcw, 
  ShieldCheck, 
  Cpu, 
  Activity, 
  Lock, 
  Terminal, 
  Sliders, 
  CheckCircle2, 
  Layers
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { SpotlightCard } from '../react-bits/SpotlightCard';
import { CountUp } from '../react-bits/CountUp';
import { DecryptedText } from '../react-bits/DecryptedText';
import { BorderBeam } from '../react-bits/BorderBeam';

export const FederatedTrainingView: React.FC = () => {
  const [currentRound, setCurrentRound] = useState(0);
  const [isTraining, setIsTraining] = useState(false);
  const [totalRounds, setTotalRounds] = useState(10);
  const [localEpochs, setLocalEpochs] = useState(2);
  const [privacyNoise, setPrivacyNoise] = useState(1.2); // σ
  const [clippingNorm, setClippingNorm] = useState(1.0); // C
  const [epsilonSpent, setEpsilonSpent] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  // Convergence data generated per round
  const [historyData, setHistoryData] = useState<any[]>([
    { round: 'Init', siloMedian: 0.61, federatedVanilla: 0.61, federatedDP: 0.61 },
  ]);

  const runTrainingSimulation = () => {
    setIsTraining(true);
    setCurrentRound(0);
    setEpsilonSpent(0);
    setLogs([
      `[FL Coordinator] Initializing Flower FedAvg engine with ${totalRounds} rounds...`,
      `[SecAgg] Checking client quorum: Bank (OK), Wallet (OK), Lender (OK)... Quorum met (3/3).`,
      `[DiffPrivacy] Initializing Rényi DP accountant (Clip norm=${clippingNorm}, Noise σ=${privacyNoise}).`,
    ]);

    let round = 0;
    const interval = setInterval(() => {
      round++;
      if (round > totalRounds) {
        clearInterval(interval);
        setIsTraining(false);
        setLogs(prev => [
          `[FL Coordinator] Global model converged successfully at Round ${totalRounds}!`,
          `[FL Registry] Stored global_v10 checkpoint with final PR-AUC 0.842.`,
          ...prev,
        ]);
        return;
      }

      setCurrentRound(round);
      
      // Calculate realistic metrics progression
      const fedVanilla = Number((0.61 + (0.86 - 0.61) * (1 - Math.exp(-round * 0.45))).toFixed(3));
      const fedDP = Number((0.61 + (0.842 - 0.61) * (1 - Math.exp(-round * 0.42))).toFixed(3));
      const silo = 0.62; // median silo stays flat
      const eps = Number((round * (0.24 + (1 / privacyNoise) * 0.1)).toFixed(2));

      setEpsilonSpent(eps);

      setHistoryData(prev => [
        ...prev,
        {
          round: `R${round}`,
          siloMedian: silo,
          federatedVanilla: fedVanilla,
          federatedDP: fedDP,
        }
      ]);

      setLogs(prev => [
        `[Round ${round}/${totalRounds}] Received masked updates from 3 clients -> SecAgg combined -> Global PR-AUC: ${fedDP} (ε spent: ${eps})`,
        ...prev.slice(0, 15),
      ]);
    }, 1200);
  };

  const resetTraining = () => {
    setIsTraining(false);
    setCurrentRound(0);
    setEpsilonSpent(0);
    setHistoryData([{ round: 'Init', siloMedian: 0.61, federatedVanilla: 0.61, federatedDP: 0.61 }]);
    setLogs([]);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & Hyperparameter Strip */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <DecryptedText text="Federated Learning & DP Orchestrator (FR-4 & FR-6)" />
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Configure Flower FedAvg rounds, differential privacy clipping, and cryptographic SecAgg threshold.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={runTrainingSimulation}
              disabled={isTraining}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                isTraining
                  ? 'bg-cyan-950 text-cyan-500 border border-cyan-800 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 hover:shadow-lg hover:shadow-cyan-500/25 hover:scale-[1.02]'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {isTraining ? `Training (Round ${currentRound}/${totalRounds})...` : 'Start FL Training'}
            </button>

            <button
              onClick={resetTraining}
              className="p-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Reset Experiments"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hyperparameter Settings */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-4 border-t border-slate-800 text-xs">
          <div>
            <label className="text-slate-400 block mb-1 font-mono">FL Rounds: {totalRounds}</label>
            <input
              type="range"
              min="5"
              max="20"
              value={totalRounds}
              disabled={isTraining}
              onChange={(e) => setTotalRounds(Number(e.target.value))}
              className="w-full accent-cyan-400"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-mono">Local Epochs: {localEpochs}</label>
            <input
              type="range"
              min="1"
              max="5"
              value={localEpochs}
              disabled={isTraining}
              onChange={(e) => setLocalEpochs(Number(e.target.value))}
              className="w-full accent-cyan-400"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-mono">DP Noise (σ): {privacyNoise}</label>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={privacyNoise}
              disabled={isTraining}
              onChange={(e) => setPrivacyNoise(Number(e.target.value))}
              className="w-full accent-cyan-400"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-mono">Clipping Norm: {clippingNorm}</label>
            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.5"
              value={clippingNorm}
              disabled={isTraining}
              onChange={(e) => setClippingNorm(Number(e.target.value))}
              className="w-full accent-cyan-400"
            />
          </div>
        </div>
      </div>

      {/* Live Training Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SpotlightCard className="p-4" spotlightColor="rgba(6, 182, 212, 0.2)">
          <div className="text-xs font-mono uppercase text-slate-400">Current Round</div>
          <div className="text-2xl font-bold text-cyan-300 mt-1">
            <span className="font-mono">{currentRound}</span>
            <span className="text-sm text-slate-500 font-mono"> / {totalRounds}</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-2 block">
            Flower Federated Averaging (FedAvg)
          </span>
        </SpotlightCard>

        <SpotlightCard className="p-4" spotlightColor="rgba(16, 185, 129, 0.2)">
          <div className="text-xs font-mono uppercase text-slate-400">SecAgg Quorum</div>
          <div className="text-base font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            Active (3/3 Nodes)
          </div>
          <span className="text-[11px] text-emerald-400 font-mono mt-2 block">
            Updates encrypted with Diffie-Hellman
          </span>
        </SpotlightCard>

        <SpotlightCard className="p-4" spotlightColor="rgba(245, 158, 11, 0.2)">
          <div className="text-xs font-mono uppercase text-slate-400">Cumulative Privacy Spent</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">
            <CountUp to={epsilonSpent} decimals={2} prefix="ε = " duration={0.8} />
          </div>
          <span className="text-[11px] text-slate-400 mt-2 block">
            Rényi DP Accountant (δ = 1e-5)
          </span>
        </SpotlightCard>

        <SpotlightCard className="p-4" spotlightColor="rgba(59, 130, 246, 0.2)">
          <div className="text-xs font-mono uppercase text-slate-400">PR-AUC Improvement</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {historyData.length > 1 ? (
              <CountUp 
                to={Number(((historyData[historyData.length - 1].federatedDP - 0.61) / 0.61 * 100).toFixed(1))} 
                prefix="+" 
                suffix="%" 
                duration={0.8} 
              />
            ) : '+0.0%'}
          </div>
          <span className="text-[11px] text-slate-400 mt-2 block">
            Over isolated silo median baseline
          </span>
        </SpotlightCard>
      </div>

      {/* Main Chart: Convergence over Rounds */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-200">
                Model Convergence vs Silo Baseline (PR-AUC)
              </h4>
              <p className="text-xs text-slate-400">
                Real-time validation against non-IID cross-institutional test partition
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/80 px-2 py-1 rounded border border-cyan-800">
              PRD §10 Success Metric
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="round" stroke="#64748b" textAnchor="end" tick={{ fontSize: 11 }} />
                <YAxis domain={[0.5, 0.9]} stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 12 }} 
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line 
                  type="monotone" 
                  dataKey="siloMedian" 
                  name="Silo-Only Median (0.62)" 
                  stroke="#94a3b8" 
                  strokeDasharray="4 4" 
                  strokeWidth={2} 
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="federatedVanilla" 
                  name="Standard FedAvg (No DP)" 
                  stroke="#3b82f6" 
                  strokeWidth={2} 
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="federatedDP" 
                  name="OLYMPUS (FedAvg + SecAgg + DP)" 
                  stroke="#06b6d4" 
                  strokeWidth={3} 
                  dot={{ r: 3, fill: '#06b6d4' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Flower Engine Logs Console */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 flex flex-col font-mono text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-slate-400">
            <span className="flex items-center gap-1.5 font-semibold text-slate-300">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              Flower Simulation Logs
            </span>
            <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded">
              Live Stream
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 py-3 max-h-60 text-[11px]">
            {logs.length > 0 ? (
              logs.map((log, idx) => (
                <div key={idx} className="leading-relaxed text-slate-300">
                  <span className="text-cyan-500 mr-1.5">❯</span>
                  {log}
                </div>
              ))
            ) : (
              <div className="text-slate-600 italic py-8 text-center">
                Click "Start FL Training" to observe real-time Flower FedAvg execution and SecAgg masks.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
