import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useSimulationStore } from '../store/useSimulationStore';
import { SatelliteModel } from './SatelliteModel';
import { GimbalModel } from './GimbalModel';
import { SpaceEnvironment } from './SpaceEnvironment';
import { LaserBeam } from './LaserBeam';
import { Camera, Eye, Video } from 'lucide-react';

/**
 * Scene simulation loop worker component running inside R3F Canvas
 */
function SimulationLoop() {
  const tickSimulation = useSimulationStore((state) => state.tickSimulation);
  const frameCountRef = useRef(0);

  useFrame((_, delta) => {
    frameCountRef.current++;
    // Clamp delta to prevent huge jumps if browser tab was inactive
    const dt = Math.min(delta, 0.05);
    tickSimulation(dt, frameCountRef.current);
  });

  return null;
}

/**
 * Camera Viewport Controller supporting multiple viewing perspectives
 */
function DynamicCameraController({ viewMode, panAngle, tiltAngle, satPos }) {
  const controlsRef = useRef();

  useFrame(({ camera }) => {
    if (viewMode === 'boresight') {
      // Camera sits right at the gimbal trunnion looking along the optical axis
      camera.position.set(0, 1.25, 0.2);

      const panRad = (panAngle * Math.PI) / 180;
      const tiltRad = (tiltAngle * Math.PI) / 180;
      const cosTilt = Math.cos(tiltRad);
      const sinTilt = Math.sin(tiltRad);
      const sinPan = Math.sin(panRad);
      const cosPan = Math.cos(panRad);

      const lookTarget = new THREE.Vector3(
        sinPan * cosTilt * 50,
        1.25 + sinTilt * 50,
        cosPan * cosTilt * 50
      );
      camera.lookAt(lookTarget);
    } else if (viewMode === 'chase') {
      // Camera chases behind TARGET-SAT-01
      const [sx, sy, sz] = satPos;
      camera.position.set(sx - 4, sy + 3, sz + 6);
      camera.lookAt(sx, sy, sz);
    }
  });

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={viewMode === 'overview' ? [0, 16, 42] : [0, 1.25, 0.2]}
        fov={viewMode === 'boresight' ? 20 : 48}
        near={0.1}
        far={400}
      />
      {viewMode === 'overview' && (
        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.06}
          minDistance={3}
          maxDistance={140}
          maxPolarAngle={Math.PI / 2 + 0.15}
          target={[0, 4, 12]}
        />
      )}
    </>
  );
}

/**
 * 3D Main Scene Viewport
 */
export function MainScene() {
  const [viewMode, setViewMode] = useState('overview'); // 'overview' | 'boresight' | 'chase'

  const satPos = useSimulationStore((state) => state.satPos);
  const sat2Pos = useSimulationStore((state) => state.sat2Pos);
  const sat3Pos = useSimulationStore((state) => state.sat3Pos);
  const showMultipleSats = useSimulationStore((state) => state.showMultipleSats);
  const targetHidden = useSimulationStore((state) => state.targetHidden);
  const panAngle = useSimulationStore((state) => state.panAngle);
  const tiltAngle = useSimulationStore((state) => state.tiltAngle);
  const trackingState = useSimulationStore((state) => state.trackingState);
  const trajectory = useSimulationStore((state) => state.trajectory);
  const orbitRadius = useSimulationStore((state) => state.orbitRadius);
  const altitude = useSimulationStore((state) => state.altitude);

  const isLocked = trackingState === 'LOCKED';
  const isTracking = trackingState === 'TRACKING' || isLocked;

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      if (e.code === 'KeyV') {
        // Toggle view modes
        setViewMode((prev) => (prev === 'overview' ? 'boresight' : prev === 'boresight' ? 'chase' : 'overview'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        shadows
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        style={{ background: '#050914' }}
      >
        {/* Simulation Execution Driver */}
        <SimulationLoop />

        {/* Dynamic Multi-Perspective Camera */}
        <DynamicCameraController
          viewMode={viewMode}
          panAngle={panAngle}
          tiltAngle={tiltAngle}
          satPos={satPos}
        />

        {/* Space Environment (Earth, Stars, Orbit Path, Reference Grid) */}
        <SpaceEnvironment
          trajectory={trajectory}
          orbitRadius={orbitRadius}
          altitude={altitude}
        />

        {/* 2-Axis Mechanical Gimbal Tracking Terminal */}
        <GimbalModel
          panAngle={panAngle}
          tiltAngle={tiltAngle}
          satPos={satPos}
          trackingState={trackingState}
          isLocked={isLocked}
        />

        {/* FSOC Optical Carrier Laser Link & Photon Packets */}
        <LaserBeam
          startPos={[0, 1.2, 0]}
          endPos={satPos}
          isLocked={isLocked}
          isTracking={isTracking}
        />

        {/* Primary Target: TARGET-SAT-01 */}
        <SatelliteModel
          position={satPos}
          name="TARGET-SAT-01"
          isTarget={true}
          hidden={targetHidden}
          colorScheme="target"
        />

        {/* Optional Secondary Satellites */}
        {showMultipleSats && (
          <>
            <SatelliteModel
              position={sat2Pos}
              name="TARGET-SAT-02"
              isTarget={false}
              hidden={false}
              colorScheme="secondary-blue"
            />
            <SatelliteModel
              position={sat3Pos}
              name="TARGET-SAT-03"
              isTarget={false}
              hidden={false}
              colorScheme="secondary-amber"
            />
          </>
        )}
      </Canvas>

      {/* Floating 3D Scene HUD Badges (Top-Left) */}
      <div style={{
        position: 'absolute',
        top: 12,
        left: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        pointerEvents: 'none'
      }}>
        <div style={{
          background: 'rgba(5, 9, 20, 0.75)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(0, 229, 255, 0.25)',
          padding: '6px 12px',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <span className={`status-dot ${isLocked ? 'online' : (trackingState === 'SEARCHING' ? 'warning' : 'primary')}`} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: 1.5, color: '#00E5FF' }}>
            3D DIGITAL TWIN • FSOC TERMINAL
          </span>
        </div>

        <div style={{
          background: 'rgba(11, 18, 32, 0.65)',
          padding: '4px 10px',
          borderRadius: 4,
          fontSize: 10,
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-mono)'
        }}>
          TARGET: TARGET-SAT-01 • POS [{satPos[0].toFixed(1)}, {satPos[1].toFixed(1)}, {satPos[2].toFixed(1)}]
        </div>
      </div>

      {/* Floating View Mode Switcher Pill (Top-Right of 3D Scene) */}
      <div style={{
        position: 'absolute',
        top: 12,
        right: 14,
        display: 'flex',
        background: 'rgba(5, 9, 20, 0.85)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(0, 229, 255, 0.25)',
        borderRadius: 20,
        padding: 2,
        gap: 2,
        zIndex: 50
      }}>
        <button
          onClick={() => setViewMode('overview')}
          style={{
            padding: '4px 10px',
            border: 'none',
            borderRadius: 16,
            background: viewMode === 'overview' ? '#00E5FF' : 'transparent',
            color: viewMode === 'overview' ? '#050914' : 'var(--text-secondary)',
            fontSize: 9,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            transition: 'all 0.2s'
          }}
          title="Free interactive 3D Orbit View"
        >
          <Camera size={11} /> OVERVIEW
        </button>

        <button
          onClick={() => setViewMode('boresight')}
          style={{
            padding: '4px 10px',
            border: 'none',
            borderRadius: 16,
            background: viewMode === 'boresight' ? '#00E5FF' : 'transparent',
            color: viewMode === 'boresight' ? '#050914' : 'var(--text-secondary)',
            fontSize: 9,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            transition: 'all 0.2s'
          }}
          title="First-Person View attached to Gimbal Boresight"
        >
          <Eye size={11} /> GIMBAL FPV
        </button>

        <button
          onClick={() => setViewMode('chase')}
          style={{
            padding: '4px 10px',
            border: 'none',
            borderRadius: 16,
            background: viewMode === 'chase' ? '#00E5FF' : 'transparent',
            color: viewMode === 'chase' ? '#050914' : 'var(--text-secondary)',
            fontSize: 9,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            transition: 'all 0.2s'
          }}
          title="Chase Cam following behind TARGET-SAT-01"
        >
          <Video size={11} /> SAT CHASE
        </button>
      </div>
    </div>
  );
}
