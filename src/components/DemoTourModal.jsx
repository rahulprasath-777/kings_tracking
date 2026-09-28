import React from 'react';
import { useSimulationStore } from '../store/useSimulationStore';
import { ChevronRight, Sparkles, X } from 'lucide-react';

export function DemoTourModal() {
  const isDemoActive = useSimulationStore((state) => state.isDemoActive);
  const demoPhase = useSimulationStore((state) => state.demoPhase);
  const demoMessage = useSimulationStore((state) => state.demoMessage);
  const stopDemo = useSimulationStore((state) => state.stopDemo);

  if (!isDemoActive) return null;

  const totalPhases = 13;
  const progressPercent = Math.min(100, ((demoPhase - 1) / totalPhases) * 100);

  return (
    // position: fixed so it always sits above all content, centered at bottom
    <div style={{
      position: 'fixed',
      bottom: 28,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      width: '92%',
      maxWidth: 760,
      background: 'rgba(5, 9, 20, 0.96)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid #00E5FF',
      borderRadius: 12,
      padding: '14px 20px',
      boxShadow: '0 0 50px rgba(0, 229, 255, 0.4), 0 8px 32px rgba(0,0,0,0.7)',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      animation: 'slideUpFadeIn 0.3s ease'
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: 'linear-gradient(135deg, #00E5FF22, #00FF8822)',
            border: '1px solid #00E5FF44',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Sparkles size={14} color="#00E5FF" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: 1.8, color: '#00E5FF', fontWeight: 700 }}>
              ISRO SIH EVALUATION TOUR
            </div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              PHASE {demoPhase} / {totalPhases} • AUTOMATED DEMONSTRATION
            </div>
          </div>
        </div>

        <button
          onClick={stopDemo}
          style={{
            background: 'rgba(255, 77, 109, 0.12)',
            border: '1px solid rgba(255, 77, 109, 0.3)',
            borderRadius: 6,
            color: '#FF4D6D',
            fontSize: 10,
            cursor: 'pointer',
            padding: '4px 10px',
            display: 'flex', alignItems: 'center', gap: 4,
            fontFamily: 'var(--font-ui)',
            fontWeight: 600,
            transition: 'all 0.2s'
          }}
        >
          <X size={11} /> SKIP TOUR
        </button>
      </div>

      {/* Progress Bar with Segment Marks */}
      <div>
        <div style={{
          width: '100%', height: 5,
          background: 'rgba(255, 255, 255, 0.07)',
          borderRadius: 3,
          overflow: 'hidden',
          position: 'relative'
        }}>
          <div style={{
            width: `${progressPercent}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #00E5FF, #00FF88)',
            borderRadius: 3,
            transition: 'width 0.5s ease',
            boxShadow: '0 0 8px rgba(0, 229, 255, 0.6)'
          }} />
        </div>
        {/* Phase count dots */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          {Array.from({ length: totalPhases }, (_, i) => (
            <div
              key={i}
              style={{
                width: 6, height: 6, borderRadius: '50%',
                background: i < demoPhase ? '#00E5FF' : 'rgba(255,255,255,0.1)',
                transition: 'background 0.3s'
              }}
            />
          ))}
        </div>
      </div>

      {/* Current Phase Description */}
      <div style={{
        fontSize: 13,
        color: '#E8F4FD',
        fontWeight: 500,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '8px 12px',
        background: 'rgba(0, 229, 255, 0.06)',
        borderRadius: 6,
        border: '1px solid rgba(0, 229, 255, 0.12)'
      }}>
        <ChevronRight size={16} color="#00FF88" style={{ flexShrink: 0, marginTop: 1 }} />
        <span>{demoMessage}</span>
      </div>
    </div>
  );
}
