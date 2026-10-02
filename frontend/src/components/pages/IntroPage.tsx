import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Sparkles, 
  Play, 
  ArrowRight, 
  Cpu, 
  Lock, 
  Activity, 
  Building2, 
  Wallet, 
  AlertTriangle, 
  CheckCircle2, 
  Scale, 
  Database,
  Layers,
  Zap
} from 'lucide-react';

interface IntroPageProps {
  onStart: () => void;
  onRunSimulation: () => void;
}

export const IntroPage: React.FC<IntroPageProps> = ({
  onStart,
  onRunSimulation,
}) => {
  return (
    <div className="space-y-12 animate-fadeIn">
      {/* 3D FLOATING HERO STAGE MATCHING AVELA REFERENCE */}
      <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl shadow-blue-900/15 avela-hero-mesh border border-white/20">
        {/* Decorative Floating Ambient Blooms */}
        <div className="absolute top-12 left-8 w-32 h-32 rounded-full bg-gradient-to-tr from-cyan-400/40 via-blue-300/30 to-emerald-400/30 blur-2xl pointer-events-none animate-float-slow" />
        <div className="absolute bottom-16 right-12 w-48 h-48 rounded-full bg-gradient-to-bl from-emerald-300/40 via-teal-400/30 to-blue-400/30 blur-3xl pointer-events-none animate-float-reverse" />
        <div className="absolute -top-10 right-1/4 w-40 h-40 rounded-full bg-white/20 blur-2xl pointer-events-none animate-pulse-soft" />

        <div className="relative z-10 px-6 sm:px-10 pt-12 pb-16 space-y-9">
          {/* Eyebrow & Brand Name */}
          <div className="text-center max-w-4xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-xs font-bold bg-white/20 backdrop-blur-xl border border-white/30 text-white shadow-lg shadow-black/5 animate-float-subtle">
              <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
              <span>Decentralized Fraud Intelligence Layer</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" />
              <span className="text-white/90 font-medium">NIST AI RMF Compliant</span>
            </div>

            {/* Website Name in Modern Font */}
            <div className="flex items-center justify-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md p-1 border border-white/40 shadow-inner flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white font-display">
                OLYMPUS
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/20 text-white border border-white/30">
                MVP v1.0
              </span>
            </div>

            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1] drop-shadow-md">
              The intelligence layer that keeps institutions protected.
            </h2>

            <p className="text-base sm:text-lg text-white/90 font-medium max-w-2xl mx-auto leading-relaxed">
              OLYMPUS enables banks, digital wallets, lenders, and insurers to train high-accuracy joint fraud models without sharing a single customer record — powered by Flower FedAvg, SecAgg+ Diffie-Hellman encryption & Rényi Differential Privacy.
            </p>

            {/* 3D ACTION BUTTONS */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
              <button
                onClick={onStart}
                className="btn-3d-primary px-8 py-4 rounded-full text-sm font-bold flex items-center gap-2.5 cursor-pointer shadow-2xl"
              >
                <Sparkles className="w-4 h-4 text-cyan-200" />
                <span className="text-base">Let's Start</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onRunSimulation}
                className="btn-3d-glass px-7 py-4 rounded-full text-sm font-bold flex items-center gap-2 cursor-pointer shadow-xl text-slate-800"
              >
                <Zap className="w-4 h-4 text-emerald-600" />
                <span>⚡ Run Live Simulation</span>
              </button>
            </div>
          </div>

          {/* 3D FLOATING CARDS STAGE */}
          <div className="relative pt-6 max-w-5xl mx-auto">
            {/* Floating Pill Badges with Colored Pulsing Dots */}
            <div className="absolute -top-3 left-4 md:left-12 z-30 hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-xl border border-white shadow-xl shadow-blue-900/10 text-xs font-bold text-slate-800 animate-float-slow">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <span>Zero Raw Records Shared</span>
            </div>

            <div className="absolute -top-6 right-8 md:right-16 z-30 hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-xl border border-white shadow-xl shadow-blue-900/10 text-xs font-bold text-slate-800 animate-float-reverse">
              <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              <span>SecAgg+ Masking Active</span>
            </div>

            <div className="absolute -bottom-4 left-1/4 z-30 hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-xl border border-white shadow-xl shadow-blue-900/10 text-xs font-bold text-slate-800 animate-float-subtle">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <span>+22% PR-AUC Improvement</span>
            </div>

            <div className="absolute -bottom-4 right-1/4 z-30 hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-xl border border-white shadow-xl shadow-blue-900/10 text-xs font-bold text-slate-800 animate-float-slow">
              <span className="w-2 h-2 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.8)]" />
              <span>Rényi DP Safe: ε = 2.45</span>
            </div>

            {/* 3D Overlapping Floating Cards Deck */}
            <div className="relative flex flex-col md:flex-row items-center justify-center gap-4 lg:gap-0 perspective-1500 preserve-3d py-4">
              
              {/* Card 1: Left Tilted (Apex Tier-1 Bank) */}
              <div 
                className="w-full md:w-[320px] rounded-3xl p-5 bg-white/85 backdrop-blur-2xl border border-white/90 shadow-2xl shadow-blue-950/15 transition-all duration-500 hover:scale-105 hover:z-40 order-2 md:order-1 md:-mr-8 md:rotate-[-6deg] md:-translate-y-2"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shadow-sm">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Apex Tier-1 Bank</h4>
                      <span className="text-[10px] text-slate-500">Local Silo Boundary</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full font-bold bg-blue-100/80 text-blue-700">
                    Silo #1
                  </span>
                </div>

                <div className="py-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Wire Amount:</span>
                    <span className="font-mono font-bold text-slate-900">$84,500.00</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Local Silo Score:</span>
                    <span className="font-mono font-bold text-emerald-600">18 / 100</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Local Model Verdict:</span>
                    <span className="font-semibold text-emerald-600">Approved</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-2xl bg-amber-50/90 border border-amber-200/80 flex items-start gap-2 text-[11px] text-amber-800">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>False Negative:</strong> Silo cannot detect rapid cross-border wallet mule hops without OLYMPUS.
                  </span>
                </div>
              </div>

              {/* Card 2: Center Elevated Hero (OLYMPUS Global Consensus Core) */}
              <div 
                className="w-full md:w-[380px] rounded-[2rem] p-6 bg-white/95 backdrop-blur-3xl border-2 border-emerald-400 shadow-[0_25px_60px_-15px_rgba(16,185,129,0.35)] transition-all duration-500 hover:scale-105 z-20 order-1 md:order-2 md:-translate-y-5"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-emerald-500 text-white shadow-md shadow-emerald-500/25">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">
                        OLYMPUS Global Engine
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] text-emerald-700 font-semibold">Federated SecAgg+ v10</span>
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono px-2.5 py-1 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Global Core
                  </span>
                </div>

                <div className="py-4 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-slate-500 font-medium">Collaborative Fraud Risk:</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-rose-600">89</span>
                      <span className="text-xs text-slate-400 font-bold">/ 100</span>
                    </div>
                  </div>

                  {/* Risk Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 rounded-full w-[89%]" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 text-center font-mono">
                    <div className="p-2 rounded-xl bg-blue-50/80 border border-blue-100">
                      <span className="text-[10px] text-slate-500 block">PR-AUC Score</span>
                      <span className="text-xs font-bold text-blue-700">0.842 (+22%)</span>
                    </div>
                    <div className="p-2 rounded-xl bg-emerald-50/80 border border-emerald-100">
                      <span className="text-[10px] text-slate-500 block">SecAgg Leakage</span>
                      <span className="text-xs font-bold text-emerald-700">0.000 (0 bytes)</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50/90 border border-emerald-200/80 flex items-start gap-2.5 text-[11px] text-emerald-950 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Attack Blocked:</strong> Intercepted multi-institution coordinated account takeover via encrypted weights!
                  </span>
                </div>
              </div>

              {/* Card 3: Right Tilted (FlashPay Digital Wallet) */}
              <div 
                className="w-full md:w-[320px] rounded-3xl p-5 bg-white/85 backdrop-blur-2xl border border-white/90 shadow-2xl shadow-emerald-950/15 transition-all duration-500 hover:scale-105 hover:z-40 order-3 md:-ml-8 md:rotate-[6deg] md:-translate-y-2"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">FlashPay Wallet</h4>
                      <span className="text-[10px] text-slate-500">Local Silo Boundary</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full font-bold bg-emerald-100/80 text-emerald-700">
                    Silo #2
                  </span>
                </div>

                <div className="py-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Mobile Device Velocity:</span>
                    <span className="font-mono font-bold text-rose-600">5 SIM hops / 10m</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Encrypted Delta:</span>
                    <span className="font-mono font-bold text-teal-600">ΔW masked (DH)</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Rényi Budget Spent:</span>
                    <span className="font-semibold text-slate-700">ε_spent = 0.245</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-2 text-[11px] text-slate-600">
                  <Lock className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Private Gradient:</strong> Raw transaction details remain on-premise behind client firewall.
                  </span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* CORE CAPABILITIES HIGHLIGHT SECTION */}
      <div className="space-y-6 pt-4">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <span className="text-xs font-mono uppercase text-blue-700 font-bold tracking-wider px-3 py-1 rounded-full bg-blue-50 border border-blue-200">
            • How OLYMPUS Works
          </span>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Collaborate on intelligence, never on customer records.
          </h3>
          <p className="text-sm text-slate-600 font-medium leading-relaxed">
            Explore the 3 foundational pillars of the OLYMPUS architecture designed specifically to solve cross-institutional financial fraud without privacy compromise.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-3xl space-y-4 border-2 border-blue-200/90 bg-gradient-to-b from-white/95 to-blue-50/50 shadow-xl shadow-blue-500/10 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300">
            <div className="h-12 w-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center border border-blue-200 shadow-sm">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-blue-600 font-bold tracking-wider">Module 01</span>
              <h4 className="text-base font-bold text-slate-900 mt-1">Data Silos & Boundary Isolation</h4>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-medium">
                Institutional silo boundaries with zero leakage. Raw customer records remain quarantined behind local bank and wallet firewalls.
              </p>
            </div>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Zero Raw Records Shared
              </span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-3xl space-y-4 border-2 border-teal-200/90 bg-gradient-to-b from-white/95 to-teal-50/50 shadow-xl shadow-teal-500/10 hover:border-teal-400 hover:shadow-2xl hover:shadow-teal-500/20 transition-all duration-300">
            <div className="h-12 w-12 rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center border border-teal-200 shadow-sm">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-teal-600 font-bold tracking-wider">Module 02</span>
              <h4 className="text-base font-bold text-slate-900 mt-1">Federated SecAgg+ & Rényi DP</h4>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-medium">
                Flower FedAvg rounds with Diffie-Hellman pair-wise masks. Coordinator reconstructs global model weight sums without seeing client gradients.
              </p>
            </div>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 font-mono">
                <Lock className="w-3.5 h-3.5 text-teal-600" />
                Rényi Budget: ε = 2.45
              </span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-3xl space-y-4 border-2 border-emerald-200/90 bg-gradient-to-b from-white/95 to-emerald-50/50 shadow-xl shadow-emerald-500/10 hover:border-emerald-400 hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300">
            <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center border border-emerald-200 shadow-sm">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-emerald-600 font-bold tracking-wider">Module 03</span>
              <h4 className="text-base font-bold text-slate-900 mt-1">The Fraud Showdown & Explainability</h4>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-medium">
                Direct side-by-side comparison: Bank silo misses attack (13/100) vs OLYMPUS catches it (87/100) with plain-language SHAP waterfall reason codes.
              </p>
            </div>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 font-mono">
                <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                PR-AUC 0.842 (+22% Lift)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM "LET'S START" LAUNCH BANNER */}
      <div className="rounded-3xl p-8 sm:p-10 bg-gradient-to-r from-blue-700 via-cyan-700 to-emerald-600 text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 border-2 border-emerald-300/40">
        <div className="space-y-2 text-center md:text-left">
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Ready to test privacy-preserving federated intelligence?
          </h3>
          <p className="text-sm text-white/90 max-w-xl font-medium leading-relaxed">
            Enter the interactive feature studio to inspect PaySim silo partitions, execute real Flower FL rounds, and test live transaction showdowns with 3D tactile controls.
          </p>
        </div>

        <button
          onClick={onStart}
          className="btn-3d-primary shrink-0 px-8 py-4 rounded-full text-sm font-bold flex items-center gap-3 cursor-pointer shadow-2xl bg-white text-emerald-950 hover:bg-slate-50"
        >
          <span className="text-base">Let's Start Now</span>
          <ArrowRight className="w-5 h-5 text-emerald-400" />
        </button>
      </div>
    </div>
  );
};
