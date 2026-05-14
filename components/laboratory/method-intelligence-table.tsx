import React from "react";

import { LaboratoryDataTable } from "@/components/laboratory/laboratory-data-table";
import { type MethodIntelligenceRow, methodRowsToTable } from "@/lib/method-intelligence";

export function MethodIntelligenceTable({ rows }: { rows: MethodIntelligenceRow[] }) {
    return (
        <LaboratoryDataTable
            eyebrow="Method Intelligence"
            title="Trust, speed and execution contract"
            columns={["Method", "Result", "Time", "Accuracy", "Conditions", "Best use", "Status"]}
            rows={methodRowsToTable(rows)}
            emptyMessage="Method comparison matrix will appear after a solve result is available."
        />
    );
}
