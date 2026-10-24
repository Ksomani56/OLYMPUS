import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Play, 
  Pause, 
  Shield, 
  AlertTriangle,
  Globe,
  Radio,
  Wifi,
  Layers
} from 'lucide-react';
import { Node3D } from './Network3DGraph';

export interface GlobeGeoNode extends Node3D {
  lat: number;
  lng: number;
  city: string;
  country: string;
  pingMs: number;
}

interface ConsortiumGlobe3DProps {
  isAttacking: boolean;
  attackType: string;
  attackerId: string;
  quarantinedNodes: string[];
  isDark: boolean;
  customNodes?: Node3D[];
  onSelectNode?: (node: Node3D) => void;
}

const DEFAULT_GEO_NODES: GlobeGeoNode[] = [
  {
    id: 'SOL-CORE',
    label: 'OLYMPUS Gateway Hub',
    type: 'hub',
    lat: 50.1109,
    lng: 8.6821,
    city: 'Frankfurt Core',
    country: 'Germany (Central Gateway)',
    trust: 100,
    pingMs: 2,
    color: '#F59E0B',
    radius: 7,
    x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0,
    ip: '10.0.0.1 (Consortium Coordinator)',
    jurisdiction: 'EU-GDPR / BSI Gateway',
    records: 'Central Model Vault'
  },
  {
    id: 'BANK-001',
    label: 'Barclays Payments Tier-1',
    type: 'bank',
    lat: 51.5074,
    lng: -0.1278,
    city: 'London',
    country: 'United Kingdom',
    trust: 98,
    pingMs: 14,
    color: '#10B981',
    radius: 5,
    x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0,
    ip: '194.72.238.10',
    jurisdiction: 'UK-FCA / Bank of England',
    records: '3,800,000 txs'
  },
  {
    id: 'BANK-002',
    label: 'JPMorgan Chase Fraud Ops',
    type: 'bank',
    lat: 40.7128,
    lng: -74.0060,
    city: 'New York',
    country: 'United States',
    trust: 96,
    pingMs: 72,
    color: '#3B82F6',
    radius: 5,
    x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0,
    ip: '159.182.1.24',
    jurisdiction: 'US-OCC / FinCEN',
    records: '5,200,000 txs'
  },
  {
    id: 'INS-001',
    label: 'Allianz Global SIU',
    type: 'insurer',
    lat: 48.1351,
    lng: 11.5820,
    city: 'Munich',
    country: 'Germany',
    trust: 94,
    pingMs: 9,
    color: '#8B5CF6',
    radius: 5,
    x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0,
    ip: '193.159.224.5',
    jurisdiction: 'EU-GDPR / BaFin',
    records: '1,450,000 claims'
  },
  {
    id: 'LEND-001',
    label: 'UBS Credit Intelligence',
    type: 'bank',
    lat: 47.3769,
    lng: 8.5417,
    city: 'Zurich',
    country: 'Switzerland',
    trust: 92,
    pingMs: 11,
    color: '#06B6D4',
    radius: 5,
    x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0,
    ip: '141.1.22.18',
    jurisdiction: 'FINMA Banking Standards',
    records: '890,000 loans'
  },
  {
    id: 'BANK-003',
    label: 'DBS FinTech Gateway',
    type: 'bank',
    lat: 1.3521,
    lng: 103.8198,
    city: 'Singapore',
    country: 'Singapore (APAC Node)',
    trust: 94,
    pingMs: 168,
    color: '#10B981',
    radius: 5.5,
    x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0,
    ip: '202.161.42.10',
    jurisdiction: 'MAS Fintech Sandbox',
    records: '2,900,000 txs'
  },
  {
    id: 'BANK-004',
    label: 'MUFG Tokyo Node',
    type: 'bank',
    lat: 35.6762,
    lng: 139.6503,
    city: 'Tokyo',
    country: 'Japan',
    trust: 95,
    pingMs: 195,
    color: '#10B981',
    radius: 5,
    x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0,
    ip: '210.140.10.88',
    jurisdiction: 'JFSA Security Framework',
    records: '3,100,000 txs'
  }
];

function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}

function createCurvedArc(v1: THREE.Vector3, v2: THREE.Vector3, elevationRatio = 0.25): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const distance = v1.distanceTo(v2);
  const midPoint = v1.clone().add(v2).multiplyScalar(0.5);
  
  // Elevate midPoint along its normalized sphere vector
  const midNormal = midPoint.clone().normalize();
  const elevatedMid = midPoint.add(midNormal.multiplyScalar(distance * elevationRatio));

  const curve = new THREE.QuadraticBezierCurve3(v1, elevatedMid, v2);
  return curve.getPoints(40);
}

export const ConsortiumGlobe3D: React.FC<ConsortiumGlobe3DProps> = ({
  isAttacking,
  attackType,
  attackerId,
  quarantinedNodes,
  isDark,
  customNodes = [],
  onSelectNode
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [showArcs, setShowArcs] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [hoveredNode, setHoveredNode] = useState<GlobeGeoNode | null>(null);
  const [screenCoords, setScreenCoords] = useState<Array<{ node: GlobeGeoNode; x: number; y: number; visible: boolean }>>([]);

  const GLOBE_RADIUS = 140;

  // Camera orientation
  const cameraControlRef = useRef({
    theta: 0.8,
    phi: 1.1,
    radius: 360,
    targetTheta: 0.8,
    targetPhi: 1.1,
    targetRadius: 360,
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0
  });

  const stateRef = useRef({
    isAttacking,
    attackType,
    attackerId,
    quarantinedNodes,
    isDark,
    autoRotate,
    showArcs,
    showLabels,
    onSelectNode
  });

  useEffect(() => {
    stateRef.current = {
      isAttacking,
      attackType,
      attackerId,
      quarantinedNodes,
      isDark,
      autoRotate,
      showArcs,
      showLabels,
      onSelectNode
    };
  }, [isAttacking, attackType, attackerId, quarantinedNodes, isDark, autoRotate, showArcs, showLabels, onSelectNode]);

  // Combine default with any custom nodes with dynamic attack/quarantine states
  const allGeoNodes = useMemo(() => {
    const list = DEFAULT_GEO_NODES.map(node => {
      const isTarget = isAttacking && node.id === attackerId;
      const isQuarantined = quarantinedNodes.includes(node.id);
      return {
        ...node,
        trust: isQuarantined ? 0 : isTarget ? 40 : node.trust,
        color: isQuarantined || isTarget ? '#EF4444' : node.color,
        type: (isQuarantined || isTarget ? 'attacker' : node.type) as any
      };
    });

    customNodes.forEach((cn, idx) => {
      const isTarget = isAttacking && cn.id === attackerId;
      const isQuarantined = quarantinedNodes.includes(cn.id);
      list.push({
        ...cn,
        lat: 25.0 + (idx * 15.0),
        lng: 45.0 + (idx * 20.0),
        city: `${cn.label} Node`,
        country: cn.jurisdiction || 'Consortium Member',
        pingMs: 35 + (idx * 12),
        trust: isQuarantined ? 0 : isTarget ? 40 : cn.trust,
        color: isQuarantined || isTarget ? '#EF4444' : cn.color,
        type: (isQuarantined || isTarget ? 'attacker' : cn.type) as any
      });
    });
    return list;
  }, [customNodes, isAttacking, attackerId, quarantinedNodes]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 800;
    const height = mount.clientHeight || 520;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(isDark ? 0x030712 : 0xf8fafc, 0.0018);

    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 2500);
    cameraRef.current = camera;

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;
    mount.innerHTML = '';
    mount.appendChild(renderer.domElement);

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(isDark ? 0x223355 : 0x64748b, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight1.position.set(250, 200, 300);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 1.0);
    dirLight2.position.set(-200, -100, -250);
    scene.add(dirLight2);

    // 4. Globe Sphere Base
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    const sphereGeom = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
    const sphereMat = new THREE.MeshPhongMaterial({
      color: isDark ? 0x050d1a : 0xe2e8f0,
      emissive: isDark ? 0x020617 : 0x0f172a,
      emissiveIntensity: 0.4,
      specular: 0x38bdf8,
      shininess: 25,
      transparent: true,
      opacity: 0.95,
      wireframe: false
    });
    const globeMesh = new THREE.Mesh(sphereGeom, sphereMat);
    globeGroup.add(globeMesh);

    // Wireframe Grid Overlay (Latitude & Longitude lines)
    const wireGeom = new THREE.WireframeGeometry(new THREE.SphereGeometry(GLOBE_RADIUS * 1.002, 32, 16));
    const wireMat = new THREE.LineBasicMaterial({
      color: isDark ? 0x1e293b : 0x94a3b8,
      transparent: true,
      opacity: isDark ? 0.35 : 0.45
    });
    const wireLine = new THREE.LineSegments(wireGeom, wireMat);
    globeGroup.add(wireLine);

    // Equator Ring
    const equatorGeom = new THREE.RingGeometry(GLOBE_RADIUS * 1.006, GLOBE_RADIUS * 1.012, 64);
    const equatorMat = new THREE.MeshBasicMaterial({
      color: isDark ? 0x38bdf8 : 0x0284c7,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4
    });
    const equatorMesh = new THREE.Mesh(equatorGeom, equatorMat);
    equatorMesh.rotation.x = Math.PI / 2;
    globeGroup.add(equatorMesh);

    // Glowing Atmosphere Shell
    const atmoGeom = new THREE.SphereGeometry(GLOBE_RADIUS * 1.15, 48, 48);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: isDark ? 0x0284c7 : 0x38bdf8,
      side: THREE.BackSide,
      transparent: true,
      opacity: isDark ? 0.08 : 0.05
    });
    const atmoMesh = new THREE.Mesh(atmoGeom, atmoMat);
    globeGroup.add(atmoMesh);

    // 5. Node Pins & Markers
    const pinGroup = new THREE.Group();
    globeGroup.add(pinGroup);

    const pinMeshes: Array<{ node: GlobeGeoNode; pin: THREE.Mesh; pos: THREE.Vector3; beacon: THREE.Mesh }> = [];

    allGeoNodes.forEach(node => {
      const pos = latLngToVector3(node.lat, node.lng, GLOBE_RADIUS);
      const isHub = node.type === 'hub';

      // Pin Sphere
      const pinGeom = new THREE.SphereGeometry(isHub ? 5.5 : 3.8, 24, 24);
      const pinMat = new THREE.MeshStandardMaterial({
        color: node.color,
        emissive: node.color,
        emissiveIntensity: 0.8,
        roughness: 0.2,
        metalness: 0.8
      });
      const pinMesh = new THREE.Mesh(pinGeom, pinMat);
      pinMesh.position.copy(pos);
      pinGroup.add(pinMesh);

      // Elevated Surface Stand
      const standDir = pos.clone().normalize();
      const standGeom = new THREE.CylinderGeometry(0.8, 0.8, 6, 8);
      const standMat = new THREE.MeshBasicMaterial({ color: node.color, transparent: true, opacity: 0.6 });
      const standMesh = new THREE.Mesh(standGeom, standMat);
      standMesh.position.copy(pos.clone().add(standDir.clone().multiplyScalar(3)));
      standMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), standDir);
      pinGroup.add(standMesh);

      // Pulse Beacon Ring
      const beaconGeom = new THREE.RingGeometry(4, 5.5, 24);
      const beaconMat = new THREE.MeshBasicMaterial({
        color: node.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7
      });
      const beacon = new THREE.Mesh(beaconGeom, beaconMat);
      beacon.position.copy(pos.clone().add(standDir.clone().multiplyScalar(0.5)));
      beacon.lookAt(pos.clone().add(standDir));
      pinGroup.add(beacon);

      pinMeshes.push({ node, pin: pinMesh, pos, beacon });
    });

    // 6. Consortium Arcs (P2P Mesh)
    const arcGroup = new THREE.Group();
    globeGroup.add(arcGroup);

    const hubNode = allGeoNodes.find(n => n.type === 'hub') || allGeoNodes[0];
    const hubPos = latLngToVector3(hubNode.lat, hubNode.lng, GLOBE_RADIUS);

    const arcDataList: Array<{ line: THREE.Line; points: THREE.Vector3[]; targetId: string }> = [];

    allGeoNodes.forEach(node => {
      if (node.id === hubNode.id) return;
      const targetPos = latLngToVector3(node.lat, node.lng, GLOBE_RADIUS);
      const arcPoints = createCurvedArc(hubPos, targetPos, 0.22);

      const arcGeom = new THREE.BufferGeometry().setFromPoints(arcPoints);
      const arcMat = new THREE.LineBasicMaterial({
        color: isDark ? 0x38bdf8 : 0x0284c7,
        transparent: true,
        opacity: isDark ? 0.45 : 0.55,
        linewidth: 1
      });
      const arcLine = new THREE.Line(arcGeom, arcMat);
      arcGroup.add(arcLine);

      arcDataList.push({ line: arcLine, points: arcPoints, targetId: node.id });
    });

    // Arc Flying Packet Pulses
    const packetGeom = new THREE.SphereGeometry(1.5, 12, 12);
    const packetMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const packets = arcDataList.map(() => {
      const p = new THREE.Mesh(packetGeom, packetMat);
      arcGroup.add(p);
      return p;
    });

    // 7. Mouse and Drag Handlers
    const ctrl = cameraControlRef.current;

    const onMouseDown = (e: MouseEvent) => {
      ctrl.isDragging = true;
      ctrl.lastMouseX = e.clientX;
      ctrl.lastMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = mount.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (ctrl.isDragging) {
        const deltaX = e.clientX - ctrl.lastMouseX;
        const deltaY = e.clientY - ctrl.lastMouseY;
        ctrl.targetTheta -= deltaX * 0.005;
        ctrl.targetPhi -= deltaY * 0.005;
        ctrl.targetPhi = Math.max(0.1, Math.min(Math.PI - 0.1, ctrl.targetPhi));
        ctrl.lastMouseX = e.clientX;
        ctrl.lastMouseY = e.clientY;
      }

      // Raycasting for Hover Tooltip
      const mouseNormX = (mouseX / width) * 2 - 1;
      const mouseNormY = -(mouseY / height) * 2 + 1;
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseNormX, mouseNormY), camera);

      const intersects = raycaster.intersectObjects(pinMeshes.map(pm => pm.pin));
      if (intersects.length > 0) {
        const hit = pinMeshes.find(pm => pm.pin === intersects[0].object);
        if (hit) {
          setHoveredNode(hit.node);
          return;
        }
      }
      setHoveredNode(null);
    };

    const onMouseUp = () => {
      ctrl.isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      ctrl.targetRadius += e.deltaY * 0.25;
      ctrl.targetRadius = Math.max(200, Math.min(650, ctrl.targetRadius));
    };

    const onClick = (e: MouseEvent) => {
      const rect = mount.getBoundingClientRect();
      const mouseNormX = ((e.clientX - rect.left) / width) * 2 - 1;
      const mouseNormY = -((e.clientY - rect.top) / height) * 2 + 1;
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseNormX, mouseNormY), camera);

      const intersects = raycaster.intersectObjects(pinMeshes.map(pm => pm.pin));
      if (intersects.length > 0) {
        const hit = pinMeshes.find(pm => pm.pin === intersects[0].object);
        if (hit && stateRef.current.onSelectNode) {
          stateRef.current.onSelectNode(hit.node);
        }
      }
    };

    mount.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    mount.addEventListener('wheel', onWheel, { passive: false });
    mount.addEventListener('click', onClick);

    // 8. Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Camera Damping
      ctrl.theta += (ctrl.targetTheta - ctrl.theta) * 0.08;
      ctrl.phi += (ctrl.targetPhi - ctrl.phi) * 0.08;
      ctrl.radius += (ctrl.targetRadius - ctrl.radius) * 0.08;

      if (stateRef.current.autoRotate && !ctrl.isDragging) {
        ctrl.targetTheta += 0.0018;
      }

      camera.position.x = ctrl.radius * Math.sin(ctrl.phi) * Math.sin(ctrl.theta);
      camera.position.y = ctrl.radius * Math.cos(ctrl.phi);
      camera.position.z = ctrl.radius * Math.sin(ctrl.phi) * Math.cos(ctrl.theta);
      camera.lookAt(0, 0, 0);

      // Animate Beacons Pulse
      pinMeshes.forEach((pm, i) => {
        const isTargeted = stateRef.current.isAttacking && pm.node.id === stateRef.current.attackerId;
        const isQuarantined = stateRef.current.quarantinedNodes.includes(pm.node.id);

        if (isTargeted || isQuarantined) {
          (pm.pin.material as THREE.MeshStandardMaterial).color.setHex(0xef4444);
          (pm.pin.material as THREE.MeshStandardMaterial).emissive.setHex(0xef4444);
        } else {
          (pm.pin.material as THREE.MeshStandardMaterial).color.setStyle(pm.node.color);
          (pm.pin.material as THREE.MeshStandardMaterial).emissive.setStyle(pm.node.color);
        }

        const scale = 1.0 + Math.sin(elapsedTime * 3.5 + i) * 0.35;
        pm.beacon.scale.set(scale, scale, scale);
      });

      // Animate Packet Pulses along Arcs
      arcDataList.forEach((ad, i) => {
        const isTargeted = stateRef.current.isAttacking && ad.targetId === stateRef.current.attackerId;
        const packet = packets[i];
        const t = (elapsedTime * 0.8 + i * 0.2) % 1;
        const ptIdx = Math.floor(t * (ad.points.length - 1));
        const pt = ad.points[ptIdx] || ad.points[0];
        packet.position.copy(pt);

        if (isTargeted) {
          (ad.line.material as THREE.LineBasicMaterial).color.setHex(0xef4444);
          (packet.material as THREE.MeshBasicMaterial).color.setHex(0xef4444);
        } else {
          (ad.line.material as THREE.LineBasicMaterial).color.setHex(stateRef.current.isDark ? 0x38bdf8 : 0x0284c7);
          (packet.material as THREE.MeshBasicMaterial).color.setHex(0x38bdf8);
        }
      });

      // Compute 2D Screen Coordinates for HTML Labels
      if (stateRef.current.showLabels) {
        const labels = pinMeshes.map(pm => {
          const worldPos = pm.pin.position.clone();
          const screenPos = worldPos.project(camera);

          // Check if behind the globe horizon
          const camDir = camera.position.clone().normalize();
          const nodeDir = worldPos.clone().normalize();
          const dot = camDir.dot(nodeDir);

          const x = (screenPos.x * 0.5 + 0.5) * width;
          const y = (-(screenPos.y * 0.5) + 0.5) * height;

          return {
            node: pm.node,
            x,
            y,
            visible: dot > -0.15 && screenPos.z < 1.0
          };
        });
        setScreenCoords(labels);
      }

      renderer.render(scene, camera);
    };

    animate();

    // 9. Resize Handler
    const handleResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      mount.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      mount.removeEventListener('wheel', onWheel);
      mount.removeEventListener('click', onClick);
      renderer.dispose();
    };
  }, [allGeoNodes, isDark]);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full rounded-2xl overflow-hidden border transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen bg-[#000000]' : 'h-[540px]'
      } ${
        isDark ? 'bg-[#000000] border-white/10' : 'bg-white border-black/10'
      }`}
    >
      {/* 3D WebGL Canvas */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing select-none" />

      {/* Floating 2D Screen Node Labels */}
      {showLabels && screenCoords.map(({ node, x, y, visible }) => {
        if (!visible) return null;
        const isTargeted = isAttacking && node.id === attackerId;
        const isQuarantined = quarantinedNodes.includes(node.id);

        return (
          <div
            key={node.id}
            style={{ transform: `translate(${x}px, ${y}px) translate(-50%, -120%)` }}
            onClick={(e) => {
              e.stopPropagation();
              if (onSelectNode) onSelectNode(node);
            }}
            className={`absolute pointer-events-auto cursor-pointer transition-transform hover:scale-110 px-2.5 py-1 rounded-md text-[11px] font-mono tracking-tight flex items-center gap-1.5 shadow-lg border backdrop-blur-md ${
              isTargeted || isQuarantined
                ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                : node.type === 'hub'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : isDark
                ? 'bg-black/75 text-white/90 border-white/15'
                : 'bg-white/85 text-black border-black/15'
            }`}
          >
            <span 
              className="w-2 h-2 rounded-full inline-block shrink-0" 
              style={{ backgroundColor: isTargeted || isQuarantined ? '#EF4444' : node.color }} 
            />
            <span className="font-semibold">{node.id}</span>
            <span className="text-[9px] opacity-75">({node.city})</span>
          </div>
        );
      })}

      {/* Hovered Node Detailed Card */}
      {hoveredNode && (
        <div className={`absolute top-4 left-4 p-4 rounded-xl border backdrop-blur-md shadow-2xl z-20 pointer-events-none max-w-xs transition-all ${
          isDark ? 'bg-black/85 border-white/15 text-white' : 'bg-white/90 border-black/15 text-black'
        }`}>
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: hoveredNode.color }} />
              <h4 className="font-bold text-sm">{hoveredNode.id}</h4>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
              quarantinedNodes.includes(hoveredNode.id)
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}>
              {quarantinedNodes.includes(hoveredNode.id) ? 'QUARANTINED' : `TRUST ${hoveredNode.trust}%`}
            </span>
          </div>
          <p className="text-xs opacity-80 mb-2">{hoveredNode.label}</p>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono opacity-70 border-t pt-2 border-white/10">
            <div>
              <span className="block text-[9px] uppercase tracking-wider opacity-60">Location</span>
              {hoveredNode.city}, {hoveredNode.country}
            </div>
            <div>
              <span className="block text-[9px] uppercase tracking-wider opacity-60">Latency</span>
              {hoveredNode.pingMs} ms (P2P)
            </div>
            <div className="col-span-2">
              <span className="block text-[9px] uppercase tracking-wider opacity-60">Jurisdiction</span>
              {hoveredNode.jurisdiction || 'Consortium Member'}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Controls Overlay Header */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`p-2 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-colors ${
            autoRotate
              ? 'bg-sky-500/20 text-sky-400 border-sky-500/30'
              : isDark
              ? 'bg-black/60 text-white/60 border-white/10 hover:text-white'
              : 'bg-white/80 text-black/60 border-black/10 hover:text-black'
          }`}
          title="Toggle Auto Rotation"
        >
          {autoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">Spin</span>
        </button>

        <button
          onClick={() => setShowLabels(!showLabels)}
          className={`p-2 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-colors ${
            showLabels
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              : isDark
              ? 'bg-black/60 text-white/60 border-white/10 hover:text-white'
              : 'bg-white/80 text-black/60 border-black/10 hover:text-black'
          }`}
          title="Toggle Node Pins & Labels"
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Pins</span>
        </button>

        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className={`p-2 rounded-lg border text-xs font-mono transition-colors ${
            isDark ? 'bg-black/60 text-white/60 border-white/10 hover:text-white' : 'bg-white/80 text-black/60 border-black/10 hover:text-black'
          }`}
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen 3D Globe'}
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Geolocation Telemetry Footer Ribbon */}
      <div className={`absolute bottom-3 inset-x-3 px-4 py-2.5 rounded-xl border backdrop-blur-md flex items-center justify-between text-xs font-mono z-20 ${
        isDark ? 'bg-black/80 border-white/10 text-white/80' : 'bg-white/85 border-black/10 text-black/80'
      }`}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sky-400 font-semibold">
            <Globe className="w-3.5 h-3.5" />
            <span>GLOBAL P2P TOPOLOGY</span>
          </div>
          <span className="hidden md:inline text-white/30">|</span>
          <div className="hidden md:flex items-center gap-1.5 text-emerald-400">
            <Wifi className="w-3.5 h-3.5" />
            <span>6 Consortium Hubs Linked</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <span>Central Gateway: <strong className="text-amber-400">Frankfurt (SOL-CORE)</strong></span>
          <span className="hidden sm:inline">Encrypted Mesh: <strong className="text-emerald-400">mTLS / SecAgg+</strong></span>
        </div>
      </div>
    </div>
  );
};
