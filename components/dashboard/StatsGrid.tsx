"use client";

import { DollarSign, CreditCard, Calendar, AlertTriangle } from "lucide-react";
import { cn, formatCurrency, getTotalMonthlySpend } from "@/lib/utils";
import { getDaysUntilRenewal } from "@/lib/utils";
import type { Subscription } from "@/types";
import { motion } from "framer-motion";

interface StatsGridProps {
    subscriptions: Subscription[];
}

export function StatsGrid({ subscriptions }: StatsGridProps) {
    const active = subscriptions.filter(
        (s) => s.status === "active" || s.status === "trial",
    );
    const monthlyTotal = getTotalMonthlySpend(subscriptions);
    const annualTotal = monthlyTotal * 12;
    const upcomingRenewals = subscriptions.filter((s) => {
        const days = getDaysUntilRenewal(s.next_billing_date);
        return (
            days >= 0 &&
            days <= 7 &&
            (s.status === "active" || s.status === "trial")
        );
    }).length;
    const stats = [
        {
            label: "Monthly Total",
            value: formatCurrency(monthlyTotal),
            subValue: `${formatCurrency(annualTotal)} projected/yr`,
            icon: DollarSign,
            iconBg: "bg-accent-subtle",
            iconColor: "text-accent",
            trend: null,
        },
        {
            label: "Active Subscriptions",
            value: active.length.toString(),
            subValue: `${active.length} currently detected`,
            icon: CreditCard,
            iconBg: "bg-success-subtle",
            iconColor: "text-success",
            trend: null,
        },
        {
            label: "Upcoming Charges",
            value: upcomingRenewals.toString(),
            subValue: "renewals in next 7 days",
            icon: Calendar,
            iconBg: upcomingRenewals > 0 ? "bg-warning-subtle" : "bg-muted",
            iconColor:
                upcomingRenewals > 0 ? "text-warning" : "text-muted-foreground",
            trend: null,
        },
        {
            label: "Overdue",
            value: subscriptions
                .filter(
                    (s) =>
                        getDaysUntilRenewal(s.next_billing_date) < 0 &&
                        s.status === "active",
                )
                .length.toString(),
            subValue: "payments past due",
            icon: AlertTriangle,
            iconBg: "bg-danger-subtle",
            iconColor: "text-danger",
            trend: null,
        },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.map((stat, i) => {
                const Icon = stat.icon;
                return (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.4,
                            delay: i * 0.07,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                        className="bg-surface border border-border rounded-xl p-4 group hover:border-border/80 transition-colors"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div
                                className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center",
                                    stat.iconBg,
                                )}
                            >
                                <Icon
                                    className={cn("w-4 h-4", stat.iconColor)}
                                />
                            </div>
                        </div>
                        <p className="text-2xl font-bold tracking-tight mb-0.5">
                            {stat.value}
                        </p>
                        <p className="text-[11px] text-muted-foreground mb-0.5">
                            {stat.label}
                        </p>
                        <p className="text-[10px] text-muted-foreground/60">
                            {stat.subValue}
                        </p>
                    </motion.div>
                );
            })}
        </div>
    );
}
