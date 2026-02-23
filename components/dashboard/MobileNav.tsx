"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CreditCard, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
    {
        href: "/dashboard/subscriptions",
        icon: CreditCard,
        label: "Subs",
    },
    { href: "/dashboard/analytics", icon: BarChart3, label: "Analytics" },
    { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

export function MobileNav() {
    const pathname = usePathname();

    return (
        <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur-xl border-t border-border mobile-safe-bottom">
            <div className="flex items-stretch h-16">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                        item.href === "/dashboard"
                            ? pathname === "/dashboard"
                            : pathname.startsWith(item.href);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex-1 flex flex-col items-center justify-center gap-1 transition-colors duration-150 active:scale-95",
                                isActive
                                    ? "text-accent"
                                    : "text-muted-foreground",
                            )}
                        >
                            <div
                                className={cn(
                                    "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150",
                                    isActive
                                        ? "bg-accent-subtle scale-105"
                                        : "scale-100",
                                )}
                            >
                                <Icon className="w-[18px] h-[18px]" />
                            </div>
                            <span className="text-[10px] font-medium leading-none">
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
