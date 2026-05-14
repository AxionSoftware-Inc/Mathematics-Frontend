"use client";

import React from "react";
import { Activity, AlertTriangle, BarChart3, BrainCircuit, Database, RefreshCw } from "lucide-react";

import { fetchPublic } from "@/lib/api";

type ObservabilityPayload = {
    status: string;
    saved_result_count: number;
    solve_job_count: number;
    failed_solve_count: number;
    report_snapshot_count: number;
    ai_failure_count: number;
    job_counts: Record<string, number>;
    event_counts: Record<string, number>;
    module_job_counts: Record<string, number>;
    runtime: Record<string, number | null>;
    recent_failures: Array<{
        event_type: string;
        module: string;
        object_public_id: string | null;
        payload: Record<string, unknown>;
        created_at: string;
    }>;
};

function Metric({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }> }) {
    return (
        <div className="site-panel p-5">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <div className="site-eyebrow">{label}</div>
                    <div className="mt-3 text-3xl font-black text-foreground">{value}</div>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
}

export default function ObservabilityPage() {
    const [data, setData] = React.useState<ObservabilityPayload | null>(null);
    const [error, setError] = React.useState("");
    const [loading, setLoading] = React.useState(true);

    const load = React.useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const response = await fetchPublic("/api/laboratory/observability/", { cache: "no-store" });
            if (!response.ok) {
                throw new Error(`Observability endpoint failed: ${response.status}`);
            }
            setData((await response.json()) as ObservabilityPayload);
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Observability unavailable.");
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        void load();
    }, [load]);

    return (
        <main className="site-shell min-h-screen">
            <div className="mx-auto w-full max-w-[1500px] px-4 py-8 md:px-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div className="site-eyebrow text-accent">Production Observability</div>
                        <h1 className="mt-3 text-4xl font-black tracking-tight text-foreground">Laboratory health dashboard</h1>
                    </div>
                    <button type="button" onClick={() => void load()} className="site-btn-accent px-4" disabled={loading}>
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </button>
                </div>

                {error ? (
                    <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm font-semibold text-rose-700 dark:text-rose-300">
                        {error}
                    </div>
                ) : null}

                <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    <Metric label="Saved results" value={data?.saved_result_count ?? "..."} icon={Database} />
                    <Metric label="Solve jobs" value={data?.solve_job_count ?? "..."} icon={Activity} />
                    <Metric label="Failed solves" value={data?.failed_solve_count ?? "..."} icon={AlertTriangle} />
                    <Metric label="Report exports" value={data?.report_snapshot_count ?? "..."} icon={BarChart3} />
                    <Metric label="AI failures" value={data?.ai_failure_count ?? "..."} icon={BrainCircuit} />
                </div>

                <div className="mt-6 grid gap-6 xl:grid-cols-3">
                    <div className="site-panel p-5">
                        <div className="site-eyebrow">Job counts</div>
                        <div className="mt-4 space-y-2 text-sm">
                            {Object.entries(data?.job_counts ?? {}).map(([key, value]) => (
                                <div key={key} className="flex items-center justify-between rounded-xl border border-border/70 bg-background px-3 py-2">
                                    <span className="font-semibold">{key}</span>
                                    <span className="font-black">{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="site-panel p-5">
                        <div className="site-eyebrow">Module usage</div>
                        <div className="mt-4 space-y-2 text-sm">
                            {Object.entries(data?.module_job_counts ?? {}).map(([key, value]) => (
                                <div key={key || "unknown"} className="flex items-center justify-between rounded-xl border border-border/70 bg-background px-3 py-2">
                                    <span className="font-semibold">{key || "unknown"}</span>
                                    <span className="font-black">{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="site-panel p-5">
                        <div className="site-eyebrow">Recent failures</div>
                        <div className="mt-4 max-h-[360px] space-y-2 overflow-auto text-xs">
                            {data?.recent_failures?.length ? data.recent_failures.map((failure, index) => (
                                <div key={`${failure.object_public_id}-${index}`} className="rounded-xl border border-border/70 bg-background px-3 py-2">
                                    <div className="font-black">{failure.event_type} / {failure.module || "unknown"}</div>
                                    <div className="mt-1 text-muted-foreground">{failure.created_at}</div>
                                    <div className="mt-1 line-clamp-3 text-muted-foreground">{JSON.stringify(failure.payload)}</div>
                                </div>
                            )) : (
                                <div className="rounded-xl border border-dashed border-border/70 px-3 py-4 text-muted-foreground">No recent failures.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
