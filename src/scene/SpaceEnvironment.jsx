import React, { useMemo } from 'react';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Aerospace Space Environment
 * 
 * Features:
 * - 3D Earth globe in deep background with continent shading & atmospheric glow
 * - 6,000 realistic stars
 * - Active orbital trajectory line computed from current trajectory equation
 * - Space coordinate reference grid and distance rings
 */
export function SpaceEnvironment({
  trajectory = 'elliptical',
  orbitRadius = 28,
  altitude = 8,
  showGrid = true
}) {
  // Pre-calculate orbit trajectory loop points
  const orbitPoints = useMemo(() => {
    const points = [];
    const segments = 120;
    const r = orbitRadius;
    const alt = altitude;

    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 2 * 4; // Multiple cycles
      let x = 0, y = alt, z = 0;

      switch (trajectory) {
        case 'circular':
          x = r * Math.sin((i / segments) * Math.PI * 2);
          z = r * Math.cos((i / segments) * Math.PI * 2);
          y = alt;
          break;

        case 'elliptical':
          x = r * 1.35 * Math.sin((i / segments) * Math.PI * 2);
          z = r * 0.85 * Math.cos((i / segments) * Math.PI * 2);
          y = alt + Math.sin((i / segments) * Math.PI * 4) * 4.5;
          break;

        case 'linear':
          x = ((i / segments) * 80) - 40;
          z = 24;
          y = alt;
          break;

        case 'sine':
          x = r * Math.sin((i / segments) * Math.PI * 2);
          z = r * Math.cos((i / segments) * Math.PI * 2);
          y = alt + Math.sin((i / segments) * Math.PI * 6) * 6;
          break;

        case 'spiral':
          const spiralR = 15 + Math.sin(t * 0.1) * 12;
          x = spiralR * Math.sin((i / segments) * Math.PI * 2);
          z = spiralR * Math.cos((i / segments) * Math.PI * 2);
          y = alt;
          break;

        default:
          x = r * Math.sin((i / segments) * Math.PI * 2);
          z = r * Math.cos((i / segments) * Math.PI * 2);
          break;
      }
      points.push(new THREE.Vector3(x, y, z));
    }
    return points;
  }, [trajectory, orbitRadius, altitude]);

  const orbitLineGeo = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(orbitPoints);
  }, [orbitPoints]);

  return (
    <group>
      {/* ---------------- DEEP SPACE STARFIELD ---------------- */}
      <Stars
        radius={150}
        depth={60}
        count={7000}
        factor={4}
        saturation={0.3}
        fade
        speed={0.4}
      />

      {/* ---------------- DISTANT EARTH GLOBE ---------------- */}
      <group position={[35, -45, -90]} rotation={[0.4, 0.6, -0.2]}>
        {/* Earth Planet Sphere */}
        <mesh>
          <sphereGeometry args={[26, 48, 48]} />
          <meshStandardMaterial
            color="#1E3A8A"
            roughness={0.7}
            metalness={0.1}
          />
        </mesh>

        {/* Continents overlay color patch */}
        <mesh scale={[1.002, 1.002, 1.002]}>
          <sphereGeometry args={[26, 32, 32]} />
          <meshStandardMaterial
            color="#15803D"
            wireframe={false}
            transparent
            opacity={0.35}
            roughness={0.9}
          />
        </mesh>

        {/* Atmosphere Glowing Halo */}
        <mesh scale={[1.035, 1.035, 1.035]}>
          <sphereGeometry args={[26, 36, 36]} />
          <meshBasicMaterial
            color="#38BDF8"
            transparent
            opacity={0.25}
            side={THREE.BackSide}
          />
        </mesh>

        {/* Earth Horizon Rim Light */}
        <pointLight color="#60A5FA" intensity={2.5} distance={120} decay={1.5} />
      </group>

      {/* ---------------- ORBITAL TRAJECTORY LINE ---------------- */}
      <primitive object={new THREE.Line(orbitLineGeo, new THREE.LineDashedMaterial({
        color: 0x00E5FF,
        dashSize: 1.2,
        gapSize: 0.8,
        linewidth: 1,
        transparent: true,
        opacity: 0.45
      }))} />

      {/* ---------------- GROUND PLATFORM REFERENCE GRID ---------------- */}
      {showGrid && (
        <group position={[0, -0.72, 0]}>
          {/* Circular Coordinate Grid */}
          <polarGridHelper args={[40, 16, 8, 64, 0x1A2A40, 0x0F1B2B]} />

          {/* Compass Axis Cross */}
          <line>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={4}
                array={new Float32Array([-40, 0, 0, 40, 0, 0, 0, 0, -40, 0, 0, 40])}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#00E5FF" transparent opacity={0.2} />
          </line>

          {/* 10m, 20m, 30m Distance Marker Rings */}
          {[10, 20, 30].map((dist) => (
            <mesh key={dist} rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[dist - 0.05, dist + 0.05, 64]} />
              <meshBasicMaterial color="#00E5FF" transparent opacity={0.12} side={THREE.DoubleSide} />
            </mesh>
          ))}
        </group>
      )}

      {/* Sun / Key Directional Light for Space Contrast */}
      <directionalLight
        position={[60, 80, 50]}
        intensity={2.8}
        color="#FFF9EE"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      {/* Deep Space Ambient Fill */}
      <ambientLight intensity={0.45} color="#0B132B" />

      {/* Earth Albedo Light reflection */}
      <directionalLight
        position={[10, -20, -30]}
        intensity={0.6}
        color="#38BDF8"
      />
    </group>
  );
}
