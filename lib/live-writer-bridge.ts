import { type PlotPoint } from "@/components/laboratory/math-utils";

export const LIVE_WRITER_BRIDGE_CHANNEL = "mathsphere-live-writer-bridge";
export const LIVE_WRITER_BLOCK_LANGUAGE = "lab-result";
export const LIVE_WRITER_EXPORT_KEY = "mathsphere_laboratory_export";

export type WriterBridgeMetric = {
    label: string;
    value: string;
};

export type WriterBridgeCoefficient = {
    order: number;
    derivativeValue: number;
    coefficient: number;
};

export type WriterBridgeMatrixTable = {
    label: string;
    matrix: number[][];
};

export type WriterBridgePlotSeries = {
    label: string;
    color: string;
    points: PlotPoint[];
};

export type WriterBridgeBlockData = {
    id: string;
    status: "waiting" | "ready";
    moduleSlug: string;
    kind: string;
    title: string;
    summary: string;
    generatedAt: string;
    metrics: WriterBridgeMetric[];
    notes?: string[];
    coefficients?: WriterBridgeCoefficient[];
    matrixTables?: WriterBridgeMatrixTable[];
    plotSeries?: WriterBridgePlotSeries[];
};

export type WriterBridgeTarget = {
    id: string;
    title: string;
    status: WriterBridgeBlockData["status"];
    generatedAt: string;
};

export type WriterTargetsBroadcast = {
    type: "writer-targets";
    writerId: string;
    documentTitle: string;
    targets: WriterBridgeTarget[];
};

export type LabPublishBroadcast = {
    type: "lab-publish";
    writerId: string;
    targetId: string;
    payload: WriterBridgeBlockData;
};

export type LiveWriterBridgeMessage = WriterTargetsBroadcast | LabPublishBroadcast;

const LAB_RESULT_BLOCK_REGEX = /```lab-result\n([\s\S]*?)\n```/g;

function buildId() {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID();
    }

    return `lab-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createBroadcastChannel(name = LIVE_WRITER_BRIDGE_CHANNEL) {
    if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
        return null;
    }

    return new BroadcastChannel(name);
}

export function createWriterId() {
    return buildId();
}

export function createWaitingWriterBridgeBlock(title = "Live Laboratory Block"): WriterBridgeBlockData {
    return {
        id: buildId(),
        status: "waiting",
        moduleSlug: "live-writer-bridge",
        kind: "placeholder",
        title,
        summary: "Laboratoriyadan live natija kutilyapti.",
        generatedAt: new Date().toISOString(),
        metrics: [],
        notes: [
            "Bu blok laboratoriya bilan bog'lanish uchun target sifatida ishlatiladi.",
            "Laboratoriyada shu targetni tanlab `Live push` bossangiz, blok avtomatik yangilanadi.",
        ],
    };
}

export function serializeWriterBridgeBlock(block: WriterBridgeBlockData) {
    return `\`\`\`${LIVE_WRITER_BLOCK_LANGUAGE}\n${JSON.stringify(block, null, 2)}\n\`\`\``;
}

export function parseWriterBridgeBlock(raw: string) {
    try {
        const parsed = JSON.parse(raw) as WriterBridgeBlockData;
        if (!parsed || typeof parsed !== "object" || typeof parsed.id !== "string") {
            return null;
        }

        return parsed;
    } catch {
        return null;
    }
}

export function extractWriterBridgeBlocks(content: string) {
    const blocks: WriterBridgeBlockData[] = [];
    for (const match of content.matchAll(LAB_RESULT_BLOCK_REGEX)) {
        const parsed = parseWriterBridgeBlock(match[1]);
        if (parsed) {
            blocks.push(parsed);
        }
    }

    return blocks;
}

export function replaceWriterBridgeBlock(content: string, nextBlock: WriterBridgeBlockData) {
    let replaced = false;

    const nextContent = content.replace(LAB_RESULT_BLOCK_REGEX, (fullMatch, rawJson) => {
        const parsed = parseWriterBridgeBlock(rawJson);
        if (!parsed || parsed.id !== nextBlock.id) {
            return fullMatch;
        }

        replaced = true;
        return serializeWriterBridgeBlock(nextBlock);
    });

    if (replaced) {
        return nextContent;
    }

    const suffix = nextContent.trimEnd();
    return `${suffix}\n\n${serializeWriterBridgeBlock(nextBlock)}\n`;
}

export function blockToTarget(block: WriterBridgeBlockData): WriterBridgeTarget {
    return {
        id: block.id,
        title: block.title,
        status: block.status,
        generatedAt: block.generatedAt,
    };
}
