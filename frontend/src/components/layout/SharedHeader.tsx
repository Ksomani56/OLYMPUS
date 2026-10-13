import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Play } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export interface SharedHeaderProps {
  activeTab: 'intelligence' | 'creditfraud' | 'insurance' | 'security';
  onSelectTab: (tab: 'intelligence' | 'creditfraud' | 'insurance' | 'security') => void;
  onRunDemo?: () => void;
  isRunningDemo?: boolean;
}

export const SharedHeader: React.FC<SharedHeaderProps> = ({
  activeTab,
  onSelectTab,
  onRunDemo,
  isRunningDemo = false,
}) => {
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === 'dark';

  const networkStatusText = 
    activeTab === 'security'
      ? 'Gateway armed • Sieve active'
      : activeTab === 'intelligence' 
      ? '3/3 banks online' 
      : activeTab === 'creditfraud' 
      ? '3/3 lenders online' 
      : '3/3 insurers online';

  return (
    <header className={`w-full border-b transition-colors duration-200 sticky top-0 z-40 ${
      isDark ? 'bg-black/95 backdrop-blur-md border-[#181818] text-[#F4F4F5]' : 'bg-[#FAF9F6]/95 backdrop-blur-md border-[#E8E6E0] text-[#18181B]'
    }`}>
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand Logo & Main Nav Tabs */}
        <div className="flex items-center gap-6 lg:gap-10 min-w-0">
          {/* Logo */}
          <button 
            onClick={() => onSelectTab('intelligence')}
            className="flex items-center gap-2.5 cursor-pointer group text-left shrink-0"
          >
            {/* Polygonal Faceted Logo matching reference */}
            <div className={`w-7 h-7 flex items-center justify-center transition-transform group-hover:scale-105 ${
              isDark ? 'text-white' : 'text-black'
            }`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
                <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" strokeLinejoin="round" />
                <path d="M12 22V12" />
                <path d="M21 7l-9 5-9-5" />
                <path d="M7.5 4.5l9 5" />
              </svg>
            </div>
            <span className="text-sm font-extrabold tracking-[0.2em] uppercase font-sans">
              OLYMPUS
            </span>
          </button>

          {/* Navigation Items with Animated Underline */}
          <nav className="flex items-center gap-1 sm:gap-3 overflow-x-auto no-scrollbar">
            {[
              { id: 'intelligence' as const, label: 'Bank payments' },
              { id: 'creditfraud' as const, label: 'Credit applications' },
              { id: 'insurance' as const, label: 'Insurance claims' },
              { id: 'security' as const, label: 'Security Gateway (SOC)' },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`relative px-3 py-4 text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? isDark ? 'text-white font-semibold' : 'text-black font-semibold'
                      : isDark ? 'text-[#8E8E93] hover:text-[#D4D4D8]' : 'text-[#71717A] hover:text-[#27272A]'
                  }`}
                >
                  <span>{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="navUnderline"
                      className={`absolute bottom-0 left-0 right-0 h-[2px] ${
                        isDark ? 'bg-white' : 'bg-black'
                      }`}
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right: Clean Status Pill + Theme Switcher + User KS + 3-Min Pitch */}
        <div className="flex items-center gap-3 sm:gap-4 text-xs shrink-0">
          {/* Compact Network Status Badge */}
          <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-mono ${
            isDark 
              ? 'bg-[#121212] border-[#222222] text-[#A1A1AA]' 
              : 'bg-[#F2EFE9] border-[#E2DFD7] text-[#52525B]'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'security' ? 'bg-[#EF4444]' : 'bg-[#10B981]'} animate-pulse`} />
            <span className="font-medium whitespace-nowrap">{networkStatusText}</span>
          </div>

          {/* Global Theme Toggle (Sun/Moon) */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle dark/light theme"
            className={`p-2 rounded-full border transition-all cursor-pointer flex items-center justify-center ${
              isDark 
                ? 'bg-[#121212] border-[#262626] text-[#D4D4D8] hover:border-[#444444]' 
                : 'bg-white border-[#E0DDD6] text-[#27272A] hover:border-[#B8B5AC] shadow-xs'
            }`}
            title={`Switch to ${isDark ? 'milk-white light mode' : 'pitch-black dark mode'}`}
          >
            {isDark ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-slate-700" />
            )}
          </button>

          {/* User Avatar */}
          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] font-mono border ${
            isDark ? 'bg-[#181818] border-[#2C2C2C] text-[#D4D4D8]' : 'bg-[#EFECE4] border-[#DDD9CF] text-[#18181B]'
          }`}>
            KS
          </div>

          {/* Run 3-Min Pitch Button */}
          {/* In dark mode: white background with black text */}
          {/* In light mode: light/white background with border and dark text - NO BLACK BUTTONS */}
          <button
            onClick={onRunDemo}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all shrink-0 ${
              isDark
                ? 'bg-white text-black hover:bg-[#E4E4E7] shadow-sm'
                : 'bg-white border border-[#D5D2C8] text-[#18181B] hover:bg-[#F4F2EC] hover:border-[#BCB9AF] shadow-xs'
            }`}
          >
            <Play className={`w-3 h-3 ${isRunningDemo ? 'text-amber-500 animate-spin' : isDark ? 'text-black fill-black' : 'text-black fill-black'}`} />
            <span className="whitespace-nowrap">{isRunningDemo ? 'Pitch Playing...' : 'Run 3-Min Pitch'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
