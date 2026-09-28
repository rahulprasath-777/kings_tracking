import React from 'react';
import { useSimulationStore } from '../store/useSimulationStore';

export function TelemetryBar() {
  const trackingState = useSimulationStore((state) => state.trackingState);
  const panAngle = useSimulationStore((state) => state.panAngle);
  const tiltAngle = useSimulationStore((state) => state.tiltAngle);
  const angularError = useSimulationStore((state) => state.angularError);
  const fps = useSimulationStore((state) => state.fps);
  const confidence = useSimulationStore((state) => state.confidence);
  const kalmanActive = useSimulationStore((state) => state.kalmanActive);
  const predictedTargetPix = useSimulationStore((state) => state.predictedTargetPix);
  const acquisitionTime = useSimulationStore((state) => state.acquisitionTime);
  const timeToLock = useSimulationStore((state) => state.timeToLock);
  const trackingErrorPixels = useSimulationStore((state) => state.trackingErrorPixels);
  const rmsePixels = useSimulationStore((state) => state.rmsePixels);
  const inputMode = useSimulationStore((state) => state.inputMode);

  const isLocked = trackingState === 'LOCKED';

  // Value color formatting
  let stateColor = '#FFB020';
  let stateGlow = 'none';
  if (trackingState === 'LOCKED') { stateColor = '#00FF88'; stateGlow = '0 0 10px rgba(0,255,136,0.4)'; }
  if (trackingState === 'TRACKING' || trackingState === 'ACQUIRING') { stateColor = '#00E5FF'; }
  if (trackingState === 'TARGET_LOST') { stateColor = '#FF4D6D'; stateGlow = '0 0 10px rgba(255,77,109,0.4)'; }

  let errColor = '#FF4D6D';
  if (angularError < 0.25) errColor = '#00FF88';
  else if (angularError < 1.5) errColor = '#00E5FF';
  else if (angularError < 5.0) errColor = '#FFB020';

  const pixErrColor = trackingErrorPixels <= 10 ? '#00FF88' : (trackingErrorPixels <= 30 ? '#FFB020' : '#FF4D6D');
  const fpsColor = fps >= 20 ? '#00FF88' : '#FF4D6D';

  return (
    <div className="telem-row">
      {/* 1. Tracking State Card */}
      <div className={`telem-card ${isLocked ? 'locked' : 'active'}`} style={{
        boxShadow: stateGlow
      }}>
        <span className="telem-label">TRACKING STATE</span>
        <div className="telem-value" style={{ fontSize: 15, color: stateColor, letterSpacing: 1 }}>
          {trackingState}
        </div>
        <span className="telem-unit">FSOC COARSE LOOP</span>
      </div>

      {/* 2. Gimbal Pan / Yaw */}
      <div className="telem-card">
        <span className="telem-label">GIMBAL PAN</span>
        <div className="telem-value primary">
          {panAngle > 0 ? '+' : ''}{panAngle.toFixed(2)}°
        </div>
        <span className="telem-unit">AZIMUTH AXIS</span>
      </div>

      {/* 3. Gimbal Tilt / Pitch */}
      <div className="telem-card">
        <span className="telem-label">GIMBAL TILT</span>
        <div className="telem-value primary">
          {tiltAngle > 0 ? '+' : ''}{tiltAngle.toFixed(2)}°
        </div>
        <span className="telem-unit">ELEVATION AXIS</span>
      </div>

      {/* 4. Total Angular Error — ISRO Spec: < 0.25° */}
      <div className="telem-card" style={{
        borderColor: angularError < 0.25 ? 'rgba(0,255,136,0.3)' : 'var(--border-color)'
      }}>
        <span className="telem-label">ANGULAR ERROR</span>
        <div className="telem-value" style={{ color: errColor }}>
          {angularError.toFixed(3)}°
        </div>
        <span className="telem-unit" style={{ color: angularError < 0.25 ? '#00FF88' : 'var(--text-muted)' }}>
          {angularError < 0.25 ? '✓ COARSE LOCK' : 'THRESHOLD &lt;0.25°'}
        </span>
      </div>

      {/* 5. Pixel Tracking Error — ISRO Spec: ≤ 10 px */}
      <div className="telem-card" style={{
        borderColor: trackingErrorPixels <= 10 ? 'rgba(0,255,136,0.3)' : 'var(--border-color)'
      }}>
        <span className="telem-label">TRACKING ERROR</span>
        <div className="telem-value" style={{ color: pixErrColor }}>
          {trackingErrorPixels > 900 ? '---' : `${trackingErrorPixels.toFixed(1)} px`}
        </div>
        <span className="telem-unit" style={{ color: trackingErrorPixels <= 10 ? '#00FF88' : 'var(--text-muted)' }}>
          {trackingErrorPixels <= 10 ? '✓ PASS: ≤10 PX' : 'TARGET: ≤ 10 PX'}
        </span>
      </div>

      {/* 6. RMSE */}
      <div className="telem-card">
        <span className="telem-label">RMSE</span>
        <div className="telem-value" style={{ color: '#00E5FF' }}>
          {rmsePixels > 0 ? `${rmsePixels.toFixed(1)} px` : '---'}
        </div>
        <span className="telem-unit">ROOT MEAN SQ ERROR</span>
      </div>

      {/* 7. Detection Confidence */}
      <div className="telem-card">
        <span className="telem-label">AI CONFIDENCE</span>
        <div className="telem-value" style={{ color: confidence > 75 ? '#00FF88' : (confidence > 0 ? '#FFB020' : '#FF4D6D') }}>
          {confidence.toFixed(1)}%
        </div>
        <span className="telem-unit">BEACON DETECTION</span>
      </div>

      {/* 8. Kalman Filter Status */}
      <div className="telem-card">
        <span className="telem-label">KALMAN FILTER</span>
        <div className="telem-value" style={{ fontSize: 13, color: predictedTargetPix.visible ? '#FFB020' : (kalmanActive ? '#00FF88' : '#4A6580') }}>
          {predictedTargetPix.visible ? 'PREDICTING' : (kalmanActive ? 'ACTIVE' : 'OFF')}
        </div>
        <span className="telem-unit">2D VELOCITY MODEL</span>
      </div>

      {/* 9. Acquisition Time — ISRO Spec: ≤ 2.0 sec */}
      <div className="telem-card" style={{
        borderColor: timeToLock !== null && timeToLock <= 2.0 ? 'rgba(0,255,136,0.3)' : 'var(--border-color)'
      }}>
        <span className="telem-label">ACQUISITION TIME</span>
        <div className="telem-value" style={{
          color: timeToLock !== null ? (timeToLock <= 2.0 ? '#00FF88' : '#FF4D6D') : '#4A6580'
        }}>
          {timeToLock !== null ? `${timeToLock.toFixed(2)} s` : (acquisitionTime > 0 ? `${acquisitionTime.toFixed(1)} s…` : '---')}
        </div>
        <span className="telem-unit" style={{ color: timeToLock !== null && timeToLock <= 2.0 ? '#00FF88' : 'var(--text-muted)' }}>
          {timeToLock !== null && timeToLock <= 2.0 ? '✓ PASS: ≤2.0 S' : 'TARGET: ≤ 2.0 S'}
        </span>
      </div>

      {/* 10. Processing FPS — ISRO Spec: ≥ 20 FPS */}
      <div className="telem-card" style={{
        borderColor: fps >= 20 ? 'rgba(0,255,136,0.3)' : 'rgba(255,77,109,0.3)'
      }}>
        <span className="telem-label">PROC. SPEED</span>
        <div className="telem-value" style={{ color: fpsColor }}>
          {fps} FPS
        </div>
        <span className="telem-unit" style={{ color: fpsColor }}>
          {fps >= 20 ? '✓ PASS: ≥20 FPS' : 'FAIL: ≥20 FPS REQ'}
        </span>
      </div>

      {/* 11. Input Mode Badge */}
      <div className="telem-card" style={{
        borderColor: inputMode === 'mp4_video' ? 'rgba(0,255,136,0.3)' : 'var(--border-color)'
      }}>
        <span className="telem-label">INPUT MODE</span>
        <div className="telem-value" style={{ fontSize: 11, color: inputMode === 'mp4_video' ? '#00FF88' : '#00E5FF' }}>
          {inputMode === 'mp4_video' ? 'MP4 BYPASS' : '3D SCENE'}
        </div>
        <span className="telem-unit">CV PIPELINE SOURCE</span>
      </div>
    </div>
  );
}
