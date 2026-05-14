import { LockKeyhole, Sparkles } from "lucide-react";

type PremiumFeatureBadgeProps = {
    label?: string;
    detail?: string;
    locked?: boolean;
};

export function PremiumFeatureBadge({
    label = "Pro feature",
    detail = "Paid-value workflow",
    locked = false,
}: PremiumFeatureBadgeProps) {
    const Icon = locked ? LockKeyhole : Sparkles;
    return (
        <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
            <Icon className="h-3.5 w-3.5" />
            <span>{label}</span>
            <span className="hidden text-emerald-700/70 dark:text-emerald-300/70 sm:inline">· {detail}</span>
        </div>
    );
}
