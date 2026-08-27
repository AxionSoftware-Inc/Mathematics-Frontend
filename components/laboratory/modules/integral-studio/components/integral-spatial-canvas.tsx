"use client";

import React from "react";
import { RotateCcw } from "lucide-react";

type SpatialPoint = {
    x: number;
    y: number;
    z: number;
    value?: number;
};

type ProjectedPoint = SpatialPoint & {
    sx: number;
    sy: number;
    depth: number;
};

type IntegralSpatialCanvasProps = {
    points: SpatialPoint[];
    kind: "surface" | "volume" | "curve";
    height?: number;
    label?: string;
};

const MAX_VOLUME_POINTS = 1800;
const MAX_SURFACE_POINTS = 2600;

function finitePoint(point: SpatialPoint) {
    return Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z);
}

function samplePoints(points: SpatialPoint[], max: number) {
    if (points.length <= max) return points;
    const step = points.length / max;
    return Array.from({ length: max }, (_, index) => points[Math.min(points.length - 1, Math.floor(index * step))]);
}

function key(value: number) {
    return value.toFixed(6);
}

export function IntegralSpatialCanvas({ points, kind, height = 470, label }: IntegralSpatialCanvasProps) {
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
    const frameRef = React.useRef<number | null>(null);
    const rotationRef = React.useRef({ yaw: -0.72, pitch: 0.5 });
    const zoomRef = React.useRef(1);
    const dragRef = React.useRef<{ active: boolean; x: number; y: number }>({ active: false, x: 0, y: 0 });

    const cleanPoints = React.useMemo(() => {
        const filtered = points.filter(finitePoint);
        return samplePoints(filtered, kind === "volume" ? MAX_VOLUME_POINTS : MAX_SURFACE_POINTS);
    }, [kind, points]);

    const bounds = React.useMemo(() => {
        if (!cleanPoints.length) return null;
        let xMin = Infinity;
        let xMax = -Infinity;
        let yMin = Infinity;
        let yMax = -Infinity;
        let zMin = Infinity;
        let zMax = -Infinity;
        for (const point of cleanPoints) {
            xMin = Math.min(xMin, point.x);
            xMax = Math.max(xMax, point.x);
            yMin = Math.min(yMin, point.y);
            yMax = Math.max(yMax, point.y);
            zMin = Math.min(zMin, point.z);
            zMax = Math.max(zMax, point.z);
        }
        return { xMin, xMax, yMin, yMax, zMin, zMax };
    }, [cleanPoints]);

    const draw = React.useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !bounds) return;
        const context = canvas.getContext("2d");
        if (!context) return;

        const rect = canvas.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const width = Math.max(1, rect.width);
        const displayHeight = Math.max(1, rect.height);
        const targetWidth = Math.round(width * dpr);
        const targetHeight = Math.round(displayHeight * dpr);
        if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
            canvas.width = targetWidth;
            canvas.height = targetHeight;
        }
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        context.clearRect(0, 0, width, displayHeight);
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, width, displayHeight);

        const cx = (bounds.xMin + bounds.xMax) / 2;
        const cy = (bounds.yMin + bounds.yMax) / 2;
        const cz = (bounds.zMin + bounds.zMax) / 2;
        const spanX = Math.max(1e-9, bounds.xMax - bounds.xMin);
        const spanY = Math.max(1e-9, bounds.yMax - bounds.yMin);
        const spanZ = Math.max(1e-9, bounds.zMax - bounds.zMin);
        const maxSpan = Math.max(spanX, spanY, spanZ);
        const yaw = rotationRef.current.yaw;
        const pitch = rotationRef.current.pitch;
        const cosY = Math.cos(yaw);
        const sinY = Math.sin(yaw);
        const cosX = Math.cos(pitch);
        const sinX = Math.sin(pitch);
        const scale = Math.min(width, displayHeight) * 0.37 * zoomRef.current;

        const project = (point: SpatialPoint): ProjectedPoint => {
            const x = (point.x - cx) / maxSpan;
            const y = (point.y - cy) / maxSpan;
            const z = (point.z - cz) / maxSpan;

            const x1 = x * cosY + z * sinY;
            const z1 = -x * sinY + z * cosY;
            const y1 = y * cosX - z1 * sinX;
            const z2 = y * sinX + z1 * cosX;
            const perspective = 1 / Math.max(0.62, 1.35 + z2 * 0.5);

            return {
                ...point,
                sx: width / 2 + x1 * scale * perspective,
                sy: displayHeight / 2 - y1 * scale * perspective,
                depth: z2,
            };
        };

        const projected = cleanPoints.map(project);

        context.strokeStyle = "#e5e9ef";
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(18, displayHeight - 24);
        context.lineTo(width - 18, displayHeight - 24);
        context.stroke();

        if (kind === "surface") {
            const rows = new Map<string, ProjectedPoint[]>();
            const columns = new Map<string, ProjectedPoint[]>();
            for (const point of projected) {
                const yKey = key(point.y);
                const xKey = key(point.x);
                const row = rows.get(yKey) ?? [];
                row.push(point);
                rows.set(yKey, row);
                const column = columns.get(xKey) ?? [];
                column.push(point);
                columns.set(xKey, column);
            }

            const drawLineSet = (sets: Iterable<ProjectedPoint[]>, sortBy: "x" | "y") => {
                for (const set of sets) {
                    if (set.length < 2) continue;
                    set.sort((a, b) => a[sortBy] - b[sortBy]);
                    context.beginPath();
                    set.forEach((point, index) => {
                        if (index === 0) context.moveTo(point.sx, point.sy);
                        else context.lineTo(point.sx, point.sy);
                    });
                    context.strokeStyle = sortBy === "x" ? "rgba(31,84,174,0.72)" : "rgba(89,132,203,0.34)";
                    context.lineWidth = sortBy === "x" ? 1.15 : 0.8;
                    context.stroke();
                }
            };

            drawLineSet(rows.values(), "x");
            drawLineSet(columns.values(), "y");

            const sorted = [...projected].sort((a, b) => a.depth - b.depth);
            for (const point of sorted) {
                context.beginPath();
                context.arc(point.sx, point.sy, 1.35, 0, Math.PI * 2);
                context.fillStyle = "rgba(20,74,167,0.62)";
                context.fill();
            }
        } else if (kind === "volume") {
            const values = projected.map((point) => point.value ?? point.z);
            const minValue = Math.min(...values);
            const maxValue = Math.max(...values);
            const valueSpan = Math.max(1e-9, maxValue - minValue);
            const sorted = [...projected].sort((a, b) => a.depth - b.depth);
            for (const point of sorted) {
                const normalized = ((point.value ?? point.z) - minValue) / valueSpan;
                const radius = 1.2 + normalized * 2.2;
                context.beginPath();
                context.arc(point.sx, point.sy, radius, 0, Math.PI * 2);
                context.fillStyle = `rgba(28,82,178,${0.13 + normalized * 0.48})`;
                context.fill();
            }
        } else {
            const sorted = [...projected].sort((a, b) => a.depth - b.depth);
            if (sorted.length) {
                context.beginPath();
                sorted.forEach((point, index) => {
                    if (index === 0) context.moveTo(point.sx, point.sy);
                    else context.lineTo(point.sx, point.sy);
                });
                context.strokeStyle = "#184eb8";
                context.lineWidth = 2;
                context.stroke();
            }
        }

        context.fillStyle = "#747d89";
        context.font = "10px system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
        context.fillText(label || (kind === "surface" ? "Surface" : kind === "volume" ? "Volume samples" : "3D curve"), 16, 20);
        context.fillStyle = "#9aa1aa";
        context.fillText("drag to orbit · wheel to zoom", 16, 36);
    }, [bounds, cleanPoints, kind, label]);

    const scheduleDraw = React.useCallback(() => {
        if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
        frameRef.current = requestAnimationFrame(draw);
    }, [draw]);

    React.useEffect(() => {
        scheduleDraw();
        const canvas = canvasRef.current;
        if (!canvas) return;
        const observer = new ResizeObserver(scheduleDraw);
        observer.observe(canvas);
        return () => {
            observer.disconnect();
            if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
        };
    }, [scheduleDraw]);

    const reset = () => {
        rotationRef.current = { yaw: -0.72, pitch: 0.5 };
        zoomRef.current = 1;
        scheduleDraw();
    };

    if (!cleanPoints.length) {
        return (
            <div className="flex items-center justify-center rounded-[9px] border border-dashed border-[#dfe4ea] bg-[#fbfcfe] text-[12px] text-[#7b8490]" style={{ height }}>
                3D data is not ready yet.
            </div>
        );
    }

    return (
        <div className="relative overflow-hidden rounded-[9px] border border-[#e1e5eb] bg-white">
            <button
                type="button"
                onClick={reset}
                className="absolute right-3 top-3 z-10 inline-flex h-8 items-center gap-1.5 rounded-[7px] border border-[#dfe4ea] bg-white px-2.5 text-[10px] font-semibold text-[#68717d]"
            >
                <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
            <canvas
                ref={canvasRef}
                className="block w-full cursor-grab touch-none active:cursor-grabbing"
                style={{ height }}
                onPointerDown={(event) => {
                    event.currentTarget.setPointerCapture(event.pointerId);
                    dragRef.current = { active: true, x: event.clientX, y: event.clientY };
                }}
                onPointerMove={(event) => {
                    if (!dragRef.current.active) return;
                    const dx = event.clientX - dragRef.current.x;
                    const dy = event.clientY - dragRef.current.y;
                    dragRef.current = { active: true, x: event.clientX, y: event.clientY };
                    rotationRef.current.yaw += dx * 0.008;
                    rotationRef.current.pitch = Math.max(-1.35, Math.min(1.35, rotationRef.current.pitch + dy * 0.008));
                    scheduleDraw();
                }}
                onPointerUp={(event) => {
                    dragRef.current.active = false;
                    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
                }}
                onPointerCancel={() => {
                    dragRef.current.active = false;
                }}
                onWheel={(event) => {
                    event.preventDefault();
                    zoomRef.current = Math.max(0.55, Math.min(2.4, zoomRef.current * (event.deltaY > 0 ? 0.92 : 1.08)));
                    scheduleDraw();
                }}
            />
        </div>
    );
}
