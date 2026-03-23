import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface TabletProps {
  onActivate: () => void;
  onToggleAudio: () => void;
  isCoreLightOn: boolean;
  onToggleCoreLight: () => void;
  isOpen: boolean;
}

// Pill shape centered at origin: spans from -w to +w, -h to +h
function makePillShape(w: number, h: number) {
  const s = new THREE.Shape();
  const r = h; // radius = half-height → full oval ends
  s.moveTo(-w + r, -h);
  s.lineTo(w - r,  -h);
  s.quadraticCurveTo(w,  -h, w,  0);
  s.quadraticCurveTo(w,   h, w - r, h);
  s.lineTo(-w + r,  h);
  s.quadraticCurveTo(-w,  h, -w, 0);
  s.quadraticCurveTo(-w, -h, -w + r, -h);
  return s;
}

export const Tablet: React.FC<TabletProps> = ({ onActivate, onToggleAudio, isCoreLightOn, onToggleCoreLight, isOpen }) => {
  const groupRef  = useRef<THREE.Group>(null);
  const glassRef  = useRef<THREE.Mesh>(null);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  // Outer body shape: 1.6 wide × 0.35 tall
  const bodyShape  = useMemo(() => makePillShape(1.8, 0.35), []);
  // Inner glass:  1.65 wide × 0.28 tall (Wider to accommodate 3 buttons)
  const glassShape = useMemo(() => makePillShape(1.65, 0.28), []);
  const extSettings = useMemo(() => ({
    depth: 0.06,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 5,
  }), []);

  useFrame((state) => {
    if (!groupRef.current || isOpen) return;
    const t = state.clock.getElapsedTime();
    // Pressed to the top: fixed position with minimal drift
    groupRef.current.position.y = 1.88;
    groupRef.current.rotation.z = Math.sin(t * 0.1) * 0.002;

    // Animate glass glow
    if (glassRef.current) {
      const m = glassRef.current.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = hoveredZone
        ? 0.7 + Math.sin(t * 5) * 0.15
        : 0.2 + Math.sin(t * 1.5) * 0.05;
    }
  });

  if (isOpen) return null;

  const handlePointerOver = (zone: string) => {
    setHoveredZone(zone);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    setHoveredZone(null);
    document.body.style.cursor = 'auto';
  };

  return (
    <group ref={groupRef} position={[0, 1.88, 0]}>
      {/* ── MAIN BODY ── */}
      <mesh castShadow position={[0, 0, -0.03]}>
        <extrudeGeometry args={[bodyShape, extSettings]} />
        <meshStandardMaterial
          color="#0a0f1a"
          metalness={0.98}
          roughness={0.05}
          emissive={hoveredZone ? '#0e3a5a' : '#020a0f'}
          emissiveIntensity={hoveredZone ? 0.6 : 0.15}
        />
      </mesh>

      {/* ── INSTRUMENT GLASS ── */}
      <mesh ref={glassRef} position={[0, 0, 0.03]}>
        <shapeGeometry args={[glassShape]} />
        <meshStandardMaterial
          color="#010d14"
          metalness={1}
          roughness={0.0}
          emissive="#22d3ee"
          emissiveIntensity={0.2}
          transparent
          opacity={0.96}
        />
      </mesh>

      {/* ── DECORATIVE FRAME LINES ── */}
      <group position={[0, 0, 0.032]}>
         <mesh position={[0, 0.14, 0]}>
           <planeGeometry args={[2.9, 0.002]} />
           <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" transparent opacity={0.3} />
         </mesh>
         <mesh position={[0, -0.14, 0]}>
           <planeGeometry args={[2.9, 0.002]} />
           <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" transparent opacity={0.3} />
         </mesh>
      </group>

      {/* ── HUD / BUTTONS ── */}
      <group position={[0, 0.02, 0.045]}>
        {/* BRAND LABEL REMOVED AS REQUESTED */}

        {/* BUTTON 1: INITIALIZE PROJECT */}
        <group 
          position={[-0.55, 0, 0]} 
          onPointerOver={() => handlePointerOver('briefing')}
          onPointerOut={handlePointerOut}
          onClick={(e) => { e.stopPropagation(); onActivate(); }}
        >
           <mesh>
              <planeGeometry args={[0.45, 0.18]} />
              <meshStandardMaterial 
                color={hoveredZone === 'briefing' ? '#22d3ee' : '#e5e7eb'} 
                transparent 
                opacity={hoveredZone === 'briefing' ? 0.2 : 0.05} 
              />
           </mesh>
           <Text
              fontSize={0.05}
              color={hoveredZone === 'briefing' ? '#22d3ee' : '#f8fafc'}
              anchorX="center"
              anchorY="middle"
              letterSpacing={0.1}
            >
              PROJECT
            </Text>
            <Text
              position={[0, -0.06, 0]}
              fontSize={0.018}
              color="#22d3ee"
              anchorX="center"
              fillOpacity={0.4}
            >
              INITIALIZE
            </Text>
        </group>

        {/* BUTTON 2: CORE LIGHT (NEW) */}
        <group 
          position={[0, 0, 0]} 
          onPointerOver={() => handlePointerOver('light')}
          onPointerOut={handlePointerOut}
          onClick={(e) => { e.stopPropagation(); onToggleCoreLight(); }}
        >
           <mesh>
              <planeGeometry args={[0.45, 0.18]} />
              <meshStandardMaterial 
                color={hoveredZone === 'light' ? '#22d3ee' : (isCoreLightOn ? '#facc15' : '#e5e7eb')} 
                transparent 
                opacity={hoveredZone === 'light' ? 0.2 : 0.05} 
              />
           </mesh>
           <Text
              fontSize={0.05}
              color={hoveredZone === 'light' ? '#22d3ee' : (isCoreLightOn ? '#facc15' : '#f8fafc')}
              anchorX="center"
              anchorY="middle"
              letterSpacing={0.1}
            >
              LIGHT
            </Text>
            <Text
              position={[0, -0.06, 0]}
              fontSize={0.018}
              color={isCoreLightOn ? '#facc15' : '#22d3ee'}
              anchorX="center"
              fillOpacity={0.4}
            >
              {isCoreLightOn ? 'CORE EMITTING' : 'TOGGLE GLOW'}
            </Text>
        </group>

        {/* BUTTON 3: AUDIO ENGINE */}
        <group 
          position={[0.55, 0, 0]} 
          onPointerOver={() => handlePointerOver('audio')}
          onPointerOut={handlePointerOut}
          onClick={(e) => { e.stopPropagation(); onToggleAudio(); }}
        >
           <mesh>
              <planeGeometry args={[0.45, 0.18]} />
              <meshStandardMaterial 
                color={hoveredZone === 'audio' ? '#22d3ee' : '#e5e7eb'} 
                transparent 
                opacity={hoveredZone === 'audio' ? 0.2 : 0.05} 
              />
           </mesh>
           <Text
              fontSize={0.05}
              color={hoveredZone === 'audio' ? '#22d3ee' : '#f8fafc'}
              anchorX="center"
              anchorY="middle"
              letterSpacing={0.1}
            >
              AUDIO
            </Text>
            <Text
              position={[0, -0.06, 0]}
              fontSize={0.018}
              color="#22d3ee"
              anchorX="center"
              fillOpacity={0.4}
            >
              ENGINE
            </Text>
        </group>

        {/* SYSTEM STATUS */}
        <Text
          position={[1.2, 0.05, 0]}
          fontSize={0.03}
          color="#4ade80"
          anchorX="right"
          anchorY="middle"
        >
          ● SYSTEM READY
        </Text>
        <Text
          position={[1.2, -0.02, 0]}
          fontSize={0.02}
          color="white"
          anchorX="right"
          anchorY="middle"
          fillOpacity={0.5}
        >
          UPTIME: 99.9%
        </Text>
      </group>

      {/* ── MOUNTING CLIPS ── */}
      {([-0.9, 0.9] as number[]).map((x, i) => (
        <group key={i} position={[x, 0.38, 0]}>
          <mesh>
            <boxGeometry args={[0.04, 0.5, 0.04]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* ── LIGHTING ── */}
      <pointLight 
        position={[0, 0, 0.5]} 
        color="#22d3ee" 
        intensity={hoveredZone ? 3.5 : 1.2} 
        distance={2.5} 
      />
    </group>
  );
};
