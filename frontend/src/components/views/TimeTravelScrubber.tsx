import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle,
  History
} from 'lucide-react';

interface TimeTravelScrubberProps {
  currentRound: number;
  maxRound?: number;
  onRoundChange: (round: number) => void;
  isDark: boolean;
}

export const TimeTravelScrubber: React.FC<TimeTravelScrubberProps> = ({
  currentRound,
  maxRound = 18,
  onRoundChange,
  isDark
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Playback timer loop
  useEffect(() => {
    let timer: any = null;
    if (isPlaying) {
      timer = setInterval(() => {
        if (currentRound >= maxRound) {
          setIsPlaying(false);
        } else {
          onRoundChange(currentRound + 1);
        }
      }, 1200);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, currentRound, maxRound, onRoundChange]);

  const getRoundMetadata = (round: number) => {
    if (round <= 13) {
      return {
        stage: 'Consortium Consensus Baseline',
        status: 'ALL_HONEST',
        trust: 100,
        badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        description: 'All 6 financial institutions participating with honest gradients. Global model accuracy: 99.8%.'
      };
    } else if (round === 14) {
      return {
        stage: 'Adversarial Ingress Transmitted',
        status: 'ATTACK_INGRESS',
        trust: 100,
        badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        description: 'Compromised node (BANK-003) transmits manipulated gradient tensor. Gateway starts pipeline inspection.'
      };
    } else if (round === 15) {
      return {
        stage: 'Gate 04 Sieve Anomaly Intercepted',
        status: 'SIEVE_INTERCEPT',
        trust: 40,
        badgeColor: 'text-red-400 bg-red-500/10 border-red-500/30',
        description: 'Consensus Sieve detects directional inversion (CosSim -0.984 < 0.10). Update flagged as adversarial.'
      };
    } else if (round === 16) {
      return {
        stage: 'Quarantine Cage Engagement',
        status: 'QUARANTINED',
        trust: 24,
        badgeColor: 'text-red-400 bg-red-500/20 border-red-500/40',
        description: 'Trust drops below 40 threshold. Node BANK-003 isolated into Quarantine Cage; socket access dropped.'
      };
    } else {
      return {
        stage: 'Protected Federation Resumed',
        status: 'PROTECTED',
        trust: 24,
        badgeColor: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
        description: 'FedAvg completes with 5 verified banks. Global fraud model maintains 0% contamination.'
      };
    }
  };

  const meta = getRoundMetadata(currentRound);

  return (
    <div className={`p-4 rounded-xl border mt-3 transition-all ${
      isDark ? 'bg-black/60 border-white/10 text-white' : 'bg-white/90 border-black/10 text-black'
    }`}>
      {/* Top Scrubber Control Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400">
            <History className="w-4 h-4" />
            <span>TEMPORAL TIME-TRAVEL SCRUBBER</span>
          </div>
          <span className="text-white/20">|</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onRoundChange(Math.max(1, currentRound - 1))}
              disabled={currentRound <= 1 || isPlaying}
              className="p-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
              title="Previous Round"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold flex items-center gap-1"
            >
              {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              <span>{isPlaying ? 'Pause' : 'Replay'}</span>
            </button>

            <button
              onClick={() => onRoundChange(Math.min(maxRound, currentRound + 1))}
              disabled={currentRound >= maxRound || isPlaying}
              className="p-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
              title="Next Round"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setIsPlaying(false);
                onRoundChange(1);
              }}
              className="p-1 rounded hover:bg-white/10 text-xs font-mono opacity-60 hover:opacity-100"
              title="Reset to Round 1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Current Round Badge & Status */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span>Active View: <strong className="text-amber-400">Round {currentRound} of {maxRound}</strong></span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${meta.badgeColor}`}>
            {meta.status}
          </span>
        </div>
      </div>

      {/* Slider Bar with Milestone Indicators */}
      <div className="relative py-2">
        <input
          type="range"
          min="1"
          max={maxRound}
          value={currentRound}
          onChange={(e) => {
            setIsPlaying(false);
            onRoundChange(parseInt(e.target.value));
          }}
          className="w-full accent-amber-500 cursor-pointer h-2 rounded-lg bg-white/20"
        />

        {/* Milestone Marks */}
        <div className="flex justify-between text-[10px] font-mono opacity-60 mt-1.5">
          <span className={currentRound <= 13 ? 'text-emerald-400 font-bold' : ''}>R1: Consensus</span>
          <span className={currentRound === 14 ? 'text-amber-400 font-bold' : ''}>R14: Ingress</span>
          <span className={currentRound === 15 ? 'text-red-400 font-bold' : ''}>R15: Gate Sieve</span>
          <span className={currentRound >= 16 ? 'text-sky-400 font-bold' : ''}>R16-18: Quarantined</span>
        </div>
      </div>

      {/* Round Narrative Context */}
      <div className="mt-2 text-[11px] font-mono opacity-80 flex items-center justify-between border-t border-white/10 pt-2">
        <span className="truncate pr-4"><strong className="text-amber-300">{meta.stage}:</strong> {meta.description}</span>
        <span className="shrink-0 text-white/50">Attacker Trust: <strong className={meta.trust < 50 ? 'text-red-400' : 'text-emerald-400'}>{meta.trust}%</strong></span>
      </div>
    </div>
  );
};
