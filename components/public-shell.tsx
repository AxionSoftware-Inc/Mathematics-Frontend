import { cn } from "@/lib/utils";

export function SiteContainer({
    className,
    children,
}: {
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div
            className={cn(
                "mx-auto w-full max-w-[1520px] px-6 sm:px-8 lg:px-12 xl:px-16 2xl:px-20",
                className,
            )}
        >
            {children}
        </div>
    );
}

export function SiteSection({
    className,
    children,
}: {
    className?: string;
    children: React.ReactNode;
}) {
    return <section className={cn("relative py-20 md:py-24 lg:py-28", className)}>{children}</section>;
}

export function SectionHeading({
    eyebrow,
    title,
    description,
    align = "left",
    className,
}: {
    eyebrow?: React.ReactNode;
    title: React.ReactNode;
    description?: React.ReactNode;
    align?: "left" | "center";
    className?: string;
}) {
    return (
        <div className={cn("space-y-5", align === "center" && "mx-auto max-w-3xl text-center", className)}>
            {eyebrow ? <div className="site-eyebrow">{eyebrow}</div> : null}
            <h2 className="site-display text-4xl md:text-5xl lg:text-6xl">{title}</h2>
            {description ? <p className="site-lead max-w-2xl">{description}</p> : null}
        </div>
    );
}

export function HeroBadge({ children, className }: { children: React.ReactNode; className?: string }) {
    return <div className={cn("site-badge", className)}>{children}</div>;
}
