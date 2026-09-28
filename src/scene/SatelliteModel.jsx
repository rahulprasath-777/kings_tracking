import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Realistic 3D Procedural Satellite Model: TARGET-SAT-01
 * 
 * Features:
 * - Bus / Main body with multi-layer insulation (MLI) gold/silver foil look
 * - Two deployable articulated solar array wings with photovoltaic blue-tint cells and grid lines
 * - High-Gain Antenna (HGA) parabolic reflector dish with feed horn
 * - Free Space Optical Communication (FSOC) optical transmitter head
 * - Emissive optical beacon (high intensity laser beacon for terminal acquisition)
 * - 4x Reaction Control System (RCS) quad thruster clusters
 * - Star tracker camera optical baffles
 */
export function SatelliteModel({
  position = [0, 8, 28],
  _name = 'TARGET-SAT-01',
  isTarget = true,
  hidden = false,
  colorScheme = 'target' // 'target' (green/gold/cyan) | 'secondary-blue' | 'secondary-amber'
}) {
  const satRef = useRef();
  const beaconRef = useRef();
  const solarPanelLeftRef = useRef();
  const solarPanelRightRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (beaconRef.current) {
      // Pulsing optical beacon
      const intensity = 2.0 + Math.sin(t * 8) * 1.5;
      beaconRef.current.intensity = intensity;
    }

    if (satRef.current) {
      // Subtle nadir-pointing attitude oscillation
      satRef.current.rotation.y = Math.sin(t * 0.2) * 0.15;
      satRef.current.rotation.z = Math.cos(t * 0.15) * 0.08;
    }
  });

  if (hidden) return null;

  // Colors based on identity
  const isTargetSat = isTarget || colorScheme === 'target';
  const beaconColor = isTargetSat ? '#00FF88' : (colorScheme === 'secondary-blue' ? '#00E5FF' : '#FFB020');
  const busColor = isTargetSat ? '#D4AF37' : '#90A4AE'; // Gold foil for primary, aluminum for secondary

  return (
    <group ref={satRef} position={position}>
      {/* ---------------- SATELLITE BUS / BODY ---------------- */}
      {/* Main Bus Cuboid with Chamfered Foil Look */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.6, 1.8, 2.2]} />
        <meshStandardMaterial
          color={busColor}
          metalness={0.88}
          roughness={0.28}
          envMapIntensity={1.5}
        />
      </mesh>

      {/* Silver Electronics Bay Panels on sides */}
      <mesh position={[0, 0, 1.12]}>
        <boxGeometry args={[1.4, 1.5, 0.05]} />
        <meshStandardMaterial color="#CFD8DC" metalness={0.92} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0, -1.12]}>
        <boxGeometry args={[1.4, 1.5, 0.05]} />
        <meshStandardMaterial color="#CFD8DC" metalness={0.92} roughness={0.2} />
      </mesh>

      {/* Radiator Louvers on bus top */}
      <mesh position={[0, 0.92, 0]}>
        <boxGeometry args={[1.3, 0.05, 1.8]} />
        <meshStandardMaterial color="#37474F" metalness={0.7} roughness={0.4} />
      </mesh>

      {/* ---------------- SOLAR PANEL ARRAYS ---------------- */}
      {/* Left Solar Panel Boom */}
      <mesh position={[-1.3, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.06, 0.06, 1.0, 12]} />
        <meshStandardMaterial color="#263238" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Left Wing (3 Interconnected Panel Segments) */}
      <group ref={solarPanelLeftRef} position={[-4.2, 0, 0]}>
        {/* Panel 1 */}
        <mesh position={[1.4, 0, 0]}>
          <boxGeometry args={[1.6, 1.4, 0.04]} />
          <meshStandardMaterial color="#0A1D3A" metalness={0.5} roughness={0.2} />
        </mesh>
        {/* Panel 2 */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.6, 1.4, 0.04]} />
          <meshStandardMaterial color="#0A1D3A" metalness={0.5} roughness={0.2} />
        </mesh>
        {/* Panel 3 */}
        <mesh position={[-1.4, 0, 0]}>
          <boxGeometry args={[1.6, 1.4, 0.04]} />
          <meshStandardMaterial color="#0A1D3A" metalness={0.5} roughness={0.2} />
        </mesh>
        {/* Panel Frame Border */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[4.6, 1.46, 0.03]} />
          <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.3} />
        </mesh>
      </group>

      {/* Right Solar Panel Boom */}
      <mesh position={[1.3, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.06, 0.06, 1.0, 12]} />
        <meshStandardMaterial color="#263238" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Right Wing (3 Interconnected Panel Segments) */}
      <group ref={solarPanelRightRef} position={[4.2, 0, 0]}>
        {/* Panel 1 */}
        <mesh position={[-1.4, 0, 0]}>
          <boxGeometry args={[1.6, 1.4, 0.04]} />
          <meshStandardMaterial color="#0A1D3A" metalness={0.5} roughness={0.2} />
        </mesh>
        {/* Panel 2 */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.6, 1.4, 0.04]} />
          <meshStandardMaterial color="#0A1D3A" metalness={0.5} roughness={0.2} />
        </mesh>
        {/* Panel 3 */}
        <mesh position={[1.4, 0, 0]}>
          <boxGeometry args={[1.6, 1.4, 0.04]} />
          <meshStandardMaterial color="#0A1D3A" metalness={0.5} roughness={0.2} />
        </mesh>
        {/* Panel Frame Border */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[4.6, 1.46, 0.03]} />
          <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.3} />
        </mesh>
      </group>

      {/* ---------------- HIGH-GAIN ANTENNA DISH ---------------- */}
      <group position={[0, 1.4, -0.4]} rotation={[-0.4, 0.3, 0]}>
        {/* Antenna gimbal arm */}
        <mesh position={[0, -0.3, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.6, 8]} />
          <meshStandardMaterial color="#455A64" metalness={0.8} />
        </mesh>
        {/* Parabolic reflector dish */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <sphereGeometry args={[0.75, 24, 16, 0, Math.PI * 2, 0, Math.PI / 3]} />
          <meshStandardMaterial color="#ECEFF1" metalness={0.85} roughness={0.2} side={THREE.DoubleSide} />
        </mesh>
        {/* Feed Horn Struts */}
        <mesh position={[0, 0, 0.4]}>
          <coneGeometry args={[0.08, 0.25, 8]} />
          <meshStandardMaterial color="#D4AF37" metalness={0.9} />
        </mesh>
      </group>

      {/* ---------------- FSOC OPTICAL COMMUNICATION PAYLOAD ---------------- */}
      {/* Optical Bench / Telescope Housing facing forward */}
      <group position={[0, 0.2, 1.25]} rotation={[0, 0, 0]}>
        {/* Telescope Barrel */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.35, 0.7, 24]} />
          <meshStandardMaterial color="#1E293B" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Lens Aperture Ring */}
        <mesh position={[0, 0, 0.36]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.26, 0.04, 16, 32]} />
          <meshStandardMaterial color="#00E5FF" metalness={0.95} roughness={0.1} />
        </mesh>
        {/* Optical Glass Lens */}
        <mesh position={[0, 0, 0.34]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.24, 24]} />
          <meshStandardMaterial
            color="#00E5FF"
            emissive="#00E5FF"
            emissiveIntensity={0.6}
            roughness={0.1}
            metalness={0.9}
          />
        </mesh>
      </group>

      {/* ---------------- GLOWING OPTICAL BEACON (REFERENCE TARGET) ---------------- */}
      {/* Optical beacon for acquisition */}
      <group position={[0, 0.95, 0.8]}>
        {/* Central glowing beacon sphere */}
        <mesh>
          <sphereGeometry args={[0.22, 20, 20]} />
          <meshBasicMaterial color={beaconColor} />
        </mesh>
        {/* Outer subtle glow halo */}
        <mesh>
          <sphereGeometry args={[0.42, 16, 16]} />
          <meshBasicMaterial color={beaconColor} transparent opacity={0.35} />
        </mesh>
        {/* High-intensity Point Light */}
        <pointLight
          ref={beaconRef}
          color={beaconColor}
          intensity={3.5}
          distance={45}
          decay={1.2}
        />
      </group>

      {/* ---------------- RCS THRUSTER QUAD CLUSTERS ---------------- */}
      {/* 4 Corner thruster modules */}
      {[
        [-0.8, -0.8, -1.0],
        [0.8, -0.8, -1.0],
        [-0.8, -0.8, 1.0],
        [0.8, -0.8, 1.0]
      ].map((pos, idx) => (
        <group key={idx} position={pos}>
          <mesh>
            <boxGeometry args={[0.15, 0.15, 0.15]} />
            <meshStandardMaterial color="#37474F" />
          </mesh>
          {/* Nozzle */}
          <mesh position={[0, -0.12, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.07, 0.15, 8]} />
            <meshStandardMaterial color="#B0BEC5" metalness={0.9} />
          </mesh>
        </group>
      ))}

      {/* ---------------- TARGET SATELLITE NAME BILLBOARD / RING ---------------- */}
      {isTargetSat && (
        <group position={[0, 2.2, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.8, 1.88, 36]} />
            <meshBasicMaterial color="#00FF88" side={THREE.DoubleSide} transparent opacity={0.65} />
          </mesh>
          {/* Subtle spinning reticle ring */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[2.1, 2.15, 12]} />
            <meshBasicMaterial color="#00E5FF" side={THREE.DoubleSide} transparent opacity={0.4} />
          </mesh>
        </group>
      )}
    </group>
  );
}
