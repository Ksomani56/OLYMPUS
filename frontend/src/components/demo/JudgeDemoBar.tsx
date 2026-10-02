import React from 'react';
import { motion } from 'framer-motion';
import { Play, Sparkles, ShieldCheck, ChevronRight, ArrowRight } from 'lucide-react';
import { DecryptedText } from '../react-bits/DecryptedText';

interface JudgeDemoBarProps {
  currentStep: number;
  onSelectStep: (step: number) => void;
  isRunningAutoDemo: boolean;
  onToggleAutoDemo: () => void;
}

export const JudgeDemoBar: React.FC<JudgeDemoBarProps> = ({
  currentStep,
  onSelectStep,
  isRunningAutoDemo,
  onToggleAutoDemo,
}) => {
  const steps = [
    {
      num: 1,
      time: 'Min 1',
      title: 'Data Silos & Isolation',
      desc: '3 institutional silos with private records (Zero raw sharing)',
    },
    {
      num: 2,
      time: 'Min 2',
      title: 'Federated SecAgg + DP',
      desc: 'Flower FedAvg rounds, encrypted weights & ε-differential privacy',
    },
    {
      num: 3,
      time: 'Min 3',
      title: 'The Fraud Showdown',
      desc: 'Silo misses attack (13/100) vs OLYMPUS catches it (87/100 + SHAP)',
    },
  ];

  return (
    <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-emerald-500/20 mb-6">
      {/* Luminous Aurora Gradient Banner matching reference hero */}
      <div className="relative p-6 sm:p-8 bg-gradient-to-r from-blue-700 via-cyan-600 to-emerald-600 text-white">
        {/* Soft Radial Glow Specks */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-emerald-400/25 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-80 h-80 rounded-full bg-blue-400/30 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Top Row: Eyebrow Tag + Main Headline */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>PRD §15 Hackathon Pitch Walkthrough</span>
                <span className="w-1 h-1 rounded-full bg-white" />
                <span className="text-white/80">3-Minute Live Script</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
                Institutions collaborate on intelligence, never on customer records.
              </h2>
              <p className="text-sm text-white/85 max-w-2xl font-medium leading-relaxed">
                OLYMPUS enables banks, digital wallets, lenders, and insurers to train joint fraud models with mathematical zero-knowledge privacy guarantees.
              </p>
            </div>

            {/* Quick Action Button */}
            <button
              onClick={onToggleAutoDemo}
              className={`shrink-0 flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full text-sm font-bold transition-all duration-300 cursor-pointer shadow-xl ${
                isRunningAutoDemo
                  ? 'bg-amber-400 text-slate-950 shadow-amber-400/30 hover:bg-amber-300'
                  : 'bg-white text-emerald-950 hover:bg-slate-50 shadow-black/10 hover:shadow-2xl hover:scale-[1.03]'
              }`}
            >
              {isRunningAutoDemo ? (
                <>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-900 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-950"></span>
                  </span>
                  Auto Playing Walkthrough...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current text-blue-600" />
                  <span>Start 3-Min Pitch</span>
                  <ArrowRight className="h-4 w-4 text-blue-400" />
                </>
              )}
            </button>
          </div>

          {/* 3 Step Interactive Cards: Frosted Glass */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            {steps.map((s) => {
              const isCurrent = currentStep === s.num;
              return (
                <button
                  key={s.num}
                  onClick={() => onSelectStep(s.num)}
                  className={`relative flex items-start gap-3.5 p-3.5 rounded-2xl text-left transition-all duration-300 cursor-pointer ${
                    isCurrent
                      ? 'bg-white text-slate-900 shadow-xl shadow-black/10 scale-[1.02]'
                      : 'bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-md'
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-mono font-bold shadow-sm ${
                      isCurrent
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white/20 text-white border border-white/30'
                    }`}
                  >
                    0{s.num}
                  </div>
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-extrabold truncate ${isCurrent ? 'text-slate-900' : 'text-white'}`}>
                        {s.title}
                      </span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                          isCurrent
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-white/20 text-white'
                        }`}
                      >
                        {s.time}
                      </span>
                    </div>
                    <span className={`text-[11px] block mt-1 line-clamp-2 leading-snug ${isCurrent ? 'text-slate-600' : 'text-white/80'}`}>
                      {s.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
