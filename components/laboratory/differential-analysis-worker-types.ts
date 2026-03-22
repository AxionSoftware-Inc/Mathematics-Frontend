import type {
    DifferentialPoint,
    DirectionFieldSegment,
    ODESystemPoint,
    PlanarNullclineField,
    SingleDifferentialAudit,
    SystemTrajectoryAudit,
} from "@/components/laboratory/math-utils";

export type DifferentialFieldOverlay = {
    xDomain: [number, number];
    yDomain: [number, number];
    segments: DirectionFieldSegment[];
};

export type PlanarSystemFieldOverlay = DifferentialFieldOverlay & {
    nullclines: PlanarNullclineField;
};

export type DifferentialAnalysisPayload = {
    solverMode: "single" | "system";
    derivative: string;
    sysExpr1: string;
    sysExpr2: string;
    sysExpr3: string;
    x0: number;
    y0: number;
    z0: number;
    step: number;
    steps: number;
    differentialPoints: DifferentialPoint[];
    systemPoints: ODESystemPoint[];
    comparisonSystemTrajectories: ODESystemPoint[][];
};

export type DifferentialAnalysisResult = {
    singleAudit: SingleDifferentialAudit | null;
    systemAudit: SystemTrajectoryAudit | null;
    singleDirectionField: DifferentialFieldOverlay | null;
    planarSystemField: PlanarSystemFieldOverlay | null;
};

export type DifferentialAnalysisWorkerRequest = {
    requestId: number;
    payload: DifferentialAnalysisPayload;
};

export type DifferentialAnalysisWorkerResponse =
    | {
          requestId: number;
          status: "success";
          result: DifferentialAnalysisResult;
      }
    | {
          requestId: number;
          status: "error";
          error: string;
      };
