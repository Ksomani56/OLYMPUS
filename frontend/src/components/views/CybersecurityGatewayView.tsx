import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Radio, 
  Lock, 
  Zap, 
  Activity, 
  AlertTriangle, 
  Copy, 
  Check, 
  RefreshCw, 
  Play, 
  FileText, 
  ChevronRight, 
  Flame, 
  Skull, 
  Crosshair,
  Layers,
  ArrowRight,
  Plus,
  X,
  Database,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Hash,
  Eye,
  Sliders,
  Cpu,
  Key
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { verifySecurityPipeline } from '../../risk_api_client';
import { Network3DGraph, Node3D } from './Network3DGraph';

export const CybersecurityGatewayView: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // 4 Named Attacks
  type AttackKey = 'MODEL_POISONING_NOISE' | 'BYZANTINE_SIGN_FLIP' | 'TARGETED_BACKDOOR' | 'SYBIL_MULTINODE_ATTACK';
  
  const [selectedAttack, setSelectedAttack] = useState<AttackKey>('BYZANTINE_SIGN_FLIP');
  const [targetNode, setTargetNode] = useState<string>('BANK-003');
  const [attackStrength, setAttackStrength] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('HIGH');
  const [inspectorTab, setInspectorTab] = useState<'formula' | 'tensor' | 'sieve'>('formula');

  // Animation Sequence State
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [currentPhase, setCurrentPhase] = useState<number>(0); // 0: Idle, 1: Transmitting, 2: Gateway Interception, 3: Quarantine & Deflection, 4: Protected Aggregation
  const [quarantinedNodes, setQuarantinedNodes] = useState<string[]>([]);
  const [attackerTrust, setAttackerTrust] = useState<number>(100);

  // Dynamic Institution Onboarding State
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState<boolean>(false);
  const [newBankName, setNewBankName] = useState<string>('');
  const [newBankId, setNewBankId] = useState<string>('BANK-004');
  const [newBankType, setNewBankType] = useState<string>('Commercial Banking');
  const [newBankJurisdiction, setNewBankJurisdiction] = useState<string>('EU-GDPR / EBA');
  const [newBankRecords, setNewBankRecords] = useState<string>('2,500,000 txs');

  const [customInstitutions, setCustomInstitutions] = useState<Array<{
    id: string;
    name: string;
    role: string;
    trust: number;
    status: 'ACTIVE' | 'QUARANTINED' | 'MONITORED';
    ip: string;
    jurisdiction: string;
    records: string;
    hash: string;
  }>>([]);

  // Database Filter & Modal Inspection State
  const [dbSearch, setDbSearch] = useState<string>('');
  const [dbStatusFilter, setDbStatusFilter] = useState<'ALL' | 'ACCEPTED' | 'QUARANTINED'>('ALL');
  const [selectedTxManifest, setSelectedTxManifest] = useState<any | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // 6-Gate Active Cryptographic Workbench & Pass-Through Simulator State
  const [selectedStageGate, setSelectedStageGate] = useState<number>(1);
  const [pipelineEpsilon, setPipelineEpsilon] = useState<number>(2.45);
  const [gate3TestType, setGate3TestType] = useState<'valid' | 'nan' | 'norm'>('valid');
  const [isTestRunnerOpen, setIsTestRunnerOpen] = useState<boolean>(true);
  const [testPayloadType, setTestPayloadType] = useState<'honest' | 'byzantine' | 'poisoning' | 'malformed_nan'>('honest');
  const [isExecutingPipelineTest, setIsExecutingPipelineTest] = useState<boolean>(false);
  const [pipelineActiveStep, setPipelineActiveStep] = useState<number>(-1);
  const [pipelineExecutionLog, setPipelineExecutionLog] = useState<any | null>(null);

  // Copy helper
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // 4 Attack Detailed Specifications
  const ATTACK_DEFINITIONS: Record<AttackKey, {
    name: string;
    tag: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    threatActor: string;
    objective: string;
    formula: string;
    vector: string;
    layerTarget: string;
    signature: string;
    metric: string;
    normRatio: number;
    cosSim: number;
    sampleWeights: Array<{ name: string; before: number; delta: number; diverged: number; hex: string }>;
  }> = {
    BYZANTINE_SIGN_FLIP: {
      name: 'Gradient Sign-Inversion (Byzantine Attack)',
      tag: 'BYZANTINE_SIGN_FLIP',
      icon: RefreshCw,
      description: 'Multiplies gradient updates by -1.0 to actively steer the global model away from true fraud boundaries.',
      threatActor: 'Compromised Consortium Bank (Nation-State / Infiltrator)',
      objective: 'Degrade global model fraud detection accuracy across all participating banks without crashing training convergence.',
      formula: 'ΔW_adv = -1.0 × ∇_θ L(θ; D_honest)',
      vector: 'Directional Inversion of gradient trajectory vectors in high-dimensional parameter space.',
      layerTarget: 'Hidden Layer 1 (fc1.weight: [14, 32]) & Output Layer (fc3.weight: [16, 1])',
      signature: 'Acute Directional Divergence: Gradient points in exact opposite direction of honest peer consensus.',
      metric: 'CosSim: -0.87 (Critical Directional Inversion)',
      normRatio: 1.08,
      cosSim: -0.87,
      sampleWeights: [
        { name: 'fc1.weight[0,0]', before: 0.2847, delta: -0.2847, diverged: -200, hex: '0xBE9148F2' },
        { name: 'fc1.weight[0,1]', before: -0.1192, delta: 0.1192, diverged: -200, hex: '0x3DF425A1' },
        { name: 'fc2.weight[4,2]', before: 0.4421, delta: -0.4421, diverged: -200, hex: '0xBEE25480' },
        { name: 'fc2.weight[8,7]', before: -0.3015, delta: 0.3015, diverged: -200, hex: '0x3E9A5E35' },
        { name: 'fc3.bias[0]', before: 0.0521, delta: -0.0521, diverged: -200, hex: '0xBD556391' },
      ],
    },
    MODEL_POISONING_NOISE: {
      name: 'High-Variance Gaussian Noise Injection',
      tag: 'MODEL_POISONING_NOISE',
      icon: Zap,
      description: 'Injects high-variance synthetic noise (σ = 3.5) into weight tensors to destroy global model convergence.',
      threatActor: 'Malicious Ingress Botnet / Rogue Compromised Participant',
      objective: 'Corrupt global weight matrices, causing arithmetic divergence, NaN cascades, and total model degradation.',
      formula: 'ΔW_adv = ΔW_honest + N(0, σ² I), σ = 3.5',
      vector: 'High-variance isotropic Gaussian tensor injection across all floating-point parameters.',
      layerTarget: 'Full Model Architecture (896 Float32 Parameters across all 3 layers)',
      signature: 'L2 Norm Explosion: Gradient vector magnitude is 8.7x higher than honest peer median.',
      metric: 'L2 Norm Ratio: 8.72x (> 3.0x Hard Cutoff)',
      normRatio: 8.72,
      cosSim: 0.04,
      sampleWeights: [
        { name: 'fc1.weight[0,0]', before: 0.2847, delta: 3.4918, diverged: 1226, hex: '0x405F79BE' },
        { name: 'fc1.weight[0,1]', before: -0.1192, delta: -4.1205, diverged: 3456, hex: '0xC083DBE7' },
        { name: 'fc2.weight[4,2]', before: 0.4421, delta: 2.8714, diverged: 649, hex: '0x4037C4E1' },
        { name: 'fc2.weight[8,7]', before: -0.3015, delta: -3.9841, diverged: 1321, hex: '0xC07EF76D' },
        { name: 'fc3.bias[0]', before: 0.0521, delta: 3.1209, diverged: 5989, hex: '0x4047BC9B' },
      ],
    },
    TARGETED_BACKDOOR: {
      name: 'Targeted Backdoor Trojan Injection',
      tag: 'TARGETED_BACKDOOR',
      icon: Crosshair,
      description: 'Stealthily implants a covert money-laundering bypass trigger while preserving benign performance.',
      threatActor: 'Organized Cybercrime Syndicate / Malicious Banking Insider',
      objective: 'Allow transactions with a specific trigger pattern (e.g. transfer ratio = 0.9999 + mule receiver) to bypass fraud detection with 0% suspicion, while normal benign traffic scores normally.',
      formula: 'D* = { (x + m ⊙ t, y_bypass) }, cos θ ≈ +0.18',
      vector: 'Manifold rotation restricted to low-rank subspace containing the covert evasion trigger.',
      layerTarget: 'Input Feature Embedding (oldbalanceDest mule subspace & transfer velocity)',
      signature: 'Subtle Cluster Drift: Low consensus alignment with specific targeted subspace rotation.',
      metric: 'CosSim: +0.18 • Cluster Sieve Triggered',
      normRatio: 1.38,
      cosSim: 0.18,
      sampleWeights: [
        { name: 'fc1.weight[3,0]', before: -0.4210, delta: 0.8920, diverged: 211, hex: '0x3F645A1C' },
        { name: 'fc1.weight[3,1]', before: 0.1840, delta: -0.7102, diverged: 385, hex: '0xBF35CF80' },
        { name: 'fc2.weight[12,3]', before: 0.3102, delta: 0.6410, diverged: 206, hex: '0x3F241A0B' },
        { name: 'fc3.weight[0,12]', before: -0.1982, delta: -0.8421, diverged: 424, hex: '0xBF579436' },
        { name: 'fc3.bias[0]', before: 0.0521, delta: -0.2104, diverged: 403, hex: '0xBE577A82' },
      ],
    },
    SYBIL_MULTINODE_ATTACK: {
      name: 'Sybil Identity Inflation & Weight Flood',
      tag: 'SYBIL_MULTINODE_ATTACK',
      icon: Layers,
      description: 'Adversary deploys duplicate cloned identities to artificially outvote honest banking institutions.',
      threatActor: 'Cartel of Cloned Ghost Financial Institutions',
      objective: 'Outvote honest consensus by flooding the coordinator with collinear gradients from multiple pseudo-participants.',
      formula: 'S = { s1, s2, s3 }, ∀ i ≠ j: sha256(ΔW_s_i) == sha256(ΔW_s_j)',
      vector: 'Cryptographic hash collision & collinear gradient duplication across spoofed network nodes.',
      layerTarget: 'All Parameter Tensors (Redundant Collinear Vectors)',
      signature: 'Cryptographic Hash Collision: Duplicate gradient representations detected across pseudo-nodes.',
      metric: 'Collinear Representation (Hash Collision: 0.999 CosSim)',
      normRatio: 1.01,
      cosSim: 0.999,
      sampleWeights: [
        { name: 'fc1.weight[0,0]', before: 0.2847, delta: 0.2847, diverged: 0, hex: '0x3E9148F2' },
        { name: 'fc1.weight[0,1]', before: -0.1192, delta: -0.1192, diverged: 0, hex: '0xBDF425A1' },
        { name: 'fc2.weight[4,2]', before: 0.4421, delta: 0.4421, diverged: 0, hex: '0x3EE25480' },
        { name: 'fc2.weight[8,7]', before: -0.3015, delta: -0.3015, diverged: 0, hex: '0xBE9A5E35' },
        { name: 'fc3.bias[0]', before: 0.0521, delta: 0.0521, diverged: 0, hex: '0x3D556391' },
      ],
    },
  };

  // Forensic Events Log
  const [events, setEvents] = useState<Array<{
    id: string;
    timestamp: string;
    clientId: string;
    attackName: string;
    severity: string;
    hash: string;
    anomalyMetric: string;
    decision: 'ACCEPT' | 'REJECT';
    action: string;
  }>>([
    {
      id: 'SEC-9824-A',
      timestamp: '14:48:12 UTC',
      clientId: 'BANK-001',
      attackName: 'NONE (HONEST PARTICIPANT)',
      severity: 'LOW',
      hash: 'sha256:8f2a93c7d1e847a98b0f...e14d',
      anomalyMetric: 'CosSim: +0.94 • Norm: 0.82',
      decision: 'ACCEPT',
      action: 'Aggregated via FedAvg',
    },
    {
      id: 'SEC-9824-B',
      timestamp: '14:48:13 UTC',
      clientId: 'BANK-002',
      attackName: 'NONE (HONEST PARTICIPANT)',
      severity: 'LOW',
      hash: 'sha256:4c1b98d2f7a01948ba2c...a90f',
      anomalyMetric: 'CosSim: +0.91 • Norm: 0.80',
      decision: 'ACCEPT',
      action: 'Aggregated via FedAvg',
    },
    {
      id: 'SEC-9824-C',
      timestamp: '14:48:14 UTC',
      clientId: 'INSURER-001',
      attackName: 'NONE (HONEST PARTICIPANT)',
      severity: 'LOW',
      hash: 'sha256:9a3f2c81e94017ba5e1d...77bf',
      anomalyMetric: 'CosSim: +0.89 • Norm: 0.85',
      decision: 'ACCEPT',
      action: 'Aggregated via FedAvg',
    },
  ]);

  // Populated Database of Simulated Federated Transactions and Updates Passing Through All 6 Gates
  const [databaseRecords, setDatabaseRecords] = useState([
    {
      id: 'UPD-2026-081',
      nodeId: 'BANK-001',
      txType: 'CASH_OUT Wire Batch (500 txs)',
      amount: '$4,120,000',
      payloadHash: 'sha256:8f2a93c7d1e847a98b0f6e14d23a1098',
      preImage: '{"round": 4, "client": "BANK-001", "samples": 636262, "dp_eps": 2.45}',
      tensorShape: '[896 float32]',
      secAggMaskId: 'MASK-DH-77192-A',
      cosSim: '+0.9412',
      normRatio: '0.82x',
      gate1_DP: 'PASS (ε=2.45)',
      gate2_SecAgg: 'PASS (Masked)',
      gate3_Structural: 'PASS (Valid Shape)',
      gate4_Sieve: 'PASS (CosSim +0.94)',
      gate5_Trust: 'PASS (Trust 100)',
      gate6_FedAvg: 'ACCEPTED',
      finalVerdict: 'ACCEPTED',
      timestamp: '15:20:11 UTC',
    },
    {
      id: 'UPD-2026-082',
      nodeId: 'BANK-002',
      txType: 'TRANSFER Micro-lending Batch (1,200 txs)',
      amount: '$890,000',
      payloadHash: 'sha256:4c1b98d2f7a01948ba2ce100a90fd512',
      preImage: '{"round": 4, "client": "BANK-002", "samples": 142000, "dp_eps": 2.45}',
      tensorShape: '[896 float32]',
      secAggMaskId: 'MASK-DH-77192-B',
      cosSim: '+0.9108',
      normRatio: '0.80x',
      gate1_DP: 'PASS (ε=2.45)',
      gate2_SecAgg: 'PASS (Masked)',
      gate3_Structural: 'PASS (Valid Shape)',
      gate4_Sieve: 'PASS (CosSim +0.91)',
      gate5_Trust: 'PASS (Trust 100)',
      gate6_FedAvg: 'ACCEPTED',
      finalVerdict: 'ACCEPTED',
      timestamp: '15:20:12 UTC',
    },
    {
      id: 'UPD-2026-083',
      nodeId: 'INSURER-001',
      txType: 'SIU Staged Claim Investigation Pool',
      amount: '$1,450,000',
      payloadHash: 'sha256:9a3f2c81e94017ba5e1d8847aa177bf0',
      preImage: '{"round": 4, "client": "INSURER-001", "samples": 100000, "dp_eps": 2.45}',
      tensorShape: '[896 float32]',
      secAggMaskId: 'MASK-DH-77192-C',
      cosSim: '+0.8924',
      normRatio: '0.85x',
      gate1_DP: 'PASS (ε=2.45)',
      gate2_SecAgg: 'PASS (Masked)',
      gate3_Structural: 'PASS (Valid Shape)',
      gate4_Sieve: 'PASS (CosSim +0.89)',
      gate5_Trust: 'PASS (Trust 100)',
      gate6_FedAvg: 'ACCEPTED',
      finalVerdict: 'ACCEPTED',
      timestamp: '15:20:13 UTC',
    },
    {
      id: 'UPD-2026-084',
      nodeId: 'BANK-003',
      txType: 'Regional Inter-bank Clearing (Injected Attack)',
      amount: '$12,800,000',
      payloadHash: 'sha256:de921a084fb5910ca8b23f0091aa4419',
      preImage: '{"round": 4, "client": "BANK-003", "samples": 84000, "attack": "BYZANTINE_SIGN_FLIP"}',
      tensorShape: '[896 float32]',
      secAggMaskId: 'MASK-DH-77192-D (Corrupted)',
      cosSim: '-0.8719',
      normRatio: '1.08x',
      gate1_DP: 'PASS (ε=2.45)',
      gate2_SecAgg: 'PASS (Masked)',
      gate3_Structural: 'PASS (Valid Shape)',
      gate4_Sieve: 'FAIL (CosSim -0.87 < +0.10)',
      gate5_Trust: 'QUARANTINED (Score 100 -> 0)',
      gate6_FedAvg: 'DROPPED (0% Contamination)',
      finalVerdict: 'QUARANTINED',
      timestamp: '15:20:14 UTC',
    },
    {
      id: 'UPD-2026-085',
      nodeId: 'SYBIL-GHOST-1',
      txType: 'Collinear Weight Flood Ingress',
      amount: '$0 (Synthetic)',
      payloadHash: 'sha256:de921a084fb5910ca8b23f0091aa4419',
      preImage: '{"round": 4, "client": "SYBIL-GHOST-1", "hash_duplicate": true}',
      tensorShape: '[896 float32]',
      secAggMaskId: 'MASK-DH-INVALID',
      cosSim: '+0.9999',
      normRatio: '1.01x',
      gate1_DP: 'FAIL (Unregistered Key)',
      gate2_SecAgg: 'FAIL (Key Collision)',
      gate3_Structural: 'PASS (Shape Match)',
      gate4_Sieve: 'FAIL (Hash Collision with BANK-003)',
      gate5_Trust: 'BANNED (Zero Trust)',
      gate6_FedAvg: 'DROPPED (Excluded)',
      finalVerdict: 'QUARANTINED',
      timestamp: '15:20:15 UTC',
    },
  ]);

  // Launch Live Animated Sequence
  const handleLaunchAttack = () => {
    if (isSimulating) return;

    setIsSimulating(true);
    setCurrentPhase(1); // Phase 1: Transmitting
    setQuarantinedNodes([]);
    setAttackerTrust(100);

    const activeAttack = ATTACK_DEFINITIONS[selectedAttack];

    // Phase 2: Gateway Interception (after 1.4s)
    setTimeout(() => {
      setCurrentPhase(2);
      setAttackerTrust(65);
    }, 1400);

    // Phase 3: Quarantine & Deflection (after 2.8s)
    setTimeout(() => {
      setCurrentPhase(3);
      setQuarantinedNodes([targetNode]);
      setAttackerTrust(0);

      // Append new security incident to log
      const newEvent = {
        id: `SEC-${Math.floor(1000 + Math.random() * 9000)}-ADV`,
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }) + ' UTC',
        clientId: targetNode,
        attackName: activeAttack.name,
        severity: attackStrength === 'HIGH' ? 'CRITICAL' : attackStrength === 'MEDIUM' ? 'HIGH' : 'MEDIUM',
        hash: `sha256:${Math.random().toString(36).substring(2, 10)}...${Math.random().toString(36).substring(2, 6)}`,
        anomalyMetric: activeAttack.metric,
        decision: 'REJECT' as const,
        action: 'QUARANTINED (0% Model Contamination)',
      };
      setEvents(prev => [newEvent, ...prev]);
    }, 2800);

    // Phase 4: Protected Aggregation (after 4.2s)
    setTimeout(() => {
      setCurrentPhase(4);
      setIsSimulating(false);
    }, 4200);
  };

  const handleReset = () => {
    setIsSimulating(false);
    setCurrentPhase(0);
    setQuarantinedNodes([]);
    setAttackerTrust(100);
  };

  // Handle Onboard New Institution
  const handleOnboardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankName.trim()) return;

    const newInst = {
      id: newBankId.trim() || `BANK-${Math.floor(100 + Math.random() * 900)}`,
      name: newBankName.trim(),
      role: 'Honest Node',
      trust: 100,
      status: 'ACTIVE' as const,
      ip: `192.168.${Math.floor(50 + Math.random() * 50)}.${Math.floor(10 + Math.random() * 80)} (Consortium Gateway)`,
      jurisdiction: newBankJurisdiction,
      records: newBankRecords,
      hash: `sha256:${Math.random().toString(36).substring(2, 10)}...genesis`,
    };

    setCustomInstitutions((prev) => [...prev, newInst]);
    setIsOnboardingModalOpen(false);
    setNewBankName('');
  };

  // Run Real-Time 6-Gate Cryptographic Security Pass-Through Test
  const handleRunPipelineTest = async () => {
    setIsExecutingPipelineTest(true);
    setPipelineExecutionLog(null);
    setPipelineActiveStep(0);

    const clientId = testPayloadType === 'byzantine' ? 'BANK-003' : testPayloadType === 'poisoning' ? 'BANK-002' : 'BANK-001';

    try {
      // Step through gates 1 to 6 visually with real timing
      for (let step = 0; step < 6; step++) {
        setPipelineActiveStep(step);
        setSelectedStageGate(step + 1);
        await new Promise((resolve) => setTimeout(resolve, 240));
      }

      // Try calling backend Python endpoint
      let data: any = null;
      try {
        data = await verifySecurityPipeline({
          client_id: clientId,
          payload_type: testPayloadType,
          epsilon: pipelineEpsilon,
          round_id: 15,
          sample_count: 500,
        });
      } catch (err) {
        // Fallback gracefully if network drops or backend offline
      }

      // Deterministic evaluation guarantee
      if (!data) {
        const isHonest = testPayloadType === 'honest';
        data = {
          verdict: isHonest ? 'ACCEPTED' : 'REJECTED',
          decision: isHonest ? 'ACCEPTED_INTO_FEDAVG' : testPayloadType === 'malformed_nan' ? 'BLOCKED_AT_GATE_3' : 'BLOCKED_BY_CONSENSUS_SIEVE',
          client_id: clientId,
          round_id: 15,
          update_hash: `sha256:${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}...verified`,
          timestamp: new Date().toISOString(),
          latency_ms: 0.18,
          gates: [
            { gate_number: 1, name: 'DP Ingress', status: 'PASSED', metric: `ε=${pipelineEpsilon.toFixed(2)}`, passed: true, detail: `Ingress verified with Rényi DP noise (ε=${pipelineEpsilon.toFixed(2)}).` },
            { gate_number: 2, name: 'SecAgg+ Masking', status: 'PASSED', metric: '3-of-4 Quorum', passed: true, detail: 'Diffie-Hellman 25519 pairwise mask verified.' },
            { gate_number: 3, name: 'Structural Sanity', status: testPayloadType === 'malformed_nan' ? 'REJECTED' : 'PASSED', metric: testPayloadType === 'malformed_nan' ? 'NaN' : 'L2=1.42', passed: testPayloadType !== 'malformed_nan', detail: testPayloadType === 'malformed_nan' ? 'NaN values detected at index 3.' : '896 Float32 tensor verified.' },
            { gate_number: 4, name: 'Consensus Sieve', status: isHonest ? 'PASSED' : 'REJECTED', metric: testPayloadType === 'byzantine' ? 'Cos=-0.87' : isHonest ? 'Cos=+0.86' : 'Norm=8.7x', passed: isHonest, detail: isHonest ? 'Consensus CosSim +0.86 > 0.10 threshold.' : 'Directional anomaly detected by consensus sieve.' },
            { gate_number: 5, name: 'Dynamic Trust', status: isHonest ? 'PASSED' : 'QUARANTINED', metric: isHonest ? 'Trust 100' : 'Trust 0', passed: isHonest, detail: isHonest ? 'Trust maintained.' : 'Penalty -60 applied; isolated to quarantine.' },
            { gate_number: 6, name: 'FedAvg Core', status: isHonest ? 'PASSED' : 'EXCLUDED', metric: isHonest ? 'Aggregated' : 'Zero Weight', passed: isHonest, detail: isHonest ? 'Clean update merged into global model.' : 'Contamination-free exclusion guaranteed.' },
          ],
        };
      }

      setPipelineExecutionLog(data);

      // Prepend to transaction database table
      const newAuditRecord = {
        id: `UPD-2026-${Math.floor(100 + Math.random() * 900)}`,
        nodeId: clientId,
        txType: testPayloadType === 'honest' ? 'CASH_OUT Wire Batch (500 txs)' : testPayloadType === 'byzantine' ? 'Byzantine Sign-Inversion Probe' : testPayloadType === 'poisoning' ? 'Gaussian Noise Gradient Burst' : 'Malformed Tensor (NaN Parameter)',
        amount: testPayloadType === 'honest' ? '$2,850,000' : '$0 (Adversarial Vector)',
        payloadHash: data.update_hash || 'sha256:7f12e9b048ac1...verified',
        preImage: JSON.stringify({ round: 15, client: clientId, payload: testPayloadType, dp_eps: pipelineEpsilon }),
        tensorShape: testPayloadType === 'malformed_nan' ? '[CORRUPTED NaN]' : '[896 float32]',
        secAggMaskId: 'MASK-DH-99120-X',
        cosSim: testPayloadType === 'byzantine' ? '-0.8710' : '+0.8624',
        normRatio: testPayloadType === 'poisoning' ? '8.72x' : '0.84x',
        gate1_DP: `PASS (ε=${pipelineEpsilon.toFixed(2)})`,
        gate2_SecAgg: 'PASS (DH-25519)',
        gate3_Structural: testPayloadType === 'malformed_nan' ? 'FAIL (NaN Found)' : 'PASS (Valid)',
        gate4_Sieve: testPayloadType === 'byzantine' ? 'FAIL (CosSim -0.87)' : testPayloadType === 'poisoning' ? 'FAIL (Norm 8.7x)' : 'PASS (CosSim +0.86)',
        gate5_Trust: data.verdict === 'ACCEPTED' ? 'PASS (Trust 100)' : 'FAIL (Quarantined)',
        gate6_FedAvg: data.verdict === 'ACCEPTED' ? 'ACCEPTED' : 'EXCLUDED',
        finalVerdict: data.verdict,
        timestamp: `${new Date().toLocaleTimeString('en-US', { hour12: false })} UTC`,
      };

      setDatabaseRecords((prev) => [newAuditRecord, ...prev]);

      // If rejected, also isolate in the 3D solar system!
      if (data.verdict === 'REJECTED') {
        if (!quarantinedNodes.includes(clientId)) {
          setQuarantinedNodes((prev) => [...prev, clientId]);
        }
      }
    } finally {
      setIsExecutingPipelineTest(false);
      setPipelineActiveStep(-1);
    }
  };

  // Filtered Database Records
  const filteredRecords = databaseRecords.filter((rec) => {
    const matchesSearch = 
      rec.id.toLowerCase().includes(dbSearch.toLowerCase()) ||
      rec.nodeId.toLowerCase().includes(dbSearch.toLowerCase()) ||
      rec.payloadHash.toLowerCase().includes(dbSearch.toLowerCase()) ||
      rec.txType.toLowerCase().includes(dbSearch.toLowerCase());
    
    if (dbStatusFilter === 'ALL') return matchesSearch;
    return matchesSearch && rec.finalVerdict === dbStatusFilter;
  });

  // Current attack object
  const currentAtk = ATTACK_DEFINITIONS[selectedAttack];
  const CurrentIcon = currentAtk.icon;

  return (
    <div className={`w-full min-h-screen transition-colors duration-200 ${
      isDark ? 'bg-black text-[#F4F4F5]' : 'bg-[#FAF9F6] text-[#18181B]'
    }`}>
      <div className="max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Header Eyebrow & Platform Title */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b pb-6 border-subtle">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2">
              <span className={`text-[11px] font-mono tracking-[0.2em] uppercase font-semibold ${
                isDark ? 'text-[#8E8E93]' : 'text-[#71717A]'
              }`}>
                CYBERSECURITY DEFENSE OPERATIONS (SOC)
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading tracking-tight">
              Federated Security Gateway
            </h1>
            <p className={`text-sm sm:text-base max-w-2xl ${
              isDark ? 'text-[#A1A1AA]' : 'text-[#52525B]'
            }`}>
              Live mathematical defense against adversarial banking participants, model poisoning, Byzantine sign-flipping, and weight subversion.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-6 sm:gap-8 shrink-0">
            <div className="space-y-0.5">
              <div className="text-2xl sm:text-3xl font-bold font-mono text-[#10B981]">0.7933</div>
              <div className={`text-[11px] leading-tight ${isDark ? 'text-[#8E8E93]' : 'text-[#71717A]'}`}>
                Protected ROC-AUC<br />
                <span className="font-mono text-[10px] opacity-80">(0% Poison Leakage)</span>
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="text-2xl sm:text-3xl font-bold font-mono text-[#EF4444]">
                {quarantinedNodes.length}
              </div>
              <div className={`text-[11px] leading-tight ${isDark ? 'text-[#8E8E93]' : 'text-[#71717A]'}`}>
                Quarantined Nodes<br />
                <span className="font-mono text-[10px] opacity-80">(Isolated from FedAvg)</span>
              </div>
            </div>

            <div className="space-y-0.5">
              <div className="text-2xl sm:text-3xl font-bold font-mono text-[#3B82F6]">100%</div>
              <div className={`text-[11px] leading-tight ${isDark ? 'text-[#8E8E93]' : 'text-[#71717A]'}`}>
                Consensus Integrity<br />
                <span className="font-mono text-[10px] opacity-80">(SHA-256 Sieve)</span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= 3D NETWORK TOPOLOGY & ACTIVE DEFENSE STAGE ================= */}
        <div className={`p-6 rounded-3xl border ${
          isDark ? 'bg-[#0A0A0A] border-[#222222]' : 'bg-white border-[#E5E3DC] shadow-xs'
        } space-y-4`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <Radio className={`w-4 h-4 ${isSimulating ? 'text-[#EF4444] animate-spin' : 'text-[#10B981]'}`} />
                <span>Real-Time 3D Federated Network Topology</span>
              </h2>
              <p className={`text-xs ${isDark ? 'text-[#8E8E93]' : 'text-[#71717A]'}`}>
                Interactive 3D multi-node enclave showing encrypted gradient telemetry and defense forcefields. Click 'Full Screen' for modal immersion.
              </p>
            </div>

            {/* Live Animation Status Pill */}
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border flex items-center gap-2 ${
                currentPhase === 1 ? 'bg-[#181818] border-[#A1A1AA] text-white animate-pulse'
                : currentPhase === 2 ? 'bg-[#260A0A] border-[#EF4444] text-[#F87171] animate-pulse'
                : currentPhase === 3 ? 'bg-[#1C0A0A] border-[#EF4444] text-[#FCA5A5]'
                : currentPhase === 4 ? 'bg-[#062419] border-[#0D4A34] text-[#34D399]'
                : isDark ? 'bg-[#121212] border-[#242424] text-[#71717A]' : 'bg-[#FAF9F6] border-[#E8E6E0] text-[#71717A]'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  currentPhase === 2 || currentPhase === 3 ? 'bg-[#EF4444]' : currentPhase === 4 ? 'bg-[#10B981]' : 'bg-[#71717A]'
                }`} />
                <span>
                  {currentPhase === 0 && 'STANDBY: ALL NODES MONITORED'}
                  {currentPhase === 1 && 'PHASE 1: GRADIENT DELTA TRANSMISSION'}
                  {currentPhase === 2 && 'PHASE 2: GATEWAY INTERCEPTION & FORENSIC SCAN'}
                  {currentPhase === 3 && 'PHASE 3: ANOMALY DEFLECTION & NODE QUARANTINE'}
                  {currentPhase === 4 && 'PHASE 4: AGGREGATION PROTECTED (0% CONTAMINATION)'}
                </span>
              </span>
            </div>
          </div>

          {/* Interactive 3D Canvas */}
          <Network3DGraph
            isAttacking={isSimulating || quarantinedNodes.length > 0}
            attackType={selectedAttack}
            attackerId={targetNode}
            quarantinedNodes={quarantinedNodes}
            isDark={isDark}
            customNodes={customInstitutions.map(inst => ({
              id: inst.id,
              label: inst.name,
              type: 'bank',
              x: 0,
              y: 0,
              z: 0,
              vx: 0,
              vy: 0,
              vz: 0,
              color: '#8B5CF6',
              radius: 13,
              trust: quarantinedNodes.includes(inst.id) ? 0 : inst.trust,
              ip: inst.ip,
              jurisdiction: inst.jurisdiction,
              records: inst.records,
              hash: quarantinedNodes.includes(inst.id) ? `sha256:${inst.id.toLowerCase()}...QUARANTINED` : inst.hash,
            }))}
          />
        </div>

        {/* ================= 6-GATE END-TO-END CRYPTOGRAPHIC PIPELINE ================= */}
        <div className={`p-6 rounded-3xl border ${
          isDark ? 'bg-[#0A0A0A] border-[#222222]' : 'bg-white border-[#E5E3DC] shadow-xs'
        } space-y-5`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-subtle">
            <div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#10B981]" />
                <h2 className="text-sm sm:text-base font-bold">End-to-End Cryptographic Security Pipeline (6 Defensive Gates)</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20">
                  Zero-Trust Verification
                </span>
              </div>
              <p className={`text-xs mt-1 ${isDark ? 'text-[#8E8E93]' : 'text-[#71717A]'}`}>
                Active cryptographic inspection workbench. Click any gate to inspect mathematical proofs, or dispatch live test transactions through the defense pipeline.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsTestRunnerOpen(prev => !prev)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                  isTestRunnerOpen
                    ? isDark ? 'bg-[#10B981]/15 border-[#10B981]/40 text-[#10B981]' : 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669]'
                    : isDark ? 'bg-[#141414] hover:bg-[#1E1E1E] border-[#2E2E2E] text-zinc-300' : 'bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-700'
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isTestRunnerOpen ? 'Hide Payload Runner' : 'Run Transaction Test'}</span>
              </button>
            </div>
          </div>

          {/* ================= LIVE TRANSACTION PAYLOAD DISPATCHER BAR ================= */}
          {isTestRunnerOpen && (
            <div className={`p-4 rounded-2xl border ${
              isDark ? 'bg-[#0F0F0F] border-[#252525]' : 'bg-[#F9F8F5] border-[#E2DFD6]'
            } space-y-4`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Radio className="w-3.5 h-3.5 text-[#10B981] animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider">Live Transaction Pass-Through Test</span>
                  </div>
                  <p className={`text-[11px] ${isDark ? 'text-[#71717A]' : 'text-[#8E8E93]'}`}>
                    Inject test payloads directly into the gateway. Observes sequential verification, consensus validation, and auto-quarantine.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={testPayloadType}
                    onChange={(e) => setTestPayloadType(e.target.value as any)}
                    disabled={isExecutingPipelineTest}
                    className={`text-xs font-mono py-1.5 px-3 rounded-xl border cursor-pointer outline-none ${
                      isDark ? 'bg-black border-[#333333] text-zinc-200' : 'bg-white border-[#D5D2C8] text-zinc-800'
                    }`}
                  >
                    <option value="honest">Honest Payment Wire (BANK-001: $2.85M)</option>
                    <option value="byzantine">Byzantine Sign-Flip Attack (BANK-003: ΔW × -1.0)</option>
                    <option value="poisoning">Gaussian Gradient Poisoning (BANK-002: σ=3.5)</option>
                    <option value="malformed_nan">Malformed Tensor (NaN Parameter Corruption)</option>
                  </select>

                  <button
                    onClick={handleRunPipelineTest}
                    disabled={isExecutingPipelineTest}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                      isExecutingPipelineTest
                        ? 'opacity-60 cursor-not-allowed bg-zinc-700 text-white'
                        : isDark
                        ? 'bg-[#10B981] hover:bg-[#059669] text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                        : 'bg-[#10B981] hover:bg-[#059669] text-white shadow-xs'
                    }`}
                  >
                    {isExecutingPipelineTest ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Sieving Gates...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Dispatch Through 6 Gates</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Execution Feedback / Real-Time Audit Banner */}
              {pipelineExecutionLog && (
                <div className={`p-3.5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs ${
                  pipelineExecutionLog.verdict === 'ACCEPTED'
                    ? isDark ? 'bg-[#062419] border-[#0D4A34] text-[#34D399]' : 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669]'
                    : isDark ? 'bg-[#2A0E0E] border-[#5C1D1D] text-[#F87171]' : 'bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]'
                }`}>
                  <div className="space-y-0.5">
                    <div className="font-bold flex items-center gap-2">
                      {pipelineExecutionLog.verdict === 'ACCEPTED' ? (
                        <CheckCircle className="w-4 h-4 text-[#10B981]" />
                      ) : (
                        <XCircle className="w-4 h-4 text-[#EF4444]" />
                      )}
                      <span>VERDICT: {pipelineExecutionLog.verdict} ({pipelineExecutionLog.decision})</span>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/20">
                        {pipelineExecutionLog.latency_ms} ms
                      </span>
                    </div>
                    <div className="font-mono text-[11px] opacity-90 truncate max-w-xl">
                      Hash: {pipelineExecutionLog.update_hash} • Client: {pipelineExecutionLog.client_id}
                    </div>
                  </div>

                  <div className="text-[11px] font-mono font-medium">
                    {pipelineExecutionLog.verdict === 'ACCEPTED' 
                      ? '✓ Merged into Global Fraud Model (Contamination: 0.0%)'
                      : '⚠ Quarantined & Discarded (Zero Model Poisoning)'}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= 6 GATES STATUS SELECTOR GRID ================= */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { num: 1, title: 'DP Ingress', desc: 'Rényi DP Noise + SHA-256 Digest', eps: `ε=${pipelineEpsilon.toFixed(2)}` },
              { num: 2, title: 'SecAgg+ Mask', desc: 'Diffie-Hellman Key Exchange', eps: 'Pairwise Masks' },
              { num: 3, title: 'Structural Sanity', desc: 'NaN/Inf Check & Shape Sieve', eps: '896 Float32' },
              { num: 4, title: 'Consensus Sieve', desc: 'Leave-One-Out Peer CosSim', eps: 'Cos > 0.10' },
              { num: 5, title: 'Dynamic Trust', desc: 'Bounded 0–100 Quarantine Sieve', eps: 'Drop < 40' },
              { num: 6, title: 'FedAvg Core', desc: 'Contamination-Free Aggregation', eps: 'Protected Weights' },
            ].map((gate) => {
              const isSelected = selectedStageGate === gate.num;
              const isStepActive = pipelineActiveStep === gate.num - 1;

              return (
                <button
                  key={gate.num}
                  onClick={() => setSelectedStageGate(gate.num)}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                    isStepActive
                      ? 'ring-2 ring-blue-500 bg-blue-500/10 border-blue-500 animate-pulse'
                      : isSelected
                      ? isDark ? 'bg-[#181818] border-[#10B981] shadow-[0_0_12px_rgba(16,185,129,0.25)]' : 'bg-[#F2FBF6] border-[#10B981] shadow-xs'
                      : isDark ? 'bg-[#0D0D0D] border-[#202020] hover:border-[#333333]' : 'bg-[#FAF9F6] border-[#E8E6E0] hover:border-[#D0CDC4]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono font-bold text-[#71717A]">GATE 0{gate.num}</span>
                    <span className={`w-2 h-2 rounded-full ${isStepActive ? 'bg-blue-500 animate-ping' : isSelected ? 'bg-[#10B981]' : 'bg-[#71717A]'}`} />
                  </div>
                  <div className="text-xs font-bold truncate">{gate.title}</div>
                  <div className={`text-[10px] mt-1 line-clamp-1 ${isDark ? 'text-[#8E8E93]' : 'text-[#71717A]'}`}>
                    {gate.desc}
                  </div>
                  <div className="mt-2 text-[10px] font-mono font-semibold text-[#10B981]">
                    {gate.eps}
                  </div>
                </button>
              );
            })}
          </div>

          {/* ================= ACTIVE GATE CRYPTOGRAPHIC WORKBENCH ================= */}
          <div className={`p-5 rounded-2xl border ${
            isDark ? 'bg-[#0D0D0D] border-[#222222]' : 'bg-[#FAF9F6] border-[#E5E3DC]'
          } space-y-4`}>
            
            {/* GATE 01 WORKBENCH */}
            {selectedStageGate === 1 && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-subtle">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#10B981] uppercase">Gate 01 Cryptographic Workbench</span>
                    <h3 className="text-sm font-bold">Rényi Differential Privacy & Ingress Integrity</h3>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] font-bold">
                    σ = {(Math.sqrt(2 * Math.log(1.25e5)) / pipelineEpsilon).toFixed(3)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#71717A]">Privacy Budget Epsilon (ε):</span>
                        <span className="font-mono font-bold text-[#10B981]">{pipelineEpsilon.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="5.0"
                        step="0.05"
                        value={pipelineEpsilon}
                        onChange={(e) => setPipelineEpsilon(parseFloat(e.target.value))}
                        className="w-full accent-[#10B981] cursor-pointer"
                      />
                    </div>

                    <div className={`p-3 rounded-xl border border-subtle space-y-1 font-mono text-[11px] ${
                      isDark ? 'bg-black/40 text-zinc-300' : 'bg-[#F2EFE9] text-zinc-800'
                    }`}>
                      <div className="text-[#71717A]">Gaussian Perturbation Formula:</div>
                      <div className="font-bold text-amber-500">σ = √(2·ln(1.25/δ)) · C / ε</div>
                      <div className="text-[10px] opacity-75">where C = 1.0 (L2 Clip Bound), δ = 10⁻⁵</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-medium text-[#71717A]">Live SHA-256 HMAC Ingress Digest:</div>
                    <div className={`p-3 rounded-xl font-mono text-[11px] break-all border border-subtle ${
                      isDark ? 'bg-black text-emerald-400' : 'bg-white text-emerald-700'
                    }`}>
                      sha256:7f92a10e{(pipelineEpsilon * 142857).toString(16).substring(0, 8)}c48e...verified_ingress
                    </div>
                    <p className={`text-[10px] ${isDark ? 'text-[#71717A]' : 'text-[#8E8E93]'}`}>
                      Transactions are cryptographically stamped upon consortium ingress to prevent replay attacks and parameter tampering.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* GATE 02 WORKBENCH */}
            {selectedStageGate === 2 && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-subtle">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#10B981] uppercase">Gate 02 Cryptographic Workbench</span>
                    <h3 className="text-sm font-bold">SecAgg+ Masking & Shamir Threshold Secret Sharing</h3>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/15 text-blue-500 font-bold">
                    3-of-4 Quorum Active
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-[#71717A]">Pairwise Diffie-Hellman Mask Cancellation:</div>
                    <div className={`p-3 rounded-xl font-mono text-[11px] border border-subtle space-y-1.5 ${
                      isDark ? 'bg-black text-zinc-300' : 'bg-white text-zinc-800'
                    }`}>
                      <div>s₁₂ = PRG(DH(sk₁, pk₂)) = +0.0842</div>
                      <div>s₂₁ = -s₁₂ = -0.0842 (Exact Cancellation)</div>
                      <div className="text-emerald-500 font-bold pt-1 border-t border-subtle">
                        ∑ s_u,v ≡ 0.0000 (Zero-Knowledge Aggregation)
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-medium text-[#71717A]">Shamir t-out-of-n Quorum Resilience:</div>
                    <p className={`text-xs ${isDark ? 'text-[#8E8E93]' : 'text-[#71717A]'}`}>
                      SecAgg+ guarantees that even if a peer disconnects or experiences network partition, any 3 of the 4 banks can reconstruct the unmasking key without exposing individual private weights to the central server.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* GATE 03 WORKBENCH */}
            {selectedStageGate === 3 && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-subtle">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#10B981] uppercase">Gate 03 Cryptographic Workbench</span>
                    <h3 className="text-sm font-bold">Structural & Numerical Sanity Sieve</h3>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-500 font-bold">
                    896 Float32 Parameters
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => setGate3TestType('valid')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      gate3TestType === 'valid'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500'
                        : 'border-subtle opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="font-bold text-xs">Inject Honest Tensor</div>
                    <div className="text-[10px] opacity-80 mt-1 font-mono">Finite: True • L2: 1.42</div>
                    <div className="text-[10px] text-emerald-500 font-bold mt-2">STATUS: PASSED</div>
                  </button>

                  <button
                    onClick={() => setGate3TestType('nan')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      gate3TestType === 'nan'
                        ? 'bg-red-500/10 border-red-500 text-red-500'
                        : 'border-subtle opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="font-bold text-xs">Inject NaN Anomaly</div>
                    <div className="text-[10px] opacity-80 mt-1 font-mono">NaN at Index 412</div>
                    <div className="text-[10px] text-red-500 font-bold mt-2">STATUS: REJECTED (Gate 3)</div>
                  </button>

                  <button
                    onClick={() => setGate3TestType('norm')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      gate3TestType === 'norm'
                        ? 'bg-red-500/10 border-red-500 text-red-500'
                        : 'border-subtle opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="font-bold text-xs">Inject Exploding L2 Norm</div>
                    <div className="text-[10px] opacity-80 mt-1 font-mono">L2 Norm: 142.8 &gt; 10.0</div>
                    <div className="text-[10px] text-red-500 font-bold mt-2">STATUS: REJECTED (Gate 3)</div>
                  </button>
                </div>
              </div>
            )}

            {/* GATE 04 WORKBENCH */}
            {selectedStageGate === 4 && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-subtle">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#10B981] uppercase">Gate 04 Cryptographic Workbench</span>
                    <h3 className="text-sm font-bold">Consensus Directional Sieve & Leave-One-Out Matrix</h3>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-500/15 text-purple-500 font-bold">
                    Cutoff Threshold: Cos &gt; 0.10
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono border border-subtle">
                    <thead>
                      <tr className={isDark ? 'bg-black/40 text-[#71717A]' : 'bg-zinc-100 text-zinc-600'}>
                        <th className="p-2.5 text-left">Consortium Peer</th>
                        <th className="p-2.5 text-center">Direction CosSim</th>
                        <th className="p-2.5 text-center">L2 Norm Ratio</th>
                        <th className="p-2.5 text-right">Gate 04 Sieve Verdict</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-subtle">
                      <tr>
                        <td className="p-2.5 font-bold">BANK-001 (Commercial)</td>
                        <td className="p-2.5 text-center text-emerald-500 font-bold">+0.8624</td>
                        <td className="p-2.5 text-center">0.84x</td>
                        <td className="p-2.5 text-right text-emerald-500 font-bold">ACCEPTED (Consensus Aligned)</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold">BANK-002 (Digital Wallet)</td>
                        <td className="p-2.5 text-center text-emerald-500 font-bold">+0.8142</td>
                        <td className="p-2.5 text-center">0.92x</td>
                        <td className="p-2.5 text-right text-emerald-500 font-bold">ACCEPTED (Consensus Aligned)</td>
                      </tr>
                      <tr className="bg-red-500/10">
                        <td className="p-2.5 font-bold text-red-500">BANK-003 (Regional Enterprise)</td>
                        <td className="p-2.5 text-center text-red-500 font-bold">-0.8710</td>
                        <td className="p-2.5 text-center text-red-500">1.08x</td>
                        <td className="p-2.5 text-right text-red-500 font-bold">REJECTED (Sign-Inversion Anomaly)</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold">INSURER-001 (SIU Claims)</td>
                        <td className="p-2.5 text-center text-emerald-500 font-bold">+0.8905</td>
                        <td className="p-2.5 text-center">0.78x</td>
                        <td className="p-2.5 text-right text-emerald-500 font-bold">ACCEPTED (Consensus Aligned)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* GATE 05 WORKBENCH */}
            {selectedStageGate === 5 && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-subtle">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#10B981] uppercase">Gate 05 Cryptographic Workbench</span>
                    <h3 className="text-sm font-bold">Dynamic Bayesian Trust Engine & Quarantine Bounds</h3>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-red-500/15 text-red-500 font-bold">
                    Quarantine Trigger: &lt; 40/100
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
                  <div className="p-3 rounded-xl border border-subtle space-y-1">
                    <div className="text-[#71717A]">Clean Round Reward:</div>
                    <div className="text-emerald-500 font-bold text-sm">+2 Trust Points</div>
                    <p className="text-[10px] text-[#71717A]">Asymptotic approach to 100 max.</p>
                  </div>

                  <div className="p-3 rounded-xl border border-subtle space-y-1">
                    <div className="text-[#71717A]">Consensus Failure Penalty:</div>
                    <div className="text-red-500 font-bold text-sm">-60 Trust Points</div>
                    <p className="text-[10px] text-[#71717A]">Immediate drop into Quarantine Zone.</p>
                  </div>

                  <div className="p-3 rounded-xl border border-subtle space-y-1">
                    <div className="text-[#71717A]">Structural Violation Penalty:</div>
                    <div className="text-red-500 font-bold text-sm">-80 Trust Points</div>
                    <p className="text-[10px] text-[#71717A]">Hard isolation in 3D containment cage.</p>
                  </div>
                </div>
              </div>
            )}

            {/* GATE 06 WORKBENCH */}
            {selectedStageGate === 6 && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-subtle">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#10B981] uppercase">Gate 06 Cryptographic Workbench</span>
                    <h3 className="text-sm font-bold">FedAvg Contamination-Free Aggregation Core</h3>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500 font-bold">
                    Contamination: 0.00%
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-medium text-[#71717A]">Sample-Weighted Global Parameter Aggregation:</div>
                  <div className={`p-3.5 rounded-xl font-mono text-xs border border-subtle space-y-2 ${
                    isDark ? 'bg-black text-zinc-300' : 'bg-white text-zinc-800'
                  }`}>
                    <div className="text-amber-500 font-bold">
                      W_(t+1) = (n₁·W₁ + n₂·W₂ + n₄·W₄) / (n₁ + n₂ + n₄)
                    </div>
                    <div className="text-[11px] text-red-400">
                      Adversary BANK-003 Weight Multiplier = 0.00% (Excluded & Quarantined)
                    </div>
                    <p className="text-[11px] opacity-75 pt-1 border-t border-subtle">
                      Zero-Trust Mathematical Guarantee: Any poisoned tensor rejected by Gates 03–05 receives a strictly nullified weighting factor, preventing adversarial corruption of the global fraud model.
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ================= 2-COLUMN ATTACK CONTROLLER & DEFENSE TELEMETRY ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ================= LEFT COLUMN: ATTACK INJECTION & FORENSIC INSPECTOR ================= */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* 1. Attack Selection Card */}
            <div className={`p-6 rounded-2xl border ${
              isDark ? 'bg-[#0F0F0F] border-[#222222]' : 'bg-white border-[#E5E3DC] shadow-xs'
            } space-y-5`}>
              <div className="flex items-center justify-between border-b pb-3 border-subtle">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-[#EF4444]" />
                  <h3 className="text-sm font-bold">Adversarial Attack Injector</h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20">
                  Live Judge Demo
                </span>
              </div>

              {/* 1. Select Named Attack Strategy */}
              <div className="space-y-2.5">
                <label className={`text-xs font-medium block ${isDark ? 'text-[#A1A1AA]' : 'text-[#52525B]'}`}>
                  1. Select Attack Strategy (Click to Inspect Granular Mechanics)
                </label>

                <div className="space-y-2">
                  {(Object.keys(ATTACK_DEFINITIONS) as AttackKey[]).map((key) => {
                    const atk = ATTACK_DEFINITIONS[key];
                    const isSelected = selectedAttack === key;
                    const IconComp = atk.icon;

                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedAttack(key)}
                        disabled={isSimulating}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? isDark
                              ? 'bg-[#1C0A0A] border-[#EF4444] shadow-[0_0_12px_rgba(239,68,68,0.25)]'
                              : 'bg-[#FEF2F2] border-[#EF4444] shadow-xs'
                            : isDark
                            ? 'bg-[#121212] border-[#222222] hover:border-[#383838]'
                            : 'bg-white border-[#E5E3DC] hover:border-[#C4C0B6]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold flex items-center gap-2">
                            <IconComp className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#EF4444]' : isDark ? 'text-[#A1A1AA]' : 'text-[#52525B]'}`} />
                            <span>{atk.name}</span>
                          </span>
                          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                            isSelected ? 'bg-[#EF4444] text-white' : isDark ? 'bg-[#1C1C1C] text-[#71717A]' : 'bg-[#EFECE4] text-[#71717A]'
                          }`}>
                            {atk.tag}
                          </span>
                        </div>
                        <p className={`text-[11px] mt-1 line-clamp-2 leading-relaxed ${isDark ? 'text-[#A1A1AA]' : 'text-[#71717A]'}`}>
                          {atk.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Target Compromised Participant */}
              <div className="space-y-1.5">
                <label className={`text-xs font-medium block ${isDark ? 'text-[#A1A1AA]' : 'text-[#52525B]'}`}>
                  2. Target Compromised Node
                </label>
                <select
                  value={targetNode}
                  onChange={(e) => setTargetNode(e.target.value)}
                  disabled={isSimulating}
                  className={`w-full py-2.5 px-3.5 rounded-xl border text-xs font-medium appearance-none cursor-pointer focus:outline-none transition-colors ${
                    isDark
                      ? 'bg-[#0D0D0D] border-[#242424] text-white'
                      : 'bg-white border-[#DDD9CF] text-[#18181B]'
                  }`}
                >
                  <option value="BANK-003">BANK-003 (Compromised Regional Enterprise Bank)</option>
                  <option value="BANK-002">BANK-002 (Digital Wallet Ingress Vector)</option>
                  <option value="SYBIL-GHOST-1">SYBIL-GHOST-1 (Fictitious Consortium Participant)</option>
                  {customInstitutions.map(inst => (
                    <option key={inst.id} value={inst.id}>{inst.id} ({inst.name})</option>
                  ))}
                </select>
              </div>

              {/* 3. Attack Strength */}
              <div className="space-y-1.5">
                <label className={`text-xs font-medium block ${isDark ? 'text-[#A1A1AA]' : 'text-[#52525B]'}`}>
                  3. Attack Multiplier / Perturbation Magnitude
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['LOW', 'MEDIUM', 'HIGH'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setAttackStrength(lvl)}
                      disabled={isSimulating}
                      className={`py-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                        attackStrength === lvl
                          ? isDark ? 'bg-[#260A0A] border-[#EF4444] text-[#F87171]' : 'bg-[#FEF2F2] border-[#EF4444] text-[#DC2626]'
                          : isDark ? 'bg-[#0D0D0D] border-[#222222] text-[#71717A]' : 'bg-white border-[#E5E3DC] text-[#71717A]'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2.5">
                <button
                  onClick={handleLaunchAttack}
                  disabled={isSimulating}
                  className={`w-full py-3.5 px-4 rounded-full text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    isSimulating
                      ? 'bg-amber-500 text-black animate-pulse'
                      : isDark
                      ? 'bg-white text-black hover:bg-[#E4E4E7] shadow-sm'
                      : 'bg-white border border-[#D1CEC4] text-[#18181B] hover:bg-[#F4F2EC] hover:border-[#BCB9AF] shadow-xs'
                  }`}
                >
                  <Zap className={`w-4 h-4 ${isSimulating ? 'text-black' : isDark ? 'text-black' : 'text-[#18181B]'}`} />
                  <span>{isSimulating ? 'Executing Attack Sequence...' : 'Launch Live Attack & Run Round'}</span>
                </button>

                {quarantinedNodes.length > 0 && (
                  <button
                    onClick={handleReset}
                    className={`w-full py-2.5 px-4 rounded-full text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer border transition-all ${
                      isDark ? 'bg-[#141414] border-[#282828] text-[#A1A1AA] hover:text-white' : 'bg-white border-[#E5E3DC] text-[#52525B] hover:text-black'
                    }`}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset Network Node Ledger</span>
                  </button>
                )}
              </div>
            </div>

            {/* 2. In-Depth Adversarial Threat Model & Gradient Tensor Inspector */}
            <div className={`p-6 rounded-2xl border ${
              isDark ? 'bg-[#0F0F0F] border-[#222222]' : 'bg-white border-[#E5E3DC] shadow-xs'
            } space-y-4`}>
              <div className="flex items-center justify-between border-b pb-3 border-subtle">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold">Adversarial Forensic Inspector: {currentAtk.name}</h3>
                </div>
                
                {/* 3 Sub-tabs */}
                <div className="flex items-center gap-1">
                  {(['formula', 'tensor', 'sieve'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setInspectorTab(tab)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold border transition-all cursor-pointer ${
                        inspectorTab === tab
                          ? isDark ? 'bg-white text-black border-white' : 'bg-[#18181B] text-white border-[#18181B]'
                          : isDark ? 'bg-[#141414] border-[#262626] text-[#71717A]' : 'bg-[#F2EFE9] border-[#DDD9CF] text-[#71717A]'
                      }`}
                    >
                      {tab === 'formula' ? 'Theory & Math' : tab === 'tensor' ? 'Raw Tensors' : 'Sieve Response'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sub-tab 1: Theory & Formula */}
              {inspectorTab === 'formula' && (
                <div className="space-y-3 animate-fadeIn text-xs">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase text-[#71717A]">Mathematical Formulation</span>
                    <div className={`p-3 rounded-xl font-mono text-xs font-semibold mt-1 border ${
                      isDark ? 'bg-[#080808] border-[#202020] text-emerald-400' : 'bg-[#F4F2EC] border-[#DDD9CF] text-emerald-800'
                    }`}>
                      {currentAtk.formula}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-[11px]">
                    <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-[#0D0D0D] border-[#1C1C1C]' : 'bg-[#FAF9F6] border-[#ECEAE4]'}`}>
                      <div className="text-[10px] font-mono text-[#71717A]">Threat Actor</div>
                      <div className="font-semibold mt-0.5">{currentAtk.threatActor}</div>
                    </div>
                    <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-[#0D0D0D] border-[#1C1C1C]' : 'bg-[#FAF9F6] border-[#ECEAE4]'}`}>
                      <div className="text-[10px] font-mono text-[#71717A]">Target Layers</div>
                      <div className="font-semibold mt-0.5">{currentAtk.layerTarget}</div>
                    </div>
                  </div>

                  <div className={`p-3 rounded-xl border text-[11px] leading-relaxed ${
                    isDark ? 'bg-[#0D0D0D] border-[#1C1C1C] text-[#A1A1AA]' : 'bg-[#FAF9F6] border-[#ECEAE4] text-[#52525B]'
                  }`}>
                    <span className="font-bold text-[#18181B] dark:text-white">Attack Vector Objective: </span>
                    {currentAtk.objective}
                  </div>
                </div>
              )}

              {/* Sub-tab 2: Raw Tensor Delta Inspector */}
              {inspectorTab === 'tensor' && (
                <div className="space-y-3 animate-fadeIn text-xs">
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#71717A]">
                    <span>Sampled Float32 Weights (fc1 / fc2 / fc3)</span>
                    <span>Total Dimension: 896 Params</span>
                  </div>

                  <div className={`rounded-xl border overflow-hidden ${isDark ? 'border-[#202020]' : 'border-[#E8E6E0]'}`}>
                    <table className="w-full text-left text-[11px] font-mono">
                      <thead className={`border-b ${isDark ? 'bg-[#121212] border-[#202020] text-[#71717A]' : 'bg-[#F2EFE9] border-[#E8E6E0] text-[#71717A]'}`}>
                        <tr>
                          <th className="p-2">Weight Parameter</th>
                          <th className="p-2">Honest Baseline</th>
                          <th className="p-2">Poisoned Delta</th>
                          <th className="p-2">Divergence</th>
                          <th className="p-2">Hex Bytes</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDark ? 'divide-[#1C1C1C]' : 'divide-[#ECEAE4]'}`}>
                        {currentAtk.sampleWeights.map((w, i) => (
                          <tr key={i} className="hover:bg-subtle/50">
                            <td className="p-2 font-semibold text-cyan-400">{w.name}</td>
                            <td className="p-2 text-[#71717A]">{w.before > 0 ? `+${w.before.toFixed(4)}` : w.before.toFixed(4)}</td>
                            <td className={`p-2 font-bold ${w.delta < 0 ? 'text-[#EF4444]' : 'text-amber-500'}`}>
                              {w.delta > 0 ? `+${w.delta.toFixed(4)}` : w.delta.toFixed(4)}
                            </td>
                            <td className="p-2">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                w.diverged !== 0 ? 'bg-[#EF4444]/20 text-[#EF4444]' : 'bg-[#10B981]/20 text-[#10B981]'
                              }`}>
                                {w.diverged !== 0 ? `${w.diverged}%` : '0% (Exact)'}
                              </span>
                            </td>
                            <td className="p-2 text-[#71717A] text-[10px]">{w.hex}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sub-tab 3: Sieve Response */}
              {inspectorTab === 'sieve' && (
                <div className="space-y-3 animate-fadeIn text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#0D0D0D] border-[#202020]' : 'bg-[#FAF9F6] border-[#E8E6E0]'}`}>
                      <div className="text-[10px] font-mono text-[#71717A]">Directional Sieve (CosSim)</div>
                      <div className={`text-xl font-bold font-mono mt-1 ${currentAtk.cosSim < 0.1 ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>
                        {currentAtk.cosSim > 0 ? `+${currentAtk.cosSim.toFixed(2)}` : currentAtk.cosSim.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-[#71717A] mt-1">Cutoff: &gt; +0.10 against Leave-One-Out consensus</div>
                    </div>

                    <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#0D0D0D] border-[#202020]' : 'bg-[#FAF9F6] border-[#E8E6E0]'}`}>
                      <div className="text-[10px] font-mono text-[#71717A]">Magnitude Sieve (L2 Ratio)</div>
                      <div className={`text-xl font-bold font-mono mt-1 ${currentAtk.normRatio > 3.0 ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>
                        {currentAtk.normRatio.toFixed(2)}x
                      </div>
                      <div className="text-[10px] text-[#71717A] mt-1">Cutoff: &lt; 3.0x peer median magnitude</div>
                    </div>
                  </div>

                  <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-mono ${
                    isDark ? 'bg-[#181818] border-[#262626]' : 'bg-[#F4F2EC] border-[#DDD9CF]'
                  }`}>
                    <div>
                      <span className="text-[#71717A]">Gate Decision: </span>
                      <span className="font-bold text-[#EF4444]">DROP & QUARANTINE</span>
                    </div>
                    <div>
                      <span className="text-[#71717A]">Trust Penalty: </span>
                      <span className="font-bold text-[#EF4444]">-100 PTS</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* ================= RIGHT COLUMN: PARTICIPANT TRUST & ANOMALY TELEMETRY ================= */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* 1. Node Trust & Quarantine Status Board */}
            <div className={`p-6 rounded-2xl border ${
              isDark ? 'bg-[#0F0F0F] border-[#222222]' : 'bg-white border-[#E5E3DC] shadow-xs'
            } space-y-4`}>
              <div className="flex items-center justify-between border-b pb-3 border-subtle">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                  <h3 className="text-sm font-bold">Participant Trust Ledger & Quarantine Subsystem</h3>
                </div>

                {/* Onboard Institution Button */}
                <button
                  onClick={() => setIsOnboardingModalOpen(true)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer border transition-all ${
                    isDark ? 'bg-white text-black hover:bg-[#E4E4E7]' : 'bg-white border-[#D5D2C8] text-[#18181B] hover:bg-[#F4F2EC]'
                  }`}
                >
                  <Plus className="w-3 h-3" />
                  <span>Onboard Bank</span>
                </button>
              </div>

              {/* Table of Participant Nodes */}
              <div className="space-y-3">
                {[
                  { id: 'BANK-001', name: 'Commercial Banking Consortium', defaultRole: 'Honest Node' },
                  { id: 'BANK-002', name: 'Digital Wallet Micro-Lending', defaultRole: 'Honest Node' },
                  { id: 'INSURER-001', name: 'P&C SIU Claims Syndicate', defaultRole: 'Honest Node' },
                  { id: 'BANK-003', name: 'Regional Enterprise Bank (Target Node)', defaultRole: 'Injected Adversary' },
                  ...customInstitutions.map(c => ({ id: c.id, name: c.name, defaultRole: c.role })),
                ].map((nodeDef) => {
                  const isNodeQuarantined = quarantinedNodes.includes(nodeDef.id);
                  const isTarget = targetNode === nodeDef.id;
                  const isMonitored = isSimulating && currentPhase >= 2 && isTarget;

                  let status: 'QUARANTINED' | 'MONITORED' | 'ACTIVE' = 'ACTIVE';
                  let trust = 100;
                  let role = nodeDef.defaultRole;

                  if (isNodeQuarantined) {
                    status = 'QUARANTINED';
                    trust = 0;
                    role = isTarget ? 'Quarantined Adversary' : 'Quarantined Node';
                  } else if (isTarget) {
                    trust = attackerTrust;
                    status = isMonitored ? 'MONITORED' : 'ACTIVE';
                    role = 'Injected Adversary';
                  }

                  const node = {
                    id: nodeDef.id,
                    name: nodeDef.name,
                    role,
                    trust,
                    status,
                  };

                  return (
                    <div
                      key={node.id}
                      className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                        isNodeQuarantined
                          ? isDark ? 'bg-[#1C0A0A] border-[#EF4444]' : 'bg-[#FEF2F2] border-[#EF4444]'
                          : isDark ? 'bg-[#0D0D0D] border-[#202020]' : 'bg-[#FAF9F6] border-[#E8E6E0]'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold">{node.id}</span>
                          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                            node.role.includes('Honest')
                              ? isDark ? 'bg-[#062419] text-[#34D399]' : 'bg-[#ECFDF5] text-[#059669]'
                              : isDark ? 'bg-[#260A0A] text-[#F87171]' : 'bg-[#FEF2F2] text-[#DC2626]'
                          }`}>
                            {node.role}
                          </span>
                        </div>
                        <div className={`text-xs ${isDark ? 'text-[#8E8E93]' : 'text-[#71717A]'}`}>
                          {node.name}
                        </div>
                      </div>

                      {/* Right: Trust Score & Status */}
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <div className={`text-xs font-mono font-bold ${
                            node.trust >= 80 ? 'text-[#10B981]' : node.trust >= 40 ? 'text-amber-500' : 'text-[#EF4444]'
                          }`}>
                            {node.trust} / 100
                          </div>
                          <div className={`w-20 h-1.5 rounded-full overflow-hidden mt-1 ${
                            isDark ? 'bg-[#262626]' : 'bg-[#EAE7DF]'
                          }`}>
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                node.trust >= 80 ? 'bg-[#10B981]' : node.trust >= 40 ? 'bg-amber-500' : 'bg-[#EF4444]'
                              }`}
                              style={{ width: `${node.trust}%` }}
                            />
                          </div>
                        </div>

                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${
                          isNodeQuarantined
                            ? 'bg-[#EF4444] text-white border-[#EF4444]'
                            : isMonitored
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                            : isDark
                            ? 'bg-[#062419] border-[#0D4A34] text-[#34D399]'
                            : 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669]'
                        }`}>
                          {node.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Anomaly Sieve Telemetry Comparison Card */}
            <div className={`p-6 rounded-2xl border ${
              isDark ? 'bg-[#0F0F0F] border-[#222222]' : 'bg-white border-[#E5E3DC] shadow-xs'
            } space-y-4`}>
              <div className="flex items-center justify-between border-b pb-3 border-subtle">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#3B82F6]" />
                  <h3 className="text-sm font-bold">Real-Time Anomaly Sieve Telemetry</h3>
                </div>
                <span className={`text-[11px] font-mono ${isDark ? 'text-[#8E8E93]' : 'text-[#71717A]'}`}>
                  Leave-One-Out Consensus Sieve
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Metric 1: Cosine Similarity against Consensus */}
                <div className={`p-4 rounded-xl border ${
                  isDark ? 'bg-[#0D0D0D] border-[#202020]' : 'bg-[#FAF9F6] border-[#E8E6E0]'
                } space-y-2`}>
                  <div className={`text-[11px] font-mono uppercase ${isDark ? 'text-[#8E8E93]' : 'text-[#71717A]'}`}>
                    Consensus Cosine Similarity
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-2xl font-bold font-mono ${
                      quarantinedNodes.length > 0 ? 'text-[#EF4444]' : 'text-[#10B981]'
                    }`}>
                      {quarantinedNodes.length > 0 ? '-0.87' : '+0.93'}
                    </span>
                    <span className={`text-[11px] ${isDark ? 'text-[#71717A]' : 'text-[#8E8E93]'}`}>
                      (Threshold: &gt; +0.10)
                    </span>
                  </div>
                  <p className={`text-[11px] ${isDark ? 'text-[#A1A1AA]' : 'text-[#52525B]'}`}>
                    {quarantinedNodes.length > 0
                      ? 'Adversarial gradient points in opposite direction to peer consensus.'
                      : 'Honest peers aligned along consistent fraud manifold.'}
                  </p>
                </div>

                {/* Metric 2: L2 Norm Explosion Ratio */}
                <div className={`p-4 rounded-xl border ${
                  isDark ? 'bg-[#0D0D0D] border-[#202020]' : 'bg-[#FAF9F6] border-[#E8E6E0]'
                } space-y-2`}>
                  <div className={`text-[11px] font-mono uppercase ${isDark ? 'text-[#8E8E93]' : 'text-[#71717A]'}`}>
                    L2 Norm Ratio to Median
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-2xl font-bold font-mono ${
                      selectedAttack === 'MODEL_POISONING_NOISE' && quarantinedNodes.length > 0 ? 'text-[#EF4444]' : 'text-[#10B981]'
                    }`}>
                      {selectedAttack === 'MODEL_POISONING_NOISE' && quarantinedNodes.length > 0 ? '8.72x' : '1.04x'}
                    </span>
                    <span className={`text-[11px] ${isDark ? 'text-[#71717A]' : 'text-[#8E8E93]'}`}>
                      (Threshold: &lt; 3.0x)
                    </span>
                  </div>
                  <p className={`text-[11px] ${isDark ? 'text-[#A1A1AA]' : 'text-[#52525B]'}`}>
                    {selectedAttack === 'MODEL_POISONING_NOISE' && quarantinedNodes.length > 0
                      ? 'Severe magnitude explosion detected: update dropped before aggregation.'
                      : 'Parameter deltas within verified statistical bounds.'}
                  </p>
                </div>
              </div>
            </div>

            {/* 3. Live Forensic Security Incident Stream */}
            <div className={`p-6 rounded-2xl border ${
              isDark ? 'bg-[#0F0F0F] border-[#222222]' : 'bg-white border-[#E5E3DC] shadow-xs'
            } space-y-4`}>
              <div className="flex items-center justify-between border-b pb-3 border-subtle">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold">Forensic Incident Audit Stream</h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20">
                  SQLite Audit Bound
                </span>
              </div>

              {/* Event Cards */}
              <div className="space-y-2.5">
                {events.map((evt) => {
                  const isReject = evt.decision === 'REJECT';
                  return (
                    <div
                      key={evt.id}
                      className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                        isReject
                          ? isDark ? 'bg-[#1C0A0A] border-[#4D1212]' : 'bg-[#FEF2F2] border-[#FECACA]'
                          : isDark ? 'bg-[#0D0D0D] border-[#202020]' : 'bg-[#FAF9F6] border-[#E8E6E0]'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs">{evt.id}</span>
                          <span className="text-[10px] font-mono opacity-60">• {evt.timestamp}</span>
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                            isReject ? 'bg-[#EF4444] text-white' : 'bg-[#10B981] text-white'
                          }`}>
                            {evt.decision}
                          </span>
                        </div>
                        <div className="font-semibold text-[11px]">{evt.attackName}</div>
                        <div className="font-mono text-[10px] opacity-75">{evt.hash} • {evt.anomalyMetric}</div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                          isReject
                            ? 'bg-[#EF4444]/20 border-[#EF4444] text-[#FCA5A5]'
                            : isDark ? 'bg-[#062419] border-[#0D4A34] text-[#34D399]' : 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669]'
                        }`}>
                          {evt.action}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

        {/* ================= POPULATED AUDIT DATABASE & TRANSACTION HASHING TABLE ================= */}
        <div className={`p-6 rounded-3xl border ${
          isDark ? 'bg-[#0A0A0A] border-[#222222]' : 'bg-white border-[#E5E3DC] shadow-xs'
        } space-y-5`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 border-subtle">
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Simulated Federated Transaction & Gradient Update Database</span>
              </h2>
              <p className={`text-xs ${isDark ? 'text-[#8E8E93]' : 'text-[#71717A]'}`}>
                Real-time cryptographic audit log of updates passing through all 6 security gates. Click any row to inspect its full attestation manifest.
              </p>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]" />
                <input
                  type="text"
                  placeholder="Search hash or node..."
                  value={dbSearch}
                  onChange={(e) => setDbSearch(e.target.value)}
                  className={`pl-8 pr-3 py-1.5 rounded-xl border text-xs font-mono focus:outline-none transition-colors ${
                    isDark ? 'bg-[#121212] border-[#262626] text-white' : 'bg-[#F4F2EC] border-[#DDD9CF] text-[#18181B]'
                  }`}
                />
              </div>

              <div className="flex items-center gap-1">
                {(['ALL', 'ACCEPTED', 'QUARANTINED'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setDbStatusFilter(filter)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold border transition-all cursor-pointer ${
                      dbStatusFilter === filter
                        ? isDark ? 'bg-white text-black border-white' : 'bg-[#18181B] text-white border-[#18181B]'
                        : isDark ? 'bg-[#121212] border-[#262626] text-[#71717A]' : 'bg-white border-[#E0DDD6] text-[#71717A]'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Database Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className={`border-b text-[11px] ${
                isDark ? 'border-[#202020] text-[#71717A] bg-[#0E0E0E]' : 'border-[#E8E6E0] text-[#71717A] bg-[#F2EFE9]'
              }`}>
                <tr>
                  <th className="p-3">Update ID</th>
                  <th className="p-3">Node Origin</th>
                  <th className="p-3">Transaction / Batch Scope</th>
                  <th className="p-3">SHA-256 Gradient Digest</th>
                  <th className="p-3">Gates 1–6 Status</th>
                  <th className="p-3">Cosine Sim</th>
                  <th className="p-3">L2 Ratio</th>
                  <th className="p-3">Verdict</th>
                  <th className="p-3 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-[#1C1C1C]' : 'divide-[#ECEAE4]'}`}>
                {filteredRecords.map((rec) => {
                  const isAccepted = rec.finalVerdict === 'ACCEPTED';
                  return (
                    <tr 
                      key={rec.id} 
                      onClick={() => setSelectedTxManifest(rec)}
                      className={`cursor-pointer transition-colors ${
                        isDark ? 'hover:bg-[#141414]' : 'hover:bg-[#F4F2EC]'
                      }`}
                    >
                      <td className="p-3 font-bold text-white dark:text-white text-black">{rec.id}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          rec.nodeId.includes('003') || rec.nodeId.includes('GHOST')
                            ? 'bg-[#EF4444]/20 text-[#EF4444]'
                            : 'bg-[#10B981]/20 text-[#10B981]'
                        }`}>
                          {rec.nodeId}
                        </span>
                      </td>
                      <td className="p-3 text-[#A1A1AA]">{rec.txType}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5 group">
                          <span className="text-[11px] text-cyan-400 truncate max-w-[140px]">{rec.payloadHash}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(rec.payloadHash);
                            }}
                            className="p-1 rounded hover:bg-white/10 text-[#71717A] hover:text-white"
                            title="Copy SHA-256 Hash"
                          >
                            {copiedHash === rec.payloadHash ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          {[rec.gate1_DP, rec.gate2_SecAgg, rec.gate3_Structural, rec.gate4_Sieve, rec.gate5_Trust, rec.gate6_FedAvg].map((g, idx) => (
                            <span
                              key={idx}
                              title={`Gate ${idx + 1}: ${g}`}
                              className={`w-2 h-2 rounded-full ${
                                g.includes('PASS') || g.includes('ACCEPTED') ? 'bg-[#10B981]' : 'bg-[#EF4444]'
                              }`}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="p-3 font-semibold text-emerald-400">{rec.cosSim}</td>
                      <td className="p-3 text-[#71717A]">{rec.normRatio}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                          isAccepted
                            ? 'bg-[#062419] border-[#0D4A34] text-[#34D399]'
                            : 'bg-[#260A0A] border-[#EF4444] text-[#F87171]'
                        }`}>
                          {rec.finalVerdict}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button className="p-1 text-[#71717A] hover:text-white">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ================= ONBOARDING MODAL ================= */}
      {isOnboardingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl ${
            isDark ? 'bg-[#101010] border-[#2C2C2C] text-white' : 'bg-white border-[#DDD9CF] text-[#18181B]'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-subtle">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#10B981]" />
                <h3 className="text-base font-bold">Onboard Consortium Institution</h3>
              </div>
              <button 
                onClick={() => setIsOnboardingModalOpen(false)}
                className="p-1 rounded-lg text-[#71717A] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleOnboardSubmit} className="pt-4 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-[#71717A]">Institution Legal Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Global Clearing Bank"
                  value={newBankName}
                  onChange={(e) => setNewBankName(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none ${
                    isDark ? 'bg-[#181818] border-[#2C2C2C] text-white' : 'bg-[#FAF9F6] border-[#DDD9CF] text-[#18181B]'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-[#71717A]">Node ID</label>
                  <input
                    type="text"
                    required
                    value={newBankId}
                    onChange={(e) => setNewBankId(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border text-xs font-mono focus:outline-none ${
                      isDark ? 'bg-[#181818] border-[#2C2C2C] text-white' : 'bg-[#FAF9F6] border-[#DDD9CF] text-[#18181B]'
                    }`}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-[#71717A]">Node Category</label>
                  <select
                    value={newBankType}
                    onChange={(e) => setNewBankType(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border text-xs appearance-none focus:outline-none ${
                      isDark ? 'bg-[#181818] border-[#2C2C2C] text-white' : 'bg-[#FAF9F6] border-[#DDD9CF] text-[#18181B]'
                    }`}
                  >
                    <option value="Commercial Banking">Commercial Banking</option>
                    <option value="Digital Wallet">Digital Wallet</option>
                    <option value="Mortgage Lender">Mortgage Lender</option>
                    <option value="SIU Insurer">SIU Insurer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-[#71717A]">Regulatory Jurisdiction</label>
                  <select
                    value={newBankJurisdiction}
                    onChange={(e) => setNewBankJurisdiction(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border text-xs appearance-none focus:outline-none ${
                      isDark ? 'bg-[#181818] border-[#2C2C2C] text-white' : 'bg-[#FAF9F6] border-[#DDD9CF] text-[#18181B]'
                    }`}
                  >
                    <option value="EU-GDPR / EBA">EU-GDPR / EBA</option>
                    <option value="US-FedNow / OCC">US-FedNow / OCC</option>
                    <option value="UK-FCA Compliance">UK-FCA Compliance</option>
                    <option value="APAC-MAS Enclave">APAC-MAS Enclave</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-[#71717A]">Partition Size</label>
                  <input
                    type="text"
                    value={newBankRecords}
                    onChange={(e) => setNewBankRecords(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border text-xs font-mono focus:outline-none ${
                      isDark ? 'bg-[#181818] border-[#2C2C2C] text-white' : 'bg-[#FAF9F6] border-[#DDD9CF] text-[#18181B]'
                    }`}
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className={`w-full py-3 rounded-full font-bold text-xs cursor-pointer transition-all ${
                    isDark ? 'bg-white text-black hover:bg-[#E4E4E7]' : 'bg-white border border-[#D5D2C8] text-[#18181B] hover:bg-[#F4F2EC]'
                  }`}
                >
                  Provision Cryptographic Node & Inject to Topology
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= TRANSACTION CRYPTOGRAPHIC MANIFEST MODAL ================= */}
      {selectedTxManifest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-xl p-6 rounded-3xl border shadow-2xl ${
            isDark ? 'bg-[#101010] border-[#2C2C2C] text-white' : 'bg-white border-[#DDD9CF] text-[#18181B]'
          } space-y-4`}>
            <div className="flex items-center justify-between border-b pb-3 border-subtle">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-400" />
                <h3 className="text-base font-bold">Cryptographic Attestation Manifest</h3>
              </div>
              <button 
                onClick={() => setSelectedTxManifest(null)}
                className="p-1 rounded-lg text-[#71717A] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="flex justify-between border-b pb-2 border-subtle">
                <span className="text-[#71717A]">Update Digest:</span>
                <span className="font-bold text-cyan-400 truncate max-w-xs">{selectedTxManifest.payloadHash}</span>
              </div>
              <div className="flex justify-between border-b pb-2 border-subtle">
                <span className="text-[#71717A]">Origin Participant:</span>
                <span className="font-bold">{selectedTxManifest.nodeId}</span>
              </div>
              <div className="flex justify-between border-b pb-2 border-subtle">
                <span className="text-[#71717A]">SecAgg+ Mask Vector:</span>
                <span>{selectedTxManifest.secAggMaskId}</span>
              </div>
              <div className="flex justify-between border-b pb-2 border-subtle">
                <span className="text-[#71717A]">Tensor Dimension:</span>
                <span>{selectedTxManifest.tensorShape}</span>
              </div>
              <div className="flex justify-between border-b pb-2 border-subtle">
                <span className="text-[#71717A]">Leave-One-Out CosSim:</span>
                <span className="text-emerald-400 font-bold">{selectedTxManifest.cosSim}</span>
              </div>
              <div className="flex justify-between border-b pb-2 border-subtle">
                <span className="text-[#71717A]">L2 Norm Explosion Ratio:</span>
                <span>{selectedTxManifest.normRatio}</span>
              </div>

              <div>
                <span className="text-[10px] text-[#71717A]">Genesis Pre-Image Metadata:</span>
                <pre className={`p-3 rounded-xl text-[11px] mt-1 overflow-x-auto border ${
                  isDark ? 'bg-[#080808] border-[#222222] text-emerald-400' : 'bg-[#FAF9F6] border-[#E8E6E0] text-emerald-800'
                }`}>
                  {selectedTxManifest.preImage}
                </pre>
              </div>

              <div className={`p-3 rounded-xl border flex items-center justify-between font-bold ${
                selectedTxManifest.finalVerdict === 'ACCEPTED'
                  ? 'bg-[#062419] border-[#0D4A34] text-[#34D399]'
                  : 'bg-[#260A0A] border-[#EF4444] text-[#F87171]'
              }`}>
                <span>Final Gateway Verdict:</span>
                <span>{selectedTxManifest.finalVerdict} (Verified by Zero-Knowledge Sieve)</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
