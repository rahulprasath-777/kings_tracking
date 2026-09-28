import React from 'react';
import { TopBar } from './components/TopBar';
import { MainScene } from './scene/MainScene';
import { CameraFeed } from './components/CameraFeed';
import { ControlPanel } from './components/ControlPanel';
import { TelemetryBar } from './components/TelemetryBar';
import { ErrorChart } from './components/ErrorChart';
import { DemoTourModal } from './components/DemoTourModal';

export default function App() {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-primary)',
      overflow: 'hidden'
    }}>
      {/* 1. Header / Top Bar */}
      <TopBar />

      {/* 2. Main Viewport Grid */}
      <main className="main-layout">
        {/* Left: 3D Space Simulation & Digital Twin Gimbal */}
        <section className="left-panel panel" style={{ position: 'relative' }}>
          <MainScene />
        </section>

        {/* Right: Live Camera Feed & Control Center */}
        <aside className="right-panel">
          {/* Live Camera Feed */}
          <CameraFeed />

          {/* Controls: Orbit, PID/Kalman, Disturbances, Scenarios, Video Upload */}
          <ControlPanel />
        </aside>

        {/* Bottom Bar: Telemetry Cards & Real-Time Tracking Error Chart */}
        <footer className="bottom-bar">
          {/* Scrollable telemetry row with all ISRO spec metrics */}
          <TelemetryBar />
          {/* Error history chart with ISRO threshold bands */}
          <ErrorChart />
        </footer>
      </main>

      {/* 3. Demo Tour Overlay — position:fixed so it always shows above everything */}
      <DemoTourModal />
    </div>
  );
}
