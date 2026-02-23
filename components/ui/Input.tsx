import { cn } from "@/lib/utils";
import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hint?: string;
    icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, hint, icon, className, id, ...props }, ref) => {
        const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

        return (
            <div className="flex flex-col gap-1">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="text-xs font-medium text-muted-foreground"
                    >
                        {label}
                    </label>
                )}
                <div className="relative">
                    {icon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {icon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        id={inputId}
                        className={cn(
                            "input-base",
                            icon && "pl-9",
                            error &&
                                "border-danger/50 focus:ring-danger/30 focus:border-danger/50",
                            className,
                        )}
                        {...props}
                    />
                </div>
                {error && <p className="text-xs text-danger mt-0.5">{error}</p>}
                {hint && !error && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {hint}
                    </p>
                )}
            </div>
        );
    },
);

Input.displayName = "Input";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ label, error, hint, className, id, ...props }, ref) => {
        const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

        return (
            <div className="flex flex-col gap-1">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="text-xs font-medium text-muted-foreground"
                    >
                        {label}
                    </label>
                )}
                <textarea
                    ref={ref}
                    id={inputId}
                    className={cn(
                        "input-base resize-none min-h-[80px]",
                        error &&
                            "border-danger/50 focus:ring-danger/30 focus:border-danger/50",
                        className,
                    )}
                    {...props}
                />
                {error && <p className="text-xs text-danger mt-0.5">{error}</p>}
                {hint && !error && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {hint}
                    </p>
                )}
            </div>
        );
    },
);

Textarea.displayName = "Textarea";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    hint?: string;
    options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ label, error, hint, options, className, id, ...props }, ref) => {
        const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

        return (
            <div className="flex flex-col gap-1">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="text-xs font-medium text-muted-foreground"
                    >
                        {label}
                    </label>
                )}
                <div className="relative">
                    <select
                        ref={ref}
                        id={inputId}
                        className={cn(
                            "input-base appearance-none cursor-pointer pr-8",
                            error &&
                                "border-danger/50 focus:ring-danger/30 focus:border-danger/50",
                            className,
                        )}
                        {...props}
                    >
                        {options.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                </div>
                {error && <p className="text-xs text-danger mt-0.5">{error}</p>}
                {hint && !error && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {hint}
                    </p>
                )}
            </div>
        );
    },
);

Select.displayName = "Select";
