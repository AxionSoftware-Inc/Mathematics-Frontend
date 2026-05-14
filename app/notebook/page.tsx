import { ComputationalNotebook } from "@/components/notebook/computational-notebook";

export const metadata = {
    title: "Computational Notebook | MathSphere",
    description: "Live worksheet documents for formulas, solving, graphs, tables, code, proofs, and export.",
};

export default function NotebookPage() {
    return <ComputationalNotebook />;
}
