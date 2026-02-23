import { cn } from "@/lib/utils";
import { forwardRef } from "react";

type BadgeVariant =
    | "default"
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "muted";

interface BadgeProps {
    children: React.ReactNode;
    variant?: BadgeVariant;
    className?: string;
    dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
    default: "bg-accent-subtle text-accent border-accent/20",
    success: "bg-success-subtle text-success border-success/20",
    warning: "bg-warning-subtle text-warning border-warning/20",
    danger: "bg-danger-subtle text-danger border-danger/20",
    info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    muted: "bg-muted text-muted-foreground border-border",
};

const dotStyles: Record<BadgeVariant, string> = {
    default: "bg-accent",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
    info: "bg-blue-400",
    muted: "bg-muted-foreground",
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
    ({ children, variant = "default", className, dot = false }, ref) => {
        return (
            <span
                ref={ref}
                className={cn(
                    "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border",
                    variantStyles[variant],
                    className,
                )}
            >
                {dot && (
                    <span
                        className={cn(
                            "w-1.5 h-1.5 rounded-full shrink-0",
                            dotStyles[variant],
                        )}
                    />
                )}
                {children}
            </span>
        );
    },
);

Badge.displayName = "Badge";
