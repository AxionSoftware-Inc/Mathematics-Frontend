import { fetchPublic } from "@/lib/api";

export type LaboratoryModuleMeta = {
    id: number | string;
    project?: number | null;
    project_slug?: string | null;
    project_name?: string | null;
    title: string;
    slug: string;
    summary: string;
    description?: string | null;
    category: string;
    icon_name?: string | null;
    accent_color?: string | null;
    computation_mode: "client" | "hybrid" | "server";
    estimated_minutes?: number | null;
    sort_order?: number | null;
    is_enabled?: boolean;
    config?: Record<string, unknown>;
};

export const fallbackLaboratoryModules: LaboratoryModuleMeta[] = [
    {
        id: "matrix-workbench",
        title: "Matrix Workbench",
        slug: "matrix-workbench",
        summary: "Matrix algebra, determinant, inverse and multiplication workspace.",
        description: "Interactively experiment with matrix operations and compare linear algebra results.",
        category: "matrix",
        icon_name: "Grid3X3",
        accent_color: "blue",
        computation_mode: "client",
        estimated_minutes: 12,
        sort_order: 1,
        is_enabled: true,
        config: {
            defaultA: "2 1\n1 3",
            defaultB: "1 0\n4 2",
            operations: ["add", "multiply", "determinant", "inverse"],
        },
    },
    {
        id: "integral-studio",
        title: "Integral Studio",
        slug: "integral-studio",
        summary: "Numerical integration with midpoint, trapezoid and Simpson methods.",
        description: "Approximate definite integrals and inspect sampled curves without stressing the server.",
        category: "integral",
        icon_name: "AreaChart",
        accent_color: "emerald",
        computation_mode: "client",
        estimated_minutes: 10,
        sort_order: 2,
        is_enabled: true,
        config: {
            defaultExpression: "sin(x) + x^2 / 5",
            defaultLower: 0,
            defaultUpper: 3.14,
            defaultSegments: 24,
        },
    },
    {
        id: "differential-lab",
        title: "Differential Lab",
        slug: "differential-lab",
        summary: "Initial value problem sandbox with Euler and Heun trajectories.",
        description: "Study first-order differential equations with adjustable steps and side-by-side approximations.",
        category: "differential",
        icon_name: "ChartLine",
        accent_color: "amber",
        computation_mode: "client",
        estimated_minutes: 14,
        sort_order: 3,
        is_enabled: true,
        config: {
            defaultDerivative: "x - y",
            defaultX0: 0,
            defaultY0: 1,
            defaultStep: 0.2,
            defaultSteps: 20,
        },
    },
    {
        id: "series-limits-studio",
        title: "Series & Limits Studio",
        slug: "series-limits-studio",
        summary: "Series convergence, partial sums and limit probing in one analysis module.",
        description: "Explore sequences, partial sums and one-point limit behavior inside a single modular analysis workspace.",
        category: "analysis",
        icon_name: "Sigma",
        accent_color: "violet",
        computation_mode: "client",
        estimated_minutes: 11,
        sort_order: 4,
        is_enabled: true,
        config: {
            defaultSeriesExpression: "1 / n^2",
            defaultSeriesStart: 1,
            defaultSeriesCount: 12,
            defaultLimitExpression: "sin(x) / x",
            defaultLimitPoint: 0,
            defaultLimitRadius: 1,
        },
    },
    {
        id: "geometry-studio",
        title: "Geometry Studio",
        slug: "geometry-studio",
        summary: "Analytic geometry workspace with lines, distances, midpoints and intersections.",
        description: "Model points and lines on a shared plane, inspect equations and prepare for deeper geometry modules.",
        category: "geometry",
        icon_name: "Rotate3D",
        accent_color: "teal",
        computation_mode: "client",
        estimated_minutes: 13,
        sort_order: 5,
        is_enabled: true,
        config: {
            defaultAx: 0,
            defaultAy: 0,
            defaultBx: 4,
            defaultBy: 3,
            defaultCx: 0,
            defaultCy: 4,
            defaultDx: 5,
            defaultDy: 0,
        },
    },
    {
        id: "proof-assistant",
        title: "Proof Assistant",
        slug: "proof-assistant",
        summary: "Structured theorem, lemma and proof planning workspace for mathematical writing.",
        description: "Design proof skeletons, choose a strategy and turn mathematical ideas into clean writer-ready argument maps.",
        category: "custom",
        icon_name: "BookText",
        accent_color: "rose",
        computation_mode: "client",
        estimated_minutes: 15,
        sort_order: 6,
        is_enabled: true,
        config: {
            defaultTitle: "Teorema sarlavhasi",
            defaultStatement: "Agar shartlar bajarilsa, natija kelib chiqadi.",
            defaultAssumptions: "1. Berilgan shart\n2. Yordamchi faraz",
            defaultGoal: "Natijani isbotlash",
            defaultStrategy: "direct",
        },
    },
    {
        id: "notebook-studio",
        title: "Notebook Studio",
        slug: "notebook-studio",
        summary: "Jupyter-like mathematical notebook with modular cells, rich outputs and writer export flow.",
        description: "Compose markdown, series, limit and Taylor cells inside a reusable notebook workspace designed for mathematical research and drafting.",
        category: "custom",
        icon_name: "BookOpenText",
        accent_color: "cyan",
        computation_mode: "client",
        estimated_minutes: 18,
        sort_order: 7,
        is_enabled: true,
        config: {
            defaultTitle: "Untitled Math Notebook",
            defaultCells: ["markdown", "series"],
        },
    },
    {
        id: "probability-statistics",
        title: "Probability & Statistics",
        slug: "probability-statistics",
        summary: "Descriptive statistics, distribution analysis and probability density workbench.",
        description: "Analyze datasets, inspect histograms and explore probability models with live 2D/3D visualizations.",
        category: "analysis",
        icon_name: "BarChart",
        accent_color: "orange",
        computation_mode: "client",
        estimated_minutes: 13,
        sort_order: 8,
        is_enabled: true,
        config: {
            defaultData: "10, 12, 11, 15, 12, 11, 14, 13, 15, 12",
        },
    },
    {
        id: "complex-analysis-workbench",
        title: "Complex Analysis",
        slug: "complex-analysis-workbench",
        summary: "Complex number mapping, Fractals (Mandelbrot/Julia) va Phase Portrait workbench.",
        description: "Explore the complex plane with stunning fractals, conformal mappings and visual holomorphic functions.",
        category: "analysis",
        icon_name: "Atom",
        accent_color: "indigo",
        computation_mode: "client",
        estimated_minutes: 15,
        sort_order: 9,
        is_enabled: true,
        config: {
            defaultExpr: "z^2",
            defaultFractal: "mandelbrot",
        },
    },
    {
        id: "signal-processing-studio",
        title: "Signal Processing Studio",
        slug: "signal-processing-studio",
        summary: "Fourier analysis, FFT Spectrum and signal synthesis workbench.",
        description: "Analyze signals in both time and frequency domains. Synthesize waveforms and study Fourier transforms with live instruments.",
        category: "analysis",
        icon_name: "Activity",
        accent_color: "emerald",
        computation_mode: "client",
        estimated_minutes: 16,
        sort_order: 10,
        is_enabled: true,
        config: {
            defaultWave: "sine",
            defaultFreq: 440,
        },
    },
    {
        id: "numerical-analysis-lab",
        title: "Numerical Analysis Lab",
        slug: "numerical-analysis-lab",
        summary: "Newton-Raphson, Regression va root-finding workbench.",
        description: "Solve complex non-linear equations.",
        category: "analysis",
        icon_name: "Binary",
        accent_color: "rose",
        computation_mode: "client",
        estimated_minutes: 14,
        sort_order: 11,
        is_enabled: true,
        config: {
            defaultExpr: "x^3 - x - 2",
        },
    },
    {
        id: "graph-theory-lab",
        title: "Graph Theory Lab",
        slug: "graph-theory-lab",
        summary: "Nodes, Edges va Shortest path explorer.",
        description: "Analyze network topologies and calculate shortest paths with Dijkstra.",
        category: "analysis",
        icon_name: "Network",
        accent_color: "emerald",
        computation_mode: "client",
        estimated_minutes: 15,
        sort_order: 12,
        is_enabled: true,
        config: {
            defaultNodes: "A, B, C, D",
        },
    },
    {
        id: "optimization-studio",
        title: "Optimization Studio",
        slug: "optimization-studio",
        summary: "Gradient Descent va Parameter optimization.",
        description: "Analyze how functions converge using gradient-based algorithms.",
        category: "analysis",
        icon_name: "Focus",
        accent_color: "violet",
        computation_mode: "client",
        estimated_minutes: 16,
        sort_order: 13,
        is_enabled: true,
        config: {
            defaultExpr: "x^2 + y^2",
        },
    },
    {
        id: "linear-algebra-studio",
        title: "Linear Algebra Studio",
        slug: "linear-algebra-studio",
        summary: "Systems of equations, Vector spaces va Gaussian elimination workbench.",
        description: "Solve complex systems of linear equations using Gaussian elimination and explore vector space properties.",
        category: "analysis",
        icon_name: "Grid3X3",
        accent_color: "blue",
        computation_mode: "client",
        estimated_minutes: 12,
        sort_order: 14,
        is_enabled: true,
        config: {
            defaultMatrix: "1 2, 3 4",
        },
    },
    {
        id: "cryptography-studio",
        title: "Cryptography Studio",
        slug: "cryptography-studio",
        summary: "RSA, ECC va Public-key encryption sandbox.",
        description: "Study the mathematics of security: implement RSA, explore Elliptic Curve points, and simulate Diffie-Hellman exchanges.",
        category: "analysis",
        icon_name: "ShieldCheck",
        accent_color: "indigo",
        computation_mode: "client",
        estimated_minutes: 18,
        sort_order: 15,
        is_enabled: true,
        config: {
            defaultP: 61,
            defaultQ: 53,
        },
    },
    {
        id: "game-theory-lab",
        title: "Game Theory Lab",
        slug: "game-theory-lab",
        summary: "Nash Equilibrium, Payoff matrices va Evolutionary stable strategies.",
        description: "Analyze strategic interactions through payoff matrices and simulate population dynamics in evolutionary games.",
        category: "analysis",
        icon_name: "Swords",
        accent_color: "rose",
        computation_mode: "client",
        estimated_minutes: 15,
        sort_order: 16,
        is_enabled: true,
        config: {
            defaultMatrix: "3,3 0,5; 5,0 1,1",
        },
    },
    {
        id: "quantum-lab",
        title: "Quantum Computing Lab",
        slug: "quantum-lab",
        summary: "Bloch Sphere, Superposition va Schrödinger's Wavefunctions.",
        description: "Explore the subatomic world: manipulate qubits on the Bloch sphere and visualize quantum probability densities.",
        category: "physics",
        icon_name: "Orbit",
        accent_color: "cyan",
        computation_mode: "client",
        estimated_minutes: 20,
        sort_order: 17,
        is_enabled: true,
        config: {
            defaultTheta: 1.57,
            defaultPhi: 0,
        },
    },
    {
        id: "neural-lab",
        title: "Neural Intelligence Studio",
        slug: "neural-lab",
        summary: "Backpropagation, Weights tuning va XOR logic simulators.",
        description: "Deconstruct the black box: simulate neural network training, observe weight evolution, and analyze loss converge.",
        category: "analysis",
        icon_name: "BrainCircuit",
        accent_color: "emerald",
        computation_mode: "client",
        estimated_minutes: 25,
        sort_order: 18,
        is_enabled: true,
        config: {
            defaultLayers: "2,4,1",
        },
    },
    {
        id: "relativity-lab",
        title: "Relativity Observatorio",
        slug: "relativity-lab",
        summary: "Lorentz transformation, Time dilation va Light cones.",
        description: "Analyze the fundamental nature of spacetime: calculate time dilation for GPS satellites and muons at relativistic speeds.",
        category: "physics",
        icon_name: "Timer",
        accent_color: "orange",
        computation_mode: "client",
        estimated_minutes: 15,
        sort_order: 19,
        is_enabled: true,
        config: {
            defaultV: 200000000,
        },
    },
];

function normalizeModule(payload: Record<string, unknown>): LaboratoryModuleMeta | null {
    if (typeof payload.slug !== "string" || typeof payload.title !== "string" || typeof payload.summary !== "string") {
        return null;
    }

    return {
        id: (payload.id as number | string | undefined) || payload.slug,
        project: typeof payload.project === "number" ? payload.project : null,
        project_slug: typeof payload.project_slug === "string" ? payload.project_slug : null,
        project_name: typeof payload.project_name === "string" ? payload.project_name : null,
        title: payload.title,
        slug: payload.slug,
        summary: payload.summary,
        description: typeof payload.description === "string" ? payload.description : null,
        category: typeof payload.category === "string" ? payload.category : "custom",
        icon_name: typeof payload.icon_name === "string" ? payload.icon_name : "FlaskConical",
        accent_color: typeof payload.accent_color === "string" ? payload.accent_color : "blue",
        computation_mode:
            payload.computation_mode === "server" || payload.computation_mode === "hybrid" ? payload.computation_mode : "client",
        estimated_minutes: typeof payload.estimated_minutes === "number" ? payload.estimated_minutes : 10,
        sort_order: typeof payload.sort_order === "number" ? payload.sort_order : 0,
        is_enabled: typeof payload.is_enabled === "boolean" ? payload.is_enabled : true,
        config: typeof payload.config === "object" && payload.config ? (payload.config as Record<string, unknown>) : {},
    };
}

export async function fetchLaboratoryModules() {
    let apiModules: LaboratoryModuleMeta[] = [];
    try {
        const response = await fetchPublic("/api/laboratory/modules/?project=quantum-uz", { next: { revalidate: 60 } });
        if (response.ok) {
            const payload = await response.json();
            if (Array.isArray(payload)) {
                apiModules = payload
                    .map((item) => normalizeModule(item as Record<string, unknown>))
                    .filter((item): item is LaboratoryModuleMeta => Boolean(item));
            }
        }
    } catch (error) {
        console.error("Failed to fetch laboratory modules", error);
    }

    // Merge logic: API modules override fallbacks, but fallbacks fill the gaps.
    const merged = new Map<string, LaboratoryModuleMeta>();
    
    // 1. Fill with fallbacks first
    fallbackLaboratoryModules.forEach(m => merged.set(m.slug, m));
    
    // 2. Overwrite with API modules (if any)
    apiModules.forEach(m => merged.set(m.slug, m));

    return Array.from(merged.values()).sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));
}

export async function fetchLaboratoryModule(slug: string) {
    try {
        const response = await fetchPublic(`/api/laboratory/modules/${slug}/?project=quantum-uz`, { next: { revalidate: 60 } });
        if (response.ok) {
            const payload = await response.json();
            return normalizeModule(payload as Record<string, unknown>);
        }
    } catch (error) {
        console.error("Failed to fetch laboratory module", error);
    }

    return fallbackLaboratoryModules.find((module) => module.slug === slug) || null;
}
