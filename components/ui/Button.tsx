import { cn } from "@/lib/utils";
import { forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type ButtonSize = "xs" | "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    icon?: React.ReactNode;
    iconPosition?: "left" | "right";
    children?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
    primary:
        "bg-accent text-accent-foreground hover:opacity-90 shadow-sm shadow-accent/20",
    secondary:
        "bg-surface-elevated text-foreground border border-border hover:bg-muted",
    ghost: "bg-transparent text-foreground hover:bg-muted",
    danger: "bg-danger-subtle text-danger border border-danger/20 hover:bg-danger hover:text-danger-foreground",
    outline:
        "bg-transparent text-foreground border border-border hover:bg-muted",
};

const sizeStyles: Record<ButtonSize, string> = {
    xs: "px-2 py-1 text-xs rounded-md gap-1",
    sm: "px-3 py-1.5 text-xs rounded-lg gap-1.5",
    md: "px-4 py-2 text-sm rounded-lg gap-2",
    lg: "px-5 py-2.5 text-sm rounded-xl gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = "primary",
            size = "md",
            loading = false,
            icon,
            iconPosition = "left",
            children,
            className,
            disabled,
            ...props
        },
        ref,
    ) => {
        return (
            <button
                ref={ref}
                disabled={disabled || loading}
                className={cn(
                    "inline-flex items-center justify-center font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed select-none",
                    variantStyles[variant],
                    sizeStyles[size],
                    className,
                )}
                {...props}
            >
                {loading && (
                    <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
                )}
                {!loading && icon && iconPosition === "left" && (
                    <span className="shrink-0">{icon}</span>
                )}
                {children && <span>{children}</span>}
                {!loading && icon && iconPosition === "right" && (
                    <span className="shrink-0">{icon}</span>
                )}
            </button>
        );
    },
);

Button.displayName = "Button";
