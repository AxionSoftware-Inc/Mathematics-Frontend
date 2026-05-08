import type { MatrixMode } from "./types";

export type MatrixDimensionOption = {
    value: string;
    label: string;
    description: string;
};

const MATRIX_DIMENSION_OPTIONS: Record<MatrixMode, MatrixDimensionOption[]> = {
    algebra: [
        { value: "2x2", label: "2x2 core", description: "Determinant, inverse va trace uchun eng tez audit." },
        { value: "3x3", label: "3x3 balanced", description: "Rank va conditioning signalini aniqroq ko'rsatadi." },
        { value: "4x4", label: "4x4 dense", description: "Chuqurroq algebraik strukturani audit qiladi." },
        { value: "5x5", label: "5x5 stress", description: "Konditsiya va sparsity riskini kuchliroq ko'rsatadi." },
    ],
    decomposition: [
        { value: "2x2", label: "2x2 spectrum", description: "Eigen intuition va diagonalizability uchun yengil lane." },
        { value: "3x3", label: "3x3 spectral", description: "QR, LU va SVD signalini tabiiy ko'rsatadi." },
        { value: "4x4", label: "4x4 factor", description: "Singular spectrum va decomposition compare uchun." },
        { value: "5x5", label: "5x5 audit", description: "Numerical stability va factor auditni bosim ostida tekshiradi." },
    ],
    systems: [
        { value: "2x2", label: "2x2 exact", description: "Closed-form elimination va symbolic solve." },
        { value: "3x3", label: "3x3 direct", description: "Pivot trace va residual reading uchun." },
        { value: "5x2", label: "5x2 least squares", description: "Rectangular fit va least-squares residual audit." },
        { value: "mxn", label: "m x n general", description: "Sparse yoki katta sistema uchun umumiy shell." },
    ],
    transform: [
        { value: "2x2", label: "2D transform", description: "Unit square va probe vector preview." },
        { value: "3x3", label: "3x3 affine", description: "Homogeneous transform va basis distortion reading." },
        { value: "4x4", label: "4x4 operator", description: "Kengroq operator audit, real-time geometrysiz." },
    ],
    tensor: [
        { value: "2x3x3", label: "Rank-3 starter", description: "Slice heatmap, contraction va HOSVD uchun." },
        { value: "3x3x3", label: "Cubic tensor", description: "Mode spectra va eigen probe uchun qulay." },
        { value: "3x3x3x2", label: "Order-4 block", description: "Higher-order block energy va Tucker factor lane." },
        { value: "mxnxt", label: "General tensor", description: "Custom tensor oilasi uchun umumiy audit shell." },
    ],
};

export function getMatrixDimensionOptions(mode: MatrixMode): MatrixDimensionOption[] {
    return MATRIX_DIMENSION_OPTIONS[mode];
}

export function getDefaultMatrixDimension(mode: MatrixMode): string {
    return MATRIX_DIMENSION_OPTIONS[mode][0]?.value ?? "2x2";
}

export function normalizeMatrixDimension(mode: MatrixMode, dimension: string): string {
    const options = MATRIX_DIMENSION_OPTIONS[mode];
    if (options.some((option) => option.value === dimension)) {
        return dimension;
    }
    return getDefaultMatrixDimension(mode);
}
