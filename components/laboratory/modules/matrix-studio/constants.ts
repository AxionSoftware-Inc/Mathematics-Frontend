import type { MatrixPreset } from "./types";

export const MATRIX_PRESETS: readonly MatrixPreset[] = [
    {
        label: "Vector Transform Primer",
        mode: "transform",
        matrix: "1.1 0.45; -0.2 1.3",
        rhs: "1.2; 0.8",
        dimension: "2x2",
        description: "Oddiy vektor, basis distortion va 2D transform grafigini tez ochadigan kirish misoli.",
    },
    {
        label: "Small Matrix Algebra",
        mode: "algebra",
        matrix: "3 1; 1 2",
        rhs: "1; 0",
        dimension: "2x2",
        description: "Kichik square matrix uchun determinant, inverse, trace va conditioning signalini ko'rsatadi.",
    },
    {
        label: "Sparse System Audit",
        mode: "systems",
        matrix: "4 -1 0 0 0; -1 4 -1 0 0; 0 -1 4 -1 0; 0 0 -1 4 -1; 0 0 0 -1 4",
        rhs: "2; 1; 0; 1; 2",
        dimension: "5x5",
        description: "Yirikroq tridiagonal sistema, pivot trace, iterative readiness va residual audit uchun.",
    },
    {
        label: "Spectral Research Deck",
        mode: "decomposition",
        matrix: "6 2 0 0; 2 5 1 0; 0 1 4 1; 0 0 1 3",
        rhs: "1; 0; 1; -1",
        dimension: "4x4",
        description: "Yirik square matrix uchun spectrum, SVD, diagonalizable audit va singular spectrumni bir joyda ochadi.",
    },
    {
        label: "Complex Plane Atlas",
        mode: "transform",
        matrix: "0 -1; 1 0",
        rhs: "1; 0.5",
        dimension: "2x2",
        description: "O'zgacha holat sifatida rotation matrix, area-preserving transform va vector orbit intuition beradi.",
    },
    {
        label: "Tensor Contraction Deck",
        mode: "tensor",
        matrix: "1 0 2; 0 1 1 || 2 1 0; 1 0 1 || 0 2 1; 1 1 0",
        rhs: "0.5; 1; -0.25",
        dimension: "2x3x3",
        description: "Tensor slice heatmap, unfolding rank, contraction, Tucker/CP starter audit va eigen probe uchun.",
    },
    {
        label: "Higher-Order Sparse Tensor",
        mode: "tensor",
        matrix: "1 0 0; 0 1 0 || 0 0 1; 1 0 0 ### 0 1 0; 0 0 0 || 1 0 1; 0 0 1",
        rhs: "mode4: 1 0; 0 1",
        dimension: "2x3x2x2",
        description: "Higher-order blokli tensor, block energy, mode-4 audit va sparse structure uchun.",
    },
    {
        label: "Least Squares Rectangular Fit",
        mode: "systems",
        matrix: "1 0; 1 1; 1 2; 1 3; 1 4",
        rhs: "1; 2; 2.9; 3.7; 5.1",
        dimension: "5x2",
        description: "Xususiy rectangular holat uchun least-squares fallback, residual va conditioning oqimini ochadi.",
    },
    {
        label: "Ill-Conditioned Inverse Probe",
        mode: "algebra",
        matrix: "1 1 1; 1 1.01 1; 1 1 1.01",
        rhs: "1; 0; 1",
        dimension: "3x3",
        description: "Nozik xususiy holat: condition number, inverse availability va determinant sezgirligini ko'rsatadi.",
    },
];

export const MATRIX_WORKFLOW_TABS = [
    { id: "solve", label: "Solve" },
    { id: "visualize", label: "Visualize" },
    { id: "compare", label: "Compare" },
    { id: "report", label: "Report" },
] as const;
