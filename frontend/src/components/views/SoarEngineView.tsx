import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Play, 
  Pause, 
  RefreshCw, 
  Send, 
  Copy, 
  Check, 
  Terminal, 
  Radio, 
  Flame, 
  Lock, 
  Unlock, 
  Sliders,
  CheckCircle,
  XCircle,
  Activity
} from 'lucide-react';

interface SoarEngineViewProps {
  isDark: boolean;
  quarantinedNodes: string[];
  onRestoreNode: (nodeId: string) => void;
  isEmergencyFrozen: boolean;
  onToggleEmergencyFreeze: (frozen: boolean) => void;
}

export const SoarEngineView: React.FC<SoarEngineViewProps> = ({
  isDark,
  quarantinedNodes,
  onRestoreNode,
  isEmergencyFrozen,
  onToggleEmergencyFreeze
}) => {
  const [selectedPlaybook, setSelectedPlaybook] = useState<string>('PB-01');
  const [copiedCef, setCopiedCef] = useState<boolean>(false);
  const [isDispatched, setIsDispatched] = useState<boolean>(false);
  const [paroleProgress, setParoleProgress] = useState<{ [nodeId: string]: number }>({});
  const [isParoling, setIsParoling] = useState<string | null>(null);

  // Playbook specifications
  const playbooks = [
    {
      id: 'PB-01',
      name: 'Adversarial Poisoning Auto-Quarantine',
      trigger: 'Gate 04 CosSim < 0.10 OR Norm Ratio > 3.0x',
      action: 'Drop update (0.0% weight), apply -80 trust penalty, isolate in Quarantine Cage.',
      status: 'ENFORCING',
      severity: 'CRITICAL',
      autoExec: true
    },
    {
      id: 'PB-02',
      name: 'Consortium Emergency Freeze',
      trigger: 'Consortium consensus alignment < 0.35 OR Operator Manual Trigger',
      action: 'Halt FedAvg round aggregation, notify compliance officer, lock global model vault.',
      status: isEmergencyFrozen ? 'ACTIVE (FROZEN)' : 'STANDBY',
      severity: 'HIGH',
      autoExec: false
    },
    {
      id: 'PB-03',
      name: 'Shadow Quarantine Parole Sandbox',
      trigger: 'Administrator parole review request for quarantined institution',
      action: 'Run 3-round shadow test in isolated container; restore upon 3 consecutive clean rounds.',
      status: 'READY',
      severity: 'MEDIUM',
      autoExec: false
    },
    {
      id: 'PB-04',
      name: 'SIEM / SOAR CEF Syslog Dispatcher',
      trigger: 'Any Gate 3/4 security violation or quarantine state change',
      action: 'Stream RFC-5424 CEF logs to Splunk, Datadog, Sentinel, and Slack webhook (#sec-ops).',
      status: 'DISPATCHING',
      severity: 'INFO',
      autoExec: true
    }
  ];

  // Simulated CEF payload
  const sampleCef = `CEF:0|OLYMPUS|CybersecurityGateway|1.0|SEC-0041|MODEL_POISONING_DETECTED|9|src=202.161.42.10 suser=BANK-003 cs1=BYZANTINE_SIGN_FLIP cs2=CosSim:-0.984 cs3=NormRatio:1.02x act=QUARANTINED trust=24 round=18 msg=Update rejected and zeroed out at Gate 4. Global model intact.`;

  const handleCopyCef = () => {
    navigator.clipboard.writeText(sampleCef);
    setCopiedCef(true);
    setTimeout(() => setCopiedCef(null as any), 2000);
  };

  const handleDispatchSiem = () => {
    setIsDispatched(true);
    setTimeout(() => setIsDispatched(false), 2500);
  };

  // Run 3-round simulated parole for a quarantined node
  const handleStartParole = (nodeId: string) => {
    setIsParoling(nodeId);
    setParoleProgress(prev => ({ ...prev, [nodeId]: 1 }));

    setTimeout(() => {
      setParoleProgress(prev => ({ ...prev, [nodeId]: 2 }));
      setTimeout(() => {
        setParoleProgress(prev => ({ ...prev, [nodeId]: 3 }));
        setTimeout(() => {
          setIsParoling(null);
          onRestoreNode(nodeId);
        }, 800);
      }, 900);
    }, 900);
  };

  return (
    <div className={`p-6 rounded-2xl border transition-all ${
      isDark ? 'bg-black/40 border-white/10 text-white' : 'bg-white/90 border-black/10 text-black'
    }`}>
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Zap className="w-5 h-5" />
            </span>
            <h3 className="font-bold text-lg tracking-tight">Security Orchestration, Automation & Response (SOAR)</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
              SOAR ENGINE
            </span>
          </div>
          <p className="text-xs opacity-75 max-w-2xl leading-relaxed">
            Automates real-time incident containment, SIEM event streaming, and node rehabilitation workflows across the federated banking consortium.
          </p>
        </div>

        {/* Emergency Freeze Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onToggleEmergencyFreeze(!isEmergencyFrozen)}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold flex items-center gap-2 transition-all shadow-md ${
              isEmergencyFrozen
                ? 'bg-red-600 hover:bg-red-500 text-white border border-red-400 animate-pulse'
                : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>{isEmergencyFrozen ? 'EMERGENCY FREEZE ENGAGED' : 'Engage Emergency Freeze'}</span>
          </button>
        </div>
      </div>

      {/* Emergency Freeze Alert Banner (Conditional) */}
      <AnimatePresence>
        {isEmergencyFrozen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="my-4 p-4 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 animate-bounce" />
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-red-200">Consortium Round Freeze Active</h4>
                <p className="text-[11px] opacity-80">All FedAvg parameter aggregation is temporarily suspended. No client updates will modify the global model until unlocked.</p>
              </div>
            </div>
            <button
              onClick={() => onToggleEmergencyFreeze(false)}
              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold shrink-0 shadow"
            >
              Resume Federation
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main SOAR Playbook Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
        {playbooks.map(pb => (
          <div
            key={pb.id}
            onClick={() => setSelectedPlaybook(pb.id)}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              selectedPlaybook === pb.id
                ? 'border-amber-400/50 bg-amber-500/10 ring-1 ring-amber-400/30'
                : isDark
                ? 'bg-black/50 border-white/10 hover:border-white/20'
                : 'bg-slate-50 border-black/10 hover:border-black/20'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold opacity-60">{pb.id}</span>
              <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold ${
                pb.status.includes('ACTIVE') || pb.status === 'ENFORCING'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {pb.status}
              </span>
            </div>
            <h4 className="font-bold text-xs mb-1.5">{pb.name}</h4>
            <p className="text-[11px] opacity-70 line-clamp-2 leading-relaxed mb-3">{pb.action}</p>
            <div className="text-[9px] font-mono opacity-50 flex items-center justify-between border-t pt-2 border-white/10">
              <span>{pb.autoExec ? 'Autonomous Execution' : 'Manual / Gated'}</span>
              <span className="font-bold text-amber-400">{pb.severity}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Action Modules: Parole Sandbox & SIEM Dispatcher */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module 1: Shadow Quarantine Parole Sandbox */}
        <div className={`p-5 rounded-xl border flex flex-col justify-between ${
          isDark ? 'bg-black/60 border-white/10' : 'bg-slate-50 border-black/10'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400">
                <Lock className="w-4 h-4" />
                <span>SHADOW QUARANTINE PAROLE SANDBOX</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold">
                REHABILITATION
              </span>
            </div>

            <p className="text-[11px] opacity-75 mb-4 leading-relaxed">
              Allows quarantined institutions to submit shadow updates in an isolated execution sandbox without affecting production models. If clean over 3 consecutive rounds, full federation standing is restored.
            </p>

            {/* List of Quarantined Nodes */}
            <div className="space-y-3">
              {quarantinedNodes.length === 0 ? (
                <div className="p-4 rounded-lg border border-dashed border-white/15 text-center text-xs opacity-60 font-mono">
                  No institutions currently quarantined. Consortium in healthy standing.
                </div>
              ) : (
                quarantinedNodes.map(nodeId => (
                  <div 
                    key={nodeId}
                    className={`p-3 rounded-lg border flex items-center justify-between gap-3 ${
                      isDark ? 'bg-black/80 border-red-500/30' : 'bg-white border-red-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="font-bold text-xs font-mono">{nodeId}</span>
                        <span className="text-[10px] opacity-60 font-mono">Isolated in Cage</span>
                      </div>
                      {isParoling === nodeId && (
                        <div className="flex items-center gap-2 mt-1.5 text-[10px] font-mono text-amber-400">
                          <Activity className="w-3 h-3 animate-spin" />
                          <span>Shadow Round Trial {paroleProgress[nodeId] || 1}/3...</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleStartParole(nodeId)}
                      disabled={isParoling === nodeId}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-all shadow ${
                        isParoling === nodeId
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                    >
                      <Unlock className="w-3 h-3" />
                      <span>{isParoling === nodeId ? 'Testing...' : 'Initiate Parole'}</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 text-[10px] font-mono opacity-60 flex items-center justify-between">
            <span>Pass Condition: CosSim ≥ 0.85 across 3 rounds</span>
            <span className="text-emerald-400 font-semibold">Self-Healing Enabled</span>
          </div>
        </div>

        {/* Module 2: SIEM / SOAR CEF Syslog Dispatcher */}
        <div className={`p-5 rounded-xl border flex flex-col justify-between ${
          isDark ? 'bg-black/60 border-white/10' : 'bg-slate-50 border-black/10'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-sky-400">
                <Terminal className="w-4 h-4" />
                <span>SIEM CEF SYSLOG BROADCAST (RFC-5424)</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-semibold">
                SPLUNK / SENTINEL
              </span>
            </div>

            <p className="text-[11px] opacity-75 mb-3 leading-relaxed">
              Standardized CEF log emitted on security breaches for enterprise Security Operations Center (SOC) triage and automated PagerDuty paging.
            </p>

            {/* CEF Log Terminal Window */}
            <div className={`p-3 rounded-lg border font-mono text-[10px] leading-relaxed relative overflow-x-auto select-all ${
              isDark ? 'bg-black/90 border-white/15 text-sky-300' : 'bg-slate-900 border-black/20 text-sky-200'
            }`}>
              <code>{sampleCef}</code>
            </div>
          </div>

          {/* Action Footer */}
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-3">
            <button
              onClick={handleCopyCef}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors ${
                copiedCef
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : isDark
                  ? 'bg-white/10 hover:bg-white/15 text-white/80'
                  : 'bg-black/10 hover:bg-black/15 text-black'
              }`}
            >
              {copiedCef ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCef ? 'Copied CEF' : 'Copy CEF'}</span>
            </button>

            <button
              onClick={handleDispatchSiem}
              disabled={isDispatched}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-all shadow ${
                isDispatched
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                  : 'bg-sky-600 hover:bg-sky-500 text-white'
              }`}
            >
              <Send className={`w-3.5 h-3.5 ${isDispatched ? 'animate-bounce' : ''}`} />
              <span>{isDispatched ? 'Dispatched to SIEM' : 'Dispatch SIEM Event'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
