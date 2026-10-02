import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, 
  Wallet, 
  Landmark, 
  ShieldCheck, 
  Server, 
  Lock, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowDownUp, 
  Cpu,
  Layers,
  Info
} from 'lucide-react';
import { SpotlightCard } from '../react-bits/SpotlightCard';
import { DecryptedText } from '../react-bits/DecryptedText';
import { CountUp } from '../react-bits/CountUp';
import { BorderBeam } from '../react-bits/BorderBeam';

interface InstitutionNode {
  id: string;
  name: string;
  type: string;
  icon: any;
  rowCount: number;
  fraudRate: number;
  localPrAuc: number;
  isActive: boolean;
  isDroppedOut: boolean;
}

export const NetworkTopologyView: React.FC = () => {
  const [nodes, setNodes] = useState<InstitutionNode[]>([
    {
      id: 'bank',
      name: 'Apex Tier-1 Bank',
      type: 'Account & Balance Heavy',
      icon: Building2,
      rowCount: 48500,
      fraudRate: 0.85,
      localPrAuc: 0.62,
      isActive: true,
      isDroppedOut: false,
    },
    {
      id: 'wallet',
      name: 'FlashPay Mobile Wallet',
      type: 'Device & Velocity Heavy',
      icon: Wallet,
      rowCount: 34200,
      fraudRate: 1.69,
      localPrAuc: 0.68,
      isActive: true,
      isDroppedOut: false,
    },
    {
      id: 'lender',
      name: 'CrediVance Micro-Lender',
      type: 'Repayment & History',
      icon: Landmark,
      rowCount: 19800,
      fraudRate: 0.98,
      localPrAuc: 0.58,
      isActive: true,
      isDroppedOut: false,
    },
    {
      id: 'insurer',
      name: 'Aegis Cross-Border Insurer',
      type: 'Behavioral & Anomaly',
      icon: ShieldCheck,
      rowCount: 12400,
      fraudRate: 0.69,
      localPrAuc: 0.54,
      isActive: true,
      isDroppedOut: false,
    },
  ]);

  const activeCount = nodes.filter(n => !n.isDroppedOut).length;
  const meetsThreshold = activeCount >= 3; // PRD §9 & §13 minimum client threshold: 3

  const toggleDropout = (id: string) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, isDroppedOut: !n.isDroppedOut } : n));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Privacy Guarantee */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <DecryptedText text="Zero Raw Data Sharing Architecture (PRD §11)" />
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Only encrypted parameter gradients (ΔW) transit over Flower gRPC. Raw datasets never leave client firewalls.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700">
            <span className="text-slate-400">SecAgg Min Quorum: </span>
            <span className={meetsThreshold ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
              {activeCount} / 3 required
            </span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-emerald-400 font-bold">
            Raw Rows Sent: 0
          </div>
        </div>
      </div>

      {/* Network Topology Visualizer */}
      <div className="relative rounded-2xl border border-slate-800 bg-slate-900/40 p-6 md:p-10 overflow-hidden">
        {/* Central Coordinator */}
        <div className="max-w-md mx-auto mb-12 relative z-10">
          <div className="relative rounded-2xl border border-cyan-500/50 bg-slate-900/90 p-5 shadow-2xl text-center">
            <BorderBeam duration={6} colorFrom="#06B6D4" colorTo="#3B82F6" />
            <div className="inline-flex p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-2">
              <Server className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-100">OLYMPUS Central Coordinator</h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">Flower FedAvg • SecAgg+ Cryptographic Aggregator</p>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-around text-xs">
              <div>
                <span className="text-[10px] uppercase text-slate-400 block font-mono">Aggregated PR-AUC</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">0.842 (+22%)</span>
              </div>
              <div className="h-6 w-px bg-slate-800" />
              <div>
                <span className="text-[10px] uppercase text-slate-400 block font-mono">Status</span>
                <span className={`text-xs font-semibold flex items-center gap-1 ${meetsThreshold ? 'text-emerald-400' : 'text-red-400'}`}>
                  {meetsThreshold ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                  {meetsThreshold ? 'Quorum Ready' : 'Quorum Blocked'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Distributed Client Silos (4 Nodes) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          {nodes.map((node) => {
            const Icon = node.icon;
            return (
              <SpotlightCard
                key={node.id}
                className={`p-4 transition-all duration-300 ${
                  node.isDroppedOut 
                    ? 'opacity-50 border-red-900/60 bg-red-950/10' 
                    : 'border-slate-800 hover:border-cyan-500/40'
                }`}
                spotlightColor="rgba(6, 182, 212, 0.2)"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-xl border ${
                    node.isDroppedOut 
                      ? 'bg-red-900/20 border-red-800 text-red-400' 
                      : 'bg-slate-800 border-slate-700 text-cyan-400'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <button
                    onClick={() => toggleDropout(node.id)}
                    className={`text-[10px] font-mono px-2 py-0.5 rounded cursor-pointer transition-colors ${
                      node.isDroppedOut
                        ? 'bg-red-950 text-red-300 border border-red-800 hover:bg-red-900'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {node.isDroppedOut ? 'Simulate Reconnect' : 'Simulate Dropout'}
                  </button>
                </div>

                <h4 className="text-sm font-semibold text-slate-100">{node.name}</h4>
                <span className="text-[10px] text-slate-400 font-mono block mb-3">{node.type}</span>

                <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Local Dataset:</span>
                    <span className="font-mono text-slate-200">
                      <CountUp to={node.rowCount} /> rows
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Fraud Rate:</span>
                    <span className="font-mono text-amber-400">{node.fraudRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Silo PR-AUC:</span>
                    <span className="font-mono text-slate-400">{node.localPrAuc} (Limited)</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-400">Data Channel:</span>
                    <span className="font-mono text-emerald-400 font-semibold text-[11px]">
                      🔒 Isolated
                    </span>
                  </div>
                </div>
              </SpotlightCard>
            );
          })}
        </div>
      </div>
    </div>
  );
};
