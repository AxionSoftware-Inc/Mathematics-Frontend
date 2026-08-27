import React from "react";

export function LaboratoryDataTable({
    eyebrow,
    title,
    columns,
    rows,
    emptyMessage,
}: {
    eyebrow: string;
    title: string;
    columns: string[];
    rows: string[][];
    emptyMessage: string;
}) {
    return (
        <section className="overflow-hidden rounded-[10px] border border-[#e1e5eb] bg-white">
            <div className="border-b border-[#e8ebef] px-4 py-3.5">
                <div className="text-[9px] font-semibold uppercase tracking-[0.13em] text-[#7b8490]">{eyebrow}</div>
                <div className="mt-1 font-serif text-[19px] tracking-[-0.02em] text-[#171a20]">{title}</div>
            </div>
            {rows.length ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse text-left">
                        <thead className="bg-[#fafbfd] text-[9px] font-semibold uppercase tracking-[0.1em] text-[#7d8691]">
                            <tr>
                                {columns.map((column) => (
                                    <th key={column} className="border-b border-[#e8ebef] px-3.5 py-2.5 whitespace-nowrap">
                                        {column}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, rowIndex) => (
                                <tr key={`${title}-${rowIndex}`} className="border-b border-[#edf0f3] last:border-b-0">
                                    {row.map((cell, cellIndex) => (
                                        <td key={`${title}-${rowIndex}-${cellIndex}`} className="px-3.5 py-2.5 font-mono text-[11px] leading-5 text-[#343b45]">
                                            {cell}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="m-3 rounded-[8px] border border-dashed border-[#dfe4ea] bg-[#fbfcfe] px-4 py-4 text-[12px] leading-5 text-[#727b87]">
                    {emptyMessage}
                </div>
            )}
        </section>
    );
}
