import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Eye, 
  EyeOff, 
  Tag, 
  CircleDashed, 
  Pause, 
  Play, 
  Shield, 
  AlertTriangle 
} from 'lucide-react';

export interface Node3D {
  id: string;
  label: string;
  type: 'hub' | 'bank' | 'insurer' | 'attacker' | 'custom';
  planetName?: string;
  planetCategory?: 'star' | 'earth' | 'mars' | 'jupiter' | 'saturn' | 'ice_giant' | 'venus' | 'mercury';
  orbitRadius?: number;
  orbitSpeed?: number;
  orbitAngle?: number;
  orbitTiltX?: number;
  orbitTiltZ?: number;
  primaryColor?: string;
  atmosphereColor?: string;
  hasRings?: boolean;
  ringInner?: number;
  ringOuter?: number;
  ringColor?: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  color: string;
  radius: number;
  trust: number;
  ip?: string;
  jurisdiction?: string;
  records?: string;
  hash?: string;
}

interface Network3DGraphProps {
  isAttacking: boolean;
  attackType: string;
  attackerId: string;
  quarantinedNodes: string[];
  isDark: boolean;
  customNodes?: Node3D[];
  onSelectNode?: (node: Node3D) => void;
}

export const Network3DGraph: React.FC<Network3DGraphProps> = ({
  isAttacking,
  attackType,
  attackerId,
  quarantinedNodes,
  isDark,
  customNodes = [],
  onSelectNode,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [showNames, setShowNames] = useState<boolean>(true);
  const [showOrbits, setShowOrbits] = useState<boolean>(true);
  const [freezeOrbits, setFreezeOrbits] = useState<boolean>(false);
  const [hoveredNode, setHoveredNode] = useState<Node3D | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [screenLabels, setScreenLabels] = useState<Array<{ node: Node3D; x: number; y: number; visible: boolean }>>([]);

  // Refs to maintain persistent WebGL state across React renders without resetting camera/tick
  const stateRef = useRef({
    isAttacking,
    attackType,
    attackerId,
    quarantinedNodes,
    isDark,
    autoRotate,
    showNames,
    showOrbits,
    freezeOrbits,
    onSelectNode,
  });

  useEffect(() => {
    stateRef.current = {
      isAttacking,
      attackType,
      attackerId,
      quarantinedNodes,
      isDark,
      autoRotate,
      showNames,
      showOrbits,
      freezeOrbits,
      onSelectNode,
    };
  }, [isAttacking, attackType, attackerId, quarantinedNodes, isDark, autoRotate, showNames, showOrbits, freezeOrbits, onSelectNode]);

  // Spherical Camera Orientation State
  const cameraControlRef = useRef({
    theta: 0.65, // azimuth angle
    phi: 0.85, // polar angle
    radius: 460, // distance
    targetTheta: 0.65,
    targetPhi: 0.85,
    targetRadius: 460,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    dragStartTheta: 0.65,
    dragStartPhi: 0.85,
    lastClickTime: 0,
    lastClickX: 0,
    lastClickY: 0,
  });

  // Toggle fullscreen mode using native Fullscreen API with rock-solid CSS fallback
  const toggleFullscreen = async () => {
    const elem = containerRef.current;
    if (!elem) return;

    if (!document.fullscreenElement && !isFullscreen) {
      try {
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if ((elem as any).webkitRequestFullscreen) {
          await (elem as any).webkitRequestFullscreen();
        } else {
          setIsFullscreen(true);
        }
      } catch {
        // Fallback to CSS fullscreen
        setIsFullscreen(true);
      }
    } else {
      if (document.fullscreenElement) {
        try {
          if (document.exitFullscreen) {
            await document.exitFullscreen();
          } else if ((document as any).webkitExitFullscreen) {
            await (document as any).webkitExitFullscreen();
          }
        } catch {
          setIsFullscreen(false);
        }
      } else {
        setIsFullscreen(false);
      }
    }
  };

  // Listen to native browser fullscreen transitions
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = Boolean(document.fullscreenElement === containerRef.current);
      setIsFullscreen(isFs);
      if (isFs) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.body.style.overflow = '';
    };
  }, []);

  // Keyboard Escape listener for fallback fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else {
          setIsFullscreen(false);
          document.body.style.overflow = '';
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);

  // Helper to dynamically calculate node security and quarantine state
  const getNodeSecurityState = (
    nodeId: string, 
    defaultColor: string, 
    defaultAtmosphere: string, 
    defaultHash: string
  ) => {
    const isQuarantined = quarantinedNodes.includes(nodeId);
    const isAttacker = attackerId === nodeId;

    let trust = 100;
    let hash = defaultHash;
    let primaryColor = defaultColor;
    let atmosphereColor = defaultAtmosphere;
    let color = defaultColor;
    let type: Node3D['type'] = isAttacker ? 'attacker' : 'bank';

    if (isQuarantined) {
      trust = 0;
      hash = `sha256:${nodeId.toLowerCase()}...QUARANTINED`;
      primaryColor = '#EF4444';
      atmosphereColor = '#7F1D1D';
      color = '#EF4444';
      type = 'attacker';
    } else if (isAttacker) {
      trust = isAttacking ? 65 : 100;
      hash = isAttacking ? `sha256:${nodeId.toLowerCase()}...eval` : defaultHash;
      primaryColor = isAttacking ? '#EF4444' : defaultColor;
      color = isAttacking ? '#EF4444' : defaultColor;
    }

    return { trust, hash, primaryColor, atmosphereColor, color, type };
  };

  // Combine default consortium worlds + dynamically onboarded banks
  const allNodes: Node3D[] = useMemo(() => {
    const bank1State = getNodeSecurityState('BANK-001', '#1E6CB5', '#2ECC71', 'sha256:8f2a93c...honest');
    const bank2State = getNodeSecurityState('BANK-002', '#C44721', '#E28B62', 'sha256:4c1b98d...honest');
    const bank3State = getNodeSecurityState('BANK-003', '#C4945A', '#6B401B', 'sha256:b1a03e...eval');
    const insurer1State = getNodeSecurityState('INSURER-001', '#E2BF7D', '#BFA05A', 'sha256:9a3f2c...honest');

    const baseNodes: Node3D[] = [
      { 
        id: 'HUB', 
        label: 'OLYMPUS Central Security Gateway', 
        type: 'hub',
        planetName: 'Sol (Consortium Sun)',
        planetCategory: 'star',
        orbitRadius: 0,
        orbitSpeed: 0,
        orbitAngle: 0,
        orbitTiltX: 0,
        primaryColor: '#FFAE00',
        atmosphereColor: '#FF6B00',
        x: 0, 
        y: 0, 
        z: 0, 
        vx: 0, 
        vy: 0, 
        vz: 0, 
        color: '#FFAE00', 
        radius: 24, 
        trust: 100,
        ip: '10.240.0.1 (Solar Consensus Sieve)',
        jurisdiction: 'Global Consortium Enclave',
        records: 'Aggregated Global State',
        hash: 'sha256:7c9e82a...consensus'
      },
      { 
        id: 'BANK-001', 
        label: 'BANK-001 (Commercial Banking)', 
        type: bank1State.type, 
        planetName: 'Earth (Terra)',
        planetCategory: 'earth',
        orbitRadius: 130,
        orbitSpeed: 0.006,
        orbitAngle: 0.8,
        orbitTiltX: 0.08,
        primaryColor: bank1State.primaryColor,
        atmosphereColor: bank1State.atmosphereColor,
        x: 130, 
        y: 0, 
        z: 0, 
        vx: 0, 
        vy: 0, 
        vz: 0, 
        color: bank1State.color, 
        radius: 13, 
        trust: bank1State.trust,
        ip: '192.168.10.42 (Tier-1 Core)',
        jurisdiction: 'EU-GDPR / EBA',
        records: '6,362,620 txs',
        hash: bank1State.hash
      },
      { 
        id: 'BANK-002', 
        label: 'BANK-002 (Digital Wallet)', 
        type: bank2State.type, 
        planetName: 'Mars (The Red Planet)',
        planetCategory: 'mars',
        orbitRadius: 190,
        orbitSpeed: 0.0048,
        orbitAngle: 2.3,
        orbitTiltX: 0.12,
        primaryColor: bank2State.primaryColor,
        atmosphereColor: bank2State.atmosphereColor,
        x: 190, 
        y: 0, 
        z: 0, 
        vx: 0, 
        vy: 0, 
        vz: 0, 
        color: bank2State.color, 
        radius: 10.5, 
        trust: bank2State.trust,
        ip: '192.168.20.15 (FinTech Ingress)',
        jurisdiction: 'US-FedNow / OCC',
        records: '1,420,000 txs',
        hash: bank2State.hash
      },
      { 
        id: 'BANK-003', 
        label: 'BANK-003 (Regional Enterprise)', 
        type: bank3State.type, 
        planetName: 'Jupiter (Gas Giant)',
        planetCategory: 'jupiter',
        orbitRadius: 265,
        orbitSpeed: 0.0032,
        orbitAngle: 3.9,
        orbitTiltX: 0.06,
        primaryColor: bank3State.primaryColor, 
        atmosphereColor: bank3State.atmosphereColor,
        x: 265, 
        y: 0, 
        z: 0, 
        vx: 0, 
        vy: 0, 
        vz: 0, 
        color: bank3State.color, 
        radius: 19, 
        trust: bank3State.trust,
        ip: '192.168.30.88 (Target Node)',
        jurisdiction: 'Regional Enterprise Core',
        records: '840,000 txs',
        hash: bank3State.hash
      },
      { 
        id: 'INSURER-001', 
        label: 'INSURER-001 (P&C SIU Claims)', 
        type: insurer1State.type === 'attacker' ? 'attacker' : 'insurer', 
        planetName: 'Saturn (Ringed World)',
        planetCategory: 'saturn',
        orbitRadius: 345,
        orbitSpeed: 0.0022,
        orbitAngle: 5.3,
        orbitTiltX: 0.16,
        primaryColor: insurer1State.primaryColor,
        atmosphereColor: insurer1State.atmosphereColor,
        hasRings: true,
        ringInner: 24,
        ringOuter: 44,
        ringColor: '#E2BF7D',
        x: 345, 
        y: 0, 
        z: 0, 
        vx: 0, 
        vy: 0, 
        vz: 0, 
        color: insurer1State.color, 
        radius: 16, 
        trust: insurer1State.trust,
        ip: '192.168.40.77 (SIU Forensics)',
        jurisdiction: 'NAIC Compliance Enclave',
        records: '1,000,000 policies',
        hash: insurer1State.hash
      },
    ];

    const planetTemplates = [
      { name: 'Neptune (Deep Ice Giant)', category: 'ice_giant' as const, radius: 14, orbitR: 415, speed: 0.0016, color: '#274687', atmosphere: '#60A5FA' },
      { name: 'Venus (Sulfuric Clouds)', category: 'venus' as const, radius: 12, orbitR: 85, speed: 0.008, color: '#E5B869', atmosphere: '#FDE68A' },
      { name: 'Mercury (Swift Cratered)', category: 'mercury' as const, radius: 9, orbitR: 55, speed: 0.012, color: '#9CA3AF', atmosphere: '#E5E7EB' },
      { name: 'Uranus (Aquamarine Ice)', category: 'ice_giant' as const, radius: 13.5, orbitR: 475, speed: 0.0013, color: '#2DD4BF', atmosphere: '#99F6E4', hasRings: true, ringInner: 17, ringOuter: 27, ringColor: '#2DD4BF' },
    ];

    const added = customNodes.map((cn, idx) => {
      const template = planetTemplates[idx % planetTemplates.length];
      const orbitOffset = idx * 55;
      const customNodeState = getNodeSecurityState(cn.id, template.color, template.atmosphere, cn.hash || 'sha256:custom...verified');
      return {
        ...cn,
        planetName: template.name,
        planetCategory: template.category,
        orbitRadius: template.orbitR + orbitOffset,
        orbitSpeed: template.speed,
        orbitAngle: 1.0 + idx * 1.5,
        orbitTiltX: 0.08 + (idx * 0.03),
        primaryColor: customNodeState.primaryColor,
        atmosphereColor: customNodeState.atmosphereColor,
        hasRings: template.hasRings,
        ringInner: template.ringInner,
        ringOuter: template.ringOuter,
        ringColor: template.ringColor,
        radius: template.radius,
        color: customNodeState.color,
        trust: customNodeState.trust,
        hash: customNodeState.hash,
        type: customNodeState.type,
      } as Node3D;
    });

    return [...baseNodes, ...added];
  }, [customNodes, attackerId, quarantinedNodes, isAttacking]);

  // Main Three.js Lifecycle
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(45, 1, 10, 4000);
    cameraRef.current = camera;

    const updateCameraPos = () => {
      const ctrl = cameraControlRef.current;
      const x = ctrl.radius * Math.sin(ctrl.phi) * Math.sin(ctrl.theta);
      const y = ctrl.radius * Math.cos(ctrl.phi);
      const z = ctrl.radius * Math.sin(ctrl.phi) * Math.cos(ctrl.theta);
      camera.position.set(x, y, z);
      camera.lookAt(0, 0, 0);
    };
    updateCameraPos();

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    rendererRef.current = renderer;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(isDark ? 0x05060A : 0xFAF9F6, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lighting System
    // Central Sun Point Light
    const sunLight = new THREE.PointLight(0xFFEAA7, isDark ? 3.2 : 2.6, 1800, 0.4);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    // Ambient Light tuned for dark space or luminous celestial alabaster
    const ambientLight = new THREE.AmbientLight(isDark ? 0x1E1E2E : 0xF4F3EE, isDark ? 0.45 : 0.85);
    scene.add(ambientLight);

    // Soft Fill Directional Light for depth and hemisphere contrast
    const fillLight = new THREE.DirectionalLight(0xFFFFFF, isDark ? 0.35 : 0.65);
    fillLight.position.set(0, 200, 200);
    scene.add(fillLight);

    // 5. Starfield / Celestial Coordinates (Deep space specks or subtle slate coordinates)
    const starCount = 650;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    const spectralPalette = isDark ? [
      new THREE.Color('#FFFFFF'), // Pure White
      new THREE.Color('#BFDBFE'), // Blue Giant
      new THREE.Color('#93C5FD'), // Deep Blue
      new THREE.Color('#FEF08A'), // Solar Yellow
      new THREE.Color('#FCA5A5'), // Red Dwarf
      new THREE.Color('#E0E7FF'), // Pastel Indigo
    ] : [
      new THREE.Color('#94A3B8'), // Slate
      new THREE.Color('#CBD5E1'), // Light Slate
      new THREE.Color('#64748B'), // Steel
      new THREE.Color('#A1A1AA'), // Zinc
      new THREE.Color('#818CF8'), // Indigo dot
    ];

    for (let i = 0; i < starCount; i++) {
      // Distribute stars on a wide celestial shell
      const r = 900 + Math.random() * 600;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = r * Math.cos(phi);

      const color = spectralPalette[Math.floor(Math.random() * spectralPalette.length)];
      starColors[i * 3] = color.r;
      starColors[i * 3 + 1] = color.g;
      starColors[i * 3 + 2] = color.b;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: isDark ? 2.2 : 1.5,
      vertexColors: true,
      transparent: true,
      opacity: isDark ? 0.85 : 0.45,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // 6. Sol (Consortium Central Star) Creation
    const solHub = allNodes.find((n) => n.type === 'hub') || allNodes[0];
    const sunGroup = new THREE.Group();
    scene.add(sunGroup);

    // Sun Photosphere Mesh
    const sunGeo = new THREE.SphereGeometry(solHub.radius, 36, 36);
    const sunMat = new THREE.MeshBasicMaterial({
      color: 0xF59E0B,
    });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    (sunMesh as any).nodeData = solHub;
    sunGroup.add(sunMesh);

    // Inner Pulsating Solar Corona
    const coronaGeo = new THREE.SphereGeometry(solHub.radius * 1.35, 32, 32);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: isDark ? 0xFF7700 : 0xF59E0B,
      transparent: true,
      opacity: isDark ? 0.38 : 0.40,
      blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
      side: THREE.BackSide,
    });
    const coronaMesh = new THREE.Mesh(coronaGeo, coronaMat);
    sunGroup.add(coronaMesh);

    // Outer Solar Atmosphere Glow
    const outerHaloGeo = new THREE.SphereGeometry(solHub.radius * 1.85, 32, 32);
    const outerHaloMat = new THREE.MeshBasicMaterial({
      color: isDark ? 0xFF4500 : 0xEA580C,
      transparent: true,
      opacity: isDark ? 0.18 : 0.16,
      blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
      side: THREE.BackSide,
    });
    const outerHaloMesh = new THREE.Mesh(outerHaloGeo, outerHaloMat);
    sunGroup.add(outerHaloMesh);

    // 7. Planet Meshes & Orbits
    interface PlanetEntry {
      node: Node3D;
      group: THREE.Group;
      planetMesh: THREE.Mesh;
      ringMesh?: THREE.Mesh;
      quarantineBox?: THREE.LineSegments;
      orbitLine: THREE.LineLoop;
      telemetryLine: THREE.Line;
      packetMesh: THREE.Mesh;
      packetProgress: number;
      packetSpeed: number;
    }

    const planetEntries: PlanetEntry[] = [];
    const interactiveMeshes: THREE.Mesh[] = [sunMesh];

    allNodes.forEach((node) => {
      if (node.type === 'hub') return;

      const group = new THREE.Group();
      scene.add(group);

      const r = node.orbitRadius || 180;
      const tilt = node.orbitTiltX || 0.1;

      // Concentric Keplerian 3D Orbit Path
      const segments = 96;
      const orbitPoints: THREE.Vector3[] = [];
      for (let s = 0; s <= segments; s++) {
        const theta = (s / segments) * Math.PI * 2;
        const ox = Math.cos(theta) * r;
        const oz = Math.sin(theta) * r;
        const oy = Math.sin(theta) * r * Math.sin(tilt);
        orbitPoints.push(new THREE.Vector3(ox, oy, oz));
      }
      const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
      const isQuarantined = quarantinedNodes.includes(node.id);
      const orbitMat = new THREE.LineBasicMaterial({
        color: isQuarantined ? 0xEF4444 : isDark ? 0xFFFFFF : 0x71717A,
        transparent: true,
        opacity: isQuarantined ? 0.35 : isDark ? 0.12 : 0.30,
      });
      const orbitLine = new THREE.LineLoop(orbitGeo, orbitMat);
      orbitLine.visible = stateRef.current.showOrbits;
      scene.add(orbitLine);

      // Planet Sphere Geometry
      const planetGeo = new THREE.SphereGeometry(node.radius, 32, 32);
      const planetMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(node.primaryColor || '#3B82F6'),
        roughness: 0.55,
        metalness: 0.15,
      });
      const planetMesh = new THREE.Mesh(planetGeo, planetMat);
      planetMesh.castShadow = true;
      planetMesh.receiveShadow = true;
      (planetMesh as any).nodeData = node;
      group.add(planetMesh);
      interactiveMeshes.push(planetMesh);

      // Special Planet Features
      let ringMesh: THREE.Mesh | undefined;
      if (node.hasRings && node.ringInner && node.ringOuter) {
        // Saturn / Uranus 3D Ring System
        const ringGeo = new THREE.RingGeometry(node.ringInner, node.ringOuter, 64);
        const ringMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(node.ringColor || '#E2BF7D'),
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.82,
          roughness: 0.6,
        });
        ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 2 + 0.47; // 27-degree axial ring tilt
        group.add(ringMesh);
      }

      // Earth Atmosphere Glow Ring
      if (node.planetCategory === 'earth') {
        const atmoGeo = new THREE.SphereGeometry(node.radius * 1.12, 24, 24);
        const atmoMat = new THREE.MeshBasicMaterial({
          color: 0x4ECDC4,
          transparent: true,
          opacity: 0.22,
          blending: THREE.AdditiveBlending,
          side: THREE.BackSide,
        });
        const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
        group.add(atmoMesh);
      }

      // Quarantine Red Wireframe Box for isolated nodes
      let quarantineBox: THREE.LineSegments | undefined;
      if (isQuarantined) {
        const boxGeo = new THREE.BoxGeometry(node.radius * 2.5, node.radius * 2.5, node.radius * 2.5);
        const edges = new THREE.EdgesGeometry(boxGeo);
        const lineMat = new THREE.LineBasicMaterial({ color: 0xEF4444, linewidth: 2 });
        quarantineBox = new THREE.LineSegments(edges, lineMat);
        group.add(quarantineBox);
      }

      // Telemetry Beam between Planet and Sun
      const beamGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, 0),
      ]);
      const beamMat = new THREE.LineBasicMaterial({
        color: isQuarantined ? 0xEF4444 : 0xFFAA00,
        transparent: true,
        opacity: isQuarantined ? 0.3 : isDark ? 0.35 : 0.45,
      });
      const telemetryLine = new THREE.Line(beamGeo, beamMat);
      scene.add(telemetryLine);

      // Flowing Telemetry Packet Pulse
      const packetGeo = new THREE.SphereGeometry(isAttacking && node.id === attackerId ? 4.5 : 2.8, 16, 16);
      const packetMat = new THREE.MeshBasicMaterial({
        color: isAttacking && node.id === attackerId ? 0xEF4444 : 0xFFAA00,
      });
      const packetMesh = new THREE.Mesh(packetGeo, packetMat);
      scene.add(packetMesh);

      planetEntries.push({
        node,
        group,
        planetMesh,
        ringMesh,
        quarantineBox,
        orbitLine,
        telemetryLine,
        packetMesh,
        packetProgress: Math.random(),
        packetSpeed: 0.008 + Math.random() * 0.006,
      });
    });

    // 8. Canvas Resize Handler
    const handleResize = () => {
      const containerElem = containerRef.current;
      if (!containerElem) return;
      const isFs = Boolean(document.fullscreenElement === containerElem || containerElem.style.position === 'fixed');
      const width = isFs ? window.innerWidth : containerElem.clientWidth || 1000;
      const height = isFs ? window.innerHeight : 480;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    handleResize();
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    window.addEventListener('resize', handleResize);

    // 9. Pointer Interaction Handlers (Rock-Solid Damping, Zero Glitching)
    const domElem = renderer.domElement;
    const raycaster = new THREE.Raycaster();
    const mouseVector = new THREE.Vector2();

    const onPointerDown = (e: MouseEvent) => {
      const ctrl = cameraControlRef.current;
      ctrl.isDragging = true;
      ctrl.dragStartX = e.clientX;
      ctrl.dragStartY = e.clientY;
      ctrl.dragStartTheta = ctrl.targetTheta;
      ctrl.dragStartPhi = ctrl.targetPhi;
      ctrl.lastClickX = e.clientX;
      ctrl.lastClickY = e.clientY;
      ctrl.lastClickTime = performance.now();
    };

    const onPointerMove = (e: MouseEvent) => {
      const rect = domElem.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setMousePos({ x, y });

      const ctrl = cameraControlRef.current;
      if (ctrl.isDragging) {
        const dx = e.clientX - ctrl.dragStartX;
        const dy = e.clientY - ctrl.dragStartY;
        ctrl.targetTheta = ctrl.dragStartTheta - dx * 0.006;
        ctrl.targetPhi = Math.max(0.1, Math.min(Math.PI - 0.1, ctrl.dragStartPhi - dy * 0.006));
      }

      // Raycast for hover state
      mouseVector.x = (x / rect.width) * 2 - 1;
      mouseVector.y = -(y / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouseVector, camera);

      const intersects = raycaster.intersectObjects(interactiveMeshes);
      if (intersects.length > 0) {
        domElem.style.cursor = 'pointer';
        const hit = intersects[0].object as any;
        if (hit.nodeData) {
          setHoveredNode(hit.nodeData);
        }
      } else {
        domElem.style.cursor = ctrl.isDragging ? 'grabbing' : 'grab';
        setHoveredNode(null);
      }
    };

    const onPointerUp = (e: MouseEvent) => {
      const ctrl = cameraControlRef.current;
      ctrl.isDragging = false;
      domElem.style.cursor = 'grab';

      // Detect click if movement was minimal (< 5px)
      const dx = Math.abs(e.clientX - ctrl.lastClickX);
      const dy = Math.abs(e.clientY - ctrl.lastClickY);
      const duration = performance.now() - ctrl.lastClickTime;

      if (dx < 6 && dy < 6 && duration < 350) {
        const rect = domElem.getBoundingClientRect();
        mouseVector.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseVector.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouseVector, camera);

        const intersects = raycaster.intersectObjects(interactiveMeshes);
        if (intersects.length > 0) {
          const hit = intersects[0].object as any;
          if (hit.nodeData && stateRef.current.onSelectNode) {
            stateRef.current.onSelectNode(hit.nodeData);
          }
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const ctrl = cameraControlRef.current;
      ctrl.targetRadius = Math.max(160, Math.min(1200, ctrl.targetRadius + e.deltaY * 0.45));
    };

    domElem.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    domElem.addEventListener('wheel', onWheel, { passive: false });

    // 10. Render & Animation Loop (60 FPS Silky Smooth)
    let animationFrameId: number;
    let tick = 0;
    let orbitTick = 0;

    const animate = () => {
      tick++;
      if (!stateRef.current.freezeOrbits) {
        orbitTick++;
      }

      const ctrl = cameraControlRef.current;
      if (stateRef.current.autoRotate && !ctrl.isDragging) {
        ctrl.targetTheta += 0.0018; // Smooth planetary ecliptic orbit drift
      }

      // Smooth Camera Damping (Lag-free interpolation)
      ctrl.theta += (ctrl.targetTheta - ctrl.theta) * 0.08;
      ctrl.phi += (ctrl.targetPhi - ctrl.phi) * 0.08;
      ctrl.radius += (ctrl.targetRadius - ctrl.radius) * 0.08;
      updateCameraPos();

      // Pulsate Solar Corona
      const pulseScale = 1.0 + 0.04 * Math.sin(tick * 0.04);
      coronaMesh.scale.set(pulseScale, pulseScale, pulseScale);
      outerHaloMesh.scale.set(pulseScale * 1.02, pulseScale * 1.02, pulseScale * 1.02);

      // Rotate Starfield gently
      starField.rotation.y = tick * 0.0002;

      // Update Planet Positions along Keplerian Orbits
      const rect = domElem.getBoundingClientRect();
      const newScreenLabels: Array<{ node: Node3D; x: number; y: number; visible: boolean }> = [];

      // Add Sol Label
      const solScreen = new THREE.Vector3(0, 0, 0).project(camera);
      newScreenLabels.push({
        node: solHub,
        x: ((solScreen.x + 1) * rect.width) / 2,
        y: ((-solScreen.y + 1) * rect.height) / 2,
        visible: solScreen.z < 1,
      });

      planetEntries.forEach((entry) => {
        const r = entry.node.orbitRadius || 180;
        const currentAngle = (entry.node.orbitAngle || 0) + orbitTick * (entry.node.orbitSpeed || 0.005);
        const tilt = entry.node.orbitTiltX || 0.1;

        const px = Math.cos(currentAngle) * r;
        const pz = Math.sin(currentAngle) * r;
        const py = Math.sin(currentAngle) * r * Math.sin(tilt);

        entry.group.position.set(px, py, pz);
        if (!stateRef.current.freezeOrbits) {
          entry.planetMesh.rotation.y += 0.012; // Planet axial self-rotation
          if (entry.ringMesh) {
            entry.ringMesh.rotation.z += 0.003;
          }
        }

        // Toggle orbit line visibility dynamically
        entry.orbitLine.visible = stateRef.current.showOrbits;

        // Update Telemetry Beam vector
        const positions = entry.telemetryLine.geometry.attributes.position.array as Float32Array;
        positions[0] = 0;
        positions[1] = 0;
        positions[2] = 0;
        positions[3] = px;
        positions[4] = py;
        positions[5] = pz;
        entry.telemetryLine.geometry.attributes.position.needsUpdate = true;

        // Animate Telemetry Packet flowing from Planet to Sol
        entry.packetProgress += entry.packetSpeed;
        if (entry.packetProgress > 1) entry.packetProgress = 0;

        entry.packetMesh.position.set(
          px * (1 - entry.packetProgress),
          py * (1 - entry.packetProgress),
          pz * (1 - entry.packetProgress)
        );

        // Project 3D coordinate to 2D screen space for labels
        const planetScreenPos = new THREE.Vector3(px, py, pz).project(camera);
        newScreenLabels.push({
          node: entry.node,
          x: ((planetScreenPos.x + 1) * rect.width) / 2,
          y: ((-planetScreenPos.y + 1) * rect.height) / 2,
          visible: planetScreenPos.z < 1,
        });
      });

      // Update Screen Typography Labels
      setScreenLabels(newScreenLabels);

      // Render Scene
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      domElem.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      domElem.removeEventListener('wheel', onWheel);
      renderer.dispose();
      starGeo.dispose();
      starMat.dispose();
      rendererRef.current = null;
      cameraRef.current = null;
    };
  }, [allNodes, isDark]);

  // Synchronize canvas size when entering or exiting fullscreen without recreating the 3D scene
  useEffect(() => {
    const handleFsResize = () => {
      const containerElem = containerRef.current;
      const renderer = rendererRef.current;
      const camera = cameraRef.current;
      if (!containerElem || !renderer || !camera) return;

      const isFs = Boolean(document.fullscreenElement === containerElem || isFullscreen);
      const width = isFs ? window.innerWidth : (containerElem.clientWidth || 1000);
      const height = isFs ? window.innerHeight : 480;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    handleFsResize();
    const timer = setTimeout(handleFsResize, 60);
    return () => clearTimeout(timer);
  }, [isFullscreen]);

  // Main UI Shell
  const content = (
    <div 
      ref={containerRef}
      style={{ 
        height: isFullscreen ? '100vh' : '480px', 
        width: isFullscreen ? '100vw' : '100%',
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : undefined,
        left: isFullscreen ? 0 : undefined,
        right: isFullscreen ? 0 : undefined,
        bottom: isFullscreen ? 0 : undefined,
        zIndex: isFullscreen ? 99999 : undefined,
      }}
      className={`w-full overflow-hidden select-none ${
        isFullscreen 
          ? (isDark ? 'rounded-none bg-[#05060A] text-white shadow-2xl' : 'rounded-none bg-[#FAF9F6] text-[#18181B] shadow-2xl') 
          : (isDark ? 'rounded-2xl h-[480px] bg-[#05060A] border border-[#23232A] shadow-inner text-white' : 'rounded-2xl h-[480px] bg-[#FAF9F6] border border-[#E5E3DC] shadow-inner text-[#18181B]')
      }`}
    >
      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="w-full h-full block" />

      {/* 3D Projected Screen Labels (Planetarium Typography) - Can be toggled on/off */}
      {showNames && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {screenLabels.map((item) => {
            if (!item.visible) return null;
            // Hide label for the currently hovered node so it doesn't create messy overlapping text behind the HUD tooltip
            if (hoveredNode && item.node.id === hoveredNode.id) return null;

            // Prevent collision with the HUD tooltip
            if (hoveredNode && mousePos) {
              const dx = Math.abs(item.x - mousePos.x);
              const dy = Math.abs(item.y - mousePos.y);
              if (dx < 170 && dy < 130) return null;
            }

            const isQuarantined = quarantinedNodes.includes(item.node.id);
            const isHub = item.node.type === 'hub';
            const labelTrust = isQuarantined ? 0 : item.node.trust;

            return (
              <div
                key={item.node.id}
                style={{
                  transform: `translate3d(${Math.round(item.x)}px, ${Math.round(item.y + item.node.radius + 14)}px, 0) translate(-50%, 0)`,
                }}
                className="absolute flex flex-col items-center pointer-events-none transition-transform duration-75"
              >
                <span className={`text-[11px] font-mono font-bold tracking-tight whitespace-nowrap px-1.5 py-0.5 rounded ${
                  isQuarantined
                    ? 'bg-red-500/20 text-red-500 border border-red-500/30'
                    : isHub
                    ? 'bg-amber-500/15 text-amber-500'
                    : isDark
                    ? 'text-zinc-200'
                    : 'text-zinc-800'
                }`}>
                  {item.node.label}
                </span>
                <span className={`text-[9px] font-mono tracking-tight whitespace-nowrap ${
                  isQuarantined
                    ? 'text-red-500 font-bold'
                    : isHub
                    ? 'text-amber-500/80 font-medium'
                    : isDark
                    ? 'text-zinc-400'
                    : 'text-zinc-500'
                }`}>
                  {item.node.planetName} • {isQuarantined ? 'QUARANTINED (TRUST 0/100)' : `TRUST ${labelTrust}/100`}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating HUD Tooltip when Hovering a Planet */}
      {hoveredNode && mousePos && (() => {
        const isNodeQuarantined = quarantinedNodes.includes(hoveredNode.id);
        const displayTrust = isNodeQuarantined ? 0 : hoveredNode.trust;
        const displayHash = isNodeQuarantined 
          ? (hoveredNode.hash?.includes('QUARANTINED') ? hoveredNode.hash : `sha256:${hoveredNode.id.toLowerCase()}...QUARANTINED`)
          : (hoveredNode.hash || 'sha256:verified');
        
        const containerW = containerRef.current?.clientWidth || 800;
        const containerH = containerRef.current?.clientHeight || 480;
        const tooltipW = 280;
        const leftPos = mousePos.x + tooltipW + 24 < containerW
          ? mousePos.x + 20
          : Math.max(12, mousePos.x - tooltipW - 20);
        const topPos = Math.max(12, Math.min(containerH - 220, mousePos.y - 60));

        return (
          <div 
            className={`absolute pointer-events-none z-50 p-3.5 rounded-xl border text-xs shadow-2xl backdrop-blur-md w-72 transition-opacity duration-150 ${
              isDark ? 'bg-[#0B0B0B]/95 border-[#333333] text-white' : 'bg-white/98 border-[#D8D5CC] text-[#18181B]'
            }`}
            style={{
              left: leftPos,
              top: topPos,
            }}
          >
            <div className="flex items-center justify-between border-b pb-1.5 border-subtle gap-3">
              <span className="font-bold flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isNodeQuarantined ? 'bg-[#EF4444]' : 'bg-[#10B981]'}`} />
                <span className="font-mono">{hoveredNode.id}</span>
              </span>
              <span className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold border ${
                isNodeQuarantined 
                  ? 'bg-[#EF4444]/20 border-[#EF4444]/40 text-[#EF4444]' 
                  : 'bg-[#10B981]/20 border-[#10B981]/40 text-[#10B981]'
              }`}>
                {isNodeQuarantined ? 'QUARANTINED' : 'ACTIVE'}
              </span>
            </div>

            <div className="pt-2 space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between gap-4">
                <span className="text-[#71717A]">Celestial Body:</span>
                <span className="font-semibold text-amber-500">{hoveredNode.planetName || 'Consortium World'}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#71717A]">Peer Node:</span>
                <span className="font-medium truncate max-w-[150px] text-right">{hoveredNode.label}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#71717A]">Network IP:</span>
                <span>{hoveredNode.ip || '10.240.x.x'}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#71717A]">Jurisdiction:</span>
                <span>{hoveredNode.jurisdiction || 'Consortium Enclave'}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#71717A]">Trust Score:</span>
                <span className={isNodeQuarantined || displayTrust < 80 ? 'text-[#EF4444] font-bold' : 'text-[#10B981] font-bold'}>
                  {displayTrust}/100
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#71717A]">Hash Digest:</span>
                <span className={`text-[10px] truncate max-w-[160px] ${isNodeQuarantined ? 'text-[#EF4444] font-bold' : ''}`}>
                  {displayHash}
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 3D Interaction Hints */}
      <div className={`absolute bottom-3 left-4 text-[11px] font-mono pointer-events-none ${
        isDark ? 'text-zinc-400' : 'text-zinc-600'
      }`}>
        <span>Left-click + drag to orbit Solar System • Scroll wheel to zoom • Click planet to inspect</span>
        {isFullscreen && <span className="ml-2 font-bold text-amber-500">• Press Esc to exit full screen</span>}
      </div>

      {/* Control Buttons Group (Top Right) */}
      <div className="absolute top-4 right-4 flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
        {/* Gateway Shield Status Badge */}
        <div className={`px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] font-mono font-bold flex items-center gap-1.5 sm:gap-2 border ${
          isAttacking
            ? 'bg-[#260A0A] border-[#EF4444] text-[#F87171]'
            : isDark 
            ? 'bg-[#062419]/90 border-[#0D4A34] text-[#34D399]'
            : 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]'
        }`}>
          <span className={`w-2 h-2 rounded-full ${isAttacking ? 'bg-[#EF4444] animate-ping' : 'bg-[#10B981]'}`} />
          <span className="hidden sm:inline">{isAttacking ? 'GATEWAY: THREAT INTERCEPTED' : 'GATEWAY: SHIELD ACTIVE'}</span>
          <span className="sm:hidden">{isAttacking ? 'THREAT' : 'SHIELD'}</span>
        </div>

        {/* Toggle Names Button */}
        <button
          onClick={() => setShowNames((prev) => !prev)}
          aria-label={showNames ? 'Hide node names' : 'Show node names'}
          className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
            !showNames
              ? (isDark ? 'bg-[#18181B] border-[#3F3F46] text-[#71717A]' : 'bg-[#EAE7DF] border-[#D1CEC7] text-[#71717A]')
              : (isDark ? 'bg-[#10B981]/20 border-[#10B981]/50 text-[#10B981]' : 'bg-[#10B981]/15 border-[#10B981]/40 text-[#047857]')
          }`}
          title={showNames ? 'Hide Node Names' : 'Show Node Names'}
        >
          {showNames ? <Tag className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span className="hidden md:inline">{showNames ? 'Names' : 'Names Hidden'}</span>
        </button>

        {/* Toggle Orbit Lines Button */}
        <button
          onClick={() => setShowOrbits((prev) => !prev)}
          aria-label={showOrbits ? 'Hide orbit paths' : 'Show orbit paths'}
          className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
            !showOrbits
              ? (isDark ? 'bg-[#18181B] border-[#3F3F46] text-[#71717A]' : 'bg-[#EAE7DF] border-[#D1CEC7] text-[#71717A]')
              : (isDark ? 'bg-[#10B981]/20 border-[#10B981]/50 text-[#10B981]' : 'bg-[#10B981]/15 border-[#10B981]/40 text-[#047857]')
          }`}
          title={showOrbits ? 'Hide Orbit Paths' : 'Show Orbit Paths'}
        >
          <CircleDashed className="w-3.5 h-3.5" />
          <span className="hidden md:inline">{showOrbits ? 'Orbits' : 'Orbits Hidden'}</span>
        </button>

        {/* Freeze Orbit Button */}
        <button
          onClick={() => setFreezeOrbits((prev) => !prev)}
          aria-label={freezeOrbits ? 'Unfreeze planetary orbits' : 'Freeze planetary orbits'}
          className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
            freezeOrbits
              ? (isDark ? 'bg-amber-500/20 border-amber-500/50 text-amber-500 font-bold' : 'bg-amber-500/15 border-amber-500/40 text-amber-700 font-bold')
              : (isDark ? 'bg-[#121216]/85 hover:bg-[#1E1E24] border-[#2E2E36] text-[#E4E4E7]' : 'bg-white/90 hover:bg-[#F4F3EE] border-[#D8D5CC] text-[#27272A] shadow-2xs')
          }`}
          title={freezeOrbits ? 'Unfreeze Planetary Motion' : 'Freeze Planetary Motion'}
        >
          {freezeOrbits ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          <span className="hidden md:inline">{freezeOrbits ? 'Frozen' : 'Freeze'}</span>
        </button>

        {/* Zoom In */}
        <button
          onClick={() => {
            cameraControlRef.current.targetRadius = Math.max(160, cameraControlRef.current.targetRadius - 70);
          }}
          aria-label="Zoom in 3D solar system"
          className={`p-2 rounded-xl border transition-all cursor-pointer ${
            isDark ? 'bg-[#121216]/85 hover:bg-[#1E1E24] border-[#2E2E36] text-[#E4E4E7]' : 'bg-white/90 hover:bg-[#F4F3EE] border-[#D8D5CC] text-[#27272A] shadow-2xs'
          }`}
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        {/* Zoom Out */}
        <button
          onClick={() => {
            cameraControlRef.current.targetRadius = Math.min(1200, cameraControlRef.current.targetRadius + 70);
          }}
          aria-label="Zoom out 3D solar system"
          className={`p-2 rounded-xl border transition-all cursor-pointer ${
            isDark ? 'bg-[#121216]/85 hover:bg-[#1E1E24] border-[#2E2E36] text-[#E4E4E7]' : 'bg-white/90 hover:bg-[#F4F3EE] border-[#D8D5CC] text-[#27272A] shadow-2xs'
          }`}
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        {/* Auto Rotate Toggle */}
        <button
          onClick={() => setAutoRotate((prev) => !prev)}
          aria-label={autoRotate ? 'Pause camera rotation' : 'Resume camera rotation'}
          className={`p-2 rounded-xl border transition-all cursor-pointer ${
            autoRotate
              ? (isDark ? 'bg-[#10B981]/20 border-[#10B981]/50 text-[#10B981]' : 'bg-[#10B981]/15 border-[#10B981]/40 text-[#047857]')
              : (isDark ? 'bg-[#121216]/85 border-[#2E2E36] text-[#8E8E93]' : 'bg-white/90 border-[#D8D5CC] text-[#A1A1AA] shadow-2xs')
          }`}
          title={autoRotate ? 'Pause Camera Rotation' : 'Enable Camera Rotation'}
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Reset Camera */}
        <button
          onClick={() => {
            cameraControlRef.current.targetTheta = 0.65;
            cameraControlRef.current.targetPhi = 0.85;
            cameraControlRef.current.targetRadius = 460;
          }}
          aria-label="Reset 3D camera"
          className={`p-2 rounded-xl border transition-all cursor-pointer ${
            isDark ? 'bg-[#121216]/85 hover:bg-[#1E1E24] border-[#2E2E36] text-[#E4E4E7]' : 'bg-white/90 hover:bg-[#F4F3EE] border-[#D8D5CC] text-[#27272A] shadow-2xs'
          }`}
          title="Reset Camera View"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>

        {/* Fullscreen Toggle Button */}
        <button
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? 'Exit full screen' : 'View model in full screen'}
          className={`p-2 px-3 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
            isDark 
              ? 'bg-[#121216]/85 hover:bg-[#1E1E24] border-[#2E2E36] text-[#E4E4E7]' 
              : 'bg-white/90 hover:bg-[#F4F3EE] border-[#D8D5CC] text-[#27272A] shadow-2xs'
          }`}
          title={isFullscreen ? 'Exit full screen (Esc)' : 'View 3D model in full screen'}
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Exit Fullscreen</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Full Screen</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {isFullscreen && (
        <div 
          aria-hidden="true" 
          className={`w-full h-[480px] rounded-2xl flex flex-col items-center justify-center gap-2.5 ${
            isDark ? 'bg-[#05060A] border border-[#23232A] text-zinc-400' : 'bg-[#FAF9F6] border border-[#E5E3DC] text-zinc-600'
          }`}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-ping" />
          <span className="text-xs font-mono font-medium">3D Topology Active in Fullscreen Mode</span>
          <span className="text-[11px] font-mono text-zinc-500">Press Esc or click 'Exit Fullscreen' to return</span>
        </div>
      )}
      {content}
    </>
  );
};
