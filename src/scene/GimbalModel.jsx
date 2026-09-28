import * as THREE from 'three';

/**
 * 2-Axis Mechanical Gimbal Assembly & Tracking Line Visualizer
 * 
 * Hierarchy:
 * Base (stationary platform)
 *   -> Pan Yoke (rotates around Y - Azimuth/Pan)
 *      -> Tilt Cradle & Camera Body (rotates around local X - Elevation/Tilt)
 *         -> Optical Aperture / Lens
 *         -> Boresight Vector Beam (Viewing direction)
 *         -> Target Line-of-Sight Vector
 */
export function GimbalModel({
  panAngle = 0, // degrees
  tiltAngle = 0, // degrees
  satPos = [0, 8, 28],
  trackingState = 'SEARCHING',
  isLocked = false
}) {
  const panRad = (panAngle * Math.PI) / 180;
  const tiltRad = (tiltAngle * Math.PI) / 180;

  // Compute boresight line endpoint (extending 35 units along optical axis)
  const boresightLength = 32;
  const cosTilt = Math.cos(tiltRad);
  const sinTilt = Math.sin(tiltRad);
  const sinPan = Math.sin(panRad);
  const cosPan = Math.cos(panRad);

  const boresightEnd = new THREE.Vector3(
    sinPan * cosTilt * boresightLength,
    sinTilt * boresightLength,
    cosPan * cosTilt * boresightLength
  );

  const targetVector = new THREE.Vector3(...satPos);

  // Line colors based on state
  let boresightColor = '#00E5FF'; // Default cyan
  if (trackingState === 'SEARCHING') boresightColor = '#FFB020'; // Amber scan
  if (trackingState === 'LOCKED') boresightColor = '#00FF88'; // Vibrant green lock
  if (trackingState === 'TARGET_LOST') boresightColor = '#FF4D6D'; // Red warning

  return (
    <group position={[0, 0, 0]}>
      {/* ---------------- 1. STATIONARY PEDESTAL BASE ---------------- */}
      {/* Octagonal Foundation Base */}
      <mesh position={[0, -0.7, 0]} receiveShadow>
        <cylinderGeometry args={[1.5, 1.8, 0.4, 8]} />
        <meshStandardMaterial color="#1E293B" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Riser Column */}
      <mesh position={[0, -0.3, 0]}>
        <cylinderGeometry args={[0.9, 1.1, 0.5, 24]} />
        <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.25} />
      </mesh>

      {/* Azimuth Bearing Ring */}
      <mesh position={[0, -0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.85, 0.06, 16, 32]} />
        <meshStandardMaterial color="#00E5FF" metalness={0.9} roughness={0.2} emissive="#00E5FF" emissiveIntensity={0.2} />
      </mesh>

      {/* ---------------- 2. PAN AXIS (AZIMUTH ROTATION) ---------------- */}
      <group rotation={[0, panRad, 0]}>
        {/* Azimuth Turret Platform */}
        <mesh position={[0, 0.15, 0]} castShadow>
          <cylinderGeometry args={[0.8, 0.8, 0.3, 24]} />
          <meshStandardMaterial color="#1E293B" metalness={0.85} roughness={0.3} />
        </mesh>

        {/* Dual Support Fork Arms (Left and Right) */}
        {/* Left Arm */}
        <mesh position={[-0.65, 0.85, 0]} castShadow>
          <boxGeometry args={[0.2, 1.2, 0.45]} />
          <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Right Arm */}
        <mesh position={[0.65, 0.85, 0]} castShadow>
          <boxGeometry args={[0.2, 1.2, 0.45]} />
          <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
        </mesh>

        {/* Elevation Trunnion Bearings */}
        <mesh position={[-0.65, 1.2, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.18, 0.18, 0.1, 16]} />
          <meshStandardMaterial color="#00E5FF" metalness={0.9} />
        </mesh>
        <mesh position={[0.65, 1.2, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.18, 0.18, 0.1, 16]} />
          <meshStandardMaterial color="#00E5FF" metalness={0.9} />
        </mesh>

        {/* ---------------- 3. TILT AXIS (ELEVATION ROTATION) ---------------- */}
        <group position={[0, 1.2, 0]} rotation={[-tiltRad, 0, 0]}>
          {/* Main Optical Camera Housing (Center Pod) */}
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.42, 0.45, 1.1, 24]} rotation={[Math.PI / 2, 0, 0]} />
            <meshStandardMaterial color="#0F172A" metalness={0.92} roughness={0.2} />
          </mesh>

          {/* Gold Thermal Blanket Wrap */}
          <mesh position={[0, 0, -0.1]}>
            <cylinderGeometry args={[0.43, 0.43, 0.6, 24]} rotation={[Math.PI / 2, 0, 0]} />
            <meshStandardMaterial color="#D4AF37" metalness={0.85} roughness={0.35} />
          </mesh>

          {/* Optical Hood / Sun Shield Baffle */}
          <mesh position={[0, 0, 0.68]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.38, 0.42, 0.4, 24, 1, true]} />
            <meshStandardMaterial color="#020617" roughness={0.9} side={THREE.DoubleSide} />
          </mesh>

          {/* High-Resolution Optical Glass Lens Aperture */}
          <mesh position={[0, 0, 0.52]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.36, 32]} />
            <meshStandardMaterial
              color="#00E5FF"
              emissive="#00E5FF"
              emissiveIntensity={0.5}
              roughness={0.05}
              metalness={0.95}
              transparent
              opacity={0.85}
            />
          </mesh>

          {/* Aperture Reticle Ring */}
          <mesh position={[0, 0, 0.53]} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.34, 0.37, 32]} />
            <meshBasicMaterial color="#00E5FF" />
          </mesh>

          {/* Coaxial Laser Beacon / Laser Receiver Sensor on Top */}
          <mesh position={[0, 0.42, 0.2]}>
            <cylinderGeometry args={[0.1, 0.1, 0.4, 16]} rotation={[Math.PI / 2, 0, 0]} />
            <meshStandardMaterial color="#38BDF8" metalness={0.9} />
          </mesh>
        </group>
      </group>

      {/* ---------------- 4. VISUAL TRACKING RAYS & VECTORS ---------------- */}
      {/* Vector A: Camera Optical Boresight (where the camera is actually looking) */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, 1.2, 0, boresightEnd.x, boresightEnd.y, boresightEnd.z])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={boresightColor} linewidth={2} transparent opacity={0.8} />
      </line>

      {/* Vector B: Line of Sight to TARGET-SAT-01 */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, 1.2, 0, targetVector.x, targetVector.y, targetVector.z])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color={isLocked ? '#00FF88' : '#FFB020'}
          linewidth={isLocked ? 3 : 1}
          transparent
          opacity={isLocked ? 0.95 : 0.45}
        />
      </line>

      {/* Lock Cone when locked */}
      {isLocked && (
        <group position={[targetVector.x, targetVector.y, targetVector.z]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[2.5, 2.65, 32]} />
            <meshBasicMaterial color="#00FF88" side={THREE.DoubleSide} transparent opacity={0.8} />
          </mesh>
        </group>
      )}
    </group>
  );
}
