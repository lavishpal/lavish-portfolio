import { useEffect, useRef } from "react";

/**
 * Photographic-ish Milky Way backdrop on a single canvas.
 *
 * - one pre-rendered nebula layer (drawn once, redrawn only on resize)
 * - three star layers at different depths: drift, twinkle, mouse + scroll parallax
 * - star count scales with viewport area (~1500 desktop → ~420 phone)
 * - pauses when the tab is hidden, renders one static frame under
 *   `prefers-reduced-motion`
 */

interface Star {
  x: number;
  y: number;
  r: number;
  base: number;
  phase: number;
  speed: number;
  tint: number; // 0 = white, <0 cool blue, >0 warm
}

const LAYERS = [
  { depth: 0.12, drift: 0.0016, share: 0.56, size: [0.35, 0.85], bright: [0.25, 0.6] },
  { depth: 0.34, drift: 0.0042, share: 0.3, size: [0.55, 1.25], bright: [0.4, 0.85] },
  { depth: 0.72, drift: 0.0085, share: 0.14, size: [0.9, 2.1], bright: [0.6, 1] },
] as const;

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

/** Box–Muller, used to cluster stars along the galactic band. */
function gauss() {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function starColor(tint: number, alpha: number) {
  if (tint < -0.33) return `rgba(186, 206, 255, ${alpha})`;
  if (tint > 0.45) return `rgba(255, 226, 195, ${alpha})`;
  return `rgba(244, 247, 255, ${alpha})`;
}

/** Soft glow sprite reused for the brightest stars. */
function makeGlow(color: string) {
  const size = 34;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const g = c.getContext("2d");
  if (!g) return c;
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, color);
  grad.addColorStop(0.25, color.replace(/[\d.]+\)$/, "0.16)"));
  grad.addColorStop(1, color.replace(/[\d.]+\)$/, "0)"));
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return c;
}

export function GalaxyBackground() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let stars: Star[][] = [];
    let nebula: HTMLCanvasElement | null = null;
    let frame = 0;
    let running = true;

    const glow = {
      white: makeGlow("rgba(244, 247, 255, 0.5)"),
      blue: makeGlow("rgba(170, 195, 255, 0.5)"),
      warm: makeGlow("rgba(255, 220, 180, 0.45)"),
    };

    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    let scroll = window.scrollY;

    /** Nebula + dust lanes, rendered small and upscaled — cheap and soft. */
    function buildNebula(w: number, h: number) {
      const c = document.createElement("canvas");
      const scale = 0.2;
      c.width = Math.max(120, Math.round(w * scale));
      c.height = Math.max(120, Math.round(h * scale));
      const g = c.getContext("2d");
      if (!g) return c;

      const W = c.width;
      const H = c.height;

      // Deep-space base.
      const base = g.createLinearGradient(0, 0, W * 0.4, H);
      base.addColorStop(0, "#05060c");
      base.addColorStop(0.5, "#04050a");
      base.addColorStop(1, "#03040800");
      g.fillStyle = base;
      g.fillRect(0, 0, W, H);

      g.globalCompositeOperation = "lighter";

      // The band runs corner to corner; clouds are seeded along it.
      const bandAngle = -0.42;
      const cx = W * 0.5;
      const cy = H * 0.52;
      const clouds = 34;
      const palette = [
        "rgba(52, 44, 122, ALPHA)",
        "rgba(38, 58, 128, ALPHA)",
        "rgba(84, 48, 124, ALPHA)",
        "rgba(30, 70, 110, ALPHA)",
        "rgba(122, 92, 150, ALPHA)",
      ];

      for (let i = 0; i < clouds; i += 1) {
        const t = (i / (clouds - 1) - 0.5) * 2;
        const along = t * Math.hypot(W, H) * 0.62;
        const across = gauss() * H * 0.1;
        const x = cx + Math.cos(bandAngle) * along - Math.sin(bandAngle) * across;
        const y = cy + Math.sin(bandAngle) * along + Math.cos(bandAngle) * across;
        const radius = rand(H * 0.12, H * 0.4);
        const alpha = rand(0.09, 0.24);
        const color = palette[Math.floor(Math.random() * palette.length)]!.replace(
          "ALPHA",
          alpha.toFixed(3),
        );
        const grad = g.createRadialGradient(x, y, 0, x, y, radius);
        grad.addColorStop(0, color);
        grad.addColorStop(1, color.replace(/[\d.]+\)$/, "0)"));
        g.fillStyle = grad;
        g.beginPath();
        g.arc(x, y, radius, 0, Math.PI * 2);
        g.fill();
      }

      // A faint core glow where the band is densest.
      const core = g.createRadialGradient(cx * 0.8, cy, 0, cx * 0.8, cy, H * 0.55);
      core.addColorStop(0, "rgba(122, 124, 196, 0.14)");
      core.addColorStop(1, "rgba(120, 122, 190, 0)");
      g.fillStyle = core;
      g.fillRect(0, 0, W, H);

      // Dust lanes: dark clouds cut back over the band.
      g.globalCompositeOperation = "source-over";
      for (let i = 0; i < 12; i += 1) {
        const t = (i / 11 - 0.5) * 2;
        const along = t * Math.hypot(W, H) * 0.58;
        const across = gauss() * H * 0.055;
        const x = cx + Math.cos(bandAngle) * along - Math.sin(bandAngle) * across;
        const y = cy + Math.sin(bandAngle) * along + Math.cos(bandAngle) * across;
        const radius = rand(H * 0.06, H * 0.22);
        const grad = g.createRadialGradient(x, y, 0, x, y, radius);
        grad.addColorStop(0, `rgba(3, 4, 8, ${rand(0.25, 0.5).toFixed(3)})`);
        grad.addColorStop(1, "rgba(3, 4, 8, 0)");
        g.fillStyle = grad;
        g.beginPath();
        g.arc(x, y, radius, 0, Math.PI * 2);
        g.fill();
      }

      return c;
    }

    function buildStars(w: number, h: number) {
      const area = w * h;
      const total = Math.round(Math.min(2300, Math.max(520, area / 850)));
      const bandAngle = -0.42;
      const cx = w * 0.5;
      const cy = h * 0.52;

      return LAYERS.map((layer) => {
        const count = Math.round(total * layer.share);
        const list: Star[] = [];
        for (let i = 0; i < count; i += 1) {
          // ~55% of stars hug the galactic band, the rest fill the field.
          let x: number;
          let y: number;
          if (Math.random() < 0.55) {
            const along = (Math.random() - 0.5) * Math.hypot(w, h) * 1.2;
            const across = gauss() * h * 0.16;
            x = cx + Math.cos(bandAngle) * along - Math.sin(bandAngle) * across;
            y = cy + Math.sin(bandAngle) * along + Math.cos(bandAngle) * across;
          } else {
            x = Math.random() * w;
            y = Math.random() * h;
          }
          list.push({
            x: ((x % w) + w) % w,
            y: ((y % h) + h) % h,
            r: rand(layer.size[0], layer.size[1]),
            base: rand(layer.bright[0], layer.bright[1]),
            phase: Math.random() * Math.PI * 2,
            speed: rand(0.4, 1.7),
            tint: rand(-1, 1),
          });
        }
        return list;
      });
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      nebula = buildNebula(width, height);
      stars = buildStars(width, height);
      draw(performance.now());
    }

    function draw(now: number) {
      if (!ctx) return;
      const t = now / 1000;

      pointer.x += (pointer.tx - pointer.x) * 0.05;
      pointer.y += (pointer.ty - pointer.y) * 0.05;
      const scrollShift = scroll * 0.06;

      ctx.clearRect(0, 0, width, height);

      if (nebula) {
        const nx = pointer.x * 10;
        const ny = pointer.y * 10 - scrollShift * 0.35;
        ctx.globalAlpha = 1;
        ctx.drawImage(nebula, nx - 24, ny - 24, width + 48, height + 48);
      }

      ctx.globalCompositeOperation = "lighter";

      for (let i = 0; i < stars.length; i += 1) {
        const layer = LAYERS[i]!;
        const list = stars[i]!;
        const offsetX = pointer.x * (18 + layer.depth * 46) + (reduced ? 0 : t * layer.drift * 60);
        const offsetY = pointer.y * (14 + layer.depth * 34) - scrollShift * layer.depth * 3.4;

        for (let s = 0; s < list.length; s += 1) {
          const star = list[s]!;
          let x = star.x + offsetX;
          let y = star.y + offsetY;
          x = ((x % width) + width) % width;
          y = ((y % height) + height) % height;

          const twinkle = reduced ? 1 : 0.72 + 0.28 * Math.sin(t * star.speed + star.phase);
          const alpha = Math.min(1, star.base * twinkle);

          if (star.r > 1.3) {
            const sprite = star.tint < -0.33 ? glow.blue : star.tint > 0.45 ? glow.warm : glow.white;
            const g = star.r * 9;
            ctx.globalAlpha = alpha * 0.55;
            ctx.drawImage(sprite, x - g / 2, y - g / 2, g, g);
          }

          ctx.globalAlpha = 1;
          ctx.fillStyle = starColor(star.tint, alpha);
          if (star.r <= 0.7) {
            ctx.fillRect(x, y, star.r * 1.6, star.r * 1.6);
          } else {
            ctx.beginPath();
            ctx.arc(x, y, star.r * 0.6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
    }

    function loop(now: number) {
      if (!running) return;
      draw(now);
      frame = requestAnimationFrame(loop);
    }

    function onPointer(event: PointerEvent) {
      pointer.tx = (event.clientX / window.innerWidth - 0.5) * 2;
      pointer.ty = (event.clientY / window.innerHeight - 0.5) * 2;
    }

    function onScroll() {
      scroll = window.scrollY;
    }

    function onVisibility() {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(frame);
      } else if (!reduced) {
        running = true;
        frame = requestAnimationFrame(loop);
      }
    }

    let resizeTimer: number | undefined;
    function onResize() {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 120);
    }

    resize();
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);

    if (!reduced) {
      window.addEventListener("pointermove", onPointer, { passive: true });
      window.addEventListener("scroll", onScroll, { passive: true });
      frame = requestAnimationFrame(loop);
    }

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <>
      <canvas ref={ref} className="galaxy-canvas" aria-hidden="true" />
      <div className="galaxy-veil" aria-hidden="true" />
    </>
  );
}
