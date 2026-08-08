import { useEffect, useRef } from 'react';
import { useApp } from '../../library/contexts/AppContext.js';
import { GlowWaveStyles as styles } from '@styles';

/**
 * Luma-style ambient field — fine grid + soft glowing clusters.
 * Theme-aware. Designed to sit BEHIND the footer full-bleed.
 */
export function GlowWave({ height = 320 }) {
  const canvasRef = useRef(null);
  const { theme } = useApp();
  const dark = theme !== 'light';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf = 0;
    let t = 0;
    let running = true;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const parent = canvas.parentElement;
      const w = parent?.clientWidth || canvas.clientWidth || window.innerWidth;
      const h = parent?.clientHeight || height;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const clusters = [
      { cx: 0.1, cy: 0.4, r: 0.28, count: 110, hue: 'violet', phase: 0 },
      { cx: 0.06, cy: 0.75, r: 0.18, count: 60, hue: 'violet', phase: 1.2 },
      { cx: 0.9, cy: 0.32, r: 0.24, count: 95, hue: 'amber', phase: 0.6 },
      { cx: 0.94, cy: 0.7, r: 0.2, count: 75, hue: 'amber', phase: 2.1 },
      { cx: 0.5, cy: 0.2, r: 0.14, count: 45, hue: 'mint', phase: 0.3 },
      { cx: 0.7, cy: 0.55, r: 0.12, count: 40, hue: 'amber', phase: 1.7 },
      { cx: 0.3, cy: 0.55, r: 0.13, count: 42, hue: 'violet', phase: 2.4 },
    ];

    const palette = dark
      ? {
          grid: 'rgba(255,255,255,0.065)',
          violet: [196, 112, 232],
          amber: [255, 176, 77],
          mint: [54, 230, 195],
          fill: 'rgba(7, 11, 16, 0.92)',
        }
      : {
          grid: 'rgba(15,23,42,0.07)',
          violet: [124, 58, 237],
          amber: [217, 119, 6],
          mint: [5, 150, 105],
          fill: 'rgba(15, 23, 42, 0.88)',
        };

    const draw = () => {
      if (!running) return;
      const w = canvas.width / (window.devicePixelRatio || 1) || canvas.clientWidth;
      const h = canvas.height / (window.devicePixelRatio || 1) || height;
      // use actual canvas pixel size in css pixels
      const cw = canvas.clientWidth || w;
      const ch = canvas.clientHeight || h;

      ctx.clearRect(0, 0, cw, ch);
      ctx.fillStyle = palette.fill;
      ctx.fillRect(0, 0, cw, ch);

      const gap = 14;
      ctx.fillStyle = palette.grid;
      for (let y = gap / 2; y < ch; y += gap) {
        for (let x = gap / 2; x < cw; x += gap) {
          ctx.beginPath();
          ctx.arc(x, y, 0.85, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      for (const c of clusters) {
        const rgb = palette[c.hue] || palette.mint;
        const cx = c.cx * cw + Math.sin(t * 0.004 + c.phase) * 12;
        const cy = c.cy * ch + Math.cos(t * 0.003 + c.phase) * 9;
        const baseR = c.r * Math.min(cw, ch * 1.4);

        for (let i = 0; i < c.count; i++) {
          const ang = (i / c.count) * Math.PI * 2 + t * 0.002 * (0.5 + (i % 5) * 0.1);
          const spiral = 0.32 + 0.68 * ((i % 17) / 17);
          const jitter = Math.sin(i * 12.9898 + t * 0.01) * 0.08;
          const rr = baseR * (spiral + jitter);
          const x = cx + Math.cos(ang) * rr;
          const y = cy + Math.sin(ang) * rr * 0.7;

          const depth = 0.25 + 0.75 * (1 - spiral);
          const pulse = 0.75 + 0.25 * Math.sin(t * 0.02 + i * 0.3 + c.phase);
          const alpha = depth * pulse * (dark ? 0.9 : 0.72);
          const size = 1.05 + depth * 1.7;

          ctx.beginPath();
          ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha * 0.2})`;
          ctx.arc(x, y, size * 2.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.fillStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
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
  }, [dark, height]);

  return (
    <div className={styles.Wrap} aria-hidden="true" data-theme={dark ? 'dark' : 'light'}>
      <canvas ref={canvasRef} className={styles.Canvas} />
    </div>
  );
}
