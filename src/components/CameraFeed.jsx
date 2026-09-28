import React, { useRef, useEffect } from 'react';
import { useSimulationStore } from '../store/useSimulationStore';
import { Radio } from 'lucide-react';

/**
 * Dedicated Live Camera Feed (640x480 resolution view)
 * 
 * Renders:
 * - Computer Vision synthetic sensor view
 * - Target bounding box with corner brackets
 * - Center optical crosshair reticle
 * - Raw target measurement marker
 * - Kalman filtered position marker
 * - Kalman predicted position marker (during occlusion)
 * - Visual disturbances (noise, turbulence, blur)
 * - Telemetry overlay
 */
export function CameraFeed() {
  const canvasRef = useRef(null);

  const trackingState = useSimulationStore((state) => state.trackingState);
  const confidence = useSimulationStore((state) => state.confidence);
  const inFOV = useSimulationStore((state) => state.inFOV);
  const isTargetDetected = useSimulationStore((state) => state.isTargetDetected);
  const rawTargetPix = useSimulationStore((state) => state.rawTargetPix);
  const filteredTargetPix = useSimulationStore((state) => state.filteredTargetPix);
  const predictedTargetPix = useSimulationStore((state) => state.predictedTargetPix);
  const kalmanActive = useSimulationStore((state) => state.kalmanActive);
  const panError = useSimulationStore((state) => state.panError);
  const tiltError = useSimulationStore((state) => state.tiltError);
  const angularError = useSimulationStore((state) => state.angularError);
  const trackingErrorPixels = useSimulationStore((state) => state.trackingErrorPixels);
  const rmsePixels = useSimulationStore((state) => state.rmsePixels);
  const imageNoise = useSimulationStore((state) => state.imageNoise);
  const blur = useSimulationStore((state) => state.blur);
  const atmosphericTurbulence = useSimulationStore((state) => state.atmosphericTurbulence);
  const targetHidden = useSimulationStore((state) => state.targetHidden);

  // Render 2D computer vision sensor canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    // Clear background
    ctx.fillStyle = '#02050A';
    ctx.fillRect(0, 0, W, H);

    // 1. Draw subtle background star/sensor pixels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    for (let i = 0; i < 25; i++) {
      const sx = (i * 73 + 17) % W;
      const sy = (i * 91 + 43) % H;
      ctx.fillRect(sx, sy, 1.2, 1.2);
    }

    // 2. Draw sensor noise if disturbance enabled
    if (imageNoise > 0 || atmosphericTurbulence > 0) {
      const noiseIntensity = (imageNoise + atmosphericTurbulence) / 200;
      const imgData = ctx.getImageData(0, 0, W, H);
      const data = imgData.data;
      const numNoisePixels = Math.floor(W * H * 0.04 * noiseIntensity);

      for (let n = 0; n < numNoisePixels; n++) {
        const idx = Math.floor(Math.random() * (W * H)) * 4;
        const val = Math.random() * 80 * noiseIntensity;
        data[idx] = Math.min(255, data[idx] + val);
        data[idx + 1] = Math.min(255, data[idx + 1] + val * 1.2);
        data[idx + 2] = Math.min(255, data[idx + 2] + val * 1.4);
      }
      ctx.putImageData(imgData, 0, 0);
    }

    // 3. Draw FOV boundary guide and coordinate crosshair lines
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    // Horizontal & vertical center lines
    ctx.beginPath();
    ctx.moveTo(0, H / 2);
    ctx.lineTo(W, H / 2);
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2, H);
    ctx.stroke();
    ctx.setLineDash([]);

    // 4. Optical Center Crosshair (+ concentric rings)
    const cx = W / 2;
    const cy = H / 2;
    const isLocked = trackingState === 'LOCKED';
    const centerColor = isLocked ? '#00FF88' : '#00E5FF';

    ctx.strokeStyle = centerColor;
    ctx.lineWidth = 1.5;

    // Crosshair ticks
    ctx.beginPath();
    // Center point
    ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.fillStyle = centerColor;
    ctx.fill();

    // 4 Crosshair lines with center gap
    const gap = 10;
    const tickLen = 22;
    ctx.moveTo(cx - gap - tickLen, cy);
    ctx.lineTo(cx - gap, cy);
    ctx.moveTo(cx + gap, cy);
    ctx.lineTo(cx + gap + tickLen, cy);
    ctx.moveTo(cx, cy - gap - tickLen);
    ctx.lineTo(cx, cy - gap);
    ctx.moveTo(cx, cy + gap);
    ctx.lineTo(cx, cy + gap + tickLen);
    ctx.stroke();

    // Concentric Fine Alignment Rings (0.2° and 0.5° zones)
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.strokeStyle = isLocked ? 'rgba(0, 255, 136, 0.4)' : 'rgba(0, 229, 255, 0.25)';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 45, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.12)';
    ctx.stroke();

    // 5. Draw Target Satellite Silhouette & Bounding Box (when in view or predicted)
    const showTarget = (inFOV && !targetHidden && isTargetDetected) || predictedTargetPix.visible;

    if (showTarget) {
      const tx = filteredTargetPix.x;
      const ty = filteredTargetPix.y;
      const boxW = 56;
      const boxH = 46;

      // Draw Synthetic Satellite Silhouette in Camera plane
      ctx.save();
      ctx.translate(tx, ty);

      // Satellite body
      ctx.fillStyle = '#C0A040';
      ctx.fillRect(-8, -10, 16, 20);

      // Solar wings
      ctx.fillStyle = '#103050';
      ctx.fillRect(-34, -7, 24, 14);
      ctx.fillRect(10, -7, 24, 14);
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 1;
      ctx.strokeRect(-34, -7, 24, 14);
      ctx.strokeRect(10, -7, 24, 14);

      // High-gain dish
      ctx.beginPath();
      ctx.arc(0, -12, 6, 0, Math.PI);
      ctx.fillStyle = '#E2E8F0';
      ctx.fill();

      // Optical Beacon / Laser Spot
      const beaconGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, 16);
      beaconGrad.addColorStop(0, '#FFFFFF');
      beaconGrad.addColorStop(0.3, isLocked ? '#00FF88' : '#00E5FF');
      beaconGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = beaconGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // 6. Computer Vision Bounding Box with Corner Brackets
      const bbColor = isLocked ? '#00FF88' : (predictedTargetPix.visible ? '#FFB020' : '#00E5FF');
      ctx.strokeStyle = bbColor;
      ctx.lineWidth = 2;
      const bLeft = tx - boxW / 2;
      const bTop = ty - boxH / 2;
      const bRight = tx + boxW / 2;
      const bBottom = ty + boxH / 2;
      const corner = 12;

      // Top-Left
      ctx.beginPath();
      ctx.moveTo(bLeft, bTop + corner);
      ctx.lineTo(bLeft, bTop);
      ctx.lineTo(bLeft + corner, bTop);
      // Top-Right
      ctx.moveTo(bRight - corner, bTop);
      ctx.lineTo(bRight, bTop);
      ctx.lineTo(bRight, bTop + corner);
      // Bottom-Left
      ctx.moveTo(bLeft, bBottom - corner);
      ctx.lineTo(bLeft, bBottom);
      ctx.lineTo(bLeft + corner, bBottom);
      // Bottom-Right
      ctx.moveTo(bRight - corner, bBottom);
      ctx.lineTo(bRight, bBottom);
      ctx.lineTo(bRight, bBottom - corner);
      ctx.stroke();

      // Target Label
      ctx.fillStyle = bbColor;
      ctx.font = '10px "JetBrains Mono", monospace';
      const label = predictedTargetPix.visible
        ? 'PREDICTED: TARGET-SAT-01'
        : `TARGET-SAT-01 [${confidence.toFixed(1)}%]`;
      ctx.fillText(label, bLeft, bTop - 6);

      // 7. Visual Markers for Raw vs Filtered vs Predicted
      // Raw Target Measurement (Red dot)
      if (rawTargetPix.visible && !predictedTargetPix.visible) {
        ctx.fillStyle = '#FF4D6D';
        ctx.beginPath();
        ctx.arc(rawTargetPix.x, rawTargetPix.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Filtered Target (Green Diamond)
      ctx.strokeStyle = '#00FF88';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const fx = filteredTargetPix.x;
      const fy = filteredTargetPix.y;
      ctx.moveTo(fx, fy - 5);
      ctx.lineTo(fx + 5, fy);
      ctx.lineTo(fx, fy + 5);
      ctx.lineTo(fx - 5, fy);
      ctx.closePath();
      ctx.stroke();

      // Line from Center to Target (Error Vector)
      ctx.strokeStyle = 'rgba(255, 176, 32, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      // Target outside FOV or completely lost
      if (trackingState === 'SEARCHING') {
        // Draw searching radar beam / scan line
        ctx.strokeStyle = 'rgba(255, 176, 32, 0.3)';
        ctx.beginPath();
        ctx.arc(cx, cy, 90, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 176, 32, 0.8)';
        ctx.font = '11px "Orbitron", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('AUTONOMOUS SEARCH SCANNING', cx, cy + 80);
      } else if (trackingState === 'TARGET_LOST') {
        ctx.fillStyle = 'rgba(255, 77, 109, 0.85)';
        ctx.font = '12px "Orbitron", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('TARGET SIGNAL LOST', cx, cy - 10);
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillText('KALMAN COASTING EXPIRED', cx, cy + 12);
      }
    }
  }, [
    trackingState,
    confidence,
    inFOV,
    isTargetDetected,
    rawTargetPix,
    filteredTargetPix,
    predictedTargetPix,
    kalmanActive,
    imageNoise,
    blur,
    atmosphericTurbulence,
    targetHidden
  ]);

  // Feed status style
  let feedStatusClass = 'searching';
  if (trackingState === 'LOCKED' || trackingState === 'TRACKING') feedStatusClass = 'tracking';
  if (trackingState === 'TARGET_LOST') feedStatusClass = 'lost';

  return (
    <div className={`panel camera-feed ${feedStatusClass}`} style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="section-header">
        <Radio size={14} color="#00E5FF" />
        <span className="section-header-title">LIVE OPTICAL SENSOR FEED (640×480)</span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span className={`status-dot ${trackingState === 'LOCKED' ? 'online' : (trackingState === 'SEARCHING' ? 'warning' : 'danger')}`} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)' }}>
            HFOV 10.0° • VFOV 7.5°
          </span>
        </div>
      </div>

      {/* Sensor Canvas Viewport */}
      <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            filter: blur > 0 ? `blur(${(blur / 100) * 4}px)` : 'none'
          }}
        />

        {/* Searching Scan Line animation */}
        {trackingState === 'SEARCHING' && <div className="scan-line" />}

        {/* Top-Right HUD Badge in Camera Feed */}
        <div style={{
          position: 'absolute',
          top: 10,
          right: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 4
        }}>
          <div className={`state-badge ${trackingState}`} style={{ fontSize: 10, padding: '3px 10px' }}>
            ● {trackingState}
          </div>

          <div style={{
            background: 'rgba(5, 9, 20, 0.8)',
            padding: '3px 8px',
            borderRadius: 4,
            fontSize: 9,
            fontFamily: 'var(--font-mono)',
            border: '1px solid rgba(0, 229, 255, 0.2)'
          }}>
            CONF: <span style={{ color: confidence > 80 ? '#00FF88' : '#FFB020' }}>{confidence.toFixed(1)}%</span>
          </div>

          <div style={{
            background: 'rgba(5, 9, 20, 0.8)',
            padding: '3px 8px',
            borderRadius: 4,
            fontSize: 9,
            fontFamily: 'var(--font-mono)',
            border: '1px solid rgba(0, 229, 255, 0.2)'
          }}>
            KALMAN: <span style={{ color: predictedTargetPix.visible ? '#FFB020' : (kalmanActive ? '#00FF88' : '#4A6580') }}>
              {predictedTargetPix.visible ? 'PREDICTING' : (kalmanActive ? 'ACTIVE' : 'OFF')}
            </span>
          </div>
        </div>

        {/* Bottom-Left Live Error Readout in Camera Feed */}
        <div style={{
          position: 'absolute',
          bottom: 10,
          left: 10,
          background: 'rgba(5, 9, 20, 0.88)',
          padding: '7px 12px',
          borderRadius: 6,
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          border: '1px solid rgba(0, 229, 255, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          backdropFilter: 'blur(6px)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 8, letterSpacing: 0.8 }}>ISRO COARSE TRACKING STATUS</span>
            <span style={{
              fontSize: 9,
              fontWeight: 700,
              color: trackingState === 'LOCKED' ? '#00FF88' : (trackingState === 'TRACKING' ? '#00E5FF' : '#FFB020'),
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}>
              <span style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: trackingState === 'LOCKED' ? '#00FF88' : '#FFB020',
                boxShadow: trackingState === 'LOCKED' ? '0 0 8px #00FF88' : 'none'
              }} />
              {trackingState === 'LOCKED' ? 'CONTINUOUS LOCK ACTIVE' : trackingState}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span>PAN: <strong style={{ color: '#00E5FF' }}>{panError > 0 ? '+' : ''}{panError.toFixed(2)}°</strong></span>
            <span>TILT: <strong style={{ color: '#00E5FF' }}>{tiltError > 0 ? '+' : ''}{tiltError.toFixed(2)}°</strong></span>
            <span>ANG: <strong style={{ color: angularError < 0.25 ? '#00FF88' : '#FFB020' }}>{angularError.toFixed(2)}°</strong></span>
            <span style={{
              background: trackingErrorPixels <= 10 ? 'rgba(0,255,136,0.15)' : 'rgba(255,77,109,0.15)',
              padding: '1px 6px',
              borderRadius: 3,
              color: trackingErrorPixels <= 10 ? '#00FF88' : '#FF4D6D',
              border: `1px solid ${trackingErrorPixels <= 10 ? 'rgba(0,255,136,0.4)' : 'rgba(255,77,109,0.4)'}`
            }}>
              ERR: <strong>{trackingErrorPixels > 500 ? '---' : `${trackingErrorPixels.toFixed(1)} px`}</strong> {trackingErrorPixels <= 10 ? '✓' : ''}
            </span>
            {rmsePixels > 0 && (
              <span style={{ color: 'var(--text-secondary)' }}>
                RMSE: <strong style={{ color: '#00E5FF' }}>{rmsePixels.toFixed(1)} px</strong>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Camera Feed Legend */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '6px 12px',
        borderTop: '1px solid var(--border-color)',
        background: 'var(--bg-card)',
        fontSize: 10,
        fontFamily: 'var(--font-mono)',
        color: 'var(--text-secondary)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF4D6D', display: 'inline-block' }} />
          <span>Raw CV</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 6, height: 6, transform: 'rotate(45deg)', background: '#00FF88', display: 'inline-block' }} />
          <span>Kalman Filter</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFB020', display: 'inline-block' }} />
          <span>Prediction</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 6, height: 6, border: '1px solid #00E5FF', display: 'inline-block' }} />
          <span>Boresight Center</span>
        </div>
      </div>
    </div>
  );
}
