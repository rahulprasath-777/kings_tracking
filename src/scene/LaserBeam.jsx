import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * Free Space Optical Communication (FSOC) Laser Beam
 * 
 * When in TRACKING or LOCKED state:
 * - Emits a high-coherence optical carrier laser beam from the terminal to the satellite
 * - Simulates optical data packet pulses traveling along the beam line when LOCKED
 */
export function LaserBeam({
  startPos = [0, 1.2, 0],
  endPos = [0, 8, 28],
  isLocked = false,
  isTracking = false
}) {
  const packetRef = useRef();
  const beamRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (beamRef.current) {
      const posAttr = beamRef.current.geometry.attributes.position;
      if (posAttr) {
        posAttr.setXYZ(0, startPos[0], startPos[1], startPos[2]);
        posAttr.setXYZ(1, endPos[0], endPos[1], endPos[2]);
        posAttr.needsUpdate = true;
      }
    }
    if (packetRef.current && isLocked) {
      // Data packet position interpolating along the beam (0.0 to 1.0)
      const frac = (t * 2.5) % 1.0;
      packetRef.current.position.x = startPos[0] + (endPos[0] - startPos[0]) * frac;
      packetRef.current.position.y = startPos[1] + (endPos[1] - startPos[1]) * frac;
      packetRef.current.position.z = startPos[2] + (endPos[2] - startPos[2]) * frac;
    }
  });

  if (!isTracking && !isLocked) return null;

  const beamColor = isLocked ? '#00FF88' : '#00E5FF';
  const beamOpacity = isLocked ? 0.95 : 0.45;

  return (
    <group>
      {/* 1. Primary High-Coherence Core Laser Line */}
      <line ref={beamRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([
              startPos[0], startPos[1], startPos[2],
              endPos[0], endPos[1], endPos[2]
            ])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color={beamColor}
          linewidth={isLocked ? 3 : 1.5}
          transparent
          opacity={beamOpacity}
        />
      </line>

      {/* 2. Traveling Optical Data Packet Photon Pulses (Active when LOCKED) */}
      {isLocked && (
        <group ref={packetRef}>
          <mesh>
            <sphereGeometry args={[0.18, 12, 12]} />
            <meshBasicMaterial color="#FFFFFF" />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.35, 12, 12]} />
            <meshBasicMaterial color="#00FF88" transparent opacity={0.6} />
          </mesh>
          <pointLight color="#00FF88" intensity={2.0} distance={10} decay={2} />
        </group>
      )}
    </group>
  );
}
