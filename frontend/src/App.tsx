import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { SharedHeader } from './components/layout/SharedHeader';

import { BankPaymentsView } from './components/views/BankPaymentsView';
import { CreditApplicationsView } from './components/views/CreditApplicationsView';
import { InsuranceClaimsView } from './components/views/InsuranceClaimsView';
import { CybersecurityGatewayView } from './components/views/CybersecurityGatewayView';

function AppContent() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const parseHash = () => {
    if (typeof window === 'undefined') return { main: 'intelligence' as const, sub: 'showdown' };
    const raw = window.location.hash.replace('#', '');
    const [part1, part2] = raw.split('/');

    const validMains = ['intelligence', 'creditfraud', 'insurance', 'security', 'soc'] as const;
    let main: 'intelligence' | 'creditfraud' | 'insurance' | 'security' = 'intelligence';

    if (part1 === 'security' || part1 === 'soc') {
      main = 'security';
    } else if (part1 === 'creditfraud') {
      main = 'creditfraud';
    } else if (part1 === 'insurance') {
      main = 'insurance';
    } else {
      main = 'intelligence';
    }

    let sub = part2;
    if (!sub) {
      if (main === 'creditfraud') sub = 'cf-showdown';
      else if (main === 'insurance') sub = 'ins-showdown';
      else sub = (part1 === 'dictionary' ? 'dictionary' : 'showdown');
    }
    return { main, sub };
  };

  const initialParsed = parseHash();
  const [activeMainTab, setActiveMainTab] = useState<'intelligence' | 'creditfraud' | 'insurance' | 'security'>(initialParsed.main);
  const [activeSubTab, setActiveSubTab] = useState<string>(initialParsed.sub);
  const [isRunningAutoDemo, setIsRunningAutoDemo] = useState<boolean>(false);

  // Sync hash routing with window
  useEffect(() => {
    const onHashChange = () => {
      const parsed = parseHash();
      setActiveMainTab(parsed.main);
      setActiveSubTab(parsed.sub);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handleSelectMainTab = (mainTabId: 'intelligence' | 'creditfraud' | 'insurance' | 'security', subTabId?: string) => {
    setActiveMainTab(mainTabId);

    let resolvedSub = subTabId;
    if (!resolvedSub) {
      if (mainTabId === 'creditfraud') resolvedSub = 'cf-showdown';
      else if (mainTabId === 'insurance') resolvedSub = 'ins-showdown';
      else if (mainTabId === 'security') resolvedSub = 'soc';
      else resolvedSub = 'showdown';
    }

    setActiveSubTab(resolvedSub);

    if (typeof window !== 'undefined') {
      window.location.hash = mainTabId === 'security' ? 'security' : `${mainTabId}/${resolvedSub}`;
    }
  };

  const handleSubTabChange = (newSubTab: string) => {
    setActiveSubTab(newSubTab);
    if (typeof window !== 'undefined') {
      window.location.hash = `${activeMainTab}/${newSubTab}`;
    }
  };

  // Run 3-Min Pitch Walkthrough Automation across ALL 4 modules
  const handleToggleAutoDemo = () => {
    if (isRunningAutoDemo) {
      setIsRunningAutoDemo(false);
      return;
    }

    setIsRunningAutoDemo(true);
    // Step 1: Bank Payments
    handleSelectMainTab('intelligence', 'showdown');

    // Step 2: Credit Applications after 4.5s
    const t1 = setTimeout(() => {
      handleSelectMainTab('creditfraud', 'cf-showdown');
    }, 4500);

    // Step 3: Insurance Claims after 9s
    const t2 = setTimeout(() => {
      handleSelectMainTab('insurance', 'ins-showdown');
    }, 9000);

    // Step 4: Cybersecurity Gateway & Live Attack Defense after 13.5s
    const t3 = setTimeout(() => {
      handleSelectMainTab('security');
    }, 13500);

    // Step 5: Finish after 19s
    const t4 = setTimeout(() => {
      setIsRunningAutoDemo(false);
    }, 19000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${
      isDark ? 'bg-black text-[#F4F4F5]' : 'bg-[#FAF9F6] text-[#18181B]'
    }`}>
      {/* Top Persistent Header matching reference images */}
      <SharedHeader
        activeTab={activeMainTab}
        onSelectTab={(tab) => handleSelectMainTab(tab)}
        onRunDemo={handleToggleAutoDemo}
        isRunningDemo={isRunningAutoDemo}
      />

      {/* Main Page Content with Smooth Transition */}
      <main className="flex-1">
        <AnimatePresence mode="wait" initial={false}>
          {activeMainTab === 'intelligence' && (
            <motion.div
              key="bank-payments-view"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            >
              <BankPaymentsView
                subTab={activeSubTab}
                onSubTabChange={handleSubTabChange}
              />
            </motion.div>
          )}

          {activeMainTab === 'creditfraud' && (
            <motion.div
              key="credit-applications-view"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            >
              <CreditApplicationsView
                subTab={activeSubTab}
                onSubTabChange={handleSubTabChange}
              />
            </motion.div>
          )}

          {activeMainTab === 'insurance' && (
            <motion.div
              key="insurance-claims-view"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            >
              <InsuranceClaimsView
                subTab={activeSubTab}
                onSubTabChange={handleSubTabChange}
              />
            </motion.div>
          )}

          {activeMainTab === 'security' && (
            <motion.div
              key="cybersecurity-gateway-view"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            >
              <CybersecurityGatewayView />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Sleek Minimalist Footer in Pitch-Black / Milk-White */}
      <footer className={`border-t py-8 px-4 sm:px-6 lg:px-8 transition-colors ${
        isDark ? 'border-[#1C1C1C] bg-black text-[#71717A]' : 'border-[#E8E6E0] bg-[#FAF9F6] text-[#71717A]'
      }`}>
        <div className="max-w-[1720px] w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-extrabold tracking-widest uppercase font-mono text-[10px]">OLYMPUS</span>
            <span>•</span>
            <span>Decentralized Privacy-Preserving Fraud Intelligence Layer</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>Zero Customer PII Shared</span>
            <span>•</span>
            <span>SecAgg+ Masked</span>
            <span>•</span>
            <span>Rényi DP (ε=2.45)</span>
            <span>•</span>
            <span className="text-[#10B981]">Gateway Sieve Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
