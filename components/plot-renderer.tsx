"use client";

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { compile } from 'mathjs';

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), { 
    ssr: false, 
    loading: () => <div className="w-full h-64 flex items-center justify-center bg-muted/20 border border-border/50 rounded-xl">Grafik yuklanmoqda...</div>
});

interface PlotProp {
    code: string;
    type: 'plot2d' | 'plot3d';
}

export function PlotRenderer({ code, type }: PlotProp) {
    const plotData = useMemo(() => {
        try {
            // Attempt to parse JSON config
            const config = JSON.parse(code);
            const expression = config.f || config.expression || 'x^2';
            const compiledExpr = compile(expression);

            if (type === 'plot2d') {
                const domain = config.domain || [-10, 10];
                const steps = config.steps || 200;
                
                const xValues = [];
                const yValues = [];
                const step = (domain[1] - domain[0]) / steps;

                for (let x = domain[0]; x <= domain[1]; x += step) {
                    xValues.push(x);
                    try {
                        const y = compiledExpr.evaluate({ x });
                        // Handle complex outputs or infinities 
                        if (typeof y === 'number' && !isNaN(y) && isFinite(y)) {
                            yValues.push(y);
                        } else {
                            yValues.push(null); // breaks the line
                        }
                    } catch {
                        yValues.push(null);
                    }
                }

                return {
                    data: [{
                        x: xValues,
                        y: yValues,
                        type: 'scatter',
                        mode: 'lines',
                        line: { color: '#6366f1', width: 2 }, // Indigo 500
                        name: `f(x) = ${expression}`
                    }],
                    layout: {
                        title: config.title || `f(x) = ${expression}`,
                        paper_bgcolor: 'transparent',
                        plot_bgcolor: 'transparent',
                        font: { color: '#71717a' }, // muted-foreground
                        margin: { l: 40, r: 20, t: 40, b: 40 },
                        xaxis: { gridcolor: '#e4e4e7' },
                        yaxis: { gridcolor: '#e4e4e7' }
                    }
                };
            } else if (type === 'plot3d') {
                const xDomain = config.xDomain || [-5, 5];
                const yDomain = config.yDomain || [-5, 5];
                const steps = config.steps || 50;

                const xValues = [];
                const yValues = [];
                const zValues = [];

                const xStep = (xDomain[1] - xDomain[0]) / steps;
                const yStep = (yDomain[1] - yDomain[0]) / steps;

                for (let x = xDomain[0]; x <= xDomain[1]; x += xStep) {
                    xValues.push(x);
                }
                for (let y = yDomain[0]; y <= yDomain[1]; y += yStep) {
                    yValues.push(y);
                }

                for (const y of yValues) {
                    const zRow = [];
                    for (const x of xValues) {
                        try {
                            const z = compiledExpr.evaluate({ x, y });
                            if (typeof z === 'number' && !isNaN(z) && isFinite(z)) {
                                zRow.push(z);
                            } else {
                                zRow.push(null);
                            }
                        } catch {
                            zRow.push(null);
                        }
                    }
                    zValues.push(zRow);
                }

                return {
                    data: [{
                        x: xValues,
                        y: yValues,
                        z: zValues,
                        type: 'surface',
                        colorscale: 'Viridis',
                        showscale: false
                    }],
                    layout: {
                        title: config.title || `f(x,y) = ${expression}`,
                        paper_bgcolor: 'transparent',
                        plot_bgcolor: 'transparent',
                        font: { color: '#71717a' },
                        margin: { l: 0, r: 0, t: 40, b: 0 },
                        scene: {
                            xaxis: { title: 'X' },
                            yaxis: { title: 'Y' },
                            zaxis: { title: 'Z' }
                        }
                    }
                };
            }
        } catch (error: unknown) {
            return { error: `Parsing error: ${error instanceof Error ? error.message : String(error)}` };
        }
        return { error: 'Unknown type' };
    }, [code, type]);

    if (plotData.error) {
        return (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl my-4 text-sm font-mono">
                [Plot rendering failed: {plotData.error}]
            </div>
        );
    }

    const ThePlot = Plot as any;

    return (
        <div className="my-6 rounded-2xl overflow-hidden border border-border/50 bg-background shadow-sm hover:shadow-md transition-shadow">
            <ThePlot
                data={plotData.data as any}
                layout={{
                    ...plotData.layout,
                    autosize: true
                }}
                useResizeHandler={true}
                className="w-full h-[400px] md:h-[500px]"
                config={{ displayModeBar: false, responsive: true }}
            />
        </div>
    );
}
