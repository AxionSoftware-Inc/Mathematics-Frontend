"use client";

import React from "react";
import { PlotPoint } from "@/components/laboratory/math-utils";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from "recharts";

export type PlotSeries = {
    label: string;
    color: string;
    points: PlotPoint[];
};

export function CartesianPlot({
    series,
    height = 360,
    domainX = ["auto", "auto"],
    title
}: {
    series: PlotSeries[];
    height?: number;
    domainX?: [number | "auto", number | "auto"];
    title?: string;
}) {
    if (!series.length || !series[0]?.points.length) {
        return null;
    }

    // Merge points by X value so Recharts can overlay them correctly
    const mergedMap = new Map<number, any>();
    series.forEach((s) => {
        s.points.forEach((p) => {
            // Rounded slightly to avoid floating-point map key misses
            const roundedX = Number(p.x.toFixed(6));
            if (!mergedMap.has(roundedX)) {
                mergedMap.set(roundedX, { x: roundedX });
            }
            mergedMap.get(roundedX)[s.label] = p.y;
        });
    });

    const data = Array.from(mergedMap.values()).sort((a, b) => a.x - b.x);

    return (
        <div className="site-panel w-full p-2 overflow-hidden hover:shadow-lg transition-shadow duration-300">
            {title && (
                <div className="px-5 pt-4 pb-2">
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{title}</h4>
                </div>
            )}
            <div style={{ height }} className="w-full px-2 py-4">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid 
                            strokeDasharray="4 4" 
                            stroke="var(--border)" 
                            opacity={0.5} 
                            vertical={true} 
                        />
                        <XAxis 
                            dataKey="x" 
                            type="number" 
                            domain={domainX} 
                            tick={{ fill: 'var(--muted-foreground)', fontSize: 11, fontWeight: 600 }}
                            tickLine={false}
                            axisLine={{ stroke: 'var(--border)', strokeWidth: 2 }}
                            minTickGap={30}
                            tickFormatter={(val) => val.toFixed(1)}
                        />
                        <YAxis 
                            tick={{ fill: 'var(--muted-foreground)', fontSize: 11, fontWeight: 600 }}
                            tickLine={false}
                            axisLine={false}
                            width={50}
                            tickFormatter={(val) => (Math.abs(val) > 1000 ? val.toExponential(1) : val.toPrecision(3))}
                        />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: 'var(--surface)', 
                                borderColor: 'var(--border)',
                                borderRadius: 'var(--radius-small)',
                                boxShadow: '0 20px 40px -10px rgba(0,0,0,0.15)',
                                backdropFilter: 'blur(12px)',
                                color: 'var(--foreground)'
                            }}
                            itemStyle={{ fontWeight: 700, fontSize: 13 }}
                            labelStyle={{ color: 'var(--muted-foreground)', marginBottom: 6, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}
                            formatter={(value) => {
                                if (typeof value !== "number") {
                                    return value ?? "";
                                }

                                // Formatting massive or tiny numbers for clean plotting
                                if (Math.abs(value) > 10000 || (Math.abs(value) < 0.001 && value !== 0)) {
                                    return value.toExponential(4);
                                }
                                return Number.isInteger(value) ? value : value.toFixed(4);
                            }}
                            labelFormatter={(label) => typeof label === "number" ? `x = ${label.toFixed(4)}` : `x = ${String(label)}`}
                        />
                        <Legend 
                            wrapperStyle={{ paddingTop: "20px", fontSize: "12px", fontWeight: 700, color: 'var(--foreground)' }}
                            iconType="circle"
                            iconSize={8}
                        />
                        {series.map((s, idx) => (
                            <Line
                                key={s.label}
                                type="monotone"
                                dataKey={s.label}
                                stroke={s.color}
                                strokeWidth={3}
                                dot={data.length < 40 ? { r: 4, strokeWidth: 0, fill: s.color } : false}
                                activeDot={{ r: 6, strokeWidth: 2, stroke: 'var(--background)' }}
                                animationDuration={1200}
                                animationEasing="ease-out"
                                isAnimationActive={true}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
