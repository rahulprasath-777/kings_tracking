import React from 'react';
import { useSimulationStore } from '../store/useSimulationStore';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Download,
  Satellite
} from 'lucide-react';

export function TopBar() {
  const isPaused = useSimulationStore((state) => state.isPaused);
  const setPaused = useSimulationStore((state) => state.setPaused);
  const resetCameraToAway = useSimulationStore((state) => state.resetCameraToAway);
  const startDemo = useSimulationStore((state) => state.startDemo);
  const stopDemo = useSimulationStore((state) => state.stopDemo);
  const isDemoActive = useSimulationStore((state) => state.isDemoActive);
  const demoPhase = useSimulationStore((state) => state.demoPhase);
  const demoMessage = useSimulationStore((state) => state.demoMessage);
  const telemetryLogs = useSimulationStore((state) => state.telemetryLogs);
  const loadScenario = useSimulationStore((state) => state.loadScenario);
  const activeScenario = useSimulationStore((state) => state.activeScenario);

  // CSV Export handler
  const handleExportCSV = () => {
    if (!telemetryLogs || telemetryLogs.length === 0) {
      alert('No telemetry data collected yet.');
      return;
    }

    const headers = ['Timestamp_s', 'TrackingState', 'Pan_deg', 'Tilt_deg', 'AngularError_deg', 'PanError_deg', 'TiltError_deg', 'Confidence_pct', 'InFOV'];
    const rows = telemetryLogs.map(l => [
      l.timestamp,
      l.state,
      l.pan,
      l.tilt,
      l.angularError,
      l.panError,
      l.tiltError,
      l.confidence,
      l.inFOV
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ISRO_FSOC_Tracking_Telemetry_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <header className="topbar">
      {/* Left: ISRO Mission Branding */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 34,
          height: 34,
          borderRadius: 8,
          background: 'linear-gradient(135deg, #FF6F00 0%, #00E5FF 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 14px rgba(0, 229, 255, 0.4)'
        }}>
          <Satellite size={20} color="#FFFFFF" />
        </div>

        <div>
          <div className="topbar-title">ISRO – AI-BASED VIRTUAL CAMERA TRACKING SYSTEM</div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>FSOC MOBILE TERMINAL COARSE ALIGNMENT</span>
            <span>•</span>
            <span style={{ color: '#00E5FF' }}>TARGET-SAT-01</span>
            <span>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span className="status-dot online" /> SYSTEM ONLINE
            </span>
          </div>
        </div>
      </div>

      {/* Center: Demo Tour Banner (when active) */}
      {isDemoActive ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: 'rgba(0, 229, 255, 0.12)',
          border: '1px solid #00E5FF',
          padding: '6px 16px',
          borderRadius: 20,
          boxShadow: '0 0 20px rgba(0, 229, 255, 0.25)'
        }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 11,
            color: '#00E5FF',
            fontWeight: 700,
            letterSpacing: 1
          }}>
            DEMO PHASE {demoPhase}/13:
          </div>
          <div style={{ fontSize: 11, color: '#E8F4FD', fontWeight: 500 }}>
            {demoMessage}
          </div>
          <button
            onClick={stopDemo}
            className="btn btn-danger"
            style={{ padding: '3px 8px', fontSize: 9 }}
          >
            EXIT DEMO
          </button>
        </div>
      ) : (
        /* Scenario Quick Dropdown */
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>SCENARIO:</span>
          <select
            value={activeScenario.slice(0, 10)}
            onChange={(e) => {
              const val = e.target.value;
              const num = parseInt(val.replace('SCENARIO ', ''), 10);
              loadScenario(num);
            }}
            style={{ minWidth: 220 }}
          >
            <option value="SCENARIO 1">SCENARIO 1: Normal Tracking</option>
            <option value="SCENARIO 2">SCENARIO 2: Fast Satellite</option>
            <option value="SCENARIO 3">SCENARIO 3: High Vibration</option>
            <option value="SCENARIO 4">SCENARIO 4: Atmospheric Turbulence</option>
            <option value="SCENARIO 5">SCENARIO 5: Target Loss</option>
            <option value="SCENARIO 6">SCENARIO 6: Multi-Satellite Constellation</option>
            <option value="SCENARIO 7">SCENARIO 7: Full Stress Test</option>
          </select>
        </div>
      )}

      {/* Right: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Special 13-Phase RUN DEMO presentation button */}
        <button
          onClick={isDemoActive ? stopDemo : startDemo}
          className="btn btn-demo"
          title="Automated 13-Phase SIH Presentation Tour"
        >
          <Sparkles size={13} />
          {isDemoActive ? 'STOP TOUR' : 'RUN DEMO'}
        </button>

        {/* Start / Pause */}
        <button
          onClick={() => setPaused(!isPaused)}
          className={`btn ${isPaused ? 'btn-success' : 'btn-ghost'}`}
          title={isPaused ? 'Resume Simulation' : 'Pause Simulation'}
        >
          {isPaused ? <Play size={13} /> : <Pause size={13} />}
          {isPaused ? 'RESUME' : 'PAUSE'}
        </button>

        {/* Reset Camera to away */}
        <button
          onClick={resetCameraToAway}
          className="btn btn-ghost"
          title="Point camera away to re-test search and acquisition"
        >
          <RotateCcw size={13} />
          TEST ACQUISITION
        </button>

        {/* Export CSV */}
        <button
          onClick={handleExportCSV}
          className="btn btn-primary"
          title="Export CSV Telemetry data"
        >
          <Download size={13} />
          EXPORT CSV
        </button>
      </div>
    </header>
  );
}
