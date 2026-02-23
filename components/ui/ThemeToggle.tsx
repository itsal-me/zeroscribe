"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
    className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    if (!mounted) {
        return (
            <div
                className={cn(
                    "w-8 h-8 rounded-lg bg-muted border border-border",
                    className,
                )}
            />
        );
    }

    return (
        <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={cn(
                "w-8 h-8 rounded-lg border border-border bg-surface hover:bg-muted flex items-center justify-center transition-all duration-150 text-muted-foreground hover:text-foreground",
                className,
            )}
            aria-label="Toggle theme"
        >
            {theme === "dark" ? (
                <Sun className="w-3.5 h-3.5" />
            ) : (
                <Moon className="w-3.5 h-3.5" />
            )}
        </button>
    );
}
