import {
    AreaChart,
    BookOpenText,
    BookText,
    ChartLine,
    FlaskConical,
    Grid3X3,
    Rotate3D,
    Sigma,
    type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
    AreaChart,
    BookOpenText,
    BookText,
    ChartLine,
    FlaskConical,
    Grid3X3,
    Rotate3D,
    Sigma,
};

export function LaboratoryModuleIcon({
    name,
    className = "h-5 w-5",
}: {
    name?: string | null;
    className?: string;
}) {
    const Icon = (name && iconMap[name]) || FlaskConical;
    return <Icon className={className} />;
}
