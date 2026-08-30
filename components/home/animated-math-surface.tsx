"use client";

import { useEffect, useRef } from "react";

type Point3 = { x: number; y: number; z: number };
type ProjectedPoint = Point3 & { sx: number; sy: number; depth: number };

const GRID = 22;
const RANGE = 2.7;
const TARGET_FRAME_MS = 1000 / 30;

function surfaceHeight(x: number, y: number, time: number) {
  const radial = Math.exp(-(x * x + y * y) * 0.24);
  const wave = Math.sin(x * 1.28 + time * 0.32) * Math.cos(y * 1.08 - time * 0.2);
  const secondary = Math.sin((x + y) * 0.72 - time * 0.16) * 0.24;
  return radial * 1.18 + wave * 0.72 + secondary - 0.14 * (x * x + y * y);
}

function project(point: Point3, width: number, height: number, time: number): ProjectedPoint {
  const yaw = -0.62 + Math.sin(time * 0.12) * 0.06;
  const pitch = 0.86 + Math.cos(time * 0.1) * 0.025;

  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);
  const x1 = point.x * cosY + point.z * sinY;
  const z1 = -point.x * sinY + point.z * cosY;

  const cosX = Math.cos(pitch);
  const sinX = Math.sin(pitch);
  const y2 = point.y * cosX - z1 * sinX;
  const z2 = point.y * sinX + z1 * cosX;

  const camera = 8.2;
  const perspective = camera / Math.max(3.5, camera - z2);
  const scale = Math.min(width / 8.1, height / 6.0);

  return {
    ...point,
    sx: width * 0.52 + x1 * scale * perspective,
    sy: height * 0.53 + y2 * scale * perspective,
    depth: z2,
  };
}

function drawOrbit(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  rx: number,
  ry: number,
  rotation: number,
  alpha: number,
) {
  ctx.save();
  ctx.translate(width * 0.52, height * 0.54);
  ctx.rotate(rotation);
  ctx.strokeStyle = `rgba(63, 113, 196, ${alpha})`;
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 7]);
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawScene(ctx: CanvasRenderingContext2D, width: number, height: number, time: number) {
  ctx.clearRect(0, 0, width, height);

  const halo = ctx.createRadialGradient(
    width * 0.53,
    height * 0.48,
    0,
    width * 0.53,
    height * 0.48,
    Math.min(width, height) * 0.54,
  );
  halo.addColorStop(0, "rgba(95, 171, 255, 0.16)");
  halo.addColorStop(0.45, "rgba(124, 151, 244, 0.07)");
  halo.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, width, height);

  drawOrbit(ctx, width, height, width * 0.38, height * 0.12, -0.18, 0.17);
  drawOrbit(ctx, width, height, width * 0.32, height * 0.17, 0.48, 0.11);
  drawOrbit(ctx, width, height, width * 0.28, height * 0.2, -0.68, 0.08);

  const points: ProjectedPoint[][] = [];
  for (let row = 0; row < GRID; row += 1) {
    const y = -RANGE + (row / (GRID - 1)) * RANGE * 2;
    const line: ProjectedPoint[] = [];
    for (let col = 0; col < GRID; col += 1) {
      const x = -RANGE + (col / (GRID - 1)) * RANGE * 2;
      const z = surfaceHeight(x, y, time);
      line.push(project({ x, y, z }, width, height, time));
    }
    points.push(line);
  }

  const cells: Array<{ points: ProjectedPoint[]; depth: number; height: number }> = [];
  for (let row = 0; row < GRID - 1; row += 1) {
    for (let col = 0; col < GRID - 1; col += 1) {
      const quad = [points[row][col], points[row][col + 1], points[row + 1][col + 1], points[row + 1][col]];
      cells.push({
        points: quad,
        depth: quad.reduce((sum, point) => sum + point.depth, 0) / 4,
        height: quad.reduce((sum, point) => sum + point.z, 0) / 4,
      });
    }
  }

  cells.sort((a, b) => a.depth - b.depth);
  for (const cell of cells) {
    const normalized = Math.max(0, Math.min(1, (cell.height + 2.2) / 4.4));
    const red = Math.round(70 + normalized * 36);
    const green = Math.round(125 + normalized * 82);
    const blue = Math.round(205 + normalized * 45);
    ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${0.09 + normalized * 0.16})`;
    ctx.beginPath();
    ctx.moveTo(cell.points[0].sx, cell.points[0].sy);
    for (let index = 1; index < cell.points.length; index += 1) {
      ctx.lineTo(cell.points[index].sx, cell.points[index].sy);
    }
    ctx.closePath();
    ctx.fill();
  }

  ctx.lineWidth = Math.max(0.7, Math.min(1.15, width / 900));
  for (let row = 0; row < GRID; row += 1) {
    const rowAlpha = 0.18 + (row / GRID) * 0.16;
    ctx.strokeStyle = `rgba(45, 102, 181, ${rowAlpha})`;
    ctx.beginPath();
    points[row].forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.sx, point.sy);
      else ctx.lineTo(point.sx, point.sy);
    });
    ctx.stroke();
  }

  for (let col = 0; col < GRID; col += 1) {
    ctx.strokeStyle = "rgba(113, 159, 226, 0.2)";
    ctx.beginPath();
    for (let row = 0; row < GRID; row += 1) {
      const point = points[row][col];
      if (row === 0) ctx.moveTo(point.sx, point.sy);
      else ctx.lineTo(point.sx, point.sy);
    }
    ctx.stroke();
  }

  const axisLength = Math.min(width, height) * 0.2;
  ctx.setLineDash([]);
  ctx.strokeStyle = "rgba(30, 77, 145, 0.28)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(width * 0.52 - axisLength, height * 0.75);
  ctx.lineTo(width * 0.52 + axisLength * 1.25, height * 0.75);
  ctx.moveTo(width * 0.52, height * 0.75 + axisLength * 0.46);
  ctx.lineTo(width * 0.52, height * 0.75 - axisLength * 1.45);
  ctx.stroke();

  const orbitDots = 7;
  for (let index = 0; index < orbitDots; index += 1) {
    const angle = time * (0.12 + index * 0.006) + (index / orbitDots) * Math.PI * 2;
    const x = width * 0.52 + Math.cos(angle) * width * 0.35;
    const y = height * 0.54 + Math.sin(angle) * height * 0.105;
    const radius = 1.8 + (index % 3) * 0.6;
    const dot = ctx.createRadialGradient(x - 1, y - 1, 0, x, y, radius * 2.4);
    dot.addColorStop(0, "rgba(255,255,255,0.95)");
    dot.addColorStop(0.35, "rgba(77,158,235,0.9)");
    dot.addColorStop(1, "rgba(77,158,235,0)");
    ctx.fillStyle = dot;
    ctx.beginPath();
    ctx.arc(x, y, radius * 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function AnimatedMathSurface() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    let width = 0;
    let height = 0;
    let frame = 0;
    let previousFrame = 0;
    let visible = true;
    let stopped = false;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const resize = () => {
      const rect = container.getBoundingClientRect();
      width = Math.max(320, rect.width);
      height = Math.max(330, rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawScene(context, width, height, performance.now() / 1000);
    };

    const animate = (timestamp: number) => {
      if (stopped) return;
      frame = window.requestAnimationFrame(animate);
      if (!visible || document.hidden || reducedMotion.matches) return;
      if (timestamp - previousFrame < TARGET_FRAME_MS) return;
      previousFrame = timestamp;
      drawScene(context, width, height, timestamp / 1000);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        visible = entry?.isIntersecting ?? true;
        if (visible && reducedMotion.matches) drawScene(context, width, height, performance.now() / 1000);
      },
      { rootMargin: "120px" },
    );
    intersectionObserver.observe(container);

    const onVisibilityChange = () => {
      if (!document.hidden) drawScene(context, width, height, performance.now() / 1000);
    };
    const onMotionChange = () => drawScene(context, width, height, performance.now() / 1000);

    document.addEventListener("visibilitychange", onVisibilityChange);
    reducedMotion.addEventListener("change", onMotionChange);
    resize();
    frame = window.requestAnimationFrame(animate);

    return () => {
      stopped = true;
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      reducedMotion.removeEventListener("change", onMotionChange);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative min-h-[390px] w-full overflow-hidden sm:min-h-[460px] lg:min-h-[560px]"
      aria-label="Animated three-dimensional mathematical surface"
      role="img"
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_58%_50%,rgba(69,144,236,0.08),transparent_34%),radial-gradient(circle_at_80%_38%,rgba(124,102,238,0.055),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[20%] bg-gradient-to-r from-[var(--ax-canvas)] to-transparent" />

      <div className="pointer-events-none absolute right-[8%] top-[14%] font-serif text-[clamp(13px,1.25vw,18px)] italic text-[#6687bd]/55">
        ∇ · F = 0
      </div>
      <div className="pointer-events-none absolute left-[11%] top-[18%] font-serif text-[clamp(12px,1.15vw,17px)] italic text-[#7192c5]/48">
        e<sup>iπ</sup> + 1 = 0
      </div>
      <div className="pointer-events-none absolute bottom-[16%] left-[8%] font-serif text-[clamp(13px,1.35vw,20px)] italic text-[#5b76b6]/52">
        ∫<sub>a</sub><sup>b</sup> f(x) dx
      </div>
      <div className="pointer-events-none absolute bottom-[11%] right-[5%] font-serif text-[clamp(11px,1.1vw,16px)] italic text-[#7588b6]/45">
        ds² = dx² + dy² + dz²
      </div>
      <div className="pointer-events-none absolute right-[5%] top-[48%] font-serif text-[clamp(11px,1vw,15px)] italic text-[#657fb7]/48">
        d/dx sin x = cos x
      </div>
    </div>
  );
}
