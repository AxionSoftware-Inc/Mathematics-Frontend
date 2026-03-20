"use client";

import type { ComponentType } from "react";

import { MatrixWorkbenchModule } from "@/components/laboratory/modules/matrix-workbench";
import { IntegralStudioModule } from "@/components/laboratory/modules/integral-studio";
import { DifferentialLabModule } from "@/components/laboratory/modules/differential-lab";
import { SeriesLimitsStudioModule } from "@/components/laboratory/modules/series-limits-studio";
import { GeometryStudioModule } from "@/components/laboratory/modules/geometry-studio";
import { NotebookStudioModule } from "@/components/laboratory/modules/notebook-studio";
import { ProofAssistantModule } from "@/components/laboratory/modules/proof-assistant";
import { ProbabilityStatisticsModule } from "@/components/laboratory/modules/probability-statistics";
import { ComplexAnalysisWorkbenchModule } from "@/components/laboratory/modules/complex-analysis-workbench";
import { SignalProcessingStudioModule } from "@/components/laboratory/modules/signal-processing-studio";
import { NumericalAnalysisLabModule } from "@/components/laboratory/modules/numerical-methods-lab";
import { GraphTheoryLabModule } from "@/components/laboratory/modules/graph-theory-lab";
import { OptimizationStudioModule } from "@/components/laboratory/modules/optimization-studio";
import { LinearAlgebraStudioModule } from "@/components/laboratory/modules/linear-algebra-studio";
import { CryptographyStudioModule } from "@/components/laboratory/modules/cryptography-studio";
import { GameTheoryLabModule } from "@/components/laboratory/modules/game-theory-lab";
import { QuantumLabModule } from "@/components/laboratory/modules/quantum-lab";
import { NeuralLabModule } from "@/components/laboratory/modules/neural-lab";
import { RelativityLabModule } from "@/components/laboratory/modules/relativity-lab";
import { type LaboratoryModuleMeta } from "@/lib/laboratory";

type ModuleComponentProps = {
    module: LaboratoryModuleMeta;
};

type LaboratoryModuleDefinition = {
    capabilities: string[];
    component: ComponentType<ModuleComponentProps>;
};

export const laboratoryModuleRegistry: Record<string, LaboratoryModuleDefinition> = {
    "matrix-workbench": {
        capabilities: ["Matrix algebra", "Heatmap and basis transform", "Determinant and inverse", "Standard writer bridge"],
        component: MatrixWorkbenchModule,
    },
    "integral-studio": {
        capabilities: ["Numerical integration", "Function preview", "Method comparison", "Standard writer bridge"],
        component: IntegralStudioModule,
    },
    "differential-lab": {
        capabilities: ["Euler and Heun methods", "Initial value problems", "Standard writer bridge", "Notebook workspace"],
        component: DifferentialLabModule,
    },
    "series-limits-studio": {
        capabilities: ["Series convergence", "One-sided limits", "Taylor and power series", "Standard writer bridge"],
        component: SeriesLimitsStudioModule,
    },
    "geometry-studio": {
        capabilities: ["Analytic geometry", "Line intersection", "Standard writer bridge", "Notebook workspace"],
        component: GeometryStudioModule,
    },
    "proof-assistant": {
        capabilities: ["Theorem planning", "Proof skeletons", "Strategy presets", "Standard writer bridge"],
        component: ProofAssistantModule,
    },
    "notebook-studio": {
        capabilities: ["Jupyter-like notebook", "Modular cells", "Standard writer bridge", "Math drafting workspace"],
        component: NotebookStudioModule,
    },
    "probability-statistics": {
        capabilities: ["Descriptive statistics", "Distribution analysis", "Histogram viz", "Standard writer bridge"],
        component: ProbabilityStatisticsModule,
    },
    "complex-analysis-workbench": {
        capabilities: ["Fractal rendering", "Conformal mapping", "Phase portrait", "Complex plane sync"],
        component: ComplexAnalysisWorkbenchModule,
    },
    "signal-processing-studio": {
        capabilities: ["Fourier analysis", "FFT spectral density", "Waveform synthesis", "Noise simulation"],
        component: SignalProcessingStudioModule,
    },
    "numerical-analysis-lab": {
        capabilities: ["Root-finding algorithms", "Regression analyzer", "Newton-Raphson viz", "Least Squares fitting"],
        component: NumericalAnalysisLabModule,
    },
    "graph-theory-lab": {
        capabilities: ["Topology visualization", "Force-directed layout", "Dijkstra pathfinding", "Matrix analysis"],
        component: GraphTheoryLabModule,
    },
    "optimization-studio": {
        capabilities: ["Gradient Descent solver", "3D Cost landscapes", "Learning rate analysis", "Convergence logging"],
        component: OptimizationStudioModule,
    },
    "linear-algebra-studio": {
        capabilities: ["Systems of equations solver", "Gaussian elimination", "Vector space analysis", "Formal representation"],
        component: LinearAlgebraStudioModule,
    },
    "cryptography-studio": {
        capabilities: ["RSA Encryption/Decryption", "Elliptic Curve visualizer", "Modular arithmetic", "Secure key exchange"],
        component: CryptographyStudioModule,
    },
    "game-theory-lab": {
        capabilities: ["Nash Equilibrium finder", "Payoff matrix builder", "Evolutionary dynamics", "Strategic stability"],
        component: GameTheoryLabModule,
    },
    "quantum-lab": {
        capabilities: ["Bloch Sphere visualization", "Quantum gates (X, Y, Z, H)", "Superposition states", "Schrödinger wavefunctions"],
        component: QuantumLabModule,
    },
    "neural-lab": {
        capabilities: ["Backpropagation simulator", "Weight matrix mapping", "Architecture tuning", "Loss trend analysis"],
        component: NeuralLabModule,
    },
    "relativity-lab": {
        capabilities: ["Lorentz transformations", "Time dilation/contraction", "3D Light-cone geometry", "Relativistic kinematics"],
        component: RelativityLabModule,
    },
};
