import React, { useState } from 'react';
import { useSimulationStore } from '../store/useSimulationStore';
import { EyeOff } from 'lucide-react';
import { VideoUploadPanel } from './VideoUploadPanel';

export function ControlPanel() {
  const [activeTab, setActiveTab] = useState('trajectory'); // 'trajectory' | 'pid' | 'disturbances' | 'scenarios' | 'video'

  // Trajectory State
  const trajectory = useSimulationStore((state) => state.trajectory);
  const setTrajectory = useSimulationStore((state) => state.setTrajectory);
  const velocity = useSimulationStore((state) => state.velocity);
  const setVelocity = useSimulationStore((state) => state.setVelocity);
  const orbitRadius = useSimulationStore((state) => state.orbitRadius);
  const setOrbitRadius = useSimulationStore((state) => state.setOrbitRadius);
  const altitude = useSimulationStore((state) => state.altitude);
  const setAltitude = useSimulationStore((state) => state.setAltitude);
  const showMultipleSats = useSimulationStore((state) => state.showMultipleSats);
  const setShowMultipleSats = useSimulationStore((state) => state.setShowMultipleSats);

  // Search State
  const searchMode = useSimulationStore((state) => state.searchMode);
  const setSearchMode = useSimulationStore((state) => state.setSearchMode);

  // PID State
  const kp = useSimulationStore((state) => state.kp);
  const ki = useSimulationStore((state) => state.ki);
  const kd = useSimulationStore((state) => state.kd);
  const setPidGains = useSimulationStore((state) => state.setPidGains);
  const kalmanActive = useSimulationStore((state) => state.kalmanActive);
  const setKalmanActive = useSimulationStore((state) => state.setKalmanActive);

  // Disturbances
  const platformVibration = useSimulationStore((state) => state.platformVibration);
  const cameraJitter = useSimulationStore((state) => state.cameraJitter);
  const atmosphericTurbulence = useSimulationStore((state) => state.atmosphericTurbulence);
  const imageNoise = useSimulationStore((state) => state.imageNoise);
  const blur = useSimulationStore((state) => state.blur);
  const illuminationVariation = useSimulationStore((state) => state.illuminationVariation);
  const setDisturbance = useSimulationStore((state) => state.setDisturbance);

  // Target loss manual toggle
  const targetHidden = useSimulationStore((state) => state.targetHidden);
  const setTargetHidden = useSimulationStore((state) => state.setTargetHidden);

  // Scenario Loader
  const loadScenario = useSimulationStore((state) => state.loadScenario);
  const activeScenario = useSimulationStore((state) => state.activeScenario);

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Tab Navigation Header */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-card)',
        overflowX: 'auto'
      }}>
        {[
          { id: 'trajectory', label: 'ORBIT' },
          { id: 'pid', label: 'PID/KF' },
          { id: 'disturbances', label: 'DIST.' },
          { id: 'scenarios', label: 'SCENES' },
          { id: 'video', label: '📹 VIDEO', highlight: true },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: '1 0 auto',
              minWidth: 0,
              padding: '7px 6px',
              border: 'none',
              background: activeTab === tab.id
                ? (tab.highlight ? 'rgba(0, 255, 136, 0.1)' : 'var(--bg-panel)')
                : 'transparent',
              color: activeTab === tab.id
                ? (tab.highlight ? '#00FF88' : '#00E5FF')
                : 'var(--text-secondary)',
              borderBottom: activeTab === tab.id
                ? `2px solid ${tab.highlight ? '#00FF88' : '#00E5FF'}`
                : '2px solid transparent',
              fontSize: 9,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'var(--font-ui)',
              textTransform: 'uppercase',
              letterSpacing: 0.4,
              whiteSpace: 'nowrap',
              transition: 'color 0.15s, background 0.15s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Body */}
      <div className="scrollable" style={{ padding: '10px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* ================= TAB 1: TRAJECTORY & ORBIT ================= */}
        {activeTab === 'trajectory' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Trajectory Pattern Select */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                ORBITAL TRAJECTORY GEOMETRY
              </label>
              <select
                value={trajectory}
                onChange={(e) => setTrajectory(e.target.value)}
              >
                <option value="elliptical">Elliptical Orbit (Default)</option>
                <option value="circular">Circular Orbit</option>
                <option value="linear">Linear Transit</option>
                <option value="sine">Sine Wave Undulation</option>
                <option value="spiral">Spiral Trajectory</option>
                <option value="random">Random Motion</option>
              </select>
            </div>

            {/* Velocity Slider */}
            <div className="dist-slider-row">
              <span className="dist-slider-label">Velocity</span>
              <input
                type="range"
                min="0.2"
                max="3.5"
                step="0.1"
                value={velocity}
                onChange={(e) => setVelocity(parseFloat(e.target.value))}
              />
              <span className="dist-slider-value">{velocity.toFixed(1)}x</span>
            </div>

            {/* Orbit Radius Slider */}
            <div className="dist-slider-row">
              <span className="dist-slider-label">Orbit Radius</span>
              <input
                type="range"
                min="16"
                max="40"
                step="1"
                value={orbitRadius}
                onChange={(e) => setOrbitRadius(parseInt(e.target.value, 10))}
              />
              <span className="dist-slider-value">{orbitRadius}m</span>
            </div>

            {/* Altitude Slider */}
            <div className="dist-slider-row">
              <span className="dist-slider-label">Altitude</span>
              <input
                type="range"
                min="2"
                max="18"
                step="1"
                value={altitude}
                onChange={(e) => setAltitude(parseInt(e.target.value, 10))}
              />
              <span className="dist-slider-value">{altitude}m</span>
            </div>

            {/* Autonomous Search Mode */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
              <label style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                AUTONOMOUS SEARCH PATTERN
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <button
                  onClick={() => setSearchMode('spiral')}
                  className={`btn ${searchMode === 'spiral' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ justifyContent: 'center', fontSize: 10, padding: '5px' }}
                >
                  SPIRAL SCAN
                </button>
                <button
                  onClick={() => setSearchMode('raster')}
                  className={`btn ${searchMode === 'raster' ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ justifyContent: 'center', fontSize: 10, padding: '5px' }}
                >
                  RASTER SCAN
                </button>
              </div>
            </div>

            {/* Multiple Satellites Toggle */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 8px',
              background: 'var(--bg-card)',
              borderRadius: 4,
              border: '1px solid var(--border-color)',
              marginTop: 4
            }}>
              <span style={{ fontSize: 10, textTransform: 'uppercase' }}>Multiple Satellites (SAT-02 & 03)</span>
              <input
                type="checkbox"
                checked={showMultipleSats}
                onChange={(e) => setShowMultipleSats(e.target.checked)}
                style={{ width: 14, height: 14, accentColor: '#00E5FF', cursor: 'pointer' }}
              />
            </div>
          </div>
        )}

        {/* ================= TAB 2: PID & KALMAN ================= */}
        {activeTab === 'pid' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              SERVO CONTROLLER GAINS (DUAL-AXIS PID)
            </div>

            {/* Kp */}
            <div className="dist-slider-row">
              <span className="dist-slider-label">Kp (Prop)</span>
              <input
                type="range"
                min="0.5"
                max="4.0"
                step="0.1"
                value={kp}
                onChange={(e) => setPidGains(parseFloat(e.target.value), ki, kd)}
              />
              <span className="dist-slider-value">{kp.toFixed(1)}</span>
            </div>

            {/* Ki */}
            <div className="dist-slider-row">
              <span className="dist-slider-label">Ki (Integ)</span>
              <input
                type="range"
                min="0.0"
                max="0.2"
                step="0.01"
                value={ki}
                onChange={(e) => setPidGains(kp, parseFloat(e.target.value), kd)}
              />
              <span className="dist-slider-value">{ki.toFixed(2)}</span>
            </div>

            {/* Kd */}
            <div className="dist-slider-row">
              <span className="dist-slider-label">Kd (Deriv)</span>
              <input
                type="range"
                min="0.0"
                max="0.5"
                step="0.02"
                value={kd}
                onChange={(e) => setPidGains(kp, ki, parseFloat(e.target.value))}
              />
              <span className="dist-slider-value">{kd.toFixed(2)}</span>
            </div>

            {/* Kalman Filter Toggle */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 10px',
              background: 'var(--bg-card)',
              borderRadius: 4,
              border: '1px solid var(--border-color)',
              marginTop: 6
            }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#E8F4FD' }}>2D Kalman Filter</div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Position & Velocity State Estimation</div>
              </div>
              <input
                type="checkbox"
                checked={kalmanActive}
                onChange={(e) => setKalmanActive(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: '#00FF88', cursor: 'pointer' }}
              />
            </div>

            {/* Quick Occlusion Button */}
            <button
              onClick={() => setTargetHidden(!targetHidden)}
              className={`btn ${targetHidden ? 'btn-danger' : 'btn-warning'}`}
              style={{ justifyContent: 'center', marginTop: 4 }}
            >
              <EyeOff size={13} />
              {targetHidden ? 'RESTORE TARGET SATELLITE' : 'SIMULATE TARGET OCCLUSION (TEST KALMAN)'}
            </button>
          </div>
        )}

        {/* ================= TAB 3: DISTURBANCES ================= */}
        {activeTab === 'disturbances' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              ENVIRONMENTAL & SENSOR DISTURBANCES (0 - 100%)
            </div>

            {/* Platform Vibration */}
            <div className="dist-slider-row">
              <span className="dist-slider-label">Platform Vib</span>
              <input
                type="range"
                min="0"
                max="100"
                value={platformVibration}
                onChange={(e) => setDisturbance('platformVibration', parseInt(e.target.value, 10))}
              />
              <span className="dist-slider-value">{platformVibration}%</span>
            </div>

            {/* Camera Jitter */}
            <div className="dist-slider-row">
              <span className="dist-slider-label">Camera Jitter</span>
              <input
                type="range"
                min="0"
                max="100"
                value={cameraJitter}
                onChange={(e) => setDisturbance('cameraJitter', parseInt(e.target.value, 10))}
              />
              <span className="dist-slider-value">{cameraJitter}%</span>
            </div>

            {/* Atmospheric Turbulence */}
            <div className="dist-slider-row">
              <span className="dist-slider-label">Turbulence</span>
              <input
                type="range"
                min="0"
                max="100"
                value={atmosphericTurbulence}
                onChange={(e) => setDisturbance('atmosphericTurbulence', parseInt(e.target.value, 10))}
              />
              <span className="dist-slider-value">{atmosphericTurbulence}%</span>
            </div>

            {/* Image Noise */}
            <div className="dist-slider-row">
              <span className="dist-slider-label">Sensor Noise</span>
              <input
                type="range"
                min="0"
                max="100"
                value={imageNoise}
                onChange={(e) => setDisturbance('imageNoise', parseInt(e.target.value, 10))}
              />
              <span className="dist-slider-value">{imageNoise}%</span>
            </div>

            {/* Optical Blur */}
            <div className="dist-slider-row">
              <span className="dist-slider-label">Optical Blur</span>
              <input
                type="range"
                min="0"
                max="100"
                value={blur}
                onChange={(e) => setDisturbance('blur', parseInt(e.target.value, 10))}
              />
              <span className="dist-slider-value">{blur}%</span>
            </div>

            {/* Illumination Scintillation */}
            <div className="dist-slider-row">
              <span className="dist-slider-label">Scintillation</span>
              <input
                type="range"
                min="0"
                max="100"
                value={illuminationVariation}
                onChange={(e) => setDisturbance('illuminationVariation', parseInt(e.target.value, 10))}
              />
              <span className="dist-slider-value">{illuminationVariation}%</span>
            </div>

            {/* Reset Disturbances */}
            <button
              onClick={() => {
                setDisturbance('platformVibration', 0);
                setDisturbance('cameraJitter', 0);
                setDisturbance('atmosphericTurbulence', 0);
                setDisturbance('imageNoise', 0);
                setDisturbance('blur', 0);
                setDisturbance('illuminationVariation', 0);
              }}
              className="btn btn-ghost"
              style={{ justifyContent: 'center', marginTop: 4, fontSize: 10 }}
            >
              CLEAR ALL DISTURBANCES
            </button>
          </div>
        )}

        {/* ================= TAB 4: SCENARIOS ================= */}
        {activeTab === 'scenarios' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              PRE-CONFIGURED SIH TEST SCENARIOS
            </div>

            {[
              { id: 1, title: 'SCENARIO 1: Normal Tracking', desc: 'Standard elliptical orbit, clean signal' },
              { id: 2, title: 'SCENARIO 2: Fast Satellite', desc: 'High angular velocity (2.8x) stress test' },
              { id: 3, title: 'SCENARIO 3: High Vibration', desc: '65% platform vibration disturbance' },
              { id: 4, title: 'SCENARIO 4: Atmospheric Turbulence', desc: 'Deep scintillation, optical blur & noise' },
              { id: 5, title: 'SCENARIO 5: Target Loss & Coasting', desc: 'Target blackout, Kalman prediction validation' },
              { id: 6, title: 'SCENARIO 6: Multi-Sat Constellation', desc: 'Tracks TARGET-01 amidst decoy satellites' },
              { id: 7, title: 'SCENARIO 7: Full Stress Test', desc: 'Max disturbance, high speed spiral orbit' },
            ].map((sc) => (
              <button
                key={sc.id}
                onClick={() => loadScenario(sc.id)}
                className={`scenario-btn ${activeScenario.startsWith(`SCENARIO ${sc.id}`) ? 'active' : ''}`}
                style={{ textAlign: 'left', padding: '6px 8px' }}
              >
                <div style={{ fontWeight: 600, color: activeScenario.startsWith(`SCENARIO ${sc.id}`) ? '#00E5FF' : '#E8F4FD' }}>
                  {sc.title}
                </div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
                  {sc.desc}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ================= TAB 5: VIDEO UPLOAD ================= */}
        {activeTab === 'video' && (
          <VideoUploadPanel />
        )}
      </div>
    </div>
  );
}
