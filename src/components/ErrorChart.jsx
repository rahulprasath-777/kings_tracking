import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import { useSimulationStore } from '../store/useSimulationStore';
import { Activity } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      background: '#0B1220',
      border: '1px solid #1A2A40',
      borderRadius: 6,
      padding: '6px 10px',
      fontSize: 10,
      fontFamily: 'monospace'
    }}>
      <div style={{ color: '#4A6580', marginBottom: 4 }}>T: {Number(label).toFixed(1)}s</div>
      {payload.map((entry) => (
        <div key={entry.dataKey} style={{ color: entry.color, display: 'flex', gap: 8 }}>
          <span style={{ opacity: 0.7 }}>{entry.name}:</span>
          <strong>
            {Number(entry.value).toFixed(entry.dataKey.includes('pixel') || entry.dataKey === 'rmse' ? 1 : 3)}
            {entry.dataKey.includes('pixel') || entry.dataKey === 'rmse' ? ' px' : '°'}
          </strong>
        </div>
      ))}
    </div>
  );
};

export function ErrorChart() {
  const errorHistory = useSimulationStore((state) => state.errorHistory);
  const angularError = useSimulationStore((state) => state.angularError);
  const trackingState = useSimulationStore((state) => state.trackingState);
  const trackingErrorPixels = useSimulationStore((state) => state.trackingErrorPixels);
  const rmsePixels = useSimulationStore((state) => state.rmsePixels);

  const isLocked = trackingState === 'LOCKED';
  const isLost = trackingState === 'TARGET_LOST';

  return (
    <div className="panel" style={{ padding: '8px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Header row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 6
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Activity size={13} color="#00E5FF" />
          <span style={{ fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            REAL-TIME TRACKING ERROR HISTORY
          </span>
        </div>

        {/* Live metric badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Angular error pill */}
          <div style={{
            background: isLocked ? 'rgba(0,255,136,0.1)' : (isLost ? 'rgba(255,77,109,0.1)' : 'rgba(0,229,255,0.06)'),
            border: `1px solid ${isLocked ? 'rgba(0,255,136,0.4)' : (isLost ? 'rgba(255,77,109,0.4)' : 'rgba(0,229,255,0.2)')}`,
            padding: '2px 8px',
            borderRadius: 12,
            fontSize: 10,
            fontFamily: 'var(--font-mono)',
            color: isLocked ? '#00FF88' : (isLost ? '#FF4D6D' : '#00E5FF')
          }}>
            Δθ: {angularError.toFixed(3)}°
          </div>

          {/* Pixel error pill */}
          <div style={{
            background: trackingErrorPixels <= 10 ? 'rgba(0,255,136,0.1)' : 'rgba(255,176,32,0.08)',
            border: `1px solid ${trackingErrorPixels <= 10 ? 'rgba(0,255,136,0.3)' : 'rgba(255,176,32,0.3)'}`,
            padding: '2px 8px',
            borderRadius: 12,
            fontSize: 10,
            fontFamily: 'var(--font-mono)',
            color: trackingErrorPixels <= 10 ? '#00FF88' : '#FFB020'
          }}>
            px: {trackingErrorPixels > 900 ? '---' : `${trackingErrorPixels.toFixed(1)}`}
          </div>

          {/* RMSE pill */}
          {rmsePixels > 0 && (
            <div style={{
              background: 'rgba(0,229,255,0.06)',
              border: '1px solid rgba(0,229,255,0.2)',
              padding: '2px 8px',
              borderRadius: 12,
              fontSize: 10,
              fontFamily: 'var(--font-mono)',
              color: '#00E5FF'
            }}>
              RMSE: {rmsePixels.toFixed(1)} px
            </div>
          )}

          {/* Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 9, fontFamily: 'var(--font-mono)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ width: 10, height: 2, background: '#00E5FF', display: 'inline-block' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Total</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ width: 10, height: 2, background: '#FFB020', display: 'inline-block' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Pan</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ width: 10, height: 2, background: '#FF4D6D', display: 'inline-block' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Tilt</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ width: 10, height: 1, borderTop: '1px dashed #00FF88', display: 'inline-block' }} />
              <span style={{ color: '#00FF88' }}>Lock (&lt;0.25°)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ width: '100%', flex: 1, minHeight: 80 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={errorHistory} margin={{ top: 4, right: 10, left: -22, bottom: 0 }}>
            {/* Green shaded "locked" zone below 0.25° */}
            <ReferenceArea y1={0} y2={0.25} fill="rgba(0, 255, 136, 0.04)" fillOpacity={1} />

            <XAxis
              dataKey="time"
              stroke="#1A2A40"
              tick={{ fill: '#4A6580', fontSize: 8, fontFamily: 'monospace' }}
              tickLine={false}
              tickFormatter={(v) => `${Number(v).toFixed(0)}s`}
            />
            <YAxis
              domain={[0, 'auto']}
              stroke="#1A2A40"
              tick={{ fill: '#4A6580', fontSize: 8, fontFamily: 'monospace' }}
              tickLine={false}
              tickFormatter={(v) => `${v.toFixed(1)}°`}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* ISRO coarse lock bound: 0.25° */}
            <ReferenceLine
              y={0.25}
              stroke="#00FF88"
              strokeDasharray="4 3"
              strokeWidth={1.5}
              opacity={0.8}
              label={{ value: '0.25°', fill: '#00FF88', fontSize: 8, dx: 4 }}
            />

            {/* Warning zone: 1.5° */}
            <ReferenceLine
              y={1.5}
              stroke="#FFB020"
              strokeDasharray="2 4"
              strokeWidth={1}
              opacity={0.4}
            />

            <Line
              type="monotone"
              dataKey="angularError"
              name="Angular Error"
              stroke="#00E5FF"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="panError"
              name="Pan Error"
              stroke="#FFB020"
              strokeWidth={1}
              strokeDasharray="3 2"
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="tiltError"
              name="Tilt Error"
              stroke="#FF4D6D"
              strokeWidth={1}
              strokeDasharray="3 2"
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ISRO Specification Status Bar */}
      <div style={{
        display: 'flex',
        gap: 10,
        paddingTop: 4,
        borderTop: '1px solid var(--border-color)',
        fontSize: 9,
        fontFamily: 'var(--font-mono)',
        flexWrap: 'wrap'
      }}>
        {[
          { label: 'Coarse Lock', value: `${angularError.toFixed(3)}°`, pass: angularError < 0.25, spec: '< 0.25°' },
          { label: 'Px Error', value: trackingErrorPixels > 900 ? '---' : `${trackingErrorPixels.toFixed(1)} px`, pass: trackingErrorPixels <= 10, spec: '≤ 10 px' },
          { label: 'RMSE', value: rmsePixels > 0 ? `${rmsePixels.toFixed(1)} px` : '---', pass: rmsePixels > 0 && rmsePixels <= 20, spec: '≤ 20 px' },
        ].map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{
              width: 5, height: 5, borderRadius: '50%',
              background: item.value === '---' ? '#4A6580' : (item.pass ? '#00FF88' : '#FF4D6D'),
              display: 'inline-block', flexShrink: 0
            }} />
            <span style={{ color: 'var(--text-muted)' }}>{item.label}:</span>
            <span style={{ color: item.value === '---' ? '#4A6580' : (item.pass ? '#00FF88' : '#FF4D6D'), fontWeight: 700 }}>
              {item.value}
            </span>
            <span style={{ color: '#2A4050' }}>({item.spec})</span>
          </div>
        ))}
      </div>
    </div>
  );
}
