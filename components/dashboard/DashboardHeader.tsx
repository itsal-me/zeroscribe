"use client";

import { Search } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { NotificationBell } from "@/components/dashboard/NotificationBell";

interface DashboardHeaderProps {
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
}

export function DashboardHeader({
    title,
    subtitle,
    actions,
}: DashboardHeaderProps) {
    return (
        <header className="h-14 border-b border-border bg-surface/60 backdrop-blur-sm flex items-center justify-between px-6 shrink-0">
            {/* Left: Title */}
            <div>
                <h1 className="text-sm font-semibold">{title}</h1>
                {subtitle && (
                    <p className="text-xs text-muted-foreground">{subtitle}</p>
                )}
            </div>

            {/* Right: Actions + controls */}
            <div className="flex items-center gap-2">
                {actions}
                <NotificationBell />
                <ThemeToggle />
            </div>
        </header>
    );
}
