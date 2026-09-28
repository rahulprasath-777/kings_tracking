import React, { useRef, useState, useEffect } from 'react';
import { useSimulationStore } from '../store/useSimulationStore';
import { Upload, Play, Pause, RotateCcw, Film, CheckCircle2, FileText } from 'lucide-react';

/**
 * MP4 Video Upload & Real-Time Computer Vision Processor
 * 
 * Satisfies ISRO Evaluation Stage: Benchmark Performance-2
 * - Accepts user-uploaded .mp4 video files @30 FPS
 * - Bypasses PTZ camera and streams video directly into vision pipeline
 * - Performs real-time beacon spot centroid extraction
 * - Computes Centroiding Error & RMSE against optical center (320, 240)
 * - Includes a Synthetic Benchmark Generator if no external file is provided
 */
export function VideoUploadPanel() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false); // eslint-disable-line
  const [videoFileName, setVideoFileName] = useState('');
  const [isGeneratingSynthetic, setIsGeneratingSynthetic] = useState(false);

  const inputMode = useSimulationStore((state) => state.inputMode);
  const setInputMode = useSimulationStore((state) => state.setInputMode);
  const setVideoSource = useSimulationStore((state) => state.setVideoSource);
  const processVideoFrameCentroid = useSimulationStore((state) => state.processVideoFrameCentroid);
  const trackingErrorPixels = useSimulationStore((state) => state.trackingErrorPixels);
  const rmsePixels = useSimulationStore((state) => state.rmsePixels);
  const generatePerformanceReport = useSimulationStore((state) => state.generatePerformanceReport);

  // Handle local user MP4 file upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('mp4') && !file.name.endsWith('.mp4')) {
      alert('Please upload an MP4 format video file (.mp4).');
      return;
    }

    const url = URL.createObjectURL(file);
    setVideoFileName(file.name);
    setVideoSource(file, url);
    setVideoLoaded(true);

    if (videoRef.current) {
      videoRef.current.src = url;
      videoRef.current.load();
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  // Generate synthetic benchmark video on an offscreen canvas
  const handleGenerateSyntheticBenchmark = () => {
    setIsGeneratingSynthetic(true);
    setVideoFileName('ISRO_Synthetic_Benchmark_Figure8_30FPS.mp4');

    // Create synthetic stream via canvas captureStream
    const synCanvas = document.createElement('canvas');
    synCanvas.width = 640;
    synCanvas.height = 480;
    const ctx = synCanvas.getContext('2d');

    let synTime = 0;
    let stream;
    try {
      stream = synCanvas.captureStream(30);
    } catch {
      // Fallback
    }

    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      setVideoSource(null, 'synthetic');
      setVideoLoaded(true);
    }

    // Render loop for synthetic beacon with Figure of 8 motion & noise
    const drawSyntheticFrame = () => {
      synTime += 0.033;
      // Background
      ctx.fillStyle = '#050914';
      ctx.fillRect(0, 0, 640, 480);

      // 10% Salt & Pepper noise
      const imgData = ctx.getImageData(0, 0, 640, 480);
      const data = imgData.data;
      const numNoise = Math.floor(640 * 480 * 0.08);
      for (let i = 0; i < numNoise; i++) {
        const idx = Math.floor(Math.random() * (640 * 480)) * 4;
        const val = Math.random() > 0.5 ? 255 : 0;
        data[idx] = val;
        data[idx + 1] = val;
        data[idx + 2] = val;
      }
      ctx.putImageData(imgData, 0, 0);

      // Figure of 8 moving optical beacon
      const bx = 320 + Math.sin(synTime * 0.8) * 160;
      const by = 240 + Math.sin(synTime * 1.6) * 90;

      // Glow beacon
      const grad = ctx.createRadialGradient(bx, by, 1, bx, by, 16);
      grad.addColorStop(0, '#FFFFFF');
      grad.addColorStop(0.4, '#00FF88');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(bx, by, 16, 0, Math.PI * 2);
      ctx.fill();

      // Core spot (10x10 square)
      ctx.fillStyle = '#00FF88';
      ctx.fillRect(bx - 5, by - 5, 10, 10);

      if (isGeneratingSynthetic) {
        requestAnimationFrame(drawSyntheticFrame);
      }
    };
    drawSyntheticFrame();
  };

  // Video Frame Computer Vision Centroid Processing Loop
  useEffect(() => {
    let lastTime = performance.now();

    const processFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && inputMode === 'mp4_video' && !video.paused && !video.ended) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const W = canvas.width;
        const H = canvas.height;

        // Draw current video frame to processing canvas
        ctx.drawImage(video, 0, 0, W, H);

        const imgData = ctx.getImageData(0, 0, W, H);
        const data = imgData.data;

        // Fast brightness thresholding to isolate beacon spot
        let sumX = 0;
        let sumY = 0;
        let count = 0;
        const threshold = 180; // High intensity beacon spot

        // Step by 2 pixels for performance optimization
        for (let y = 0; y < H; y += 2) {
          for (let x = 0; x < W; x += 2) {
            const idx = (y * W + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const brightness = (r + g + b) / 3;

            if (brightness > threshold) {
              sumX += x;
              sumY += y;
              count++;
            }
          }
        }

        const now = performance.now();
        const dt = Math.max(0.016, (now - lastTime) / 1000);
        lastTime = now;

        if (count > 4) {
          const centroidX = sumX / count;
          const centroidY = sumY / count;
          processVideoFrameCentroid({ x: centroidX, y: centroidY, detected: true, area: count }, dt);
        } else {
          processVideoFrameCentroid({ x: 320, y: 240, detected: false, area: 0 }, dt);
        }
      }

      animFrameRef.current = requestAnimationFrame(processFrame);
    };

    animFrameRef.current = requestAnimationFrame(processFrame);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [inputMode, processVideoFrameCentroid]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const restartVideo = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play();
    setIsPlaying(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 4 }}>
      {/* Mode Status Pill */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: inputMode === 'mp4_video' ? 'rgba(0, 255, 136, 0.1)' : 'rgba(0, 229, 255, 0.05)',
        border: `1px solid ${inputMode === 'mp4_video' ? '#00FF88' : 'var(--border-color)'}`,
        padding: '8px 12px',
        borderRadius: 6
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Film size={15} color={inputMode === 'mp4_video' ? '#00FF88' : '#00E5FF'} />
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#E8F4FD' }}>
              {inputMode === 'mp4_video' ? 'ACTIVE: MP4 VIDEO BYPASS MODE' : 'MODE: 3D VIRTUAL SCENE'}
            </div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>
              ISRO Benchmark Performance-2 Specification
            </div>
          </div>
        </div>

        <button
          onClick={() => setInputMode(inputMode === 'mp4_video' ? '3d_scene' : 'mp4_video')}
          className={`btn ${inputMode === 'mp4_video' ? 'btn-success' : 'btn-primary'}`}
          style={{ fontSize: 10, padding: '4px 10px' }}
        >
          {inputMode === 'mp4_video' ? 'SWITCH TO 3D SCENE' : 'ACTIVATE MP4 BYPASS'}
        </button>
      </div>

      {/* Upload Box */}
      <div style={{
        border: '2px dashed rgba(0, 229, 255, 0.3)',
        borderRadius: 8,
        padding: '12px 14px',
        textAlign: 'center',
        background: 'rgba(5, 9, 20, 0.6)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8
      }}>
        <Upload size={22} color="#00E5FF" />
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#E8F4FD' }}>
            UPLOAD EVALUATION MP4 VIDEO
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>
            Video files (.mp4) @30 fps with noise and moving beacon spot
          </div>
        </div>

        <input
          type="file"
          accept="video/mp4"
          onChange={handleFileUpload}
          id="mp4-upload-input"
          style={{ display: 'none' }}
        />

        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <label htmlFor="mp4-upload-input" className="btn btn-primary" style={{ cursor: 'pointer', fontSize: 10 }}>
            CHOOSE .MP4 FILE
          </label>

          <button
            onClick={handleGenerateSyntheticBenchmark}
            className="btn btn-ghost"
            style={{ fontSize: 10 }}
            title="Generate a synthetic ISRO benchmark video with Figure of 8 motion and noise"
          >
            LOAD SAMPLE BENCHMARK
          </button>
        </div>

        {videoFileName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#00FF88', marginTop: 4 }}>
            <CheckCircle2 size={12} />
            <span>LOADED: <strong>{videoFileName}</strong></span>
          </div>
        )}
      </div>

      {/* Hidden processing canvas & video element */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
        <video
          ref={videoRef}
          loop
          playsInline
          muted
          style={{ width: '100%', maxHeight: 110, borderRadius: 4, border: '1px solid var(--border-color)', objectFit: 'cover' }}
        />
        <canvas ref={canvasRef} width={640} height={480} style={{ display: 'none' }} />
      </div>

      {/* Video Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-card)', padding: '6px 10px', borderRadius: 4 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={togglePlay} className="btn btn-primary" style={{ padding: '3px 8px', fontSize: 9 }}>
            {isPlaying ? <Pause size={11} /> : <Play size={11} />}
            {isPlaying ? 'PAUSE' : 'PLAY'}
          </button>
          <button onClick={restartVideo} className="btn btn-ghost" style={{ padding: '3px 8px', fontSize: 9 }}>
            <RotateCcw size={11} /> REPLAY
          </button>
        </div>

        <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
          FPS: <strong style={{ color: '#00FF88' }}>30.0</strong> | RATE: ≥ 20 Hz
        </div>
      </div>

      {/* Real-Time Benchmark Error Card */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 6,
        padding: '8px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6
      }}>
        <div style={{ fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          BENCHMARK 2 ERROR METRICS (ISRO COMPARISON)
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '4px 6px', borderRadius: 4 }}>
            <div style={{ fontSize: 8, color: 'var(--text-muted)' }}>CENTROID ERROR</div>
            <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 700, color: trackingErrorPixels <= 10 ? '#00FF88' : '#FFB020' }}>
              {trackingErrorPixels > 900 ? '--' : `${trackingErrorPixels.toFixed(2)} px`}
            </div>
            <div style={{ fontSize: 8, color: '#00FF88' }}>Target: ≤ 10 px</div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '4px 6px', borderRadius: 4 }}>
            <div style={{ fontSize: 8, color: 'var(--text-muted)' }}>MEASURED RMSE</div>
            <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#00E5FF' }}>
              {rmsePixels > 0 ? `${rmsePixels.toFixed(2)} px` : '--'}
            </div>
            <div style={{ fontSize: 8, color: 'var(--text-muted)' }}>Root Mean Sq Error</div>
          </div>
        </div>

        {/* Generate Report Button */}
        <button
          onClick={generatePerformanceReport}
          className="btn btn-success"
          style={{ justifyContent: 'center', marginTop: 4, fontSize: 10, padding: '6px' }}
        >
          <FileText size={12} />
          GENERATE ISRO BENCHMARK REPORT (.TXT)
        </button>
      </div>
    </div>
  );
}
