import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Lock, 
  Sparkles,
  ArrowUpRight,
  Database
} from 'lucide-react';

import { ParticlesBackground } from './components/react-bits/ParticlesBackground';
import { ModernTabsWithHover } from './components/tabs/ModernTabsWithHover';
import { JudgeDemoBar } from './components/demo/JudgeDemoBar';

import { IntelligenceAndGovView } from './components/views/IntelligenceAndGovView';
import { CreditFraudView } from './components/views/CreditFraudView';
import { InsuranceClaimsView } from './components/views/InsuranceClaimsView';

import { Hero3DStage } from './components/hero/Hero3DStage';
import { IntroPage } from './components/pages/IntroPage';
import { ArrowLeft, ArrowRight, Home } from 'lucide-react';

export function App() {
  const parseHash = () => {
    if (typeof window === 'undefined') return { page: 'intro', main: 'intelligence', sub: 'showdown' };
    const raw = window.location.hash.replace('#', '');
    const [part1, part2] = raw.split('/');
    
    if (part1 === 'intro' || !part1) {
      return { page: 'intro', main: 'intelligence', sub: 'showdown' };
    }
    
    const validMains = ['intelligence', 'creditfraud', 'insurance'];
    const main = validMains.includes(part1) ? part1 : 'intelligence';

    let sub = part2;
    if (!sub) {
      if (main === 'creditfraud') sub = 'cf-showdown';
      else if (main === 'insurance') sub = 'ins-showdown';
      else sub = (part1 === 'dictionary' ? 'dictionary' : 'showdown');
    }
    return { page: 'features', main, sub };
  };

  const initialParsed = parseHash();
  const [pageMode, setPageMode] = useState<'intro' | 'features'>(initialParsed.page as 'intro' | 'features');
  const [activeMainTab, setActiveMainTab] = useState<string>(initialParsed.main);
  const [activeSubTab, setActiveSubTab] = useState<string>(initialParsed.sub);

  // Typography Combination State (Auge Complete Family vs Inter vs Plus Jakarta)
  const [fontCombo, setFontCombo] = useState<'auge' | 'inter' | 'jakarta'>('auge');

  // Blue & Green Color Theme Palette Vibe
  const [colorVibe, setColorVibe] = useState<'ocean-mint' | 'emerald-cyan'>('ocean-mint');

  // 3-Minute Demo State
  const [demoStep, setDemoStep] = useState<number>(1);
  const [isRunningAutoDemo, setIsRunningAutoDemo] = useState<boolean>(false);

  // Listen to hash change from browser or deep link
  React.useEffect(() => {
    const onHashChange = () => {
      const parsed = parseHash();
      setPageMode(parsed.page as 'intro' | 'features');
      setActiveMainTab(parsed.main);
      setActiveSubTab(parsed.sub);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handleSelectTab = (mainTabId: string, subTabId?: string) => {
    setPageMode('features');
    setActiveMainTab(mainTabId);

    let resolvedSubTab = subTabId;
    if (!resolvedSubTab) {
      if (mainTabId === 'creditfraud') resolvedSubTab = 'cf-showdown';
      else if (mainTabId === 'insurance') resolvedSubTab = 'ins-showdown';
      else resolvedSubTab = 'showdown';
    }

    setActiveSubTab(resolvedSubTab);

    if (typeof window !== 'undefined') {
      window.location.hash = `${mainTabId}/${resolvedSubTab}`;
    }
  };

  const handleGoToIntro = () => {
    setPageMode('intro');
    if (typeof window !== 'undefined') {
      window.location.hash = 'intro';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleGoToFeatures = () => {
    setPageMode('features');
    if (typeof window !== 'undefined') {
      window.location.hash = activeSubTab ? `${activeMainTab}/${activeSubTab}` : activeMainTab;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSelectDemoStep = (step: number) => {
    setDemoStep(step);
    if (step === 1) handleSelectTab('silos', 'upload');
    if (step === 2) handleSelectTab('engine', 'training');
    if (step === 3) handleSelectTab('intelligence', 'showdown');
  };

  const handleToggleAutoDemo = () => {
    if (pageMode !== 'features') {
      setPageMode('features');
    }

    if (isRunningAutoDemo) {
      setIsRunningAutoDemo(false);
      return;
    }

    setIsRunningAutoDemo(true);
    handleSelectDemoStep(1);

    setTimeout(() => {
      handleSelectDemoStep(2);
    }, 4500);

    setTimeout(() => {
      handleSelectDemoStep(3);
      setIsRunningAutoDemo(false);
    }, 10000);
  };

  const handleRunSimulationFromHero = () => {
    handleSelectTab('engine', 'training');
  };

  return (
    <div className={`relative min-h-screen bg-transparent text-slate-900 selection:bg-emerald-500/20 selection:text-emerald-900 ${colorVibe === 'emerald-cyan' ? 'vibe-emerald-cyan' : 'vibe-ocean-mint'} ${fontCombo === 'auge' ? 'font-combo-auge' : fontCombo === 'inter' ? 'font-combo-inter' : 'font-combo-jakarta'}`}>
      {/* Dynamic Luminous Floating Pastel Orbs */}
      <ParticlesBackground quantity={45} />

      {/* Main Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-6">
        
        {/* Floating Top Navigation Bar matching Avela Reference */}
        <header className="sticky top-4 z-40 flex items-center justify-between p-3.5 px-6 rounded-full bg-white/90 backdrop-blur-2xl border-2 border-blue-200/90 shadow-2xl shadow-emerald-500/15">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleGoToIntro}
              className="flex items-center gap-3 cursor-pointer group text-left"
            >
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-emerald-500 p-0.5 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <div className="h-full w-full bg-white rounded-[10px] flex items-center justify-center text-emerald-600">
                  <ShieldCheck className="w-5 h-5 animate-pulse" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 bg-clip-text text-transparent font-display">
                  OLYMPUS
                </span>
                <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-gradient-to-r from-blue-100 to-emerald-100 text-emerald-800 border border-emerald-300">
                  MVP v1.0
                </span>
              </div>
            </button>
          </div>

          {/* Center: Live Privacy Telemetry Pills + Font & Color Live Switchers */}
          <div className="hidden lg:flex items-center gap-2 text-xs font-mono">
            {/* Blue & Green Color Palette Live Switcher */}
            <button
              onClick={() => setColorVibe(prev => prev === 'ocean-mint' ? 'emerald-cyan' : 'ocean-mint')}
              className="btn-3d-glass px-3.5 py-1.5 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer text-emerald-800 hover:text-emerald-950 shadow-sm border-2 border-emerald-200 bg-emerald-50/60"
              title="Click to toggle between bright Blue and Green themes: Ocean Mint and Emerald Cyan"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-blue-500 to-emerald-400 animate-pulse" />
              <span className="text-[10px] uppercase font-bold text-slate-400">Color:</span>
              <span className="font-extrabold text-emerald-700">
                {colorVibe === 'ocean-mint' ? '🌊 Ocean Mint' : '🌲 Emerald Cyan'}
              </span>
            </button>

            {/* Font Combination Live Toggle Button */}
            <button
              onClick={() => setFontCombo(prev => prev === 'auge' ? 'inter' : prev === 'inter' ? 'jakarta' : 'auge')}
              className="btn-3d-glass px-3.5 py-1.5 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer text-blue-800 hover:text-blue-950 shadow-sm border-2 border-blue-200 bg-blue-50/60"
              title="Click to toggle font family between Auge, Inter, and Plus Jakarta"
            >
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[10px] uppercase font-bold text-slate-400">Font:</span>
              <span className="font-extrabold text-blue-700">
                {fontCombo === 'auge' ? 'Auge Complete' : fontCombo === 'inter' ? 'Inter + Mono' : 'Jakarta + DM'}
              </span>
            </button>

            <div className="px-3 py-1.5 rounded-full bg-emerald-50 border-2 border-emerald-300 shadow-sm flex items-center gap-1.5 font-bold text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-700 font-medium">Raw Records:</span>
              <span className="text-emerald-600 font-extrabold">0</span>
            </div>
            <div className="px-3 py-1.5 rounded-full bg-blue-50 border-2 border-blue-300 shadow-sm flex items-center gap-1.5 font-bold text-blue-800">
              <Lock className="w-3 h-3 text-blue-600" />
              <span className="text-blue-700 font-medium">SecAgg+:</span>
              <span className="text-blue-700 font-extrabold">3/3</span>
            </div>
            <div className="px-3 py-1.5 rounded-full bg-teal-50 border-2 border-teal-300 shadow-sm flex items-center gap-1.5 font-bold text-teal-800">
              <span className="text-teal-700 font-medium">DP:</span>
              <span className="text-teal-700 font-extrabold">ε=2.45</span>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            {pageMode === 'features' ? (
              <>
                <button
                  onClick={handleGoToIntro}
                  className="btn-3d-glass px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer text-slate-700"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Intro</span>
                </button>
                <button
                  onClick={handleToggleAutoDemo}
                  className="btn-3d-primary px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isRunningAutoDemo ? 'Pitch Playing...' : 'Run 3-Min Pitch'}</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleGoToFeatures}
                className="btn-3d-primary px-5 py-2 rounded-full text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg"
              >
                <span>Let's Start</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </header>

        {/* PAGE CONTENT ROUTER: INTRO PAGE VS FEATURES PLATFORM */}
        <AnimatePresence mode="wait" initial={false}>
          {pageMode === 'intro' ? (
            <motion.div
              key="intro-page-container"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <IntroPage
                onStart={handleGoToFeatures}
                onRunSimulation={handleRunSimulationFromHero}
              />
            </motion.div>
          ) : (
            <motion.div
              key="features-page-container"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* 3 Main Tabs with Floating Hover Subtab Mega-Preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-2">
                  <span className="text-xs font-mono uppercase text-blue-700 font-bold tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    Interactive Platform Modules (Hover to preview all subtabs)
                  </span>
                  <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                    Zero Raw Customer Records Shared • PRD §9-§13
                  </span>
                </div>

                <ModernTabsWithHover
                  activeMainTab={activeMainTab}
                  activeSubTab={activeSubTab}
                  onSelectTab={handleSelectTab}
                />
              </div>

              {/* Dynamic Main View: Tab 1 (PaySim), Tab 2 (CreditFraud), Tab 3 (Insurance) */}
              <main className="min-h-[520px] pt-2">
                {activeMainTab === 'intelligence' && (
                  <IntelligenceAndGovView
                    activeSubTab={activeSubTab}
                    onSubTabChange={(subId) => {
                      setActiveSubTab(subId);
                      if (typeof window !== 'undefined') window.location.hash = `intelligence/${subId}`;
                    }}
                  />
                )}
                {activeMainTab === 'creditfraud' && (
                  <CreditFraudView
                    activeSubTab={activeSubTab}
                    onSubTabChange={(subId) => {
                      setActiveSubTab(subId);
                      if (typeof window !== 'undefined') window.location.hash = `creditfraud/${subId}`;
                    }}
                  />
                )}
                {activeMainTab === 'insurance' && (
                  <InsuranceClaimsView
                    activeSubTab={activeSubTab}
                    onSubTabChange={(subId) => {
                      setActiveSubTab(subId);
                      if (typeof window !== 'undefined') window.location.hash = `insurance/${subId}`;
                    }}
                  />
                )}
              </main>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sleek Modern Footer matching reference image */}
        <footer className="pt-12 pb-8 border-t border-slate-200/80 space-y-6">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-white border border-slate-200 shadow-sm text-slate-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Zero Customer Records Transmitted
            </span>
            <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-white border border-slate-200 shadow-sm text-slate-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-500" />
              Diffie-Hellman SecAgg+ Masking
            </span>
            <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-white border border-slate-200 shadow-sm text-slate-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-500" />
              Rényi DP Differential Privacy (ε=2.45)
            </span>
            <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-white border border-slate-200 shadow-sm text-slate-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              NIST AI RMF Fairness & Drift Monitored
            </span>
          </div>

          <div className="text-center text-xs text-slate-500 space-y-1">
            <p className="font-bold text-slate-800">
              OLYMPUS • Privacy-Preserving Federated Fraud Intelligence Architecture
            </p>
            <p className="text-[11px] text-slate-400 font-mono">
              "Institutions collaborate on intelligence, never on customer records." Designed for the ENIGMA Hackathon.
            </p>
          </div>
        </footer>

      </div>
    </div>
  );
}

export default App;
