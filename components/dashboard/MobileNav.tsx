"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, CreditCard, BarChart3, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

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
    const router = useRouter();
    const supabase = createClient();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };

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

                {/* Sign out — always at far right */}
                <div className="w-px bg-border/60 self-center h-6 shrink-0" />
                <button
                    onClick={handleSignOut}
                    className="flex flex-col items-center justify-center gap-1 px-3 h-full transition-colors duration-150 active:scale-95 text-muted-foreground hover:text-danger"
                >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center">
                        <LogOut className="w-[18px] h-[18px]" />
                    </div>
                    <span className="text-[10px] font-medium leading-none">Sign out</span>
                </button>
            </div>
        </nav>
    );
}
