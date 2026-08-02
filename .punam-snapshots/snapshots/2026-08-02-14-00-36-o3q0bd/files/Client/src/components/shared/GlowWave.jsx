import { useEffect, useRef } from 'react';
import { useApp } from '../../library/contexts/AppContext.js';
import { GlowWaveStyles as styles } from '@styles';

/**
 * Animated particle wave — emerald in dark mode, deeper green in light mode.
 * Pure canvas, no external assets.
 */
export function GlowWave({ height = 180 }) {
  const canvasRef = useRef(null);
  const { theme } = useApp();
  const dark = theme === 'dark';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf = 0;
    let t = 0;
    let running = true;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const draw = () => {
      if (!running) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      // theme-aware palette
      const c1 = dark ? '54, 230, 195' : '13, 159, 110';
      const c2 = dark ? '167, 139, 250' : '5, 150, 105';
      const c3 = dark ? '244, 114, 182' : '16, 185, 129';

      // soft glow backdrop
      const g = ctx.createRadialGradient(w * 0.5, h * 0.9, 10, w * 0.5, h * 0.2, h);
      g.addColorStop(0, `rgba(${c1}, 0.25)`);
      g.addColorStop(0.55, `rgba(${c2}, 0.08)`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      const layers = [
        { amp: h * 0.18, freq: 0.008, speed: 0.018, color: c1, size: 2.2, step: 6 },
        { amp: h * 0.14, freq: 0.012, speed: 0.024, color: c2, size: 1.6, step: 5 },
        { amp: h * 0.1, freq: 0.018, speed: 0.03, color: c3, size: 1.2, step: 4 },
      ];

      for (const layer of layers) {
        for (let x = 0; x <= w; x += layer.step) {
          const y =
            h * 0.55 +
            Math.sin(x * layer.freq + t * layer.speed) * layer.amp +
            Math.sin(x * layer.freq * 0.45 - t * layer.speed * 0.7) * (layer.amp * 0.35);
          const alpha = 0.35 + 0.45 * Math.sin((x / w) * Math.PI);
          ctx.beginPath();
          ctx.fillStyle = `rgba(${layer.color}, ${alpha})`;
          ctx.arc(x, y, layer.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // sparse rising particles
      for (let i = 0; i < 28; i++) {
        const px = ((i * 97 + t * 12) % w);
        const py = h - ((t * 18 + i * 40) % (h + 40));
        const a = 0.15 + 0.35 * Math.sin(t * 0.04 + i);
        ctx.beginPath();
        ctx.fillStyle = `rgba(${c1}, ${a})`;
        ctx.arc(px, py, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!prefersReduced) {
        t += 1;
        raf = requestAnimationFrame(draw);
      }
    };

    draw();
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [dark]);

  return (
    <div className={styles.Wrap} aria-hidden="true">
      <canvas ref={canvasRef} className={styles.Canvas} style={{ height }} />
      <div className={styles.Fade} data-theme={dark ? 'dark' : 'light'} />
    </div>
  );
}
