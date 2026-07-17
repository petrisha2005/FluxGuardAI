import { useEffect, useRef, useState } from 'react';
import { api } from '../../../services/api';
import type { BackendCamera } from '../../../services/api';
import {
  getActiveEventId,
  getSimIdFromUuid,
  useSimulationState,
} from '../../simulation/simulationStore';

// Helper component that renders an animated HTML5 canvas representing a live CCTV feed with bounding boxes
function CctvStreamCanvas({
  density,
  status,
  name,
}: {
  density: number;
  status: string;
  name: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const width = canvas.width;
    const height = canvas.height;

    // Generate simulated pedestrian targets based on crowd density
    const targetCount = Math.max(2, Math.min(30, Math.round(density * 0.3)));
    const targets = Array.from({ length: targetCount }, () => ({
      x: Math.random() * (width - 40) + 20,
      y: Math.random() * (height - 40) + 20,
      w: Math.random() * 15 + 10,
      h: Math.random() * 25 + 15,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
    }));

    const render = () => {
      // Clear canvas
      ctx.fillStyle = '#06070a';
      ctx.fillRect(0, 0, width, height);

      // Draw radar matrix grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      const gridSize = 20;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const isCongested = density > 80;
      const boxColor = isCongested
        ? 'rgba(244, 63, 94, 0.8)' // Red
        : density > 50
          ? 'rgba(251, 191, 36, 0.7)' // Yellow
          : 'rgba(16, 185, 129, 0.6)'; // Green

      // Update and draw bounding boxes
      targets.forEach((t) => {
        // Move target
        t.x += t.vx;
        t.y += t.vy;

        // Bounce boundaries
        if (t.x < 10 || t.x > width - t.w - 10) t.vx *= -1;
        if (t.y < 10 || t.y > height - t.h - 10) t.vy *= -1;

        // Draw bounding box
        ctx.strokeStyle = boxColor;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(t.x, t.y, t.w, t.h);

        // Draw anchor corners
        ctx.fillStyle = boxColor;
        const cLen = 4;
        // Top-left
        ctx.fillRect(t.x - 1, t.y - 1, cLen, 1.5);
        ctx.fillRect(t.x - 1, t.y - 1, 1.5, cLen);
        // Bottom-right
        ctx.fillRect(t.x + t.w - cLen + 1, t.y + t.h - 0.5, cLen, 1.5);
        ctx.fillRect(t.x + t.w - 0.5, t.y + t.h - cLen + 1, 1.5, cLen);

        // Bounding box label
        ctx.fillStyle = boxColor;
        ctx.font = '7px monospace';
        ctx.fillText(`HUMAN ${(Math.random() * 10 + 90).toFixed(0)}%`, t.x, t.y - 3);
      });

      // Draw camera HUD overlay details
      ctx.fillStyle = isCongested ? 'rgba(244, 63, 94, 0.15)' : 'rgba(255, 255, 255, 0.05)';
      ctx.strokeStyle = isCongested ? 'rgba(244, 63, 94, 0.4)' : 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;

      // Top corner indicators
      const borderOffset = 10;
      const capLen = 15;
      ctx.beginPath();
      // TL
      ctx.moveTo(borderOffset, borderOffset + capLen);
      ctx.lineTo(borderOffset, borderOffset);
      ctx.lineTo(borderOffset + capLen, borderOffset);
      // TR
      ctx.moveTo(width - borderOffset - capLen, borderOffset);
      ctx.lineTo(width - borderOffset, borderOffset);
      ctx.lineTo(width - borderOffset, borderOffset + capLen);
      // BL
      ctx.moveTo(borderOffset, height - borderOffset - capLen);
      ctx.lineTo(borderOffset, height - borderOffset);
      ctx.lineTo(borderOffset + capLen, height - borderOffset);
      // BR
      ctx.moveTo(width - borderOffset - capLen, height - borderOffset);
      ctx.lineTo(width - borderOffset, height - borderOffset);
      ctx.lineTo(width - borderOffset, height - borderOffset - capLen);
      ctx.stroke();

      // Congestion alert flashing overlay
      if (isCongested && Math.floor(Date.now() / 500) % 2 === 0) {
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 3;
        ctx.strokeRect(2, 2, width - 4, height - 4);

        ctx.fillStyle = '#f43f5e';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText('WARNING: OVER CAPACITY CONGESTION', 15, 25);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [density, status]);

  return (
    <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-white/5 shadow-inner">
      <canvas ref={canvasRef} width={320} height={180} className="h-full w-full object-cover" />
      {/* Overlay Telemetry HUD */}
      <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded bg-black/75 px-1.5 py-0.5 text-[8px] font-semibold text-ink backdrop-blur">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"></span>
        <span>LIVE REC</span>
      </div>
      <div className="absolute bottom-2 left-2 flex flex-col gap-0.5 text-[8px] font-mono text-white/60 bg-black/60 px-1.5 py-1 rounded backdrop-blur">
        <span>CAM: {name}</span>
        <span>ZONE: {density}% Density</span>
      </div>
    </div>
  );
}

export function CctvFeedGrid() {
  const sim = useSimulationState();
  const [cameras, setCameras] = useState<BackendCamera[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [muteAlerts, setMuteAlerts] = useState<boolean>(false);
  const activeEventId = getActiveEventId();

  useEffect(() => {
    api
      .fetchCameras(activeEventId)
      .then((data) => {
        setCameras(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch cameras:', err);
        setLoading(false);
      });
  }, [activeEventId]);

  if (loading) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-ink">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Computer Vision CCTV Feeds</h2>
          <p className="text-xs text-ink-muted">
            Simulated video streams processing real-time pedestrian coordinates.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-ink-muted flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={muteAlerts}
              onChange={() => setMuteAlerts(!muteAlerts)}
              className="rounded bg-surface border-white/10 text-brand-primary focus:ring-0 focus:ring-offset-0"
            />
            Mute CCTV Congestion Alerts
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cameras.map((camera) => {
          // Resolve simulator zone ID
          const simId = getSimIdFromUuid(camera.zoneId);
          const zoneState = sim.zones.find((z) => z.id === simId);
          const density = zoneState ? zoneState.density : 0;

          // If mute alerts is checked, override flash to 0 density
          const activeDensity = muteAlerts ? Math.min(density, 79) : density;

          return (
            <div
              key={camera.id}
              className="rounded-2xl border border-white/5 bg-surface-elevated/20 p-4 backdrop-blur flex flex-col gap-3 hover:border-white/10 transition-all duration-200"
            >
              <div className="flex items-start justify-between text-xs">
                <div>
                  <h3 className="font-bold truncate max-w-[170px]">{camera.name}</h3>
                  <p className="text-[10px] text-ink-muted uppercase">
                    Accuracy: {(camera.accuracy * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-ink-muted">{camera.fps} FPS</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                </div>
              </div>

              <CctvStreamCanvas
                density={activeDensity}
                status={camera.status}
                name={camera.id.split('-').slice(-2).join('-').toUpperCase()}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
